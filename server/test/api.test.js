'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp } = require('../src/app');
const { createStore } = require('../src/store/sqlite');
const { createLimiter } = require('../src/rate-limit');
const analytics = require('../src/analytics');
const rules = require('../src/rules');

/**
 * The hub, driven through `handle` with no socket anywhere.
 *
 * The clock is a variable so a test can move time forward by a fortnight
 * between two lines, which is the only way to check that a pairing code really
 * expires and that a week of bars lands on the right days.
 */

function harness() {
  let now = Date.UTC(2026, 8, 19, 12, 0, 0); // Saturday 19 September 2026, noon UTC
  const clock = () => now;
  const store = createStore({ file: ':memory:', clock });
  const app = createApp({
    store,
    clock,
    limiter: createLimiter(clock),
    log: { error() {} },
  });

  let ip = 1;
  const call = (method, path, { body, token, freshIp = false } = {}) => {
    const [pathname, search] = path.split('?');
    const query = Object.fromEntries(new URLSearchParams(search || '').entries());
    return app.handle({
      method,
      path: pathname,
      query,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: body || null,
      // Most tests share one address; the rate-limit tests ask for their own.
      ip: freshIp ? `10.0.0.${(ip += 1)}` : '10.0.0.1',
    });
  };

  return {
    call,
    store,
    advance: (ms) => {
      now += ms;
    },
    at: () => now,
    setNow: (value) => {
      now = value;
    },
  };
}

async function signedUpParent(h, email = 'parent@example.com') {
  const res = await h.call('POST', '/v1/parents', {
    body: { email, password: 'a-long-enough-password', name: 'Emin' },
  });
  assert.equal(res.status, 201);
  return res.body.token;
}

async function pairedChild(h, token, name = 'Ayla', ageBand = '6-9') {
  const created = await h.call('POST', '/v1/children', { body: { name, ageBand }, token });
  assert.equal(created.status, 201);
  const paired = await h.call('POST', '/v1/devices', {
    body: { code: created.body.pairing.pretty, platform: 'android' },
  });
  assert.equal(paired.status, 201);
  return { child: created.body.child, deviceToken: paired.body.token };
}

/* ------------------------------------------------------------------ basics */

