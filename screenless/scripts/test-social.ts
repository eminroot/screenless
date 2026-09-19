/**
 * Checks the friends board on the phone side.
 *
 * The one that matters most is first: a child whose parent said no to a
 * username must never cause a request. That is proved here by replacing
 * `fetch` and calling every function the app has for the board with the door
 * shut. The rest keeps the app and the server agreeing on usernames, and the
 * weekly numbers honest across Monday and New Year.
 *
 *   node -r sucrase/register scripts/test-social.ts
 *
 * The server's own suite is in `server/firebase/leaderboard/test`.
 */
import type * as ApiModule from '../src/online/api';
import type * as NetworkModule from '../src/online/network';
import type { ScoreSnapshot } from '../src/online/score';
import type { AppData, Mission, OnlineAccount } from '../src/state/types';

// What the bundler would inline, set before any app module is loaded.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;
process.env.EXPO_PUBLIC_LEADERBOARD_URL = 'https://board.example.test';

/* eslint-disable @typescript-eslint/no-require-imports */
const network: typeof NetworkModule = require('../src/online/network');
const api: typeof ApiModule = require('../src/online/api');
const username = require('../src/online/username') as typeof import('../src/online/username');
const score = require('../src/online/score') as typeof import('../src/online/score');
const rank = require('../src/online/rank') as typeof import('../src/online/rank');
const migrate = require('../src/state/migrate') as typeof import('../src/state/migrate');
const server = require('../server/firebase/leaderboard/src/rules.js');
/* eslint-enable @typescript-eslint/no-require-imports */

