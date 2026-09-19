/**
 * The friends board API, end to end through `handle`.
 *
 *   npm test                  against the in-memory store
 *   npm run test:emulator     the same tests against the Firestore emulator
 *
 * Running one suite against both stores is what keeps them honest: a promise
 * the memory store keeps and Firestore does not shows up here as a failure.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { createApp, sweepInactive } = require('../src/app');
const rules = require('../src/rules');
const { createMemoryStore } = require('../src/store/memory');
const { createFirestoreStore } = require('../src/store/firestore');

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST;
const PROJECT = process.env.GCLOUD_PROJECT || 'demo-screenless';
const DATABASE = 'screenless';

let firestore = null;
if (EMULATOR) {
  const { initializeApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  firestore = getFirestore(initializeApp({ projectId: PROJECT }), DATABASE);
}

/** Monday 14 September 2026, 09:00 UTC. ISO week 2026-W38. */
const START = Date.UTC(2026, 8, 14, 9, 0);
const HOUR = 3_600_000;

async function setup() {
  let store;
  if (firestore) {
    await fetch(`http://${EMULATOR}/emulator/v1/projects/${PROJECT}/databases/${DATABASE}/documents`, {
      method: 'DELETE',
    });
    store = createFirestoreStore(firestore);
  } else {
    store = createMemoryStore();
  }

  const clock = { now: START };
  const silent = { error() {}, info() {} };
  const app = createApp({ store, clock: () => clock.now, log: silent });

  const call = (method, path, { body, auth, ip = '10.0.0.1', query } = {}) =>
    app.handle({
      method,
      path,
      query,
      body,
      ip,
      headers: auth ? { authorization: `Bearer ${auth.playerId}.${auth.token}` } : {},
    });

  const claim = async (username, buddyId = 'fox', ip) => {
    const res = await call('POST', '/players', { body: { username, buddyId }, ip });
    assert.equal(res.status, 201, `claim ${username}: ${JSON.stringify(res.body)}`);
    return res.body;
  };

  return { store, clock, call, claim };
}

const friendIds = async (store, account) => (await store.getPlayer(account.playerId)).friends;

/* ---------------------------------------------------------------- usernames */

test('a free username is available and a malformed one says why', async () => {
  const { call } = await setup();

  assert.deepEqual((await call('GET', '/usernames/Arif')).body, { available: true });
  assert.deepEqual((await call('GET', '/usernames/ab')).body, { available: false, reason: 'short' });
  assert.deepEqual((await call('GET', '/usernames/Emin%20Baxish')).body, { available: false, reason: 'chars' });
  assert.deepEqual((await call('GET', '/usernames/7arif')).body, { available: false, reason: 'start' });
  assert.deepEqual((await call('GET', '/usernames/ali12345')).body, { available: false, reason: 'digits' });
  assert.deepEqual((await call('GET', '/usernames/abcdefghijklmnopq')).body, { available: false, reason: 'long' });
  assert.deepEqual((await call('GET', '/usernames/%D0%B0rif')).body, { available: false, reason: 'chars' });
  assert.deepEqual((await call('GET', '/usernames/%E0%A4%A')).body, { error: 'invalid' });
});

test('rude and reserved names are refused, ordinary words that contain them are not', async () => {
  const { call } = await setup();

  assert.equal((await call('GET', '/usernames/ShitHead')).body.reason, 'rude');
  assert.equal((await call('GET', '/usernames/ScreenLessTeam')).body.reason, 'reserved');
  assert.equal((await call('GET', '/usernames/support')).body.reason, 'reserved');
  // "ışık" folds to "isik" and "kanal" contains "anal". Both are fine.
  assert.equal((await call('GET', `/usernames/${encodeURIComponent('Işık')}`)).body.available, true);
  assert.equal((await call('GET', '/usernames/Kanal7')).body.available, true);
});

test('usernames are unique across case, Turkish letters and underscores', async () => {
  const { call, claim } = await setup();

  const cagla = await claim('Çağla');
  assert.equal(cagla.username, 'Çağla');
  assert.match(cagla.inviteCode, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);

  for (const clash of ['cagla', 'CAGLA', 'ÇAĞLA', 'Cag_la']) {
    const res = await call('POST', '/players', { body: { username: clash } });
    assert.equal(res.status, 409, clash);
    assert.equal(res.body.error, 'taken');
    assert.deepEqual((await call('GET', `/usernames/${encodeURIComponent(clash)}`)).body, {
      available: false,
      reason: 'taken',
    });
  }

  await claim('EMİN');
  assert.equal((await call('POST', '/players', { body: { username: 'emin' } })).status, 409);
});