test('health answers without a token', async () => {
  const h = harness();
  const res = await h.call('GET', '/v1/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

test('an unknown path is 404 and a wrong method is 405', async () => {
  const h = harness();
  assert.equal((await h.call('GET', '/v1/nope')).status, 404);
  assert.equal((await h.call('PUT', '/v1/health')).status, 405);
});

/* ----------------------------------------------------------------- parents */

test('registering returns a working session', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const res = await h.call('GET', '/v1/parents/me', { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.parent.email, 'parent@example.com');
  assert.deepEqual(res.body.children, []);
});

test('the email is stored folded and trimmed', async () => {
  const h = harness();
  await h.call('POST', '/v1/parents', {
    body: { email: '  Parent@Example.COM ', password: 'a-long-enough-password' },
  });
  const res = await h.call('POST', '/v1/parents/session', {
    body: { email: 'parent@example.com', password: 'a-long-enough-password' },
  });
  assert.equal(res.status, 200);
});

test('a short password is refused with a reason the app can show', async () => {
  const h = harness();
  const res = await h.call('POST', '/v1/parents', {
    body: { email: 'a@b.co', password: 'short' },
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.reason, 'short');
});

test('the same address cannot register twice', async () => {
  const h = harness();
  await signedUpParent(h);
  const res = await h.call('POST', '/v1/parents', {
    body: { email: 'parent@example.com', password: 'another-long-password' },
  });
  assert.equal(res.status, 409);
});

test('a wrong password and an unknown address answer identically', async () => {
  const h = harness();
  await signedUpParent(h);
  const wrong = await h.call('POST', '/v1/parents/session', {
    body: { email: 'parent@example.com', password: 'not-the-password' },
  });
  const unknown = await h.call('POST', '/v1/parents/session', {
    body: { email: 'nobody@example.com', password: 'not-the-password' },
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
});

test('signing out kills that token and no other', async () => {
  const h = harness();
  const first = await signedUpParent(h);
  const second = (
    await h.call('POST', '/v1/parents/session', {
      body: { email: 'parent@example.com', password: 'a-long-enough-password' },
    })
  ).body.token;

  assert.equal((await h.call('DELETE', '/v1/parents/session', { token: first })).status, 200);
  assert.equal((await h.call('GET', '/v1/parents/me', { token: first })).status, 401);
  assert.equal((await h.call('GET', '/v1/parents/me', { token: second })).status, 200);
});

test('a token pointed at another parent id is rejected', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const other = await signedUpParent(h, 'other@example.com');
  const secret = token.split('.')[1];
  const forged = `${other.split('.')[0]}.${secret}`;
  assert.equal((await h.call('GET', '/v1/parents/me', { token: forged })).status, 401);
});

test('deleting the account needs the password and takes the children with it', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child } = await pairedChild(h, token);

  assert.equal(
    (await h.call('DELETE', '/v1/parents/me', { token, body: { password: 'wrong' } })).status,
    401,
  );
  const res = await h.call('DELETE', '/v1/parents/me', {
    token,
    body: { password: 'a-long-enough-password' },
  });
  assert.equal(res.status, 200);
  assert.equal(h.store.getChild(child.id), null);
  assert.equal(h.store.stats().parents, 0);
});

/* ---------------------------------------------------------------- children */

test('adding a child hands back a readable pairing code', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const res = await h.call('POST', '/v1/children', {
    body: { name: '  Ayla   Baxisli ', ageBand: '6-9' },
    token,
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.child.name, 'Ayla Baxisli');
  assert.match(res.body.pairing.pretty, /^[A-Z0-9]{3}-[A-Z0-9]{5,}$|^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  assert.equal(res.body.pairing.code.length, 6);
});

test('a bad age band is refused', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const res = await h.call('POST', '/v1/children', {
    body: { name: 'Ayla', ageBand: '4-5' },
    token,
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.reason, 'ageBand');
});

test('one parent cannot see or touch another parent\'s child', async () => {
  const h = harness();
  const mine = await signedUpParent(h);
  const theirs = await signedUpParent(h, 'other@example.com');
  const { child } = await pairedChild(h, mine);

  assert.equal((await h.call('GET', `/v1/children/${child.id}/summary`, { token: theirs })).status, 404);
  assert.equal((await h.call('PUT', `/v1/children/${child.id}/limits`, { token: theirs, body: {} })).status, 404);
  assert.equal((await h.call('DELETE', `/v1/children/${child.id}`, { token: theirs })).status, 404);
});

test('renaming a child leaves the history alone', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-19', missionsDone: 3 }] },
  });
  await h.call('PATCH', `/v1/children/${child.id}`, { token, body: { name: 'Aylin' } });
  const res = await h.call('GET', `/v1/children/${child.id}/summary`, { token });
  assert.equal(res.body.child.name, 'Aylin');
  assert.equal(res.body.summary.totals.missionsDone, 3);
});

/* ----------------------------------------------------------------- pairing */

test('a code works once and is then gone', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const created = await h.call('POST', '/v1/children', {
    body: { name: 'Ayla', ageBand: '3-5' },
    token,
  });
  const code = created.body.pairing.code;

  assert.equal((await h.call('POST', '/v1/devices', { body: { code } })).status, 201);
  assert.equal((await h.call('POST', '/v1/devices', { body: { code } })).status, 404);
});

test('a code is accepted however it is typed', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const created = await h.call('POST', '/v1/children', {
    body: { name: 'Ayla', ageBand: '3-5' },
    token,
  });
  const code = created.body.pairing.code;
  const messy = `  ${code.slice(0, 3).toLowerCase()} - ${code.slice(3).toLowerCase()} `;
  assert.equal((await h.call('POST', '/v1/devices', { body: { code: messy } })).status, 201);
});

test('a code expires after half an hour', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const created = await h.call('POST', '/v1/children', {
    body: { name: 'Ayla', ageBand: '3-5' },
    token,
  });
  h.advance(31 * 60_000);
  assert.equal(
    (await h.call('POST', '/v1/devices', { body: { code: created.body.pairing.code } })).status,
    404,
  );

  const fresh = await h.call('POST', `/v1/children/${created.body.child.id}/code`, { token });
  assert.equal(
    (await h.call('POST', '/v1/devices', { body: { code: fresh.body.pairing.code } })).status,
    201,
  );
});

