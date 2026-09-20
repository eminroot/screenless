/**
 * What leaves the phone, and what a parent's settings do when they arrive.
 *
 * This is the most important test file in the app, and not because the code is
 * hard. `src/sync/report.ts` is the only function whose output goes to a
 * server, so the assertions about what is *not* in the report are the privacy
 * promise written down in a form that fails a build. Everything else here is
 * ordinary arithmetic.
 *
 * Run with: npm run test:sync
 */
import { emptyGuardDay, type GuardConfig, type GuardDay } from '../src/guard/types';
import { defaultGuardConfig } from '../src/guard/types';
import type { HubLimits } from '../src/sync/api';
import { applyLimits, limitsDiffer } from '../src/sync/limits';
import { buildReport, hasSomethingToSend, signatureOf } from '../src/sync/report';
import { isDue, retryDelayMs, SYNC_EVERY_MS } from '../src/sync/schedule';
import {
  acceptFromHub,
  MAX_REAL_REWARDS,
  MAX_REWARD_LABEL,
  MAX_REWARD_STARS,
  MIN_REWARD_STARS,
} from '../src/engine/rewards';
import {
  createEmptyData,
  type AppData,
  type Mission,
  type RealReward,
  type TaskContent,
} from '../src/state/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const MIN = 60;

function guardDay(date: string, patch: Partial<GuardDay> = {}): GuardDay {
  return { ...emptyGuardDay(date), ...patch };
}

function task(patch: Partial<TaskContent> = {}): TaskContent {
  return {
    id: 'demo-task',
    category: 'move',
    minutes: 10,
    stars: 2,
    emoji: '*',
    interests: [],
    ageBands: ['6-9'],
    title: { en: 'Ten star jumps', tr: 'On yildiz zipla', az: 'On ulduz tullan' },
    body: { en: 'Do ten star jumps', tr: '', az: '' },
    source: 'library',
    ...patch,
  };
}

function mission(patch: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    task: task(),
    status: 'done',
    assignedAt: '2026-09-19T09:00:00',
    startedAt: '2026-09-19T09:05:00',
    claimedAt: '2026-09-19T09:20:00',
    confirmedAt: '2026-09-19T09:25:00',
    durationSec: 900,
    ...patch,
  };
}

function appData(patch: Partial<AppData> = {}): AppData {
  const base = createEmptyData('en');
  return {
    ...base,
    profile: {
      nickname: 'Ayla',
      ageBand: '6-9',
      interests: ['football'],
      buddyId: 'fox',
      buddyName: 'Tilki',
      createdAt: '2026-08-01T00:00:00',
    },
    ...patch,
  };
}

/* -------------------------------------------------------- what is reported */

section('the numbers');
{
  const data = appData({
    guardDay: guardDay('2026-09-19', {
      usedSec: 70 * MIN,
      deviceSec: 140 * MIN,
      appSec: 22 * MIN,
      nudgeCount: 3,
      nudgeHeeded: 2,
      gracesUsed: 1,
    }),
    missions: [
      mission({ id: 'm1', durationSec: 900 }),
      mission({ id: 'm2', task: task({ category: 'outdoor', stars: 3 }), durationSec: 600 }),
      mission({ id: 'm3', status: 'active', confirmedAt: undefined, claimedAt: undefined }),
    ],
    walk: { coins: 4200, lifetimeSteps: 90_000, days: [{ date: '2026-09-19', steps: 6100 }], bestDay: 9000, goalStreak: 3 },
    guard: { ...defaultGuardConfig, dailyBudgetMin: 60 },
  });

  const today = buildReport(data).days.at(-1)!;
  ok('the day is the one being reported', today.date === '2026-09-19');
  ok('screen time is the whole phone', today.screenSec === 140 * MIN);
  ok('the watched apps are reported separately', today.guardedSec === 70 * MIN);
  ok('so is time in this app', today.appSec === 22 * MIN);
  ok('two confirmed missions', today.missionsDone === 2);
  ok('three were started', today.missionsStarted === 3);
  ok('stars are summed from the tasks', today.stars === 5);
  ok('active minutes come from the runner', today.activeMin === 25);
  ok('steps come from the walk record', today.steps === 6100);
  ok('the purse is sent once', today.coins === 4200);
  ok('reminders and what came of them', today.nudges === 3 && today.nudgeHeeded === 2);
  ok('over the limit, because 70 beats 60', today.overLimit === true);
  ok('the category mix', today.categories.move === 1 && today.categories.outdoor === 1);
}

