/**
 * Drives the claim-integrity rules under plain Node.
 *
 * These decide what a parent is told about a claim before they approve it, so
 * the thresholds matter in both directions: a note that never fires is
 * decoration, and one that fires on an ordinary tidy-up teaches the parent to
 * tap straight past it.
 *
 * Run with: npm run test:integrity
 */
import { minutesOf, readIntegrity } from '../src/engine/integrity';
import type { Mission, TaskContent } from '../src/state/types';

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

const NOW = Date.parse('2026-09-16T18:00:00.000Z');
const MIN = 60 * 1000;

function task(id: string, minutes: number): TaskContent {
  return {
    id,
    category: 'calm',
    minutes,
    stars: 8,
    emoji: '🧸',
    interests: [],
    ageBands: ['3-5'],
    title: { en: id, tr: id, az: id },
    body: { en: id, tr: id, az: id },
    source: 'library',
  };
}

function claim(
  id: string,
  taskId: string,
  minutes: number,
  durationSec: number | undefined,
  claimedMsAgo = 0,
): Mission {
  return {
    id,
    task: task(taskId, minutes),
    status: 'pending',
    assignedAt: new Date(NOW - claimedMsAgo - 10 * MIN).toISOString(),
    claimedAt: new Date(NOW - claimedMsAgo).toISOString(),
    durationSec,
  };
}

function done(id: string, taskId: string, confirmedMsAgo: number): Mission {
  return {
    id,
    task: task(taskId, 5),
    status: 'done',
    assignedAt: new Date(NOW - confirmedMsAgo - 10 * MIN).toISOString(),
    claimedAt: new Date(NOW - confirmedMsAgo - MIN).toISOString(),
    confirmedAt: new Date(NOW - confirmedMsAgo).toISOString(),
  };
}

section('a claim that took the time it says');
{
  const m = claim('m1', 'tidy', 5, 4 * 60);
  const read = readIntegrity(m, [m], NOW);
  ok('nothing is flagged', read.flags.length === 0);
  ok('the time spent is reported', read.spentSec === 240);
  ok('the time asked for is reported', read.expectedSec === 300);
}

section('impossibly fast');
{
  // A five minute mission claimed in twelve seconds.
  const fast = claim('m2', 'tidy', 5, 12);
  ok('twelve seconds on a five minute job is flagged', readIntegrity(fast, [fast], NOW).flags.includes('tooFast'));

  // Generous on purpose: putting three toys away really does take 100 seconds.
  const brisk = claim('m3', 'tidy', 5, 100);
  ok('a brisk but real tidy-up is left alone', !readIntegrity(brisk, [brisk], NOW).flags.includes('tooFast'));

  // The ceiling stops long missions from demanding implausible minimums.
  const longOne = claim('m4', 'fort', 20, 100);
  ok(
    'a long mission does not demand five minutes before it believes you',
    !readIntegrity(longOne, [longOne], NOW).flags.includes('tooFast'),
  );
  const longFake = claim('m5', 'fort', 20, 20);
  ok('twenty seconds on a twenty minute job is still flagged', readIntegrity(longFake, [longFake], NOW).flags.includes('tooFast'));

  // The commonest honest case of all.
  const noTimer = claim('m6', 'tidy', 5, undefined);
  ok('never pressing start is not an accusation', readIntegrity(noTimer, [noTimer], NOW).flags.length === 0);
  ok('and it says so rather than guessing a number', readIntegrity(noTimer, [noTimer], NOW).spentSec === null);
}

section('the same job over and over');
{
  const again = claim('m7', 'tidy', 5, 5 * 60);
  const history = [done('d1', 'tidy', 60 * MIN), done('d2', 'tidy', 120 * MIN), again];
  const read = readIntegrity(again, history, NOW);
  ok('the third time today is flagged', read.flags.includes('repeated'));
  ok('and the count is reported', read.repeatsToday === 2);

  const twice = readIntegrity(again, [done('d1', 'tidy', 60 * MIN), again], NOW);
  ok('twice in a day is allowed', !twice.flags.includes('repeated'));

  const other = readIntegrity(again, [done('d1', 'other', 60 * MIN), done('d2', 'other', 90 * MIN), again], NOW);
  ok('a different mission does not count against this one', !other.flags.includes('repeated'));

  // 30 hours back is a different day however you slice it.
  const yesterday = readIntegrity(again, [done('d1', 'tidy', 30 * 60 * MIN), done('d2', 'tidy', 31 * 60 * MIN), again], NOW);
  ok("yesterday's confirmations do not count", !yesterday.flags.includes('repeated'));

  const refused = readIntegrity(
    again,
    [{ ...done('d1', 'tidy', 60 * MIN), status: 'skipped' }, { ...done('d2', 'tidy', 90 * MIN), status: 'pending' }, again],
    NOW,
  );
  ok('claims the parent never approved are not held against them', !refused.flags.includes('repeated'));
}

section('a run of confirmations too close together');
{
  const last = claim('m8', 'sing', 5, 5 * 60);
  const burst = readIntegrity(last, [done('d1', 'a', 1 * MIN), done('d2', 'b', 2 * MIN), last], NOW);
  ok('three inside five minutes is flagged', burst.flags.includes('burst'));
  ok('and the count is reported', burst.recentConfirms === 2);

  const spread = readIntegrity(last, [done('d1', 'a', 40 * MIN), done('d2', 'b', 80 * MIN), last], NOW);
  ok('an ordinary afternoon is left alone', !spread.flags.includes('burst'));

  const pair = readIntegrity(last, [done('d1', 'a', 1 * MIN), last], NOW);
  ok('two in a row is allowed', !pair.flags.includes('burst'));

  // A confirmation after this claim belongs to a later mission, not this run.
  const future = readIntegrity(
    last,
    [{ ...done('d1', 'a', 0), confirmedAt: new Date(NOW + 5 * MIN).toISOString() }, last],
    NOW,
  );
  ok('later confirmations are not counted backwards', !future.flags.includes('burst'));
}

section('signals stack');
{
  const bad = claim('m9', 'tidy', 5, 8);
  const read = readIntegrity(
    bad,
    [done('d1', 'tidy', 1 * MIN), done('d2', 'tidy', 2 * MIN), bad],
    NOW,
  );
  ok('all three can fire at once', read.flags.length === 3);
}

section('odds and ends');
{
  const broken = readIntegrity(
    { ...claim('m10', 'tidy', 5, 4 * 60), claimedAt: 'not a date' },
    [done('d1', 'tidy', 1 * MIN)],
    NOW,
  );
  ok('a broken timestamp does not throw', broken.flags.length === 0);
  ok('and the clock falls back to now', broken.recentConfirms === 1);
  ok('four minutes reads as four', minutesOf(240) === 4);
  ok('a few seconds still reads as a minute', minutesOf(8) === 1);
}

console.log(
  failures === 0
    ? `\n  claim integrity holds (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