test('wrong codes are throttled and right ones are not', async () => {
  const h = harness();
  const token = await signedUpParent(h);

  let blocked = false;
  for (let i = 0; i < 14; i += 1) {
    const res = await h.call('POST', '/v1/devices', { body: { code: 'BBBBBB' } });
    if (res.status === 429) blocked = true;
  }
  assert.equal(blocked, true, 'guessing should eventually be refused');

  // A real code still goes through from the same address.
  const created = await h.call('POST', '/v1/children', {
    body: { name: 'Ayla', ageBand: '3-5' },
    token,
  });
  assert.equal(
    (await h.call('POST', '/v1/devices', { body: { code: created.body.pairing.code } })).status,
    201,
  );
});

test('a device token cannot be used on a parent route, or the other way round', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  assert.equal((await h.call('GET', '/v1/children', { token: deviceToken })).status, 401);
  assert.equal((await h.call('GET', '/v1/devices/me', { token })).status, 401);
  assert.equal((await h.call('GET', `/v1/children/${child.id}/limits`, { token })).status, 200);
});

test('unpairing stops that phone reporting', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { deviceToken } = await pairedChild(h, token);
  assert.equal((await h.call('DELETE', '/v1/devices/me', { token: deviceToken })).status, 200);
  assert.equal((await h.call('GET', '/v1/devices/me', { token: deviceToken })).status, 401);
});

/* ------------------------------------------------------------------ limits */

test('a parent sets a limit and the phone reads it back', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const before = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  const firstRevision = before.body.limits.revision;

  const set = await h.call('PUT', `/v1/children/${child.id}/limits`, {
    token,
    body: {
      enabled: true,
      tier: 'interrupt',
      dailyBudgetMin: 120,
      nudgeEveryMin: 30,
      curfew: { startMin: 1260, endMin: 420 },
      watched: ['com.google.android.youtube'],
    },
  });
  assert.equal(set.status, 200);
  assert.equal(set.body.limits.dailyBudgetMin, 120);
  assert.equal(set.body.limits.curfewStartMin, 1260);

  const after = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(after.body.limits.enabled, true);
  assert.equal(after.body.limits.nudgeEveryMin, 30);
  assert.deepEqual(after.body.limits.watched, ['com.google.android.youtube']);
  assert.ok(after.body.limits.revision > firstRevision, 'revision must move so the phone re-applies');
});

test('nonsense limits are clamped rather than refused', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child } = await pairedChild(h, token);
  const res = await h.call('PUT', `/v1/children/${child.id}/limits`, {
    token,
    body: { enabled: true, tier: 'melt', dailyBudgetMin: 99_999, nudgeEveryMin: -4 },
  });
  assert.equal(res.body.limits.tier, 'notice');
  assert.equal(res.body.limits.dailyBudgetMin, 1440);
  assert.equal(res.body.limits.nudgeEveryMin, 0);
});

/* ----------------------------------------------------------------- reports */

test('a report is stored and comes back in the summary', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const res = await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: {
      days: [
        {
          date: '2026-09-18',
          screenSec: 5400,
          missionsDone: 2,
          activeMin: 35,
          steps: 4200,
          categories: { move: 1, outdoor: 1 },
        },
        { date: '2026-09-19', screenSec: 3600, missionsDone: 3, activeMin: 50, steps: 6100 },
      ],
      snapshot: { ageBand: '6-9', buddyId: 'fox', level: 4, stars: 120, streak: 6, tzOffsetMin: 240 },
    },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.stored, 2);

  const summary = await h.call('GET', `/v1/children/${child.id}/summary?range=week`, { token });
  assert.equal(summary.body.summary.totals.missionsDone, 5);
  assert.equal(summary.body.summary.totals.screenSec, 9000);
  assert.equal(summary.body.summary.totals.reportedDays, 2);
  assert.equal(summary.body.child.level, 4);
  assert.equal(summary.body.child.streak, 6);
});