section('screen time where the platform reports nothing');
{
  // iOS. Apple hands an app no figures, so the only thing measured is this
  // app's own foreground time.
  const data = appData({
    guardDay: guardDay('2026-09-19', { deviceSec: 0, appSec: 18 * MIN }),
  });
  const today = buildReport(data).days.at(-1)!;
  ok('the app time stands in for the missing figure', today.screenSec === 18 * MIN);
  ok('and is still reported in its own right', today.appSec === 18 * MIN);
}

section('nothing a child made goes anywhere near the wire');
{
  const data = appData({
    guardDay: guardDay('2026-09-19', { usedSec: 600 }),
    missions: [
      mission({
        id: 'm1',
        task: task({ title: { en: 'Draw your worst day', tr: '', az: '' } }),
        note: 'I was sad because nobody sat with me at lunch',
        proofUri: 'file:///data/user/0/pictures/proof.jpg',
      }),
    ],
    chat: [{ id: 'c1', role: 'user', text: 'my mum shouted at me', at: '2026-09-19T10:00:00' }],
    collection: [
      {
        id: 'f1',
        kind: 'leaf',
        at: '2026-09-19T10:00:00',
        answers: [],
        factIds: [],
        photoUri: 'file:///data/user/0/album/leaf.jpg',
        nickname: 'Spiky',
      },
    ],
  });

  const wire = JSON.stringify(buildReport(data));
  ok('no private note', !wire.includes('sad'));
  ok('no mission title', !wire.includes('worst day'));
  ok('no photo path', !wire.includes('pictures') && !wire.includes('album'));
  ok('no chat message', !wire.includes('shouted'));
  ok('no name the child typed', !wire.includes('Spiky'));
  ok('not even the name a parent typed', !wire.includes('Ayla'));
  ok('not the name the child gave the buddy', !wire.includes('Tilki'));
  ok('and no interests', !wire.includes('football'));
  // What it does carry, so the test is not passing by sending nothing.
  ok('but the age band does go, because the hub bands the charts', wire.includes('6-9'));
  ok('and the buddy species, which is a drawing', wire.includes('fox'));
}

section('the backlog');
{
  const data = appData({
    guardHistory: [
      guardDay('2026-09-16', { deviceSec: 30 * MIN }),
      guardDay('2026-09-17', { deviceSec: 40 * MIN }),
      guardDay('2026-09-18', { deviceSec: 50 * MIN }),
    ],
    guardDay: guardDay('2026-09-19', { deviceSec: 60 * MIN }),
    walk: { coins: 900, lifetimeSteps: 0, days: [], bestDay: 0, goalStreak: 0 },
  });

  const report = buildReport(data);
  ok('every queued day goes', report.days.length === 4);
  ok('oldest first', report.days[0].date === '2026-09-16');
  ok('today is last', report.days.at(-1)!.date === '2026-09-19');
  ok('the purse is only on today', report.days.at(-1)!.coins === 900);
  ok(
    'and not on the history, which would draw a flat line and call it a fact',
    report.days.slice(0, -1).every((day) => day.coins === 0),
  );
}

section('a day with no date is not a day');
{
  // What a fresh install carries until the first rollover.
  const data = appData({ guardDay: guardDay('') });
  ok('it is dropped rather than sent', buildReport(data).days.length === 0);
}

section('missions land on the day they were confirmed');
{
  const data = appData({
    guardHistory: [guardDay('2026-09-18')],
    guardDay: guardDay('2026-09-19'),
    missions: [
      // Started late on Thursday, confirmed on Friday morning.
      mission({
        id: 'm1',
        startedAt: '2026-09-18T21:50:00',
        confirmedAt: '2026-09-19T08:10:00',
      }),
    ],
  });

  const report = buildReport(data);
  const thursday = report.days.find((d) => d.date === '2026-09-18')!;
  const friday = report.days.find((d) => d.date === '2026-09-19')!;
  ok('started counts on Thursday', thursday.missionsStarted === 1 && thursday.missionsDone === 0);
  ok('done counts on Friday', friday.missionsDone === 1);
}

