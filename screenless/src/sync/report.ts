import type { GuardDay } from '../guard/types';
import type { AppData, TaskCategory } from '../state/types';

/**
 * What this phone tells the hub, and nothing else.
 *
 * Pure, so `npm run test:sync` can drive it with a hand-built `AppData` and
 * assert on exactly what comes out. That matters more here than anywhere else
 * in the app: this is the only function in the codebase whose output leaves
 * the device, so the test for it is really a test of the privacy promise.
 *
 * ## What is in it
 *
 * Counts. How long the screen was on, how many missions were finished, how
 * many stars and steps, which categories, how many reminders fired and how
 * many led anywhere.
 *
 * ## What is deliberately not in it
 *
 * The child's name. Their nickname for the buddy. Mission titles and bodies.
 * The private notes the 10-14 tier writes. Photographs and their file paths.
 * Chat messages. Finds. The tree. Anything a child typed, drew, said or
 * photographed stays on the phone, and the server has no field to receive it.
 *
 * A parent who wants to see a mission title opens the child's phone, where it
 * has always been. Putting it on a server would mean a stranger with the
 * database could read a nine year old's week, and no chart is worth that.
 *
 * ## Why counters are totals for the day rather than deltas
 *
 * Every number here is "everything so far today", which makes the whole sync
 * idempotent. The hub folds a report in by taking the larger of what it has
 * and what arrived, so a retry after a dropped connection costs nothing and a
 * stale report arriving late cannot walk a figure backwards.
 */

export type DayReport = {
  date: string;
  screenSec: number;
  guardedSec: number;
  appSec: number;
  missionsDone: number;
  missionsStarted: number;
  stars: number;
  coins: number;
  steps: number;
  activeMin: number;
  nudges: number;
  nudgeHeeded: number;
  overLimit: boolean;
  gracesUsed: number;
  categories: Record<TaskCategory, number>;
};

export type Snapshot = {
  ageBand: string | null;
  buddyId: string | null;
  level: number;
  stars: number;
  coins: number;
  totalMissions: number;
  streak: number;
  bestStreak: number;
  tzOffsetMin: number;
  appVersion: string | null;
};

export type Report = { days: DayReport[]; snapshot: Snapshot };

const CATEGORIES: TaskCategory[] = ['move', 'outdoor', 'create', 'social', 'calm'];

function zeroCategories(): Record<TaskCategory, number> {
  return { move: 0, outdoor: 0, create: 0, social: 0, calm: 0 };
}

