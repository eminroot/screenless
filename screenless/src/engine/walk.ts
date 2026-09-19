import { dayKey } from './progress';
import type { AgeBand, DayWalk, WalkState } from '../state/types';

/**
 * Turning steps into something worth having.
 *
 * The one rule that shapes everything here: **steps never make stars.** Stars
 * come only from a mission a parent confirmed, and they are what a parent has
 * promised an ice cream against in `engine/rewards.ts`. If ten thousand steps
 * made ten thousand stars, every promise a parent has written down would be
 * settled by one afternoon in a park, and the app would have quietly spent
 * their money for them.
 *
 * So walking earns coins, which are a separate currency that buys nothing real
 * — they dress the buddy up, in `engine/wardrobe.ts`, and nothing else. A
 * confirmed mission pays into the same purse and pays far more, which is the
 * right way round: the missions are the point and the walking is the bonus.
 *
 * The purse lives on `WalkState.coins` because that is where it started and
 * moving it would migrate the one number a child actually watches. It is the
 * app's only purse, not a walking-specific one.
 */

/** One coin per step, which is the number the child actually sees. */
export const COINS_PER_STEP = 1;

/**
 * Daily goals. The WHO puts 12,000 steps a day at the top of the range for
 * school age children, so these sit comfortably under it: a goal a child
 * misses every day is not a goal, it is a reproach.
 */
const DAILY_GOAL: Record<AgeBand, number> = {
  '3-5': 5000,
  '6-9': 7000,
  '10-14': 10000,
};

export function goalFor(ageBand: AgeBand): number {
  return DAILY_GOAL[ageBand];
}

/**
 * Steps that can be added in one go.
 *
 * The detector already refuses anything that is not walking, and this is the
 * belt to that pair of braces: a bug, a clock jump or a device with a strange
 * sensor cannot dump an implausible number into the total.
 */
export const MAX_STEPS_PER_TICK = 40;

/** Nobody walks a marathon before bedtime. Caps a day at a believable number. */
export const MAX_STEPS_PER_DAY = 40_000;

export const emptyWalk: WalkState = {
  coins: 0,
  lifetimeSteps: 0,
  days: [],
  bestDay: 0,
  goalStreak: 0,
};

/** Today's record, or a fresh one when the child has not walked yet. */
export function todayWalk(walk: WalkState, today = dayKey()): DayWalk {
  return walk.days.find((day) => day.date === today) ?? { date: today, steps: 0 };
}

export type WalkDelta = {
  walk: WalkState;
  /** Coins earned by this batch of steps. */
  coins: number;
  /** Set on the tick that crosses the daily goal, so the screen can celebrate. */
  reachedGoal: boolean;
  /** Set when today became the child's best day ever. */
  newBest: boolean;
};

/**
 * Folds a batch of counted steps into the record.
 *
 * Pure, and given the day key rather than reading the clock, so the rollover
 * at midnight is testable instead of being something that happens to work.
 */
export function addSteps(
  walk: WalkState,
  steps: number,
  ageBand: AgeBand,
  today = dayKey(),
): WalkDelta {
  const clean = Math.max(0, Math.min(Math.floor(steps), MAX_STEPS_PER_TICK));
  if (clean === 0) return { walk, coins: 0, reachedGoal: false, newBest: false };

  const current = todayWalk(walk, today);
  const before = current.steps;
  const after = Math.min(before + clean, MAX_STEPS_PER_DAY);
  const counted = after - before;
  if (counted === 0) return { walk, coins: 0, reachedGoal: false, newBest: false };

  const goal = goalFor(ageBand);
  const reachedGoal = before < goal && after >= goal;

  const days = walk.days.some((day) => day.date === today)
    ? walk.days.map((day) => (day.date === today ? { ...day, steps: after } : day))
    : [...walk.days, { date: today, steps: after }];

  return {
    walk: {
      coins: walk.coins + counted * COINS_PER_STEP,
      lifetimeSteps: walk.lifetimeSteps + counted,
      days: days.slice(-DAYS_KEPT),
      bestDay: Math.max(walk.bestDay, after),
      // Counted on the day it is reached, so it cannot be run up twice.
      goalStreak: reachedGoal ? walk.goalStreak + 1 : walk.goalStreak,
    },
    coins: counted * COINS_PER_STEP,
    reachedGoal,
    newBest: after > walk.bestDay && before <= walk.bestDay,
  };
}

/** A fortnight is as far back as the little chart goes. */
const DAYS_KEPT = 14;

/**
 * A goal streak only survives if yesterday counted too. Checked on load, the
 * same way `decayStreak` handles the mission streak.
 */
export function decayGoalStreak(walk: WalkState, ageBand: AgeBand, today = dayKey()): WalkState {
  if (walk.goalStreak === 0) return walk;

  const goal = goalFor(ageBand);
  const hit = new Set(walk.days.filter((day) => day.steps >= goal).map((day) => day.date));
  if (hit.has(today)) return walk;

  const yesterday = shiftDay(today, -1);
  return hit.has(yesterday) ? walk : { ...walk, goalStreak: 0 };
}

function shiftDay(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dayKey(date);
}

/** The last fortnight, oldest first, with gaps filled in for the chart. */
export function recentDays(walk: WalkState, today = dayKey(), count = 7): DayWalk[] {
  const known = new Map(walk.days.map((day) => [day.date, day.steps]));
  const out: DayWalk[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = shiftDay(today, -offset);
    out.push({ date, steps: known.get(date) ?? 0 });
  }
  return out;
}

/**
 * How far the child has explored, as a fraction of the next milestone.
 *
 * Milestones grow, so the first one arrives on the first walk and the later
 * ones take real effort. This is what the map reads to decide how much of the
 * world has opened up.
 */
export const MILESTONES = [
  1_000, 5_000, 15_000, 30_000, 60_000, 100_000, 160_000, 250_000,
] as const;

export function milestonesReached(lifetimeSteps: number): number {
  return MILESTONES.filter((milestone) => lifetimeSteps >= milestone).length;
}

export function nextMilestone(lifetimeSteps: number): number | null {
  return MILESTONES.find((milestone) => lifetimeSteps < milestone) ?? null;
}

/** 0 to 1 towards the next milestone, or 1 once they are all behind. */
export function milestoneProgress(lifetimeSteps: number): number {
  const next = nextMilestone(lifetimeSteps);
  if (next === null) return 1;
  const reached = milestonesReached(lifetimeSteps);
  const floor = reached === 0 ? 0 : MILESTONES[reached - 1];
  return Math.min(1, Math.max(0, (lifetimeSteps - floor) / (next - floor)));
}
