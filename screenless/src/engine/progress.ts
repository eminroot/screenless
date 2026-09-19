import type { Progress, RewardId } from '../state/types';

/** Stars needed to reach each level. Index 0 is level 1. */
export const LEVEL_THRESHOLDS = [0, 30, 80, 160, 280, 450, 700] as const;
export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/** Rewards handed out when a level is reached. */
export const LEVEL_REWARDS: Record<number, RewardId[]> = {
  2: ['hat', 'balloon'],
  3: ['scarf'],
  4: ['glasses', 'ball'],
  5: ['cape'],
  6: ['crown'],
  7: ['medal'],
};

export const LEVEL_TITLE_KEYS = [
  'levelTitles.l1',
  'levelTitles.l2',
  'levelTitles.l3',
  'levelTitles.l4',
  'levelTitles.l5',
  'levelTitles.l6',
  'levelTitles.l7',
] as const;

export function levelForStars(stars: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (stars >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function starsToNextLevel(stars: number): number {
  const level = levelForStars(stars);
  if (level >= MAX_LEVEL) return 0;
  return LEVEL_THRESHOLDS[level] - stars;
}

/** 0 to 1 progress inside the current level, used by the ring on the map. */
export function levelFraction(stars: number): number {
  const level = levelForStars(stars);
  if (level >= MAX_LEVEL) return 1;
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceiling = LEVEL_THRESHOLDS[level];
  return Math.min(1, Math.max(0, (stars - floor) / (ceiling - floor)));
}

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export type ProgressDelta = {
  progress: Progress;
  leveledUpTo: number | null;
  newRewards: RewardId[];
};

/** Applies one confirmed mission and reports what the child should see. */
export function applyCompletion(
  progress: Progress,
  earnedStars: number,
  minutes: number,
  today = dayKey(),
): ProgressDelta {
  const stars = progress.stars + earnedStars;
  const previousLevel = progress.level;
  const level = levelForStars(stars);

  let streak = progress.streak;
  if (progress.lastDoneDate === today) {
    // Already counted today, extra missions do not extend the streak.
    streak = Math.max(streak, 1);
  } else if (progress.lastDoneDate && daysBetween(progress.lastDoneDate, today) === 1) {
    streak += 1;
  } else {
    streak = 1;
  }

  const newRewards: RewardId[] = [];
  for (let l = previousLevel + 1; l <= level; l += 1) {
    for (const reward of LEVEL_REWARDS[l] ?? []) {
      if (!progress.unlocked.includes(reward)) newRewards.push(reward);
    }
  }

  return {
    progress: {
      stars,
      level,
      totalMissions: progress.totalMissions + 1,
      totalMinutes: progress.totalMinutes + minutes,
      streak,
      bestStreak: Math.max(progress.bestStreak, streak),
      lastDoneDate: today,
      unlocked: [...progress.unlocked, ...newRewards],
    },
    leveledUpTo: level > previousLevel ? level : null,
    newRewards,
  };
}

/**
 * Undoes one approved mission, for a parent taking back what the phone let
 * through.
 *
 * Stars, level and the two totals go back. Two things deliberately do not:
 * the streak, because it counts days rather than missions and rebuilding it
 * from history would punish a day that had other missions in it; and
 * `unlocked`, because an item already in the wardrobe stays owned. Taking a
 * crown off a child's buddy over one unmade bed teaches the wrong lesson.
 */
export function revokeCompletion(progress: Progress, earnedStars: number, minutes: number): Progress {
  const stars = Math.max(0, progress.stars - earnedStars);
  return {
    ...progress,
    stars,
    level: levelForStars(stars),
    totalMissions: Math.max(0, progress.totalMissions - 1),
    totalMinutes: Math.max(0, progress.totalMinutes - minutes),
  };
}

/** A streak lapses once a full day has been missed. */
export function decayStreak(progress: Progress, today = dayKey()): Progress {
  if (!progress.lastDoneDate || progress.streak === 0) return progress;
  const gap = daysBetween(progress.lastDoneDate, today);
  if (gap <= 1) return progress;
  return { ...progress, streak: 0 };
}