test('re-sending the same day changes nothing', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);
  const day = { date: '2026-09-19', screenSec: 3600, missionsDone: 3 };

  for (let i = 0; i < 4; i += 1) {
    await h.call('POST', '/v1/devices/me/reports', { token: deviceToken, body: { days: [day] } });
  }
  const summary = await h.call('GET', `/v1/children/${child.id}/summary?range=week`, { token });
  assert.equal(summary.body.summary.totals.missionsDone, 3);
  assert.equal(summary.body.summary.totals.screenSec, 3600);
});

test('a day only ever moves forwards, so a late stale retry cannot undo it', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-19', screenSec: 7200, missionsDone: 4 }] },
  });
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-19', screenSec: 900, missionsDone: 1 }] },
  });
  const summary = await h.call('GET', `/v1/children/${child.id}/summary?range=week`, { token });
  assert.equal(summary.body.summary.totals.screenSec, 7200);
  assert.equal(summary.body.summary.totals.missionsDone, 4);
});

test('an impossible day is dropped and the good ones beside it are kept', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const res = await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: {
      days: [
        { date: 'yesterday', missionsDone: 9 },
        { date: '2026-02-30', missionsDone: 9 },
        { date: '2026-09-19', missionsDone: 2 },
      ],
    },
  });
  assert.equal(res.body.stored, 1);
  const summary = await h.call('GET', `/v1/children/${child.id}/summary?range=week`, { token });
  assert.equal(summary.body.summary.totals.missionsDone, 2);
});

test('a phone with a broken clock is clamped, not believed', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-19', screenSec: 999_999, missionsDone: 3 }] },
  });
  const summary = await h.call('GET', `/v1/children/${child.id}/summary?range=week`, { token });
  assert.equal(summary.body.summary.totals.screenSec, 86_400);
  assert.equal(summary.body.summary.totals.missionsDone, 3);
});

test('nothing a child typed has anywhere to land', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: {
      days: [
        {
          date: '2026-09-19',
          missionsDone: 1,
          note: 'I felt sad about school today',
          photoUri: 'file:///pictures/kid.jpg',
          nickname: 'Ayla',
          lat: 40.4,
          lng: 49.8,
        },
      ],
      snapshot: { ageBand: '6-9', nickname: 'Ayla', interests: ['football'] },
    },
  });

  const stored = JSON.stringify(h.store.getDay(child.id, '2026-09-19'));
  assert.ok(!stored.includes('sad'), 'a note must not be stored');
  assert.ok(!stored.includes('pictures'), 'a photo path must not be stored');
  assert.ok(!stored.includes('Ayla'), 'a child-typed name must not be stored');
  assert.ok(!stored.includes('40.4'), 'a location must not be stored');

  // The name on the card is the one the parent typed, not one the phone sent.
  const card = await h.call('GET', '/v1/children', { token });
  assert.equal(card.body.children[0].name, 'Ayla');
});

test('the child list carries today and a week of bars in one request', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { deviceToken } = await pairedChild(h, token);
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-19', missionsDone: 2, screenSec: 1800 }] },
  });

  const res = await h.call('GET', '/v1/children', { token });
  const card = res.body.children[0];
  assert.equal(card.paired, true);
  assert.equal(card.week.length, 7);
  assert.equal(card.today.date, '2026-09-19');
  assert.equal(card.today.missionsDone, 2);
  assert.equal(card.week[0].reported, false, 'days with no report are drawn as gaps');
});

/* --------------------------------------------------------------- analytics */

test('a month summary compares against the month before it', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  // Two stretches of ten days: the older one heavier on screen time.
  const days = [];
  for (let i = 0; i < 10; i += 1) {
    days.push({ date: rules.shiftDay('2026-08-01', i), screenSec: 7200, missionsDone: 1 });
    days.push({ date: rules.shiftDay('2026-09-10', i), screenSec: 3600, missionsDone: 3 });
  }
  await h.call('POST', '/v1/devices/me/reports', { token: deviceToken, body: { days } });

  const res = await h.call('GET', `/v1/children/${child.id}/summary?range=month`, { token });
  const summary = res.body.summary;
  assert.equal(summary.range.days, 30);
  assert.equal(summary.totals.reportedDays, 10);
  assert.equal(summary.averages.screenSec, 3600);
  assert.equal(summary.previous.screenPerDay, 7200);
  assert.equal(summary.change.screenPerDay, -50, 'half the screen time is a 50% fall');
  assert.equal(summary.change.missionsDone, 200, 'ten missions to thirty is a threefold rise');
});

