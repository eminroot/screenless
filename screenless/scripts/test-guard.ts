/**
 * Drives the screen limit rules under plain Node.
 *
 * The native watchers on both platforms are effectively untestable from here —
 * one needs a provisioned iOS device with an Apple entitlement, the other an
 * Android device with two special access permissions granted by hand. So every
 * decision lives in `src/guard/budget.ts` and this is the thing that proves it
 * behaves, which makes the native side a reporter of seconds rather than a
 * place where policy hides.
 *
 * Run with: npm run test:guard
 */
import {
  addUsage,
  decide,
  formatSpan,
  fractionUsed,
  inCurfew,
  liftForToday,
  markNoticed,
  minuteOfDay,
  pendingNotices,
  remainingSeconds,
  rollover,
  setUsage,
  takeGrace,
  totalSeconds,
} from '../src/guard/budget';
import { defaultGuardConfig, emptyGuardDay, type GuardConfig, type GuardDay } from '../src/guard/types';

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

function config(patch: Partial<GuardConfig> = {}): GuardConfig {
  return { ...defaultGuardConfig, enabled: true, watched: ['com.example.app'], ...patch };
}

function day(patch: Partial<GuardDay> = {}): GuardDay {
  return { ...emptyGuardDay('2026-09-15'), ...patch };
}

/* ------------------------------------------------------------------ budget */

section('budget arithmetic');
{
  const c = config({ dailyBudgetMin: 60 });
  ok('a fresh day has the whole budget', remainingSeconds(c, day()) === 60 * MIN);
  ok('half spent leaves half', remainingSeconds(c, day({ usedSec: 30 * MIN })) === 30 * MIN);
  ok('overspending never goes negative', remainingSeconds(c, day({ usedSec: 99 * MIN })) === 0);
  ok('grace is added on top', remainingSeconds(c, day({ usedSec: 60 * MIN, graceLeftSec: 300 })) === 300);

  ok('fraction is clamped at one', fractionUsed(c, day({ usedSec: 999 * MIN })) === 1);
  ok('a zero budget reads as fully spent', fractionUsed(config({ dailyBudgetMin: 0 }), day()) === 1);
  ok('grace does not flatter the bar', fractionUsed(c, day({ usedSec: 60 * MIN, graceLeftSec: 600 })) === 1);
}

/* ------------------------------------------------------------------ curfew */

section('curfew windows');
{
  ok('a daytime window contains its middle', inCurfew({ startMin: 9 * 60, endMin: 15 * 60 }, 12 * 60));
  ok('a daytime window excludes the evening', !inCurfew({ startMin: 9 * 60, endMin: 15 * 60 }, 20 * 60));

  // The case every naive implementation gets wrong.
  const night = { startMin: 22 * 60, endMin: 7 * 60 };
  ok('a night window contains 23:00', inCurfew(night, 23 * 60));
  ok('a night window contains 02:00', inCurfew(night, 2 * 60));
  ok('a night window contains its first minute', inCurfew(night, 22 * 60));
  ok('a night window excludes its last minute', !inCurfew(night, 7 * 60));
  ok('a night window excludes the afternoon', !inCurfew(night, 15 * 60));

  ok('an empty window is never on', !inCurfew({ startMin: 600, endMin: 600 }, 600));
  ok('no curfew is never on', !inCurfew(null, 600));
}

/* ----------------------------------------------------------------- notices */

section('warnings');
{
  const c = config({ dailyBudgetMin: 60 });
  ok('nothing is due early on', pendingNotices(c, day({ usedSec: 10 * MIN })).length === 0);
  ok('three quarters is due at 75%', pendingNotices(c, day({ usedSec: 45 * MIN })).join() === '0.75');

  // Someone who does not look at their phone between 70% and 100% should still
  // be told about both, not silently skipped past the first.
  const late = pendingNotices(c, day({ usedSec: 60 * MIN }));
  ok('both are due if the first was missed', late.join() === '0.75,1');

  const announced = markNoticed(day({ usedSec: 60 * MIN }), [0.75]);
  ok('an announced warning does not repeat', pendingNotices(c, announced).join() === '1');
  ok('marking twice does not duplicate', markNoticed(announced, [0.75]).noticed.length === 1);
  ok('a silent tier announces nothing', pendingNotices(config({ tier: 'off' }), day({ usedSec: 99 * MIN })).length === 0);
}

/* ---------------------------------------------------------------- decisions */