test('two phones claiming the same name at once: exactly one wins', async () => {
  const { call } = await setup();
  const results = await Promise.all([
    call('POST', '/players', { body: { username: 'Deniz' } }),
    call('POST', '/players', { body: { username: 'DENIZ' } }),
    call('POST', '/players', { body: { username: 'deniz' } }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409, 409]);
});

test('a claim with a bad username or buddy is handled', async () => {
  const { call, store } = await setup();
  const bad = await call('POST', '/players', { body: { username: 'x' } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: 'invalid', reason: 'short' });

  const res = await call('POST', '/players', { body: { username: 'Leyla', buddyId: 'dragon' } });
  assert.equal(res.status, 201);
  assert.equal((await store.getPlayer(res.body.playerId)).buddyId, 'fox');

  // The token itself is never stored.
  const stored = await store.getPlayer(res.body.playerId);
  assert.equal(JSON.stringify(stored).includes(res.body.token), false);
});

/* --------------------------------------------------------------------- auth */

test('everything about a player needs that player’s token', async () => {
  const { call, claim } = await setup();
  const arif = await claim('Arif');

  assert.equal((await call('GET', '/board')).status, 401);
  assert.equal((await call('GET', '/board', { auth: { ...arif, token: `${arif.token.slice(0, -2)}xx` } })).status, 401);
  assert.equal((await call('GET', '/board', { auth: { ...arif, playerId: 'pnobodyatall' } })).status, 401);
  assert.equal((await call('GET', '/board', { auth: arif })).status, 200);
  assert.equal((await call('GET', '/nope')).status, 404);
  assert.equal((await call('DELETE', '/players')).status, 405);
});

/* ------------------------------------------------------------------- scores */

test('a first score brings existing progress along, later ones are rate limited', async () => {
  const { call, claim, clock } = await setup();
  const arif = await claim('Arif');

  const first = await call('PUT', '/me/score', {
    auth: arif,
    body: { stars: 820, missions: 70, streak: 5, weekKey: '2026-W38', weekStars: 40, weekSteps: 12000, buddyId: 'tiger' },
  });
  assert.equal(first.status, 200);
  assert.deepEqual(first.body, { stars: 820, level: 7, weekKey: '2026-W38', weekStars: 40 });

  // A patched app asking for a million stars an hour later.
  clock.now += HOUR;
  const greedy = await call('PUT', '/me/score', { auth: arif, body: { stars: 1_000_000, weekKey: '2026-W38', weekStars: 999_999 } });
  assert.equal(greedy.body.stars, 820 + rules.STAR_BURST + rules.STARS_PER_HOUR);
  // Week stars can never exceed what actually arrived this week.
  assert.equal(greedy.body.weekStars, greedy.body.stars);

  // Stars never go down.
  clock.now += HOUR;
  const lower = await call('PUT', '/me/score', { auth: arif, body: { stars: 10, weekKey: '2026-W38', weekStars: 0 } });
  assert.equal(lower.body.stars, greedy.body.stars);
});

test('an honest child offline for a week catches up in one sync', async () => {
  const { call, claim, clock } = await setup();
  const leyla = await claim('Leyla');
  await call('PUT', '/me/score', { auth: leyla, body: { stars: 40, weekKey: '2026-W38', weekStars: 40 } });

  clock.now += 7 * 24 * HOUR;
  const res = await call('PUT', '/me/score', { auth: leyla, body: { stars: 340, weekKey: '2026-W39', weekStars: 60 } });
  assert.equal(res.body.stars, 340);
  assert.equal(res.body.weekStars, 60);
});

test('week keys from the wrong year are ignored and a bad body is refused', async () => {
  const { call, claim, store } = await setup();
  const deniz = await claim('Deniz');

  const res = await call('PUT', '/me/score', { auth: deniz, body: { stars: 50, weekKey: '2099-W01', weekStars: 50, weekSteps: 5 } });
  assert.equal(res.status, 200);
  const stored = await store.getPlayer(deniz.playerId);
  assert.equal(stored.weekKey, null);
  assert.equal(stored.weekStars, 0);

  assert.equal((await call('PUT', '/me/score', { auth: deniz, body: { stars: 'lots' } })).status, 400);
  assert.equal((await call('PUT', '/me/score', { auth: deniz })).status, 400);

  // Steps are capped at a week of the app's daily ceiling.
  await call('PUT', '/me/score', { auth: deniz, body: { stars: 50, weekKey: '2026-W38', weekStars: 0, weekSteps: 9e9 } });
  assert.equal((await store.getPlayer(deniz.playerId)).weekSteps, rules.MAX_WEEK_STEPS);
});

/* ------------------------------------------------------------------ friends */

test('an invite code makes two children friends, both ways', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin', 'fox');
  const arif = await claim('Arif', 'tiger');

  await call('PUT', '/me/score', { auth: arif, body: { stars: 120, missions: 11, streak: 3, weekKey: '2026-W38', weekStars: 30, weekSteps: 9000, buddyId: 'tiger' } });

  // Typed the way a parent would type it off another phone.
  const code = `${emin.inviteCode.slice(0, 3).toLowerCase()}-${emin.inviteCode.slice(3)}`;
  const added = await call('POST', '/friends', { auth: arif, body: { code } });
  assert.equal(added.status, 201);
  assert.equal(added.body.friend.username, 'Emin');
  assert.equal(added.body.already, false);

  const eminBoard = await call('GET', '/board', { auth: emin, query: { week: '2026-W38' } });
  assert.equal(eminBoard.status, 200);
  assert.equal(eminBoard.body.inviteCode, emin.inviteCode);
  const [me, friend] = eminBoard.body.entries;
  assert.equal(me.me, true);
  assert.deepEqual(friend, {
    id: arif.playerId,
    username: 'Arif',
    buddyId: 'tiger',
    level: 3,
    stars: 120,
    missions: 11,
    streak: 3,
    weekStars: 30,
    weekSteps: 9000,
    me: false,
  });
  // Nothing private rides along on the board.
  for (const field of ['tokenHash', 'usernameKey', 'friends', 'inviteCode', 'createdAt']) {
    assert.equal(field in friend, false, field);
  }

  const arifBoard = await call('GET', '/board', { auth: arif });
  assert.deepEqual(arifBoard.body.entries.map((e) => e.username), ['Arif', 'Emin']);

  const again = await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } });
  assert.equal(again.status, 200);
  assert.equal(again.body.already, true);
});

