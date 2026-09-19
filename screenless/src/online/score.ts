import type { AppData, BuddyId } from '../state/types';

/**
 * What goes to the friends board, and nothing more.
 *
 * Pure, so `scripts/test-social.ts` can check it. Every field here is a number
 * or the buddy's id: no name, no age, no interests, no mission text.
 */
export type ScoreSnapshot = {
  stars: number;
  missions: number;
  streak: number;
  /** ISO week in local time, e.g. `2026-W38`. The weekly numbers belong to it. */
  weekKey: string;
  weekStars: number;
  weekSteps: number;
  buddyId: BuddyId;
};

/** ISO 8601 week of a local calendar day. Weeks start on Monday. */
export function isoWeekKey(date: Date = new Date()): string {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Week of a `yyyy-mm-dd` day key as `engine/progress.ts` writes them. */
function weekOfDayKey(key: string): string | null {
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : isoWeekKey(date);
}

export function scoreSnapshot(
  data: Pick<AppData, 'progress' | 'missions' | 'walk' | 'profile'>,
  now: Date = new Date(),
): ScoreSnapshot | null {
  if (!data.profile) return null;
  const weekKey = isoWeekKey(now);

  // Counted from confirmed missions rather than kept as a running total, so a
  // new week starts at zero without anything having to notice Monday arrive.
  let weekStars = 0;
  for (const mission of data.missions) {
    if (mission.status !== 'done' || !mission.confirmedAt) continue;
    if (isoWeekKey(new Date(mission.confirmedAt)) === weekKey) weekStars += mission.task.stars;
  }

  const weekSteps = data.walk.days
    .filter((day) => weekOfDayKey(day.date) === weekKey)
    .reduce((sum, day) => sum + day.steps, 0);

  return {
    stars: data.progress.stars,
    missions: data.progress.totalMissions,
    streak: data.progress.streak,
    weekKey,
    weekStars,
    weekSteps,
    buddyId: data.profile.buddyId,
  };
}