section('the snapshot');
{
  const data = appData();
  data.progress = { ...data.progress, level: 7, stars: 214, totalMissions: 88, streak: 5, bestStreak: 19 };
  const snapshot = buildReport(data, '1.1.0').snapshot;
  ok('the level and the streak', snapshot.level === 7 && snapshot.streak === 5);
  ok('the age band', snapshot.ageBand === '6-9');
  ok('the buddy', snapshot.buddyId === 'fox');
  ok('the build, so an old app can be spotted', snapshot.appVersion === '1.1.0');
  ok('and a timezone, so today is the child’s today', typeof snapshot.tzOffsetMin === 'number');
  ok('but no nickname', !('nickname' in snapshot));
}

/* ------------------------------------------------------- when to bother */

section('not waking the radio for nothing');
{
  const data = appData({ guardDay: guardDay('2026-09-19', { deviceSec: 600 }) });
  const report = buildReport(data);
  const today = report.days.at(-1)!;

  ok('a day never sent is worth sending', hasSomethingToSend(report, null, null));
  ok('an unchanged day is not', !hasSomethingToSend(report, '2026-09-19', signatureOf(today)));
  ok('a changed day is', hasSomethingToSend(report, '2026-09-19', 'something.else'));

  const moved = buildReport(
    appData({ guardDay: guardDay('2026-09-19', { deviceSec: 900 }) }),
  );
  ok(
    'the fingerprint moves when the numbers do',
    signatureOf(moved.days.at(-1)!) !== signatureOf(today),
  );
  ok('an empty report is never worth a request', !hasSomethingToSend({ days: [], snapshot: report.snapshot }, null, null));
}

section('backing off after a failure');
{
  ok('no wait when nothing has failed', retryDelayMs(0) === 0);
  ok('half a minute after one', retryDelayMs(1) === 30_000);
  ok('doubling', retryDelayMs(2) === 60_000 && retryDelayMs(3) === 120_000);
  ok('capped at half an hour', retryDelayMs(20) === 30 * 60_000);

  const now = 1_000_000_000;
  ok('a phone that has never tried is due', isDue(null, 0, now));
  ok('one that just succeeded is not', !isDue(now - 60_000, 0, now));
  ok('ten minutes later it is', isDue(now - SYNC_EVERY_MS, 0, now));
  ok('after a failure it waits its turn', !isDue(now - 10_000, 1, now));
  ok('and tries once the wait is up', isDue(now - 31_000, 1, now));
}

/* ------------------------------------------------- limits coming the other way */

function limits(patch: Partial<HubLimits> = {}): HubLimits {
  return {
    revision: 3,
    enabled: true,
    tier: 'interrupt',
    dailyBudgetMin: 120,
    nudgeEveryMin: 30,
    graceCount: 2,
    graceMinutes: 5,
    curfewStartMin: 21 * 60,
    curfewEndMin: 7 * 60,
    watched: [],
    ...patch,
  };
}

function config(patch: Partial<GuardConfig> = {}): GuardConfig {
  return { ...defaultGuardConfig, ...patch };
}

section('a parent sets the limit from their own phone');
{
  const next = applyLimits(config({ dailyBudgetMin: 60, tier: 'notice' }), limits());
  ok('the budget comes down', next.dailyBudgetMin === 120);
  ok('so does the tier', next.tier === 'interrupt');
  ok('and the reminder interval', next.nudgeEveryMin === 30);
  ok('and the quiet hours', next.curfew?.startMin === 21 * 60 && next.curfew?.endMin === 7 * 60);
  ok('and whether it is on at all', next.enabled === true);
}

section('but not which apps');
{
  // The parent picked these on the child's phone, from the apps installed on
  // it. The parent app has no way to show that list.
  const local = config({ watched: ['com.google.android.youtube', 'com.instagram.android'] });
  const next = applyLimits(local, limits({ watched: ['com.example.wrong'] }));
  ok('the phone keeps its own list', next.watched.join() === local.watched.join());

  const blank = applyLimits(config({ watched: [] }), limits({ watched: ['com.example.one'] }));
  ok('unless it has none, in which case anything is better than nothing', blank.watched.join() === 'com.example.one');
}