test('an explicit from and to is honoured', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: {
      days: [
        { date: '2026-09-01', missionsDone: 5 },
        { date: '2026-09-15', missionsDone: 7 },
      ],
    },
  });
  const res = await h.call('GET', `/v1/children/${child.id}/summary?from=2026-09-10&to=2026-09-20`, {
    token,
  });
  assert.equal(res.body.summary.totals.missionsDone, 7);
  assert.equal(res.body.summary.range.days, 11);
});

test('a backwards range is refused', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child } = await pairedChild(h, token);
  const res = await h.call('GET', `/v1/children/${child.id}/summary?from=2026-09-20&to=2026-09-01`, {
    token,
  });
  assert.equal(res.status, 400);
});

test('averages are over days that reported, not over the calendar', () => {
  const rows = [
    { date: '2026-09-18', screenSec: 3600, missionsDone: 2, categories: {} },
    { date: '2026-09-19', screenSec: 1800, missionsDone: 0, categories: {} },
  ];
  const summary = analytics.summarise(rows, '2026-09-13', '2026-09-19');
  assert.equal(summary.totals.reportedDays, 2);
  assert.equal(summary.averages.screenSec, 2700, 'not 5400 divided by seven');
  assert.equal(summary.days.length, 7);
  assert.equal(summary.days[0].reported, false);
});

test('the weekday profile puts Monday first and averages only the days that ran', () => {
  const rows = [
    // 14 and 21 September 2026 are Mondays.
    { date: '2026-09-14', screenSec: 7200, missionsDone: 1, categories: {} },
    { date: '2026-09-21', screenSec: 3600, missionsDone: 3, categories: {} },
    { date: '2026-09-19', screenSec: 1800, missionsDone: 2, categories: {} },
  ];
  const profile = analytics.weekdayProfile(analytics.series(rows, '2026-09-14', '2026-09-21'));
  assert.equal(profile[0].weekday, 0);
  assert.equal(profile[0].days, 2);
  assert.equal(profile[0].screenSec, 5400, 'the two Mondays averaged');
  assert.equal(profile[5].screenSec, 1800, 'Saturday');
  assert.equal(profile[6].days, 0, 'Sunday never reported');
});

test('the trailing streak stops at the first day without a mission', () => {
  const rows = [
    { date: '2026-09-16', missionsDone: 1, categories: {} },
    { date: '2026-09-17', missionsDone: 0, categories: {} },
    { date: '2026-09-18', missionsDone: 2, categories: {} },
    { date: '2026-09-19', missionsDone: 1, categories: {} },
  ];
  const summary = analytics.summarise(rows, '2026-09-13', '2026-09-19');
  assert.equal(summary.streak, 2);
});

test('the balance score is active minutes against screen minutes', () => {
  const rows = [{ date: '2026-09-19', screenSec: 3600, activeMin: 60, categories: {} }];
  const summary = analytics.summarise(rows, '2026-09-19', '2026-09-19');
  assert.equal(summary.balance, 50);
});

test('the trend compares rates, so a window with fewer reporting days is not inflated', () => {
  // Same three missions every day it ran. The older window only ran twice, the
  // newer one ran six times. Comparing totals would call that a 200% rise.
  const rows = [
    { date: '2026-09-06', missionsDone: 3, categories: {} },
    { date: '2026-09-07', missionsDone: 3, categories: {} },
    { date: '2026-09-14', missionsDone: 3, categories: {} },
    { date: '2026-09-15', missionsDone: 3, categories: {} },
    { date: '2026-09-16', missionsDone: 3, categories: {} },
    { date: '2026-09-17', missionsDone: 3, categories: {} },
    { date: '2026-09-18', missionsDone: 3, categories: {} },
    { date: '2026-09-19', missionsDone: 3, categories: {} },
  ];
  const summary = analytics.summarise(rows, '2026-09-13', '2026-09-19');
  assert.equal(summary.totals.missionsDone, 18);
  assert.equal(summary.previous.missionsDone, 6);
  assert.equal(summary.change.missionsDone, 0, 'the child did not change; the uptime did');
});

