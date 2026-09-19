/**
 * The friends board API.
 *
 * Framework free on purpose: `handle` takes a plain request and returns a
 * plain response, so the same code runs inside the Firebase Function, inside
 * `dev-server.js` on a laptop, and inside the tests.
 *
 *   GET    /usernames/:name   is this username free?
 *   POST   /players           claim a username           { username, buddyId }
 *   PATCH  /me                change the username        { username }
 *   PUT    /me/score          send the latest numbers    { stars, missions, streak, weekKey, weekStars, weekSteps, buddyId }
 *   POST   /me/invite         swap the invite code for a new one
 *   DELETE /me                delete the username and everything stored with it
 *   GET    /board?week=       this player and their friends
 *   POST   /friends           add a friend by invite code { code }
 *   DELETE /friends/:id       remove a friend, from both sides
 *
 * What is stored for a player is the username, the buddy, the board numbers
 * and the friend list. The app never sends the child's name, age or anything
 * else, and nothing here would accept it.
 */

const rules = require('./rules');
const { createLimiter } = require('./rate-limit');

/** A friend who has not sent a score in two days has broken the streak, whatever it last said. */
const STREAK_STALE_MS = 48 * 3_600_000;
/** Reading the board refreshes `updatedAt` at most this often, to save a write per visit. */
const TOUCH_EVERY_MS = 6 * 3_600_000;

function createApp({ store, clock = () => Date.now(), limiter = createLimiter(clock), log = console }) {
  const routes = [
    { method: 'GET', pattern: /^\/health$/, run: () => ok({ ok: true }) },
    { method: 'GET', pattern: /^\/usernames\/([^/]+)$/, run: checkName },
    { method: 'POST', pattern: /^\/players$/, run: claim },
    { method: 'PATCH', pattern: /^\/me$/, auth: true, run: rename },
    { method: 'PUT', pattern: /^\/me\/score$/, auth: true, run: score },
    { method: 'POST', pattern: /^\/me\/invite$/, auth: true, run: rotateInvite },
    { method: 'DELETE', pattern: /^\/me$/, auth: true, run: removePlayer },
    { method: 'GET', pattern: /^\/board$/, auth: true, run: board },
    { method: 'POST', pattern: /^\/friends$/, auth: true, run: addFriend },
    { method: 'DELETE', pattern: /^\/friends\/([^/]+)$/, auth: true, run: removeFriend },
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
        query: request.query ?? {},
        body: request.body && typeof request.body === 'object' ? request.body : null,
        player: null,
      };
      if (route.auth) {
        context.player = await authenticate(request.headers ?? {});
        if (!context.player) return fail(401, 'unauthorized');
      }
      return await route.run(context);
    } catch (error) {
      if (error instanceof URIError) return fail(400, 'invalid');
      log.error('[leaderboard] unhandled', error);
      return fail(500, 'server');
    }
  }

  async function authenticate(headers) {
    const header = headers.authorization ?? headers.Authorization ?? '';
    const match = /^Bearer (p[A-Za-z0-9_-]{8,40})\.([A-Za-z0-9_-]{20,100})$/.exec(header);
    if (!match) return null;
    const player = await store.getPlayer(match[1]);
    return player && rules.tokenMatches(match[2], player.tokenHash) ? player : null;
  }

  /* ------------------------------------------------------------ handlers */

  async function checkName({ ip, params }) {
    if (!limiter.take('check', ip)) return fail(429, 'rateLimited');
    const result = rules.checkUsername(params[0]);
    if (!result.ok) return ok({ available: false, reason: result.reason });
    const taken = await store.isUsernameTaken(result.key);
    return ok(taken ? { available: false, reason: 'taken' } : { available: true });
  }

  async function claim({ ip, body }) {
    const result = rules.checkUsername(body?.username);
    if (!result.ok) return fail(400, 'invalid', { reason: result.reason });
    if (!limiter.peek('claim', ip)) return fail(429, 'rateLimited');

    const buddyId = rules.BUDDY_IDS.includes(body.buddyId) ? body.buddyId : 'fox';

    // A clash on the invite code is a one in a hundred million event; roll again.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const now = clock();
      const token = rules.newToken();
      const player = {
        id: rules.newPlayerId(),
        username: result.username,
        usernameKey: result.key,
        tokenHash: rules.hashToken(token),
        inviteCode: rules.newInviteCode(),
        buddyId,
        stars: 0,
        missions: 0,
        streak: 0,
        weekKey: null,
        weekBase: 0,
        weekStars: 0,
        weekSteps: 0,
        friends: [],
        createdAt: now,
        updatedAt: now,
        scoredAt: null,
      };

      const outcome = await store.createPlayer(player);
      if (outcome === 'taken') return fail(409, 'taken');
      if (outcome === 'ok') {
        limiter.take('claim', ip);
        return ok(
          {
            playerId: player.id,
            token,
            username: player.username,
            inviteCode: player.inviteCode,
            createdAt: new Date(now).toISOString(),
          },
          201,
        );
      }
    }
    return fail(500, 'server');
  }

  async function rename({ ip, body, player }) {
    const result = rules.checkUsername(body?.username);
    if (!result.ok) return fail(400, 'invalid', { reason: result.reason });
    if (result.key === player.usernameKey && result.username === player.username) {
      return ok({ username: player.username });
    }
    if (!limiter.peek('claim', ip)) return fail(429, 'rateLimited');

    const outcome = await store.renamePlayer(player.id, result.username, result.key);
    if (outcome === 'taken') return fail(409, 'taken');
    if (outcome === 'missing') return fail(401, 'unauthorized');
    limiter.take('claim', ip);
    return ok({ username: result.username });
  }

  async function score({ body, player }) {
    if (!body || typeof body.stars !== 'number') return fail(400, 'invalid');
    const next = await store.updatePlayer(player.id, (current) => rules.acceptScore(current, body, clock()));
    if (!next) return fail(401, 'unauthorized');
    return ok({
      stars: next.stars,
      level: rules.levelForStars(next.stars),
      weekKey: next.weekKey,
      weekStars: next.weekStars,
    });
  }

  async function rotateInvite({ player }) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = rules.newInviteCode();
      const outcome = await store.setInviteCode(player.id, code);
      if (outcome === 'ok') return ok({ inviteCode: code });
      if (outcome === 'missing') return fail(401, 'unauthorized');
    }
    return fail(500, 'server');
  }

  async function removePlayer({ player }) {
    await store.deletePlayer(player.id);
    return ok({ deleted: true });
  }

  async function board({ query, player }) {
    const now = clock();
    const week = rules.isWeekKey(query.week) ? query.week : rules.isoWeekKey(now);
    const friends = await store.getPlayers(player.friends);

    if (now - player.updatedAt > TOUCH_EVERY_MS) {
      await store.updatePlayer(player.id, () => ({ updatedAt: now }));
    }

    return ok({
      week,
      username: player.username,
      inviteCode: player.inviteCode,
      entries: [player, ...friends].map((entry) => publicView(entry, week, now, player.id)),
    });
  }

  async function addFriend({ body, player }) {
    if (!limiter.peek('friend', player.id)) return fail(429, 'rateLimited');

    const code = rules.normaliseInviteCode(body?.code);
    if (!code) return fail(400, 'invalid');

    const friendId = await store.findInvite(code);
    if (!friendId) {
      // Only a miss costs anything. A parent typing in a whole class of real
      // codes never runs out; somebody guessing does.
      limiter.take('friend', player.id);
      return fail(404, 'notFound');
    }
    if (friendId === player.id) return fail(400, 'self');

    const outcome = await store.befriend(player.id, friendId, rules.MAX_FRIENDS);
    if (outcome === 'missing') return fail(404, 'notFound');
    if (outcome === 'full') return fail(409, 'full');

    const friend = await store.getPlayer(friendId);
    if (!friend) return fail(404, 'notFound');
    return ok(
      { already: outcome === 'already', friend: publicView(friend, rules.isoWeekKey(clock()), clock(), player.id) },
      outcome === 'ok' ? 201 : 200,
    );
  }

  async function removeFriend({ params, player }) {
    const outcome = await store.unfriend(player.id, params[0]);
    if (outcome === 'missing') return fail(401, 'unauthorized');
    return ok({ removed: true });
  }

  return { handle };
}

