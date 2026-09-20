'use strict';

const analytics = require('./analytics');
const auth = require('./auth');
const rules = require('./rules');
const { createLimiter } = require('./rate-limit');

/**
 * The ScreenLess hub API.
 *
 * Framework free, the same way the friends board is: `handle` takes a plain
 * request object and returns a plain response object, so the identical code
 * runs behind `node:http` in production and inside `node --test` with no
 * socket anywhere near it.
 *
 * Two kinds of caller, and they never overlap:
 *
 *   the parent app    signs in with an email and a password, sees names and
 *                     numbers, and is the only thing that can change a limit
 *   a child's phone   pairs once with a six character code, then only ever
 *                     pushes numbers up and pulls limits down
 *
 * Routes
 *
 *   GET    /v1/health
 *   POST   /v1/parents                     register                  { email, password, name? }
 *   POST   /v1/parents/session             sign in                   { email, password }
 *   DELETE /v1/parents/session             sign out
 *   GET    /v1/parents/me                  who am I
 *   DELETE /v1/parents/me                  delete the account and everything under it
 *   GET    /v1/children                    every child, with today and a week of bars
 *   POST   /v1/children                    add a child               { name, ageBand }
 *   PATCH  /v1/children/:id                rename, or fix the age band
 *   DELETE /v1/children/:id                remove the child and their history
 *   POST   /v1/children/:id/code           a fresh pairing code
 *   GET    /v1/children/:id/summary        analytics                 ?from=&to=  or ?range=week|month
 *   GET    /v1/children/:id/limits
 *   PUT    /v1/children/:id/limits         set the daily budget and the nudges
 *   POST   /v1/devices                     pair a phone              { code, platform }
 *   GET    /v1/devices/me                  the current plan, by revision
 *   POST   /v1/devices/me/reports          push days                 { days: [...], snapshot }
 *   DELETE /v1/devices/me                  unpair this phone
 *
 * What a child's phone may send is fixed by `rules.cleanReport`, and it is
 * numbers only. No name, no mission text, no note, no photo and no location
 * has a field to arrive in.
 */

/** A signed-in parent stays signed in for this long without opening the app. */
const SESSION_TTL_MS = 180 * 86_400_000;