test('adding each other at the same moment still makes one friendship', async () => {
  const { call, claim, store } = await setup();
  const a = await claim('Ayla');
  const b = await claim('Bora');
  await Promise.all([
    call('POST', '/friends', { auth: a, body: { code: b.inviteCode } }),
    call('POST', '/friends', { auth: b, body: { code: a.inviteCode } }),
  ]);
  assert.deepEqual(await friendIds(store, a), [b.playerId]);
  assert.deepEqual(await friendIds(store, b), [a.playerId]);
});

test('your own code and a code that does not exist', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin');

  assert.deepEqual((await call('POST', '/friends', { auth: emin, body: { code: emin.inviteCode } })).body, { error: 'self' });
  assert.equal((await call('POST', '/friends', { auth: emin, body: { code: 'nope' } })).status, 400);
  const unknown = emin.inviteCode === 'ZZZZZZ' ? 'YYYYYY' : 'ZZZZZZ';
  assert.equal((await call('POST', '/friends', { auth: emin, body: { code: unknown } })).status, 404);
});

test('guessing invite codes runs out, real codes do not', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin');

  // Eight misses spend the bucket.
  let blocked = 0;
  for (let i = 0; i < 12; i += 1) {
    const res = await call('POST', '/friends', { auth: emin, body: { code: 'ZZZZZ' + 'ABCDEFGHJKMN'[i] } });
    if (res.status === 429) blocked += 1;
  }
  assert.equal(blocked, 4);
});

test('a class of real codes can all be added in a row', async () => {
  const { call, claim, store } = await setup();
  const teacherKid = await claim('Sinif');
  const pupils = [];
  for (let i = 0; i < 12; i += 1) pupils.push(await claim(`Pupil${i}`, 'owl', `10.0.1.${i}`));
  for (const pupil of pupils) {
    const res = await call('POST', '/friends', { auth: teacherKid, body: { code: pupil.inviteCode } });
    assert.equal(res.status, 201);
  }
  assert.equal((await friendIds(store, teacherKid)).length, 12);
});

test('friend lists stop at fifty', async () => {
  const { call, claim, store } = await setup();
  const popular = await claim('Popular');
  for (let i = 0; i < rules.MAX_FRIENDS; i += 1) {
    const kid = await claim(`Kid${i}`, 'cat', `10.0.2.${i}`);
    assert.equal((await call('POST', '/friends', { auth: kid, body: { code: popular.inviteCode } })).status, 201);
  }
  const late = await claim('LateKid', 'cat', '10.0.3.1');
  const res = await call('POST', '/friends', { auth: late, body: { code: popular.inviteCode } });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'full');
  assert.equal((await friendIds(store, popular)).length, rules.MAX_FRIENDS);
});