section('nonsense from the wire is clamped');
{
  const next = applyLimits(
    config(),
    limits({ tier: 'melt', dailyBudgetMin: 99_999, nudgeEveryMin: -3, graceMinutes: 999 }),
  );
  ok('an unknown tier falls back to warning only', next.tier === 'notice');
  ok('the budget is capped at a day', next.dailyBudgetMin === 1440);
  ok('a negative interval is off', next.nudgeEveryMin === 0);
  ok('grace is capped at an hour', next.graceMinutes === 60);
}

section('no curfew is null, not midnight to midnight');
{
  const next = applyLimits(config(), limits({ curfewStartMin: -1, curfewEndMin: -1 }));
  ok('it comes out as no curfew at all', next.curfew === null);
}

section('re-applying a plan that did not change');
{
  const current = applyLimits(config(), limits());
  ok('nothing to do', !limitsDiffer(current, limits()));
  ok('a new revision alone changes nothing', !limitsDiffer(current, limits({ revision: 99 })));
  ok('a real change is seen', limitsDiffer(current, limits({ dailyBudgetMin: 90 })));
  ok('so is switching it off', limitsDiffer(current, limits({ enabled: false })));
  ok('and so is dropping the curfew', limitsDiffer(current, limits({ curfewStartMin: -1, curfewEndMin: -1 })));
}


section('promises arriving from the hub are cut to this app’s own size');
{
  const reward = (n: number, over: Partial<RealReward> = {}): RealReward => ({
    id: `r${n}`,
    stars: 100,
    label: `Reward ${n}`,
    emoji: '🎁',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  });

  // The hub stores twenty. This card is built for MAX_REAL_REWARDS, and a
  // parent who promised a term’s worth must not push it over.
  const many = Array.from({ length: 20 }, (_, i) => reward(i, { stars: 50 + i * 10 }));
  ok(
    'never more than the card holds',
    acceptFromHub(many, MAX_REAL_REWARDS).length === MAX_REAL_REWARDS,
  );
  ok('and none at all when there is no room', acceptFromHub(many, 0).length === 0);
  ok('a negative room is not a crash', acceptFromHub(many, -3).length === 0);

  // Promises typed on this phone behind the PIN are kept in full, so the hub
  // only ever gets the room they leave.
  ok(
    'local promises take their room first',
    acceptFromHub(many, MAX_REAL_REWARDS - 6).length === MAX_REAL_REWARDS - 6,
  );

  // The hub accepts 1 to 100000. This app rounds onto a step of ten inside its
  // own range, so the number on the card is one the card can draw.
  const wild = acceptFromHub([reward(0, { stars: 100_000 }), reward(1, { stars: 1 })], 8);
  ok('a huge target comes down to the ceiling', wild.every((r) => r.stars <= MAX_REWARD_STARS));
  ok('and a tiny one comes up to the floor', wild.every((r) => r.stars >= MIN_REWARD_STARS));

  // Sixty characters are allowed up there; forty fit down here.
  const long = acceptFromHub([reward(0, { label: 'x'.repeat(60) })], 8);
  ok('a long label is trimmed', long[0].label.length === MAX_REWARD_LABEL);

  // What is still to be earned is the whole point of the card.
  const mixed = acceptFromHub(
    [
      reward(0, { stars: 50, givenAt: '2026-01-02T00:00:00.000Z' }),
      reward(1, { stars: 250 }),
      reward(2, { stars: 100 }),
    ],
    2,
  );
  ok('outstanding promises are kept over handed-over ones', mixed.every((r) => !r.givenAt));
  ok('and the nearest comes first', mixed[0].stars === 100 && mixed[1].stars === 250);

  ok(
    'everything kept is marked as the hub’s',
    acceptFromHub(many, 8).every((r) => r.origin === 'hub'),
  );
}

console.log(
  failures === 0
    ? `\n  the sync is honest (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