test('a change against nothing is null rather than infinity', () => {
  assert.equal(analytics.changePct(10, 0), null);
  assert.equal(analytics.changePct(10, 5), 100);
  assert.equal(analytics.changePct(0, 5), -100);
});

test('the nudge response rate is null until a nudge has fired', () => {
  const quiet = analytics.summarise([{ date: '2026-09-19', categories: {} }], '2026-09-19', '2026-09-19');
  assert.equal(quiet.nudgeResponse, null);
  const busy = analytics.summarise(
    [{ date: '2026-09-19', nudges: 4, nudgeHeeded: 3, categories: {} }],
    '2026-09-19',
    '2026-09-19',
  );
  assert.equal(busy.nudgeResponse, 75);
});

/* -------------------------------------------------------------- timezones */

test("today on the chart is the child's today, not the server's", async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  // 22:30 UTC. In Baku, +4, it is already half past two the next morning.
  h.setNow(Date.UTC(2026, 8, 19, 22, 30, 0));
  await h.call('POST', '/v1/devices/me/reports', {
    token: deviceToken,
    body: { days: [{ date: '2026-09-20', missionsDone: 1 }], snapshot: { tzOffsetMin: 240 } },
  });

  const res = await h.call('GET', '/v1/children', { token });
  assert.equal(res.body.children[0].today.date, '2026-09-20');
  assert.equal(res.body.children[0].today.missionsDone, 1);
  assert.equal(h.store.getChild(child.id).tzOffsetMin, 240);
});

/* ------------------------------------------------------------------- rules */

test('a report with no days at all is accepted quietly', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { deviceToken } = await pairedChild(h, token);
  const res = await h.call('POST', '/v1/devices/me/reports', { token: deviceToken, body: {} });
  assert.equal(res.status, 200);
  assert.equal(res.body.stored, 0);
});

test('a huge backlog is capped at sixty days', () => {
  const days = [];
  for (let i = 0; i < 200; i += 1) days.push({ date: rules.shiftDay('2026-01-01', i) });
  assert.equal(rules.cleanReport({ days }).days.length, 60);
});

test('duplicate dates in one report collapse to the first', () => {
  const report = rules.cleanReport({
    days: [
      { date: '2026-09-19', missionsDone: 3 },
      { date: '2026-09-19', missionsDone: 9 },
    ],
  });
  assert.equal(report.days.length, 1);
  assert.equal(report.days[0].missionsDone, 3);
});

/* ------------------------------------------- what a parent sends down */

/**
 * The other direction.
 *
 * Everything above this point is a phone reporting counts upwards. These are
 * the three things a parent can send the other way: a mission they picked, a
 * reward they promised, and a line they typed. The last block is the one that
 * matters most — it checks that none of it opens a way for a child's own words
 * to arrive here, which is the whole reason the report contract is as narrow
 * as it is.
 */

test('a parent picks a mission and the phone collects it once', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  // Nothing waiting to begin with.
  const empty = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(empty.body.assignment, null);

  const put = await h.call('PUT', `/v1/children/${child.id}/assignment`, {
    body: { taskId: 'duo-hide' },
    token,
  });
  assert.equal(put.status, 200);
  assert.equal(put.body.assignment.taskId, 'duo-hide');

  const config = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(config.body.assignment.taskId, 'duo-hide');

  // The phone says it landed, and stops being handed the same mission.
  const ack = await h.call('POST', '/v1/devices/me/ack', {
    body: { tookTaskId: 'duo-hide' },
    token: deviceToken,
  });
  assert.equal(ack.body.took, true);

  const after = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(after.body.assignment, null);

  // The parent can still see what they picked and when it was taken.
  const read = await h.call('GET', `/v1/children/${child.id}/assignment`, { token });
  assert.equal(read.body.assignment.taskId, 'duo-hide');
  assert.ok(read.body.assignment.takenAt);
});

