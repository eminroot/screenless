/**
 * Checks the walking economy.
 *
 * The step detector has its own harness; this covers what happens to the
 * number afterwards. The two that bite are the midnight rollover and the goal
 * streak, because both only go wrong on a day boundary and neither is
 * something you notice by using the app for ten minutes.
 *
 *   node -r sucrase/register scripts/test-walk.ts
 */
import {
  addSteps,
  decayGoalStreak,
  emptyWalk,
  goalFor,
  milestoneProgress,
  MAX_STEPS_PER_DAY,
  MAX_STEPS_PER_TICK,
  recentDays,
  todayWalk,
} from '../src/engine/walk';
import type { WalkState } from '../src/state/types';

let failures = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'}  ${name.padEnd(52)}${ok ? '' : `got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)}`}`,
  );
}

/** Walks `steps` in one day, in believable batches. */
function walkDay(state: WalkState, steps: number, day: string): WalkState {
  let current = state;
  let left = steps;
  while (left > 0) {
    const batch = Math.min(left, MAX_STEPS_PER_TICK);
    current = addSteps(current, batch, '6-9', day).walk;
    left -= batch;
  }
  return current;
}

console.log('');

/* ------------------------------------------------------------- basic count */

const one = addSteps(emptyWalk, 10, '6-9', '2026-09-12');
check('ten steps bank ten coins', one.coins, 10);
check('ten steps land on today', todayWalk(one.walk, '2026-09-12').steps, 10);
check('lifetime follows', one.walk.lifetimeSteps, 10);
check('no goal on ten steps', one.reachedGoal, false);

check('zero steps change nothing', addSteps(emptyWalk, 0, '6-9').coins, 0);
check('negative steps change nothing', addSteps(emptyWalk, -50, '6-9').coins, 0);
check(
  'an implausible batch is clamped',
  addSteps(emptyWalk, 5000, '6-9', '2026-09-12').coins,
  MAX_STEPS_PER_TICK,
);

/* -------------------------------------------------------------- daily goal */

const goal = goalFor('6-9');
const nearly = walkDay(emptyWalk, goal - 10, '2026-09-12');
check('short of the goal, no streak yet', nearly.goalStreak, 0);

const crossing = addSteps(nearly, 20, '6-9', '2026-09-12');
check('the crossing tick reports the goal', crossing.reachedGoal, true);
check('reaching the goal starts a run', crossing.walk.goalStreak, 1);

const after = addSteps(crossing.walk, 20, '6-9', '2026-09-12');
check('the goal only fires once a day', after.reachedGoal, false);
check('and cannot run the streak up twice', after.walk.goalStreak, 1);

/* ---------------------------------------------------------------- rollover */

const dayOne = walkDay(emptyWalk, goal + 100, '2026-09-12');
const dayTwo = walkDay(dayOne, 300, '2026-09-13');
check('a new day starts from zero', todayWalk(dayTwo, '2026-09-13').steps, 300);
check('yesterday is untouched', todayWalk(dayTwo, '2026-09-12').steps, goal + 100);
check('lifetime carries across', dayTwo.lifetimeSteps, goal + 400);
check('best day remembers the bigger one', dayTwo.bestDay, goal + 100);

/* ------------------------------------------------------------ streak decay */

const hitBoth = walkDay(walkDay(emptyWalk, goal, '2026-09-12'), goal, '2026-09-13');
check('two days in a row', hitBoth.goalStreak, 2);
check(
  'a streak survives the day after',
  decayGoalStreak(hitBoth, '6-9', '2026-09-14').goalStreak,
  2,
);
check(
  'a streak dies after a missed day',
  decayGoalStreak(hitBoth, '6-9', '2026-09-15').goalStreak,
  0,
);
check(
  'reaching it again today keeps it',
  decayGoalStreak(walkDay(hitBoth, goal, '2026-09-14'), '6-9', '2026-09-14').goalStreak,
  3,
);

/* --------------------------------------------------------------- day cap */

let capped = emptyWalk;
for (let i = 0; i < 1200; i += 1) capped = addSteps(capped, 40, '6-9', '2026-09-12').walk;
check('a single day cannot exceed the cap', todayWalk(capped, '2026-09-12').steps, MAX_STEPS_PER_DAY);
check('and the cap stops coins too', capped.coins, MAX_STEPS_PER_DAY);

/* ----------------------------------------------------------------- chart */

const week = recentDays(dayTwo, '2026-09-13');
check('the chart always has seven days', week.length, 7);
check('the chart ends on today', week[6].date, '2026-09-13');
check('missing days read as zero', week[0].steps, 0);

/* ------------------------------------------------------------ milestones */

check('progress starts at zero', milestoneProgress(0), 0);
check('progress is bounded', milestoneProgress(999_999_999), 1);
const mid = milestoneProgress(3000);
check('progress between milestones is sane', mid > 0 && mid < 1, true);

console.log('');
console.log(failures === 0 ? '  walking economy holds' : `  ${failures} check(s) failed`);
console.log('');
process.exit(failures === 0 ? 0 : 1);