let failures = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(60)}${ok ? '' : `got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)}`}`,
  );
}

type Call = { url: string; init: RequestInit };
const calls: Call[] = [];
globalThis.fetch = (async (url: string, init: RequestInit) => {
  calls.push({ url, init });
  return new Response(JSON.stringify({ available: true, entries: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

const account: OnlineAccount = {
  playerId: 'pAbCdEfGhIjKlMnOp',
  token: 'tokentokentokentokentokentoken',
  username: 'Emin',
  inviteCode: 'K7M2QX',
  createdAt: '2026-09-12T10:00:00.000Z',
};

const snapshot: ScoreSnapshot = {
  stars: 10,
  missions: 1,
  streak: 1,
  weekKey: '2026-W37',
  weekStars: 10,
  weekSteps: 0,
  buddyId: 'fox',
};

/** Every call the app can make to the board, in one place. */
const everyCall = () => [
  api.checkUsername('Emin'),
  api.claimUsername('Emin', 'fox'),
  api.renameUsername(account, 'Emin2'),
  api.sendScore(account, snapshot),
  api.fetchBoard(account, '2026-W37'),
  api.addFriend(account, 'K7M2QX'),
  api.removeFriend(account, 'pSomeoneElse1234'),
  api.newInviteCode(account),
  api.deleteAccount(account),
];

async function main() {
  /* ------------------------------------------------- no username, no requests */

  console.log('\n  offline means offline');
  check('the door starts shut', network.isNetworkOpen(), false);

  const shut = await Promise.all(everyCall());
  check('every call is refused without a request', shut.map((r) => (r.ok ? 'sent' : r.error)), Array(9).fill('offline'));
  check('fetch was never called', calls.length, 0);

  network.holdNetwork('picker', true);
  network.holdNetwork('picker', false);
  await Promise.all(everyCall());
  check('closing the picker shuts it again', calls.length, 0);

  network.holdNetwork('account', true);
  network.holdNetwork('picker', true);
  network.holdNetwork('picker', false);
  check('the picker closing does not shut an account', network.isNetworkOpen(), true);

  await api.sendScore(account, snapshot);
  check('with a username a score goes out', calls.length, 1);
  check('to the configured board', calls[0]?.url, 'https://board.example.test/me/score');
  check('with the token in the header', (calls[0]?.init.headers as Record<string, string>).Authorization, `Bearer ${account.playerId}.${account.token}`);
  check('carrying only numbers and the buddy', Object.keys(JSON.parse(String(calls[0]?.init.body))).sort(), [
    'buddyId',
    'missions',
    'stars',
    'streak',
    'weekKey',
    'weekStars',
    'weekSteps',
  ]);

  await api.checkUsername('Çağla Nur');
  check('usernames are escaped in the url', calls[1]?.url, 'https://board.example.test/usernames/%C3%87a%C4%9Fla%20Nur');

  network.holdNetwork('account', false);
  const before = calls.length;
  await Promise.all(everyCall());
  check('removing the username shuts the door for good', calls.length, before);

  /* ------------------------------------------- the app and server agree */

  console.log('\n  usernames match the server');
  const names = [
    'Emin', 'ab', 'abc', 'Çağla', 'ƏliRza', 'Arif_2017', 'arif12345', '7arif', '_arif', 'Emin Baxish',
    'аrif', 'abcdefghijklmnop', 'abcdefghijklmnopq', 'a__', 'İsmayıl', 'Işık', '   Leyla  ', 'Ali🙂',
    'x1_2_3_4', 'ŞENOL', 'Dəniz',
  ];
  for (const name of names) {
    check(`format of ${JSON.stringify(name)}`, username.usernameFormatProblem(name), server.usernameFormatProblem(name));
  }
  for (const name of ['Çağla', 'CAGLA', 'EMİN', 'emin', 'Işık', 'ISIK', 'Arif_2017', 'Əli']) {
    check(`key of ${name}`, username.usernameKey(username.cleanUsername(name)), server.usernameKey(name.normalize('NFC').trim()));
  }
  check('EMİN and emin are the same username', username.usernameKey('EMİN'), username.usernameKey('emin'));
  check('suggestions are all valid', username.suggestUsernames('Emin').every((s) => username.usernameFormatProblem(s) === null), true);
  check('suggestions for a long name still fit', username.suggestUsernames('Abcdefghijklmnop').every((s) => s.length <= 16), true);
  check('codes accept a parent’s typing', username.normaliseInviteCode(' k7m-2qx '), 'K7M2QX');
  check('codes refuse letters that are not used', username.normaliseInviteCode('O0IL11'), null);
  check('the server’s codes pass the app’s check', username.normaliseInviteCode(server.newInviteCode()) !== null, true);

  /* ---------------------------------------------------------------- weeks */

  console.log('\n  weekly numbers');
  check('Monday 14 Sep 2026 is week 38', score.isoWeekKey(new Date(2026, 8, 14, 9)), '2026-W38');
  check('Sunday 13 Sep 2026 late evening is week 37', score.isoWeekKey(new Date(2026, 8, 13, 23, 59)), '2026-W37');
  check('1 Jan 2027 belongs to 2026-W53', score.isoWeekKey(new Date(2027, 0, 1)), '2026-W53');
  check('30 Dec 2024 belongs to 2025-W01', score.isoWeekKey(new Date(2024, 11, 30)), '2025-W01');
  check('app and server agree on a UTC noon', score.isoWeekKey(new Date(2026, 8, 16, 12)), server.isoWeekKey(Date.UTC(2026, 8, 16, 12)));

  const mission = (stars: number, confirmedAt: string, status: Mission['status'] = 'done'): Mission => ({
    id: `m${confirmedAt}${stars}`,
    status,
    assignedAt: confirmedAt,
    confirmedAt,
    task: { stars } as Mission['task'],
  });

  const data: Pick<AppData, 'progress' | 'missions' | 'walk' | 'profile'> = {
    profile: {
      nickname: 'Emin',
      ageBand: '6-9',
      interests: [],
      buddyId: 'tiger',
      buddyName: 'Tiko',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    progress: {
      stars: 120,
      level: 3,
      totalMissions: 11,
      totalMinutes: 90,
      streak: 2,
      bestStreak: 4,
      lastDoneDate: '2026-09-15',
      unlocked: [],
    },
    missions: [
      mission(12, new Date(2026, 8, 13, 20).toISOString()),
      mission(8, new Date(2026, 8, 14, 10).toISOString()),
      mission(15, new Date(2026, 8, 15, 18).toISOString()),
      mission(30, new Date(2026, 8, 15, 19).toISOString(), 'pending'),
    ],
    walk: {
      coins: 0,
      lifetimeSteps: 0,
      bestDay: 0,
      goalStreak: 0,
      days: [
        { date: '2026-09-13', steps: 5000 },
        { date: '2026-09-14', steps: 3000 },
        { date: '2026-09-15', steps: 4200 },
      ],
    },
  };

  const snap = score.scoreSnapshot(data, new Date(2026, 8, 15, 21));
  check('week stars count only this week’s confirmed missions', snap?.weekStars, 23);
  check('week steps count only this week', snap?.weekSteps, 7200);
  check('totals come from progress', [snap?.stars, snap?.missions, snap?.streak], [120, 11, 2]);
  check('the buddy rides along for the avatar', snap?.buddyId, 'tiger');
  check('no name, age or interests in the snapshot', Object.keys(snap ?? {}).some((k) => /nick|name|age|interest/i.test(k)), false);
  check('no profile, no snapshot', score.scoreSnapshot({ ...data, profile: null }), null);

  /* ---------------------------------------------------------------- ranks */

  console.log('\n  ranking');
  const entry = (id: string, stars: number, weekStars: number, me = false) => ({
    id,
    username: id,
    buddyId: 'fox' as const,
    level: 1,
    stars,
    missions: 0,
    streak: 0,
    weekStars,
    weekSteps: 0,
    me,
  });
  const entries = [entry('Arif', 186, 58), entry('Emin', 120, 23, true), entry('Leyla', 242, 41), entry('Deniz', 97, 58)];
  const weekly = rank.rankBoard(entries, 'week');
  check('weekly order', weekly.map((e) => e.username), ['Arif', 'Deniz', 'Leyla', 'Emin']);
  check('ties share a place', weekly.map((e) => e.rank), [1, 1, 3, 4]);
  check('all time order', rank.rankBoard(entries, 'all').map((e) => e.username), ['Leyla', 'Arif', 'Emin', 'Deniz']);
  const mine = rank.withLocalScore(entries, { ...snapshot, stars: 132, weekStars: 35, buddyId: 'owl' });
  check('my row shows the stars on this phone', mine.find((e) => e.me)?.stars, 132);
  check('friends keep the server’s numbers', mine.find((e) => e.id === 'Arif')?.stars, 186);
  check('a lower local number never hides a server one', rank.withLocalScore(entries, { ...snapshot, stars: 1 }).find((e) => e.me)?.stars, 120);

  /* ----------------------------------------------------------- migration */

  console.log('\n  older builds');
  check('4-5 becomes 3-5', migrate.migrateAgeBand('4-5'), '3-5');
  check('6-7 becomes 6-8', migrate.migrateAgeBand('6-7'), '6-9');
  check('8-10 becomes 9-11', migrate.migrateAgeBand('8-10'), '10-13');
  // The top band narrowed in September 2026. A phone set up before that has
  // '10-14' stored and must land on the teen tier, not on the 6-9 fallback.
  check('10-14 becomes 10-13', migrate.migrateAgeBand('10-14'), '10-13');
  check('a new band is kept', migrate.migrateAgeBand('10-13'), '10-13');
  check('junk falls back to 6-8', migrate.migrateAgeBand(42), '6-9');
  check('an old family is offline, never online by default', migrate.reconcileSocial(undefined, true).mode, 'offline');
  check('a family mid setup has not answered', migrate.reconcileSocial(undefined, false).mode, 'unset');
  check('online without an account is not online', migrate.reconcileSocial({ mode: 'online', account: null }, true).mode, 'offline');
  check('a stored account survives', migrate.reconcileSocial({ mode: 'online', account }, true).account?.username, 'Emin');
  check(
    'history keeps readable bands',
    migrate.migrateMission({ ...mission(5, '2026-01-01'), task: { ageBands: ['4-5', '6-7'] } as unknown as Mission['task'] }).task.ageBands,
    ['3-5', '6-9'],
  );

  console.log('');
  console.log(failures === 0 ? '  friends board holds' : `  ${failures} check(s) failed`);
  console.log('');
  process.exit(failures === 0 ? 0 : 1);
}

void main();