test('acknowledging a mission the parent already replaced changes nothing', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  await h.call('PUT', `/v1/children/${child.id}/assignment`, { body: { taskId: 'old-one' }, token });
  await h.call('PUT', `/v1/children/${child.id}/assignment`, { body: { taskId: 'new-one' }, token });

  const ack = await h.call('POST', '/v1/devices/me/ack', {
    body: { tookTaskId: 'old-one' },
    token: deviceToken,
  });
  assert.equal(ack.body.took, false);

  // The new one is still waiting, which is the point.
  const config = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(config.body.assignment.taskId, 'new-one');
});

test('a mission id has to look like a library key', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child } = await pairedChild(h, token);

  for (const taskId of ['../secrets', 'a space', '', 'x'.repeat(80), 42]) {
    const res = await h.call('PUT', `/v1/children/${child.id}/assignment`, { body: { taskId }, token });
    assert.equal(res.status, 400, `accepted ${JSON.stringify(taskId)}`);
  }

  // Null is how a parent takes the mission back.
  const cleared = await h.call('PUT', `/v1/children/${child.id}/assignment`, {
    body: { taskId: null },
    token,
  });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.assignment, null);
});

test('a promised reward reaches the phone and comes back marked given', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const made = await h.call('POST', `/v1/children/${child.id}/rewards`, {
    body: { stars: 50, label: 'Cinema on Saturday', emoji: '🎬' },
    token,
  });
  assert.equal(made.status, 201);
  assert.equal(made.body.reward.stars, 50);
  assert.equal(made.body.reward.givenAt, null);

  const config = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(config.body.rewards.length, 1);
  assert.equal(config.body.rewards[0].label, 'Cinema on Saturday');

  const given = await h.call('PATCH', `/v1/children/${child.id}/rewards/${made.body.reward.id}`, {
    body: { given: true },
    token,
  });
  assert.equal(given.status, 200);
  assert.ok(given.body.reward.givenAt);

  const removed = await h.call('DELETE', `/v1/children/${child.id}/rewards/${made.body.reward.id}`, {
    token,
  });
  assert.equal(removed.status, 200);
  assert.equal((await h.call('GET', `/v1/children/${child.id}/rewards`, { token })).body.rewards.length, 0);
});

test('a reward needs words and the list has a ceiling', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child } = await pairedChild(h, token);

  const blank = await h.call('POST', `/v1/children/${child.id}/rewards`, {
    body: { stars: 10, label: '   ', emoji: '🎁' },
    token,
  });
  assert.equal(blank.status, 400);

  for (let i = 0; i < rules.MAX_REWARDS; i += 1) {
    const res = await h.call('POST', `/v1/children/${child.id}/rewards`, {
      body: { stars: 10, label: `Reward ${i}`, emoji: '🎁' },
      token,
    });
    assert.equal(res.status, 201);
  }
  const overflow = await h.call('POST', `/v1/children/${child.id}/rewards`, {
    body: { stars: 10, label: 'One too many', emoji: '🎁' },
    token,
  });
  assert.equal(overflow.status, 409);
});

test('a note goes down and one of four replies comes back', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const line = 'Granny is coming at five, tidy the front room first';
  const sent = await h.call('POST', `/v1/children/${child.id}/notes`, { body: { text: line }, token });
  assert.equal(sent.status, 201);

  const config = await h.call('GET', '/v1/devices/me', { token: deviceToken });
  assert.equal(config.body.note.text, line);

  const ack = await h.call('POST', '/v1/devices/me/ack', {
    body: { note: { id: config.body.note.id, reply: 'done' } },
    token: deviceToken,
  });
  assert.equal(ack.body.answered, true);

  // Answered notes stop being handed down.
  assert.equal((await h.call('GET', '/v1/devices/me', { token: deviceToken })).body.note, null);

  // And the parent sees which of the four came back.
  const notes = await h.call('GET', `/v1/children/${child.id}/notes`, { token });
  assert.equal(notes.body.notes[0].reply, 'done');
  assert.ok(notes.body.notes[0].repliedAt);
});