/** `yyyy-mm-dd` in local time, matching `engine/progress.ts`. */
function localDay(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The mission side of a day, gathered from the mission list.
 *
 * Read from the missions themselves rather than kept as a running tally,
 * because a tally has to be right on the first try forever and this can simply
 * be recomputed. A mission counts towards the day it was *confirmed*, which is
 * the day the child was told it counted.
 */
export type MissionTotals = {
  done: number;
  started: number;
  stars: number;
  activeSec: number;
  categories: Record<TaskCategory, number>;
};

function missionTotals(data: AppData): Map<string, MissionTotals> {
  const byDay = new Map<string, MissionTotals>();

  const at = (key: string): MissionTotals => {
    const found = byDay.get(key);
    if (found) return found;
    const fresh: MissionTotals = {
      done: 0,
      started: 0,
      stars: 0,
      activeSec: 0,
      categories: zeroCategories(),
    };
    byDay.set(key, fresh);
    return fresh;
  };

  for (const mission of data.missions) {
    if (mission.startedAt) {
      const key = localDay(mission.startedAt);
      if (key) at(key).started += 1;
    }

    if (mission.status !== 'done' || !mission.confirmedAt) continue;
    const key = localDay(mission.confirmedAt);
    if (!key) continue;

    const totals = at(key);
    totals.done += 1;
    totals.stars += mission.task.stars;
    // What the runner actually measured, falling back to what the mission was
    // written to take. The fallback matters: the 3-5 runner has no timer at
    // all, so without it every toddler's active minutes would read as zero.
    totals.activeSec += mission.durationSec ?? mission.task.minutes * 60;
    if (CATEGORIES.includes(mission.task.category)) {
      totals.categories[mission.task.category] += 1;
    }
  }

  return byDay;
}

function stepsByDay(data: AppData): Map<string, number> {
  return new Map(data.walk.days.map((day) => [day.date, day.steps]));
}

/**
 * Whether the day went past the limit.
 *
 * Worked out from the numbers rather than trusted from a flag, so a day that
 * was over the limit under a budget the parent has since changed still reads
 * as it was lived. The budget in `data.guard` is the current one; for a day in
 * the queue it is the best available answer and it is the one the parent will
 * recognise.
 */
function wentOver(day: GuardDay, budgetMin: number): boolean {
  if (budgetMin <= 0) return false;
  return day.usedSec >= budgetMin * 60;
}

/** One day, as the hub will store it. */
export function dayReport(
  day: GuardDay,
  missions: MissionTotals | undefined,
  steps: number,
  budgetMin: number,
  coins: number,
): DayReport {
  return {
    date: day.date,
    // The whole phone where that can be measured, falling back to this app's
    // own time where it cannot. On iOS the fallback is the only figure there
    // is, and saying "ten minutes" is better than saying "nothing happened".
    screenSec: Math.max(day.deviceSec, day.appSec),
    guardedSec: day.usedSec,
    appSec: day.appSec,
    missionsDone: missions?.done ?? 0,
    missionsStarted: missions?.started ?? 0,
    stars: missions?.stars ?? 0,
    coins,
    steps,
    activeMin: Math.round((missions?.activeSec ?? 0) / 60),
    nudges: day.nudgeCount,
    nudgeHeeded: day.nudgeHeeded,
    overLimit: wentOver(day, budgetMin),
    gracesUsed: day.gracesUsed,
    categories: missions?.categories ?? zeroCategories(),
  };
}

export function snapshotOf(data: AppData, appVersion: string | null = null): Snapshot {
  return {
    ageBand: data.profile?.ageBand ?? null,
    buddyId: data.profile?.buddyId ?? null,
    level: data.progress.level,
    stars: data.progress.stars,
    coins: data.walk.coins,
    totalMissions: data.progress.totalMissions,
    streak: data.progress.streak,
    bestStreak: data.progress.bestStreak,
    // So the hub can draw "today" as the child's today rather than the
    // server's. A family in Baku finishing a mission at half past midnight
    // should see it on the right bar.
    tzOffsetMin: -new Date().getTimezoneOffset(),
    appVersion,
  };
}

/**
 * Everything waiting to be sent.
 *
 * Today is always included, because it is always moving. The finished days in
 * the queue are included too: they are cheap, the hub ignores anything it
 * already has, and a phone that was offline for a week has no other way to
 * catch up.
 */
export function buildReport(data: AppData, appVersion: string | null = null): Report {
  const missions = missionTotals(data);
  const steps = stepsByDay(data);
  const budgetMin = data.guard.dailyBudgetMin;

  // Coins are a running total rather than a daily figure, so they are only
  // meaningful on the most recent day. Putting today's purse on every day in
  // the backlog would draw a flat line and call it history.
  const coinsToday = data.walk.coins;

  const days = [...data.guardHistory, data.guardDay]
    .filter((day) => day.date.length === 10)
    .map((day, index, all) =>
      dayReport(
        day,
        missions.get(day.date),
        steps.get(day.date) ?? 0,
        budgetMin,
        index === all.length - 1 ? coinsToday : 0,
      ),
    );

  return { days, snapshot: snapshotOf(data, appVersion) };
}

/**
 * Whether there is anything worth a request.
 *
 * A phone that has been sitting untouched should not wake the radio to say so.
 * Something has happened when a day in the queue has not been confirmed yet,
 * or when today has moved since the last send.
 */
export function hasSomethingToSend(
  report: Report,
  lastSentDay: string | null,
  lastSentSignature: string | null,
): boolean {
  if (report.days.length === 0) return false;
  const today = report.days[report.days.length - 1];
  if (lastSentDay !== today.date) return true;
  return signatureOf(today) !== lastSentSignature;
}

/** A cheap fingerprint of a day, so an unchanged one is not re-sent. */
export function signatureOf(day: DayReport): string {
  return [
    day.screenSec,
    day.guardedSec,
    day.appSec,
    day.missionsDone,
    day.missionsStarted,
    day.steps,
    day.activeMin,
    day.nudges,
    day.nudgeHeeded,
  ].join('.');
}