test('removing a friend removes them from both boards', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin');
  const arif = await claim('Arif');
  await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } });

  assert.equal((await call('DELETE', `/friends/${arif.playerId}`, { auth: emin })).status, 200);
  assert.equal((await call('GET', '/board', { auth: emin })).body.entries.length, 1);
  assert.equal((await call('GET', '/board', { auth: arif })).body.entries.length, 1);
});

test('the weekly numbers reset when a new week starts', async () => {
  const { call, claim, clock } = await setup();
  const emin = await claim('Emin');
  const arif = await claim('Arif');
  await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } });
  await call('PUT', '/me/score', { auth: arif, body: { stars: 90, weekKey: '2026-W38', weekStars: 90, weekSteps: 20000 } });

  clock.now += 7 * 24 * HOUR;
  const board = await call('GET', '/board', { auth: emin, query: { week: '2026-W39' } });
  const friend = board.body.entries.find((e) => e.username === 'Arif');
  assert.equal(friend.stars, 90);
  assert.equal(friend.weekStars, 0);
  assert.equal(friend.weekSteps, 0);
  // Two days without a score and the streak shown to friends is gone too.
  assert.equal(friend.streak, 0);
});

/* ------------------------------------------------------ usernames and codes */

test('renaming frees the old name and refuses a taken one', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin');
  await claim('Arif');

  assert.equal((await call('PATCH', '/me', { auth: emin, body: { username: 'arif' } })).status, 409);
  const renamed = await call('PATCH', '/me', { auth: emin, body: { username: 'EminFox' } });
  assert.deepEqual(renamed.body, { username: 'EminFox' });
  assert.equal((await call('GET', '/usernames/Emin')).body.available, true);
  assert.equal((await call('GET', '/usernames/eminfox')).body.reason, 'taken');

  // Changing only the capitals keeps the same claim.
  assert.deepEqual((await call('PATCH', '/me', { auth: emin, body: { username: 'eminFOX' } })).body, { username: 'eminFOX' });
});

test('a new invite code retires the old one', async () => {
  const { call, claim } = await setup();
  const emin = await claim('Emin');
  const arif = await claim('Arif');

  const rotated = await call('POST', '/me/invite', { auth: emin });
  assert.equal(rotated.status, 200);
  assert.notEqual(rotated.body.inviteCode, emin.inviteCode);

  assert.equal((await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } })).status, 404);
  assert.equal((await call('POST', '/friends', { auth: arif, body: { code: rotated.body.inviteCode } })).status, 201);
});

/* ----------------------------------------------------------------- deletion */

test('deleting a player removes the username, the code, the token and the friendships', async () => {
  const { call, claim, store } = await setup();
  const emin = await claim('Emin');
  const arif = await claim('Arif');
  await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } });

  assert.deepEqual((await call('DELETE', '/me', { auth: emin })).body, { deleted: true });

  assert.equal(await store.getPlayer(emin.playerId), null);
  assert.equal((await call('GET', '/board', { auth: emin })).status, 401);
  assert.equal((await call('GET', '/usernames/Emin')).body.available, true);
  assert.deepEqual(await friendIds(store, arif), []);
  assert.equal((await call('POST', '/friends', { auth: arif, body: { code: emin.inviteCode } })).status, 404);
});

test('players nobody has opened the app for in a year are swept', async () => {
  const { call, claim, store, clock } = await setup();
  const old = await claim('OldKid');
  const active = await claim('ActiveKid');
  await call('POST', '/friends', { auth: active, body: { code: old.inviteCode } });

  clock.now += 200 * 24 * HOUR;
  await call('PUT', '/me/score', { auth: active, body: { stars: 10 } });
  clock.now += 200 * 24 * HOUR;

  const removed = await sweepInactive({ store, clock: () => clock.now, log: { info() {} } });
  assert.equal(removed, 1);
  assert.equal(await store.getPlayer(old.playerId), null);
  assert.deepEqual(await friendIds(store, active), []);
  assert.equal((await call('GET', '/usernames/OldKid')).body.available, true);
});

/* -------------------------------------------------------------------- rules */

test('ISO week keys match the calendar at the year edges', () => {
  assert.equal(rules.isoWeekKey(Date.UTC(2026, 8, 14)), '2026-W38');
  assert.equal(rules.isoWeekKey(Date.UTC(2026, 0, 1)), '2026-W01');
  assert.equal(rules.isoWeekKey(Date.UTC(2027, 0, 1)), '2026-W53');
  assert.equal(rules.isoWeekKey(Date.UTC(2024, 11, 30)), '2025-W01');
});