section('what the watcher is told to do');
{
  const noon = 12 * 60;

  ok(
    'a disabled guard allows everything',
    decide(config({ enabled: false }), day({ usedSec: 999 * MIN }), noon).action === 'allow',
  );
  ok(
    'the off tier allows everything',
    decide(config({ tier: 'off' }), day({ usedSec: 999 * MIN }), noon).action === 'allow',
  );

  const notice = config({ tier: 'notice', dailyBudgetMin: 60 });
  ok('inside the budget is allowed', decide(notice, day({ usedSec: 10 * MIN }), noon).action === 'allow');
  ok('the notice tier never covers the screen', decide(notice, day({ usedSec: 90 * MIN }), noon).action === 'allow');
  ok(
    'the notice tier still warns',
    decide(notice, day({ usedSec: 90 * MIN }), noon).announce.join() === '0.75,1',
  );

  const interrupt = config({ tier: 'interrupt', dailyBudgetMin: 60, graceCount: 2 });
  ok(
    'the interrupt tier interrupts once spent',
    decide(interrupt, day({ usedSec: 60 * MIN }), noon).action === 'interrupt',
  );
  ok(
    'it falls through to a block once grace runs out',
    decide(interrupt, day({ usedSec: 60 * MIN, gracesUsed: 2 }), noon).action === 'block',
  );

  const block = config({ tier: 'block', dailyBudgetMin: 60, graceCount: 5 });
  ok(
    'the block tier ignores grace entirely',
    decide(block, day({ usedSec: 60 * MIN }), noon).action === 'block',
  );

  // Curfew.
  const night = config({ tier: 'interrupt', curfew: { startMin: 22 * 60, endMin: 7 * 60 } });
  ok('curfew blocks with budget to spare', decide(night, day({ usedSec: 0 }), 23 * 60).action === 'block');
  ok(
    'curfew is not negotiable with grace',
    decide(night, day({ usedSec: 0, gracesUsed: 0 }), 23 * 60).action === 'block',
  );
  ok('curfew names itself', decide(night, day(), 23 * 60).reason === 'curfew');
  ok('outside curfew it behaves normally', decide(night, day({ usedSec: 0 }), 12 * 60).action === 'allow');
  ok(
    'a spent budget names itself',
    decide(config({ tier: 'block' }), day({ usedSec: 999 * MIN }), noon).reason === 'budget',
  );

  // A parent standing there and saying yes.
  const lifted = liftForToday(day({ usedSec: 999 * MIN }));
  ok('a parent lift allows everything', decide(block, lifted, noon).action === 'allow');
  ok('a parent lift beats the curfew too', decide(night, lifted, 23 * 60).action === 'allow');
}

/* -------------------------------------------------------------- accounting */

section('counting');
{
  ok('usage adds up', addUsage(day({ usedSec: 100 }), 50).usedSec === 150);
  ok('a negative tick is ignored', addUsage(day({ usedSec: 100 }), -50).usedSec === 100);
  ok('grace burns down with usage', addUsage(day({ graceLeftSec: 120 }), 50).graceLeftSec === 70);
  ok('grace stops at zero', addUsage(day({ graceLeftSec: 30 }), 500).graceLeftSec === 0);

  // The platforms report a running total, and a reboot can make that total
  // look smaller than what we already counted.
  ok('an absolute figure is taken', setUsage(day({ usedSec: 100 }), 400).usedSec === 400);
  ok('a smaller figure never rewinds the day', setUsage(day({ usedSec: 400 }), 100).usedSec === 400);
  ok('an absolute jump also burns grace', setUsage(day({ usedSec: 100, graceLeftSec: 200 }), 250).graceLeftSec === 50);

  ok('samples sum', totalSeconds([{ id: 'a', seconds: 30 }, { id: 'b', seconds: 12 }]) === 42);
  ok('a negative sample cannot subtract', totalSeconds([{ id: 'a', seconds: -99 }, { id: 'b', seconds: 10 }]) === 10);
}

section('grace');
{
  const c = config({ graceCount: 2, graceMinutes: 5 });
  const first = takeGrace(c, day({ usedSec: 60 * MIN }));
  ok('taking grace adds the minutes', first.graceLeftSec === 5 * MIN);
  ok('taking grace spends one', first.gracesUsed === 1);

  const second = takeGrace(c, first);
  const third = takeGrace(c, second);
  ok('grace runs out', third.gracesUsed === 2);
  ok('a refused grace adds no time', third.graceLeftSec === second.graceLeftSec);
}

section('the day rolling over');
{
  const yesterday = {
    ...day({ usedSec: 999, gracesUsed: 2, graceLeftSec: 60, noticed: [0.75, 1] }),
    liftedByParent: true,
  };
  const fresh = rollover(yesterday, '2026-09-16');
  ok('a new date wipes the count', fresh.usedSec === 0);
  ok('a new date restores grace', fresh.gracesUsed === 0);
  ok('a new date re-arms the warnings', fresh.noticed.length === 0);
  // The bug every version of this feature ships with first.
  ok('a new date cancels a parent lift', fresh.liftedByParent === false);
  ok('the same date is left alone', rollover(yesterday, '2026-09-15').usedSec === 999);
}

section('odds and ends');
{
  ok('minutes from midnight', minuteOfDay(new Date(2026, 8, 15, 13, 45)) === 13 * 60 + 45);
  ok('under an hour reads in minutes', formatSpan(25 * MIN) === '25m');
  ok('a round hour drops the minutes', formatSpan(60 * MIN) === '1h');
  ok('an hour and change reads as both', formatSpan(80 * MIN) === '1h 20m');
  ok('nothing reads as zero', formatSpan(-5) === '0m');
}

console.log(
  failures === 0
    ? `\n  the screen limit holds (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