function createApp({ store, clock = () => Date.now(), limiter = createLimiter(clock), log = console }) {
  const routes = [
    { method: 'GET', pattern: /^\/v1\/health$/, run: health },

    { method: 'POST', pattern: /^\/v1\/parents$/, run: register },
    { method: 'POST', pattern: /^\/v1\/parents\/session$/, run: signIn },
    { method: 'DELETE', pattern: /^\/v1\/parents\/session$/, parent: true, run: signOut },
    { method: 'GET', pattern: /^\/v1\/parents\/me$/, parent: true, run: me },
    { method: 'DELETE', pattern: /^\/v1\/parents\/me$/, parent: true, run: deleteParent },

    { method: 'GET', pattern: /^\/v1\/children$/, parent: true, run: listChildren },
    { method: 'POST', pattern: /^\/v1\/children$/, parent: true, run: addChild },
    { method: 'PATCH', pattern: /^\/v1\/children\/([^/]+)$/, parent: true, run: editChild },
    { method: 'DELETE', pattern: /^\/v1\/children\/([^/]+)$/, parent: true, run: removeChild },
    { method: 'POST', pattern: /^\/v1\/children\/([^/]+)\/code$/, parent: true, run: newCode },
    { method: 'GET', pattern: /^\/v1\/children\/([^/]+)\/summary$/, parent: true, run: summary },
    { method: 'GET', pattern: /^\/v1\/children\/([^/]+)\/limits$/, parent: true, run: readLimits },
    { method: 'PUT', pattern: /^\/v1\/children\/([^/]+)\/limits$/, parent: true, run: writeLimits },

    { method: 'GET', pattern: /^\/v1\/children\/([^/]+)\/assignment$/, parent: true, run: readAssignment },
    { method: 'PUT', pattern: /^\/v1\/children\/([^/]+)\/assignment$/, parent: true, run: writeAssignment },

    { method: 'GET', pattern: /^\/v1\/children\/([^/]+)\/rewards$/, parent: true, run: listRewards },
    { method: 'POST', pattern: /^\/v1\/children\/([^/]+)\/rewards$/, parent: true, run: addReward },
    { method: 'PATCH', pattern: /^\/v1\/children\/([^/]+)\/rewards\/([^/]+)$/, parent: true, run: editReward },
    { method: 'DELETE', pattern: /^\/v1\/children\/([^/]+)\/rewards\/([^/]+)$/, parent: true, run: removeReward },

    { method: 'GET', pattern: /^\/v1\/children\/([^/]+)\/notes$/, parent: true, run: listNotes },
    { method: 'POST', pattern: /^\/v1\/children\/([^/]+)\/notes$/, parent: true, run: addNote },

    { method: 'POST', pattern: /^\/v1\/devices$/, run: pair },
    { method: 'GET', pattern: /^\/v1\/devices\/me$/, device: true, run: deviceConfig },
    { method: 'POST', pattern: /^\/v1\/devices\/me\/reports$/, device: true, run: report },
    { method: 'POST', pattern: /^\/v1\/devices\/me\/ack$/, device: true, run: acknowledge },
    { method: 'DELETE', pattern: /^\/v1\/devices\/me$/, device: true, run: unpair },
  ];

  async function handle(request) {
    const ip = request.ip || 'unknown';
    if (!limiter.take('any', ip)) return fail(429, 'rateLimited');

    const path = normalisePath(request.path);
    const candidates = routes.filter((route) => route.pattern.test(path));
    if (candidates.length === 0) return fail(404, 'notFound');
    const route = candidates.find((r) => r.method === request.method);
    if (!route) return fail(405, 'methodNotAllowed');

    try {
      const params = path.match(route.pattern).slice(1).map(decodeURIComponent);
      const context = {
        ip,
        params,
        query: request.query || {},
        headers: request.headers || {},
        body: request.body && typeof request.body === 'object' ? request.body : null,
        parent: null,
        device: null,
        child: null,
      };

      if (route.parent) {
        context.parent = authenticateParent(request.headers || {});
        if (!context.parent) return fail(401, 'unauthorized');
      }
      if (route.device) {
        const found = authenticateDevice(request.headers || {});
        if (!found) return fail(401, 'unauthorized');
        context.device = found.device;
        context.child = found.child;
      }
      return await route.run(context);
    } catch (error) {
      if (error instanceof URIError) return fail(400, 'invalid');
      log.error('[hub] unhandled', error);
      return fail(500, 'server');
    }
  }

  /* ----------------------------------------------------------------- auth */

  function bearer(headers) {
    const header = headers.authorization || headers.Authorization || '';
    const match = /^Bearer ((?:par|dev)_[A-Za-z0-9_-]{6,40})\.([A-Za-z0-9_-]{20,120})$/.exec(header);
    return match ? { id: match[1], secret: match[2] } : null;
  }

  /**
   * A parent's session.
   *
   * The token id is the parent id, so a stolen token cannot be pointed at a
   * different account by editing the half in front of the dot: the session row
   * is looked up by the hash of the secret and then has to agree.
   */
  function authenticateParent(headers) {
    const token = bearer(headers);
    if (!token || !token.id.startsWith('par_')) return null;
    const session = store.getSession(auth.hashToken(token.secret));
    if (!session || session.parent_id !== token.id) return null;
    if (clock() - session.last_seen > SESSION_TTL_MS) {
      store.deleteSession(session.token_hash);
      return null;
    }
    const parent = store.getParent(session.parent_id);
    if (!parent) return null;
    // One write a day at most, rather than one per request.
    if (clock() - session.last_seen > 86_400_000) store.touchSession(session.token_hash);
    return parent;
  }

  function authenticateDevice(headers) {
    const token = bearer(headers);
    if (!token || !token.id.startsWith('dev_')) return null;
    const device = store.getDevice(token.id);
    if (!device || !auth.tokenMatches(token.secret, device.token_hash)) return null;
    const child = store.getChild(device.child_id);
    if (!child) return null;
    if (clock() - device.last_seen > 3_600_000) store.touchDevice(device.id);
    return { device, child };
  }

  /** The child in the path, but only if this parent owns it. */
  function ownedChild(parent, id) {
    const child = store.getChild(id);
    return child && child.parentId === parent.id ? child : null;
  }

  /* ------------------------------------------------------------- handlers */

  function health() {
    return ok({ ok: true, service: 'screenless-hub', time: new Date(clock()).toISOString() });
  }

  function register({ ip, body }) {
    if (!limiter.take('signup', ip)) return fail(429, 'rateLimited');
    const email = rules.checkEmail(body && body.email);
    if (!email.ok) return fail(400, 'invalid', email.reason);
    const password = rules.checkPassword(body && body.password);
    if (!password.ok) return fail(400, 'invalid', password.reason);

    if (store.getParentByEmail(email.value)) return fail(409, 'taken');

    const parent = store.createParent({
      id: auth.newParentId(),
      email: email.value,
      passHash: auth.hashPassword(password.value),
      name: typeof (body && body.name) === 'string' ? body.name.trim().slice(0, 60) : null,
      createdAt: clock(),
    });

    return ok({ parent: publicParent(parent), ...issueSession(parent) }, 201);
  }

  function signIn({ ip, body }) {
    const email = rules.checkEmail(body && body.email);
    if (!email.ok) return fail(400, 'invalid', 'email');
    if (!limiter.take('signin', email.value)) return fail(429, 'rateLimited');
    if (!limiter.take('signin', ip)) return fail(429, 'rateLimited');

    const parent = store.getParentByEmail(email.value);
    // The same answer whether the address is unknown or the password is wrong,
    // so this endpoint cannot be used to find out who has an account.
    if (!parent || !auth.verifyPassword(String((body && body.password) || ''), parent.pass_hash)) {
      return fail(401, 'unauthorized');
    }
    store.touchParent(parent.id);
    return ok({ parent: publicParent(parent), ...issueSession(parent) });
  }

  function issueSession(parent) {
    const secret = auth.newToken();
    store.createSession(auth.hashToken(secret), parent.id);
    return { token: `${parent.id}.${secret}`, expiresInMs: SESSION_TTL_MS };
  }

  function signOut({ headers }) {
    // Nothing to look up: the request already proved which session it is, so
    // this only has to find the secret again to know which row to drop.
    const token = bearer(headers);
    if (token) store.deleteSession(auth.hashToken(token.secret));
    return ok({ ok: true });
  }

  function me({ parent }) {
    return ok({ parent: publicParent(parent), children: childCards(parent) });
  }

  function deleteParent({ parent, body }) {
    // Asked for again here because it takes every child's history with it.
    if (!auth.verifyPassword(String((body && body.password) || ''), parent.pass_hash)) {
      return fail(401, 'unauthorized');
    }
    store.deleteParent(parent.id);
    return ok({ deleted: true });
  }

  /* -------------------------------------------------------------- children */

  function listChildren({ parent }) {
    return ok({ children: childCards(parent) });
  }

  /**
   * One card per child: who they are, whether a phone is attached, today's
   * numbers and a week of bars. The list screen is the first thing a parent
   * sees, and it should not take six requests to draw it.
   */
  function childCards(parent) {
    return store.listChildren(parent.id).map((child) => {
      const today = rules.dayKeyFor(new Date(clock()), child.tzOffsetMin);
      const from = rules.shiftDay(today, -6);
      const week = analytics.series(store.getDays(child.id, from, today), from, today);
      const limits = store.getLimits(child.id);
      return {
        ...publicChild(child),
        paired: store.listDevices(child.id).length > 0,
        limits,
        today: week[week.length - 1],
        week,
      };
    });
  }

  function addChild({ parent, body }) {
    const name = rules.checkChildName(body && body.name);
    if (!name.ok) return fail(400, 'invalid', 'name');
    const band = rules.checkAgeBand(body && body.ageBand);
    if (!band.ok) return fail(400, 'invalid', 'ageBand');
    if (store.listChildren(parent.id).length >= 12) return fail(409, 'full');

    const child = store.createChild({
      id: auth.newChildId(),
      parentId: parent.id,
      name: name.value,
      ageBand: band.value,
      createdAt: clock(),
      ...freshCode(),
    });
    store.setLimits(child.id, rules.defaultLimits());

    return ok({ child: publicChild(child), pairing: pairingOf(child) }, 201);
  }

  /** A code nobody else is holding. Collisions are rare; a retry settles it. */
  function freshCode() {
    for (let i = 0; i < 8; i += 1) {
      const pairCode = auth.newPairCode();
      if (!store.getChildByCode(pairCode)) {
        return { pairCode, pairExpires: clock() + auth.PAIR_CODE_TTL_MS };
      }
    }
    return { pairCode: auth.newPairCode(), pairExpires: clock() + auth.PAIR_CODE_TTL_MS };
  }

  function editChild({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    const name = body && body.name !== undefined ? rules.checkChildName(body.name) : { ok: true, value: child.name };
    if (!name.ok) return fail(400, 'invalid', 'name');
    const band = body && body.ageBand !== undefined ? rules.checkAgeBand(body.ageBand) : { ok: true, value: child.ageBand };
    if (!band.ok) return fail(400, 'invalid', 'ageBand');
    store.updateChild(child.id, name.value, band.value);
    return ok({ child: publicChild(store.getChild(child.id)) });
  }

  function removeChild({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    store.deleteChild(child.id);
    return ok({ deleted: true });
  }

  function newCode({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    const code = freshCode();
    store.setPairCode(child.id, code.pairCode, code.pairExpires);
    return ok({ pairing: pairingOf({ ...child, ...code }) });
  }

  /**
   * The analytics for one child.
   *
   * `range=week` and `range=month` are the two the app asks for; explicit
   * `from`/`to` exist so a future screen can ask for anything without the
   * server growing another named range.
   */
  function summary({ parent, params, query }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');

    const today = rules.dayKeyFor(new Date(clock()), child.tzOffsetMin);
    let from;
    let to = rules.isDayKey(query.to) ? query.to : today;
    if (rules.isDayKey(query.from)) {
      from = query.from;
    } else {
      const span = query.range === 'month' ? 29 : query.range === 'quarter' ? 89 : 6;
      from = rules.shiftDay(to, -span);
    }
    if (from > to) return fail(400, 'invalid', 'range');
    // Fetch the window before it too, so the comparison has something to read.
    const reach = rules.shiftDay(from, -(rules.daysBetween(from, to).length));
    const rows = store.getDays(child.id, reach, to);

    return ok({
      child: publicChild(child),
      limits: store.getLimits(child.id),
      paired: store.listDevices(child.id).length > 0,
      summary: analytics.summarise(rows, from, to),
    });
  }

  function readLimits({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    return ok({ limits: store.getLimits(child.id) });
  }

  function writeLimits({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    const limits = store.setLimits(child.id, rules.cleanLimits(body));
    return ok({ limits });
  }

  /* ------------------------------------------- what a parent sends down */

  /**
   * The three handlers below all write into the same half of the database: a
   * mission the parent picked, a reward they promised, a line they typed.
   *
   * None of them can reach a phone on their own. The hub has no way to wake a
   * device, so all three wait in `deviceConfig` until the child's app next
   * syncs and collects them. That is a real limitation and worth knowing about
   * rather than papering over: a note written at nine in the morning is read
   * when the child next opens the app, not when it is sent.
   */

  function readAssignment({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    return ok({ assignment: store.getAssignment(child.id) });
  }

  /**
   * A mission id travels, not a mission.
   *
   * Both apps ship the same library, so the title and the steps are already on
   * the child's phone in the child's language. Sending the key is smaller,
   * cannot go stale against a translation, and means this server never holds a
   * line of the mission text.
   */
  function writeAssignment({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');

    const taskId = body && body.taskId;
    if (taskId === null) {
      store.clearAssignment(child.id);
      return ok({ assignment: null });
    }
    if (!rules.checkTaskId(taskId)) return fail(400, 'invalid', 'taskId');
    return ok({ assignment: store.setAssignment(child.id, taskId) });
  }

  function listRewards({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    return ok({ rewards: store.listRewards(child.id) });
  }

  function addReward({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    if (store.countRewards(child.id) >= rules.MAX_REWARDS) return fail(409, 'tooMany');

    const cleaned = rules.cleanReward(body);
    if (!cleaned.label) return fail(400, 'invalid', 'label');

    const reward = store.addReward(child.id, {
      id: auth.newRewardId(),
      stars: cleaned.stars,
      label: cleaned.label,
      emoji: cleaned.emoji || '⭐',
    });
    return ok({ reward }, 201);
  }

  function editReward({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    const reward = store.setRewardGiven(child.id, params[1], body && body.given === true);
    if (!reward) return fail(404, 'notFound');
    return ok({ reward });
  }

  function removeReward({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    if (!store.deleteReward(child.id, params[1])) return fail(404, 'notFound');
    return ok({ deleted: true });
  }

  function listNotes({ parent, params }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');
    return ok({ notes: store.listNotes(child.id) });
  }

  function addNote({ parent, params, body }) {
    const child = ownedChild(parent, params[0]);
    if (!child) return fail(404, 'notFound');

    const text = rules.cleanNoteText(body && body.text);
    if (!text) return fail(400, 'invalid', 'text');

    return ok({ note: store.addNote(child.id, { id: auth.newNoteId(), text }) }, 201);
  }

  /* --------------------------------------------------------------- devices */

  /**
   * A child's phone joins a family.
   *
   * The code is single use: it is cleared the moment it works. Re-pairing a
   * phone that was wiped means the parent generating a new one, which is the
   * behaviour a parent expects and the only one that keeps a code short.
   */
  function pair({ ip, body }) {
    const code = auth.normaliseCode(body && body.code);
    if (!code) {
      limiter.take('pair', ip);
      return fail(400, 'invalid', 'code');
    }
    const child = store.getChildByCode(code);
    if (!child) {
      // Only wrong guesses are charged, so a family setting up three phones in
      // a row on the same wifi never trips it.
      if (!limiter.take('pair', ip)) return fail(429, 'rateLimited');
      return fail(404, 'notFound');
    }

    const secret = auth.newToken();
    const device = {
      id: auth.newDeviceId(),
      childId: child.id,
      tokenHash: auth.hashToken(secret),
      platform: rules.checkPlatform(body && body.platform),
    };
    store.createDevice(device);
    store.markPaired(child.id);

    return ok(
      {
        deviceId: device.id,
        token: `${device.id}.${secret}`,
        childId: child.id,
        ageBand: child.ageBand,
        limits: store.getLimits(child.id),
      },
      201,
    );
  }

  /**
   * What the phone pulls.
   *
   * Deliberately tiny and deliberately cheap: the child's app calls this every
   * time it comes back to the foreground, compares `revision`, and does
   * nothing at all unless it moved.
   */
  function deviceConfig({ child }) {
    const assignment = store.getAssignment(child.id);
    return ok({
      childId: child.id,
      ageBand: child.ageBand,
      limits: store.getLimits(child.id),
      // A mission the phone has already collected is not sent again, so a
      // child who dismissed one does not find it back every ten minutes.
      assignment: assignment && !assignment.takenAt ? assignment : null,
      rewards: store.listRewards(child.id),
      note: store.openNote(child.id),
      serverTime: new Date(clock()).toISOString(),
    });
  }

  /**
   * What the phone says back about any of it.
   *
   * Deliberately the smallest handler here. Everything it can write is an id
   * this server issued or one of four fixed replies, both checked by
   * `cleanAck` before they arrive — there is no path through this function
   * that puts a string a child typed into the database.
   */
  function acknowledge({ ip, child, body }) {
    if (!limiter.take('report', ip)) return fail(429, 'rateLimited');
    const ack = rules.cleanAck(body);

    const took = ack.tookTaskId ? store.takeAssignment(child.id, ack.tookTaskId) : false;
    const answered = ack.note ? store.answerNote(child.id, ack.note.id, ack.note.reply) : false;

    return ok({ took, answered });
  }

  function report({ ip, child, body }) {
    if (!limiter.take('report', ip)) return fail(429, 'rateLimited');
    const cleaned = rules.cleanReport(body);
    for (const day of cleaned.days) store.putDay(child.id, day);
    store.applySnapshot(child.id, cleaned.snapshot);
    return ok({ stored: cleaned.days.length, limits: store.getLimits(child.id) });
  }

  function unpair({ device }) {
    store.deleteDevice(device.id);
    return ok({ unpaired: true });
  }

  /* ---------------------------------------------------------------- shapes */

  function publicParent(parent) {
    return {
      id: parent.id,
      email: parent.email,
      name: parent.name || null,
      createdAt: new Date(parent.created_at).toISOString(),
    };
  }

  function publicChild(child) {
    return {
      id: child.id,
      name: child.name,
      ageBand: child.ageBand,
      buddyId: child.buddyId,
      level: child.level,
      stars: child.stars,
      coins: child.coins,
      totalMissions: child.totalMissions,
      streak: child.streak,
      bestStreak: child.bestStreak,
      createdAt: new Date(child.createdAt).toISOString(),
      lastReport: child.lastReport ? new Date(child.lastReport).toISOString() : null,
    };
  }

  function pairingOf(child) {
    return {
      code: child.pairCode,
      /** `ABC-123` is what the parent reads aloud; the API takes either form. */
      pretty: child.pairCode ? `${child.pairCode.slice(0, 3)}-${child.pairCode.slice(3)}` : null,
      expiresAt: child.pairExpires ? new Date(child.pairExpires).toISOString() : null,
    };
  }

  return { handle, routes };
}

/* --------------------------------------------------------------- plumbing */

function normalisePath(path) {
  const clean = String(path || '/').split('?')[0];
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}

function ok(body, status = 200) {
  return { status, body };
}

function fail(status, error, reason) {
  return { status, body: reason ? { error, reason } : { error } };
}

module.exports = { createApp, SESSION_TTL_MS };