test('a note cannot be answered twice', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  await h.call('POST', `/v1/children/${child.id}/notes`, { body: { text: 'Bins out please' }, token });
  const { id } = (await h.call('GET', '/v1/devices/me', { token: deviceToken })).body.note;

  const first = await h.call('POST', '/v1/devices/me/ack', {
    body: { note: { id, reply: 'ok' } },
    token: deviceToken,
  });
  assert.equal(first.body.answered, true);

  const second = await h.call('POST', '/v1/devices/me/ack', {
    body: { note: { id, reply: 'later' } },
    token: deviceToken,
  });
  assert.equal(second.body.answered, false);

  assert.equal((await h.call('GET', `/v1/children/${child.id}/notes`, { token })).body.notes[0].reply, 'ok');
});

test('a note is a line, not a page', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  const blank = await h.call('POST', `/v1/children/${child.id}/notes`, { body: { text: '   ' }, token });
  assert.equal(blank.status, 400);

  await h.call('POST', `/v1/children/${child.id}/notes`, {
    body: { text: `a${'b'.repeat(500)}\n\n\nc` },
    token,
  });
  const note = (await h.call('GET', '/v1/devices/me', { token: deviceToken })).body.note;
  assert.equal(note.text.length, 200);
  assert.ok(!note.text.includes('\n'), 'newlines are flattened');
});

test('none of this lets a child put their own words on the server', async () => {
  const h = harness();
  const token = await signedUpParent(h);
  const { child, deviceToken } = await pairedChild(h, token);

  await h.call('PUT', `/v1/children/${child.id}/assignment`, { body: { taskId: 'duo-hide' }, token });
  await h.call('POST', `/v1/children/${child.id}/notes`, { body: { text: 'How was school?' }, token });
  const noteId = (await h.call('GET', '/v1/devices/me', { token: deviceToken })).body.note.id;

  // A phone trying every field it can see, with a sentence in each.
  const ack = await h.call('POST', '/v1/devices/me/ack', {
    body: {
      tookTaskId: 'I sat next to Mira today and she said',
      note: { id: noteId, reply: 'It was bad, Mr Yilmaz shouted at me' },
      text: 'my address is 14 Green Lane',
      nickname: 'Emin',
      message: 'please tell mum',
    },
    token: deviceToken,
  });
  assert.equal(ack.status, 200);
  assert.equal(ack.body.took, false, 'a sentence is not a task id');
  assert.equal(ack.body.answered, false, 'a sentence is not one of the four replies');

  // Nothing landed anywhere a parent could read it back.
  const notes = await h.call('GET', `/v1/children/${child.id}/notes`, { token });
  assert.equal(notes.body.notes[0].reply, null);
  assert.equal(notes.body.notes[0].text, 'How was school?');

  const assignment = await h.call('GET', `/v1/children/${child.id}/assignment`, { token });
  assert.equal(assignment.body.assignment.taskId, 'duo-hide');
  assert.equal(assignment.body.assignment.takenAt, null);

  // And the whole of this child's half of the database holds none of those
  // sentences, in any column.
  const dump = JSON.stringify([
    h.store.listNotes(child.id),
    h.store.listRewards(child.id),
    h.store.getAssignment(child.id),
  ]);
  for (const leak of ['Mira', 'Yilmaz', 'Green Lane', 'Emin', 'tell mum']) {
    assert.ok(!dump.includes(leak), `${leak} reached the database`);
  }
});

test('a parent cannot send anything to a child who is not theirs', async () => {
  const h = harness();
  const mine = await signedUpParent(h, 'mine@example.com');
  const theirs = await signedUpParent(h, 'theirs@example.com');
  const { child } = await pairedChild(h, theirs);

  const assign = await h.call('PUT', `/v1/children/${child.id}/assignment`, {
    body: { taskId: 'duo-hide' },
    token: mine,
  });
  assert.equal(assign.status, 404);

  const note = await h.call('POST', `/v1/children/${child.id}/notes`, {
    body: { text: 'hello' },
    token: mine,
  });
  assert.equal(note.status, 404);

  const reward = await h.call('POST', `/v1/children/${child.id}/rewards`, {
    body: { stars: 5, label: 'Sweets', emoji: '🎁' },
    token: mine,
  });
  assert.equal(reward.status, 404);
});
