/**
 * The 6-9 self checks: badges, the accelerometer reads, and the decision
 * between the phone approving a mission and a parent looking at it.
 *
 * Everything under test is pure, so the clock, the dice and the sensor traces
 * are all made up here.
 *
 * Run with: npm run test:verify
 */
import qrcode from 'qrcode-generator';

import { clueObjects } from '../src/data/object-clues';
import { roomObjectMeta } from '../src/data/room-objects';
import { taskById } from '../src/data/tasks';
import {
  BADGE_COUNT,
  badgeCode,
  badgeCodes,
  badgePayload,
  createBadgeKey,
  HIDE_BADGE,
  looksLikeBadge,
  matchCode,
  planRoute,
  readBadge,
  ROUTE_BADGES,
} from '../src/engine/badges';
import { applyCompletion, revokeCompletion } from '../src/engine/progress';
import {
  answered,
  canTakeBack,
  checksFor,
  correctWays,
  decideReview,
  evaluateCheck,
  FIRST_ONES,
  MAX_UNCHECKED_RUN,
  planMission,
  planSecret,
  reviewPolicy,
  screenFreeThisWeek,
  SECRET_CHOICES,
  secretChoices,
  TAKE_BACK_DAYS,
  tallyProgress,
  tallyReady,
} from '../src/engine/verify';
import { LANGUAGES, type Localized } from '../src/i18n/types';
import { qrPath, qrSvgMarkup, QR_QUIET } from '../src/lib/qr';
import {
  activityLooksOdd,
  createActivityMeter,
  createStillnessMeter,
  jumpsLookOdd,
  stepsLookOdd,
  type Sample,
} from '../src/lib/motion-analysis';
import { emptyProgress, type Mission, type TaskContent } from '../src/state/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.log(`  FAIL  ${label}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