/**
 * What a friend is allowed to see. Built field by field so a new field on the
 * stored record never leaks onto somebody else's phone by accident.
 */
function publicView(player, week, now, viewerId) {
  const sameWeek = player.weekKey === week;
  const fresh = player.scoredAt != null && now - player.scoredAt < STREAK_STALE_MS;
  return {
    id: player.id,
    username: player.username,
    buddyId: player.buddyId,
    level: rules.levelForStars(player.stars),
    stars: player.stars,
    missions: player.missions,
    streak: fresh ? player.streak : 0,
    weekStars: sameWeek ? player.weekStars : 0,
    weekSteps: sameWeek ? player.weekSteps : 0,
    me: player.id === viewerId,
  };
}

/**
 * Deletes players nobody has opened the app for in a year, together with their
 * usernames and invite codes. A parent who uninstalls without removing the
 * username first is covered by this.
 */
async function sweepInactive({ store, clock = () => Date.now(), days = 365, batch = 200, log = console }) {
  const before = clock() - days * 86_400_000;
  let removed = 0;
  for (let round = 0; round < 20; round += 1) {
    const ids = await store.listInactive(before, batch);
    for (const id of ids) {
      if ((await store.deletePlayer(id)) === 'ok') removed += 1;
    }
    if (ids.length < batch) break;
  }
  if (removed > 0) log.info?.(`[leaderboard] removed ${removed} inactive players`);
  return removed;
}

/** The Cloud Functions url keeps the function name in front; the dev server does not. */
function normalisePath(raw) {
  const path = String(raw ?? '/').split('?')[0].replace(/\/+$/, '') || '/';
  return path.startsWith('/leaderboard/') ? path.slice('/leaderboard'.length) : path;
}

function ok(body, status = 200) {
  return { status, body };
}

function fail(status, error, extra = {}) {
  return { status, body: { error, ...extra } };
}

module.exports = { createApp, sweepInactive };