/** Deterministic dice. */
function dice(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function complete(value: Localized): boolean {
  return LANGUAGES.every((lang) => typeof value[lang] === 'string' && value[lang].trim().length > 0);
}

const NOW = Date.parse('2026-09-16T17:00:00');
const MIN = 60_000;

function task(id: string): TaskContent {
  const found = taskById.get(id);
  if (!found) throw new Error(`no task ${id}`);
  return found;
}

let serial = 0;
function mission(t: TaskContent, patch: Partial<Mission> = {}): Mission {
  serial += 1;
  return {
    id: `m${serial}`,
    task: t,
    status: 'active',
    assignedAt: new Date(NOW - 20 * MIN).toISOString(),
    ...patch,
  };
}

/** A mission the phone approved at `minutesAgo`. */
function approved(t: TaskContent, minutesAgo: number, by: 'app' | 'parent' | 'grownup' = 'app'): Mission {
  const at = new Date(NOW - minutesAgo * MIN).toISOString();
  return mission(t, {
    status: 'done',
    claimedAt: at,
    confirmedAt: at,
    review: { by, reasons: by === 'app' ? [] : ['spotCheck'], checks: [], at },
  });
}

/* ================================================================= badges */

section('treasure badges');
{
  const random = dice(7);
  const key = createBadgeKey(random);
  ok('key is ten characters', key.length === 10);
  ok('key has no look-alike characters', !/[ILO01]/.test(key));

  for (let n = 1; n <= BADGE_COUNT; n += 1) {
    const payload = badgePayload(key, n);
    ok(`badge ${n} reads back as itself`, readBadge(key, payload) === n);
    ok(`badge ${n} reads back from lower case`, readBadge(key, payload.toLowerCase()) === n);
    ok(`badge ${n} fits QR alphanumeric mode`, /^[0-9A-Z:]+$/.test(payload));
    ok(`badge ${n} is recognised as a badge`, looksLikeBadge(payload));
  }

  const other = createBadgeKey(dice(99));
  ok('another family’s badge does not count', readBadge(key, badgePayload(other, 2)) === null);
  ok('a retired sheet does not count', readBadge(other, badgePayload(key, 2)) === null);

  const payload = badgePayload(key, 3);
  const forged = payload.replace(/:3:/, ':4:');
  ok('changing the number breaks the checksum', readBadge(key, forged) === null);
  ok('a random QR is not a badge', readBadge(key, 'https://example.com/menu') === null);
  ok('a random QR does not look like a badge', !looksLikeBadge('https://example.com/menu'));
  ok('badge 7 does not exist', readBadge(key, badgePayload(key, 7)) === null);
  ok('badge 0 does not exist', readBadge(key, badgePayload(key, 0)) === null);

  const codes = badgeCodes(key);
  ok('six codes', codes.length === BADGE_COUNT);
  ok('codes are three digits', codes.every((code) => /^\d{3}$/.test(code)));
  ok('codes differ within a sheet', new Set(codes).size === BADGE_COUNT);
  ok('codes are stable', badgeCodes(key).join() === codes.join());
  for (let n = 1; n <= BADGE_COUNT; n += 1) {
    ok(`code ${n} matches badge ${n}`, matchCode(key, badgeCode(key, n)) === n);
  }
  ok('a code typed with spaces still matches', matchCode(key, ` ${codes[1][0]} ${codes[1].slice(1)} `) === 2);
  ok('a two digit code does not match', matchCode(key, codes[0].slice(0, 2)) === null);

  // Codes stay unique across a lot of sheets, not just the one above.
  let clash = false;
  const many = dice(3);
  for (let i = 0; i < 2000; i += 1) {
    if (new Set(badgeCodes(createBadgeKey(many))).size !== BADGE_COUNT) clash = true;
  }
  ok('no sheet in 2000 repeats a code', !clash);

  let routesOk = true;
  const routeDice = dice(11);
  for (let i = 0; i < 300; i += 1) {
    const route = planRoute(3, routeDice);
    if (route.length !== 3 || new Set(route).size !== 3) routesOk = false;
    if (!route.every((n) => ROUTE_BADGES.includes(n))) routesOk = false;
  }
  ok('routes visit three different stuck-up badges', routesOk);
  ok('the hiding badge is never on a route', !ROUTE_BADGES.includes(HIDE_BADGE));
}

section('the printed QR codes');
{
  const key = createBadgeKey(dice(4));
  const value = badgePayload(key, 3);
  const qr = qrcode(0, 'M');
  qr.addData(value, 'Alphanumeric');
  qr.make();

  // The library's own renderer is the ground truth for orientation: a code
  // drawn with rows and columns swapped looks fine and scans on nothing.
  // It draws one `M x,y l1,0 …z` square per dark module.
  const theirs = new Set(
    [...qr.createSvgTag({ cellSize: 1, margin: QR_QUIET }).matchAll(/M(\d+),(\d+)l1,0/g)].map(
      (m) => `${m[1]},${m[2]}`,
    ),
  );
  const mine = new Set<string>();
  for (const segment of qrPath(value).d.split('z')) {
    const m = segment.match(/M(\d+) (\d+)h(\d+)/);
    if (!m) continue;
    const [x, y, run] = [Number(m[1]), Number(m[2]), Number(m[3])];
    for (let i = 0; i < run; i += 1) mine.add(`${x + i},${y}`);
  }

  ok('the library drew something to compare against', theirs.size > 100);
  ok('every dark module matches the library, none extra', mine.size === theirs.size && [...theirs].every((cell) => mine.has(cell)));
  ok('the quiet zone is there', qrPath(value).size === qr.getModuleCount() + QR_QUIET * 2);
  ok('a badge payload fits alphanumeric mode', /^[0-9A-Z:]+$/.test(value));
  ok('the printed markup carries the same path', qrSvgMarkup(value, 100).includes(qrPath(value).d));
}

/* ========================================================= accelerometer */

function trace(
  seconds: number,
  hz: number,
  at: (t: number, random: () => number) => Sample,
  seed = 1,
): { s: Sample; now: number }[] {
  const random = dice(seed);
  const out: { s: Sample; now: number }[] = [];
  const step = 1000 / hz;
  for (let i = 0; i < seconds * hz; i += 1) {
    const now = 1_000_000 + i * step;
    out.push({ s: at(i / hz, random), now });
  }
  return out;
}

const noise = (random: () => number, size: number) => (random() - 0.5) * 2 * size;

section('phone put down');
{
  const table = trace(20, 10, (_, r) => ({ x: noise(r, 0.004), y: noise(r, 0.004), z: -1 + noise(r, 0.004) }));
  const meter = createStillnessMeter();
  let first: number | null = null;
  for (const { s, now } of table) {
    if (meter.push(s, now) && first === null) first = now - table[0].now;
  }
  ok('a phone face down on a table counts as put down', meter.parked());
  ok('it settles within about three seconds', first !== null && first <= 3500);
  ok('about seventeen of twenty seconds counted', Math.abs(meter.parkedMs() - 17_000) < 1500);

  const faceUp = createStillnessMeter();
  for (const { s, now } of trace(10, 10, (_, r) => ({ x: noise(r, 0.004), y: noise(r, 0.004), z: 1 + noise(r, 0.004) }))) {
    faceUp.push(s, now);
  }
  ok('face up and untouched counts too', faceUp.parked());

  const hand = createStillnessMeter();
  let everParked = false;
  for (const { s, now } of trace(30, 10, (t, r) => ({
    x: 0.1 + noise(r, 0.03),
    y: -0.62 + 0.02 * Math.sin(t * 7) + noise(r, 0.03),
    z: -0.76 + noise(r, 0.03),
  }))) {
    if (hand.push(s, now)) everParked = true;
  }
  ok('a phone held in a hand never counts', !everParked && hand.parkedMs() === 0);

  // Hand tremor on a held phone swings a few hundredths of a g either way.
  const steady = createStillnessMeter();
  let steadyParked = false;
  const steadyTrace = trace(30, 10, (t, r) => ({
    x: noise(r, 0.03),
    y: noise(r, 0.03),
    z: -0.97 + 0.03 * Math.sin(t * 9) + noise(r, 0.02),
  }));
  for (const { s, now } of steadyTrace) {
    if (steady.push(s, now)) steadyParked = true;
  }
  ok('a phone held flat in a hand does not count', !steadyParked);

  // Cheap accelerometers are noisier than good ones. Lying on a table must
  // still count on them, or an honest child waits for a parent every time.
  const cheap = createStillnessMeter();
  const cheapTrace = trace(20, 10, (_, r) => ({ x: noise(r, 0.015), y: noise(r, 0.015), z: -1 + noise(r, 0.015) }));
  for (const { s, now } of cheapTrace) cheap.push(s, now);
  ok('a noisy sensor lying on a table still counts', cheap.parkedMs() > 15_000);

  const touched = createStillnessMeter();
  const touchedTrace = table;
  for (const { s, now } of touchedTrace) {
    if (now - touchedTrace[0].now === 10_000) touched.wake(now);
    touched.push(s, now);
  }
  ok('a touch costs the settle time again', touched.parkedMs() < meter.parkedMs() - 1500);

  const gap = createStillnessMeter();
  for (const { s, now } of table.slice(0, 100)) gap.push(s, now);
  const before = gap.parkedMs();
  // Five minutes in the background, then the same still phone.
  for (const { s, now } of table.slice(100)) gap.push(s, now + 300_000);
  ok('time the app was in the background is not counted', gap.parkedMs() - before < 10_000);

  const lifted = createStillnessMeter();
  for (const { s, now } of table.slice(0, 100)) lifted.push(s, now);
  lifted.push({ x: 0.3, y: -0.8, z: -0.4 }, table[100].now);
  ok('picking it up stops the count at once', !lifted.parked());
}

section('time spent moving');
{
  const walk = createActivityMeter();
  for (const { s, now } of trace(60, 20, (t, r) => ({ x: noise(r, 0.05), y: 1 + 0.35 * Math.sin(t * 2 * Math.PI * 2) + noise(r, 0.05), z: noise(r, 0.05) }))) {
    walk.push(s, now);
  }
  ok('a minute of walking is close to a minute of movement', walk.activeSec() >= 56);

  const still = createActivityMeter();
  for (const { s, now } of trace(60, 20, (_, r) => ({ x: noise(r, 0.02), y: 1 + noise(r, 0.02), z: noise(r, 0.02) }))) {
    still.push(s, now);
  }
  ok('standing still is no movement', still.activeSec() === 0);

  // A child: bursts of different strengths with pauses.
  const play = createActivityMeter();
  const playTrace = trace(240, 20, (t, r) => {
    const burst = Math.floor(t / 7);
    const strength = [0.25, 0.9, 0.5, 0.05, 0.7, 0.35, 1.2, 0.15][burst % 8];
    return {
      x: noise(r, 0.05),
      y: 1 + strength * Math.sin(t * 2 * Math.PI * (1.5 + (burst % 3))) + noise(r, strength * 0.4),
      z: noise(r, 0.05),
    };
  });
  for (const { s, now } of playTrace) play.push(s, now);
  ok('ball play counts most of its seconds', play.activeSec() >= 150);
  ok('ball play does not look odd', !activityLooksOdd(play.energies()));

  const machine = createActivityMeter();
  for (const { s, now } of trace(240, 20, (t) => ({ x: 0, y: 1 + 0.6 * Math.sin(t * 2 * Math.PI * 3), z: 0 }))) {
    machine.push(s, now);
  }
  ok('a phone on a machine counts as movement', machine.activeSec() >= 200);
  ok('but looks odd', activityLooksOdd(machine.energies()));
  ok('a short even burst is not enough to call odd', !activityLooksOdd(machine.energies().slice(0, 20)));

  const gapped = createActivityMeter();
  for (const { s, now } of trace(30, 20, (t) => ({ x: 0, y: 1 + 0.5 * Math.sin(t * 12), z: 0 }))) {
    gapped.push(s, now > 1_010_000 ? now + 600_000 : now);
  }
  ok('a background gap adds nothing', gapped.activeSec() <= 31);
}

section('jumps and steps');
{
  const shaken = Array.from({ length: 20 }, (_, i) => i * 265);
  ok('twenty "jumps" a quarter second apart look odd', jumpsLookOdd(shaken));
  const random = dice(5);
  let t = 0;
  const legs = Array.from({ length: 20 }, () => (t += 520 + noise(random, 90)));
  ok('twenty real jumps do not', !jumpsLookOdd(legs));
  const fastHops = Array.from({ length: 20 }, (_, i) => i * 340);
  ok('fast little hops do not', !jumpsLookOdd(fastHops));
  ok('too few jumps to judge', !jumpsLookOdd([0, 100, 200]));
  ok('a couple of shaken-off walks is ordinary', !stepsLookOdd(2));
  ok('six is a phone being shaken', stepsLookOdd(6));
}

/* ================================================================ rules */

section('the checks a mission gets');
{
  const plain = task('general-8');
  const rules = checksFor(plain);
  ok('a plain mission needs half its minutes', rules.some((r) => r.kind === 'clock' && r.minutes === Math.ceil(plain.minutes / 2)));
  ok('and the phone put down', rules.some((r) => r.kind === 'away'));

  const jumps = task('junior-move-jumps');
  ok('a written mission keeps its own checks', checksFor(jumps).length === 1 && checksFor(jumps)[0].kind === 'reps');

  const photo = { ...plain, proof: 'photo' as const };
  ok('a photo mission needs the photo', checksFor(photo).some((r) => r.kind === 'photo'));

  const duo = { ...plain, mode: 'duo' as const, parentBrief: plain.body };
  const duoRules = checksFor(duo);
  ok(
    'a duo mission can be approved by the grown up',
    duoRules.some((r) => r.kind === 'either' && r.of.some((c) => c.kind === 'grownup')),
  );

  const motion = { ...plain, proof: 'motion' as const, motion: { kind: 'jump' as const, count: 15 } };
  ok('a motion mission needs its count', checksFor(motion)[0].kind === 'reps');
}

section('answers');
{
  const blocks = task('junior-make-blocks');
  ok('no answer yet', !answered(blocks, mission(blocks)));
  ok('two floors is not three', !answered(blocks, mission(blocks, { answerValue: 2 })));
  ok('four floors counts', answered(blocks, mission(blocks, { answerValue: 4 })));
  ok('a silly number does not', !answered(blocks, mission(blocks, { answerValue: 9999 })));

  const ten = task('junior-think-ten');
  ok('two ways of three is not enough', !answered(ten, mission(ten, { answerValue: [[4, 6], [3, 7]] })));
  ok('three honest attempts count, wrong sums included', answered(ten, mission(ten, { answerValue: [[4, 6], [3, 8], [5, 5]] })));
  ok('4 + 6 and 6 + 4 are one way', correctWays(10, [[4, 6], [6, 4], [5, 5]]) === 2);
  ok('three different ways', correctWays(10, [[4, 6], [3, 7], [5, 5]]) === 3);

  const tower = task('junior-make-tower');
  ok('a question needs picking', !answered(tower, mission(tower)));
  ok('any option counts', answered(tower, mission(tower, { checkAnswer: 3 })));
}

section('measuring each check');
{
  const bridge = task('junior-make-bridge');
  const m = mission(bridge, { durationSec: 7 * 60, awaySec: 5 * 60 + 10, awaySensor: true });
  ok('clock passes at seven of six minutes', evaluateCheck({ kind: 'clock', minutes: 6 }, bridge, m).passed);
  ok('clock fails at five of six', !evaluateCheck({ kind: 'clock', minutes: 6 }, bridge, { ...m, durationSec: 300 }).passed);
  ok('away passes', evaluateCheck({ kind: 'away', minutes: 5 }, bridge, m).passed);
  ok('away fails when the phone could not tell', !evaluateCheck({ kind: 'away', minutes: 5 }, bridge, { ...m, awaySensor: false }).passed);
  ok('a photo nobody could read does not pass', !evaluateCheck({ kind: 'photo' }, bridge, { ...m, proofUri: 'file://x', photoRead: false }).passed);
  ok('a readable photo passes', evaluateCheck({ kind: 'photo' }, bridge, { ...m, proofUri: 'file://x', photoRead: true }).passed);
  ok('a photo of a screen does not', !evaluateCheck({ kind: 'photo' }, bridge, { ...m, proofUri: 'file://x', photoRead: true, photoOfScreen: true }).passed);

  const steps = task('junior-move-steps');
  ok('300 steps pass', evaluateCheck({ kind: 'steps', count: 300 }, steps, mission(steps, { steps: 312 })).passed);
  ok('shaken steps do not', !evaluateCheck({ kind: 'steps', count: 300 }, steps, mission(steps, { steps: 312, motionOdd: true })).passed);

  const route = task('junior-adventure-route');
  const walked = mission(route, { plan: { badges: [4, 1, 3] }, badgeHits: [30, 75, 140] });
  ok('three badges walked between pass', evaluateCheck({ kind: 'badges', count: 3 }, route, walked).passed);
  ok('badges found two seconds apart do not', !evaluateCheck({ kind: 'badges', count: 3 }, route, { ...walked, badgeHits: [30, 32, 140] }).passed);
  ok('guessed codes do not', !evaluateCheck({ kind: 'badges', count: 3 }, route, { ...walked, badgeMisses: 4 }).passed);

  const clues = task('junior-adventure-clues');
  ok('found on camera passes', evaluateCheck({ kind: 'secret' }, clues, mission(clues, { secretFound: 'camera' })).passed);
  ok('picked after two wrong guesses passes', evaluateCheck({ kind: 'secret' }, clues, mission(clues, { secretFound: 'picked', secretMisses: 2 })).passed);
  ok('picked after three wrong guesses does not', !evaluateCheck({ kind: 'secret' }, clues, mission(clues, { secretFound: 'picked', secretMisses: 3 })).passed);
  ok('not found does not', !evaluateCheck({ kind: 'secret' }, clues, mission(clues, { secretMisses: 1 })).passed);
}

/* ============================================================== deciding */

/** Enough decided history that the first-ones rule is out of the way. */
function settled(): Mission[] {
  const plain = task('general-8');
  return [approved(plain, 60 * 30, 'parent'), approved(plain, 60 * 29, 'app'), approved(plain, 60 * 28, 'parent')];
}

function bridgeDone(patch: Partial<Mission> = {}): Mission {
  return mission(task('junior-make-bridge'), {
    durationSec: 9 * 60,
    awaySec: 6 * 60,
    awaySensor: true,
    answerValue: 7,
    ...patch,
  });
}

section('who checks a finished mission');
{
  const base = { band: '6-9' as const, spotChecks: 'some' as const, now: NOW };

  const first = decideReview({ ...base, mission: bridgeDone(), history: [], random: () => 0.99 });
  ok('the first ones go to a parent', !first.approve && first.review.reasons.includes('firstOnes'));

  const history = settled();
  const passes = decideReview({ ...base, mission: bridgeDone(), history, random: () => 0.99 });
  ok('a mission that passes is approved by the phone', passes.approve && passes.review.by === 'app');
  ok('with every check recorded', passes.review.checks.length === 4);

  const spot = decideReview({ ...base, mission: bridgeDone(), history, random: () => 0.05 });
  ok('some of them are spot checked', !spot.approve && spot.review.reasons.join() === 'spotCheck');

  const run = [...history];
  for (let i = 0; i < MAX_UNCHECKED_RUN; i += 1) run.push(approved(task('general-8'), 60 * (20 - i)));
  const forced = decideReview({ ...base, mission: bridgeDone(), history: run, random: () => 0.99 });
  ok(`after ${MAX_UNCHECKED_RUN} unchecked in a row one is checked for certain`, forced.review.reasons.includes('spotCheck'));
  const oneShort = decideReview({ ...base, mission: bridgeDone(), history: run.slice(0, -1), random: () => 0.99 });
  ok('one short of that it is still up to chance', oneShort.approve);

  const quick = decideReview({ ...base, mission: bridgeDone({ durationSec: 120 }), history, random: () => 0.99 });
  ok('finished before the minimum goes to a parent as too fast', !quick.approve && quick.review.reasons.includes('tooFast'));

  const noAnswer = decideReview({ ...base, mission: bridgeDone({ answerValue: undefined }), history, random: () => 0.99 });
  ok('a missing answer goes to a parent', !noAnswer.approve && noAnswer.review.reasons.includes('missing'));

  const noPark = decideReview({ ...base, mission: bridgeDone({ awaySec: 10 }), history, random: () => 0.99 });
  ok('not put down and no photo goes to a parent', !noPark.approve && noPark.review.reasons.includes('missing'));

  const photoInstead = decideReview({
    ...base,
    mission: bridgeDone({ awaySec: 10, proofUri: 'file://bridge.jpg', photoRead: true }),
    history,
    random: () => 0.99,
  });
  ok('a readable photo stands in for putting the phone down', photoInstead.approve);

  const everyOne = decideReview({ ...base, spotChecks: 'all', mission: bridgeDone(), history, random: () => 0.99 });
  ok('a parent who wants every one gets every one', !everyOne.approve && everyOne.review.reasons.includes('everyOne'));

  const shaken = decideReview({
    ...base,
    mission: mission(task('junior-move-steps'), { steps: 340, motionOdd: true, durationSec: 200 }),
    history,
    random: () => 0.99,
  });
  ok('a shaken phone goes to a parent as odd', !shaken.approve && shaken.review.reasons.includes('odd'));

  const jumps = decideReview({
    ...base,
    mission: mission(task('junior-move-jumps'), { motionReps: 20, durationSec: 25 }),
    history,
    random: () => 0.99,
  });
  ok('twenty jumps in 25 seconds is not "too fast": the sensor is the proof', jumps.approve);

  const grownup = decideReview({
    ...base,
    mission: mission(task('junior-think-riddle'), { grownupAt: new Date(NOW).toISOString(), checkAnswer: 2 }),
    history: [],
    random: () => 0.01,
  });
  ok('a grown up who typed the code approves it on the spot', grownup.approve && grownup.review.by === 'grownup');

  const noGrownup = decideReview({
    ...base,
    mission: mission(task('junior-think-riddle'), { checkAnswer: 2, durationSec: 600 }),
    history,
    random: () => 0.99,
  });
  ok('a riddle nobody heard goes to a parent', !noGrownup.approve);

  const bridge = task('junior-make-bridge');
  const repeatHistory = [...history, approved(bridge, 90), approved(bridge, 45)];
  const repeated = decideReview({ ...base, mission: bridgeDone(), history: repeatHistory, random: () => 0.99 });
  ok('the same mission a third time today goes to a parent', !repeated.approve && repeated.review.reasons.includes('repeated'));

  const plain = task('general-8');
  const burstHistory = [...history, approved(plain, 3), approved(plain, 2)];
  const burst = decideReview({ ...base, mission: bridgeDone(), history: burstHistory, random: () => 0.99 });
  ok('a run of approvals minutes apart goes to a parent', !burst.approve && burst.review.reasons.includes('burst'));

  const takenBack = history.map((m) => ({ ...m, takenBackAt: new Date(NOW).toISOString() }));
  const afterTakeBack = decideReview({ ...base, mission: bridgeDone(), history: takenBack, random: () => 0.99 });
  ok('taken back missions do not count towards the first ones', afterTakeBack.review.reasons.includes('firstOnes'));

  const little = decideReview({ ...base, band: '3-5', mission: bridgeDone(), history, random: () => 0.99 });
  ok('3-5 still goes to a parent every time', !little.approve);
  const littleWithCode = decideReview({
    ...base,
    band: '3-5',
    mission: bridgeDone({ grownupAt: new Date(NOW).toISOString() }),
    history,
    random: () => 0.99,
  });
  ok('3-5 is not changed by a grown up code either', !littleWithCode.approve);

  // Over many honest missions, roughly the spot rate reach a parent.
  const dice1 = dice(42);
  let sent = 0;
  let rolling = [...history];
  const plainTask = task('general-8');
  for (let i = 0; i < 400; i += 1) {
    const m = mission(plainTask, { durationSec: 900, awaySec: 600, awaySensor: true });
    const decision = decideReview({ ...base, mission: m, history: rolling, random: dice1, now: NOW + i * 86_400_000 });
    if (!decision.approve) sent += 1;
    const at = new Date(NOW + i * 86_400_000).toISOString();
    rolling = [...rolling, { ...m, status: 'done' as const, confirmedAt: at, review: { ...decision.review, at } }].slice(-30);
  }
  ok(`about a fifth to a quarter of honest missions are spot checked (${sent}/400)`, sent >= 70 && sent <= 115);
  ok(`first ones rule is ${FIRST_ONES}`, FIRST_ONES === 3);
}

section('the week long team goals');
{
  const week = task('junior-team-kindweek');
  const check = { kind: 'tally' as const, missions: 'junior-kind-', count: 5 };
  const kind = task('junior-kind-note');
  const other = task('junior-kind-word');

  // Monday 08:00 of the week NOW falls in, and the Saturday before it.
  const monday = (() => {
    const d = new Date(NOW);
    d.setHours(8, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  })();
  const lastWeek = monday - 2 * 86_400_000;

  const done = (t: TaskContent, at: number, patch: Partial<Mission> = {}) =>
    mission(t, { status: 'done', confirmedAt: new Date(at).toISOString(), ...patch });

  const history = [
    done(kind, monday),
    done(other, monday + 3_600_000),
    done(kind, monday + 7_200_000),
    done(task('junior-book-read'), monday),
    done(kind, lastWeek),
  ];
  ok('this week only', tallyProgress(check, history, NOW) === 3);
  ok('a different strand does not count', tallyProgress({ ...check, missions: 'junior-book-' }, history, NOW) === 1);
  ok(
    'a mission a parent took back stops counting',
    tallyProgress(check, [...history, done(kind, monday, { takenBackAt: new Date(NOW).toISOString() })], NOW) === 3,
  );
  ok('a claim waiting for a parent does not count yet', tallyProgress(check, [...history, mission(kind, { status: 'pending' })], NOW) === 3);

  ok('the goal is not offered at three of five', !tallyReady(week, history, NOW));
  const five = [...history, done(kind, monday + 10_800_000), done(other, monday + 14_400_000)];
  ok('it is offered at five', tallyReady(week, five, NOW));
  ok('a mission with no week goal is always offered', tallyReady(task('junior-make-bridge'), [], NOW));

  const withCode = decideReview({
    mission: mission(week, { grownupAt: new Date(NOW).toISOString(), durationSec: 300 }),
    history: five,
    band: '6-9',
    spotChecks: 'some',
    now: NOW,
    random: () => 0.99,
  });
  ok('a grown up finishes the week off', withCode.approve && withCode.review.by === 'grownup');

  const noCode = decideReview({
    mission: mission(week, { durationSec: 300 }),
    history: five,
    band: '6-9',
    spotChecks: 'some',
    now: NOW,
    random: () => 0.99,
  });
  ok('without one it waits for a parent', !noCode.approve);
  ok(
    'and the week itself is recorded as passed',
    noCode.review.checks.some((outcome) => outcome.kind === 'tally' && outcome.passed && outcome.value === 5),
  );
}

section('ages 10 to 14 finish where they stand');
{
  const base = { history: [] as Mission[], band: '10-14' as const, spotChecks: 'some' as const, now: NOW };
  ok('three policies, one per band', reviewPolicy('3-5') === 'parent' && reviewPolicy('6-9') === 'sample' && reviewPolicy('10-14') === 'self');

  const focus = task('teen-goal-focus');
  const backed = decideReview({
    ...base,
    mission: mission(focus, { durationSec: 22 * MIN / 1000, awaySec: 19 * 60, awaySensor: true, checkAnswer: 0 }),
    random: () => 0.01,
  });
  ok('a challenge the phone measured is approved and says so', backed.approve && backed.review.by === 'app');
  ok('and no dice roll can send it to a parent', backed.review.reasons.length === 0);

  const onTheirWord = decideReview({
    ...base,
    mission: mission(focus, { durationSec: 22 * MIN / 1000, awaySec: 30, awaySensor: false, checkAnswer: 0 }),
    random: () => 0.99,
  });
  ok('one the phone could not see still finishes', onTheirWord.approve);
  ok('but the record says it rests on their word', onTheirWord.review.by === 'self');
  ok('with the reason kept for the audit', onTheirWord.review.reasons.includes('missing'));

  // A parent cannot switch a teenager back to per-mission approval; that is
  // the whole point of the age band, not a setting that was forgotten.
  const everyOne = decideReview({
    ...base,
    spotChecks: 'all',
    mission: mission(focus, { durationSec: 22 * MIN / 1000, awaySec: 19 * 60, awaySensor: true, checkAnswer: 0 }),
    random: () => 0.99,
  });
  ok('the every-mission setting does not reach this age', everyOne.approve);

  const cook = task('teen-project-cook');
  const signed = decideReview({
    ...base,
    mission: mission(cook, { durationSec: 20 * 60, grownupAt: new Date(NOW).toISOString() }),
    random: () => 0.99,
  });
  ok('the risky one an adult signed is theirs', signed.approve && signed.review.by === 'grownup');
  const unsigned = decideReview({ ...base, mission: mission(cook, { durationSec: 20 * 60 }), random: () => 0.99 });
  ok('unsigned, it still finishes but on their word', unsigned.approve && unsigned.review.by === 'self');

  // The note: that something was written, never a word of what it said.
  const goals = task('teen-goal-three');
  const written = mission(goals, { note: 'Finish the reading\nRun before dinner\nText back' });
  ok('three lines counts', evaluateCheck({ kind: 'note' }, goals, written).passed);
  ok('two lines does not', !evaluateCheck({ kind: 'note' }, goals, mission(goals, { note: 'One\nTwo' })).passed);
  ok('a shrug does not', !evaluateCheck({ kind: 'note' }, goals, mission(goals, { note: 'a\nb\nc' })).passed);
  ok('nothing written does not', !evaluateCheck({ kind: 'note' }, goals, mission(goals)).passed);
  ok(
    'the outcome carries a count, never the text',
    JSON.stringify(evaluateCheck({ kind: 'note' }, goals, written)).includes('dinner') === false,
  );

  const takeBack = mission(focus, {
    status: 'done',
    confirmedAt: new Date(NOW - 60 * MIN).toISOString(),
    review: { by: 'self', reasons: ['missing'], checks: [], at: new Date(NOW - 60 * MIN).toISOString() },
  });
  ok('a parent can still take back what stood on their word', canTakeBack(takeBack, NOW));

  // Screen free minutes measured this week, for the target they set themselves.
  const monday = (() => {
    const d = new Date(NOW);
    d.setHours(9, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  })();
  const weekHistory = [
    mission(focus, { status: 'done', confirmedAt: new Date(monday).toISOString(), awaySec: 20 * 60 }),
    mission(focus, { status: 'done', confirmedAt: new Date(monday + 3_600_000).toISOString(), awaySec: 10 * 60 }),
    mission(focus, { status: 'done', confirmedAt: new Date(monday - 3 * 86_400_000).toISOString(), awaySec: 40 * 60 }),
    mission(focus, { status: 'pending', awaySec: 60 * 60 }),
  ];
  ok('only this week, only what was measured', screenFreeThisWeek(weekHistory, NOW) === 30);
}

section('taking a mission back');
{
  const bridge = task('junior-make-bridge');
  const fresh = approved(bridge, 60 * 24);
  ok('a phone approval from yesterday can be taken back', canTakeBack(fresh, NOW));
  ok(`not after ${TAKE_BACK_DAYS} days`, !canTakeBack(approved(bridge, 60 * 24 * (TAKE_BACK_DAYS + 1)), NOW));
  ok('a parent approval is the parent’s own decision', !canTakeBack(approved(bridge, 60, 'parent'), NOW));
  // Children watch parents type a code, so an on-the-spot yes is not final.
  ok('a grown up code approval can be taken back', canTakeBack(approved(bridge, 60, 'grownup'), NOW));
  ok('not twice', !canTakeBack({ ...fresh, takenBackAt: new Date(NOW).toISOString() }, NOW));

  const earned = applyCompletion({ ...emptyProgress, stars: 25, unlocked: [] }, 14, 12, '2026-09-16');
  ok('the mission took them to level 2', earned.progress.level === 2);
  const back = revokeCompletion(earned.progress, 14, 12);
  ok('stars go back', back.stars === 25);
  ok('level goes back', back.level === 1);
  ok('totals go back', back.totalMissions === 0 && back.totalMinutes === 0);
  ok('the streak is left alone', back.streak === earned.progress.streak);
  ok('an earned hat stays earned', back.unlocked.join() === earned.progress.unlocked.join());
  ok('never below zero', revokeCompletion({ ...emptyProgress, unlocked: [] }, 14, 12).stars === 0);
}

/* ============================================================== planning */

section('planning a run');
{
  const random = dice(21);
  ok('a badge hunt is always the hiding badge', planMission(task('junior-adventure-badge'), { recent: [], roomObjects: null }, random)?.badges?.join() === String(HIDE_BADGE));
  const route = planMission(task('junior-adventure-route'), { recent: [], roomObjects: null }, random)?.badges ?? [];
  ok('a route plans three badges', route.length === 3 && new Set(route).size === 3);
  ok('an ordinary mission has no plan', planMission(task('junior-make-bridge'), { recent: [], roomObjects: null }, random) === undefined);

  const secret = planMission(task('junior-adventure-clues'), { recent: [], roomObjects: null }, random)?.secret;
  ok('a clue mission picks something with clues', clueObjects.some((entry) => entry.id === secret));

  ok('the room scan is used when there is one', planSecret([], ['plant'], random) === 'plant');
  const clues = task('junior-adventure-clues');
  const recent = [mission(clues, { plan: { secret: 'plant' } })];
  ok('the same secret does not come straight back', planSecret(recent, ['plant', 'hat'], random) === 'hat');

  const board = secretChoices('spoon', 'm_abc');
  ok(`the board has ${SECRET_CHOICES} pictures`, board.length === SECRET_CHOICES);
  ok('all different', new Set(board).size === SECRET_CHOICES);
  ok('the answer is on it', board.includes('spoon'));
  ok('it does not reshuffle', secretChoices('spoon', 'm_abc').join() === board.join());
  ok('a different mission shuffles differently', secretChoices('spoon', 'm_xyz').join() !== board.join());
}

section('the clues');
{
  ok(`enough objects for a board of ${SECRET_CHOICES}`, clueObjects.length >= SECRET_CHOICES);
  ok('no object twice', new Set(clueObjects.map((entry) => entry.id)).size === clueObjects.length);
  for (const entry of clueObjects) {
    ok(`${entry.id}: the labeller knows it`, roomObjectMeta.has(entry.id));
    ok(`${entry.id}: three clues in every language`, entry.clues.length === 3 && entry.clues.every(complete));
    const name = roomObjectMeta.get(entry.id)?.name;
    ok(
      `${entry.id}: no clue gives the name away`,
      !!name && entry.clues.every((clue) => LANGUAGES.every((lang) => !clue[lang].toLowerCase().includes(name[lang].toLowerCase()))),
    );
  }
}

console.log(
  failures === 0
    ? `\n  the self checks hold (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
