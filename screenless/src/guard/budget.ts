import {
  emptyGuardDay,
  type Curfew,
  type GuardConfig,
  type GuardDay,
  type GuardDecision,
  type UsageSample,
} from './types';

/**
 * The rules behind the screen limit.
 *
 * Pure and importing nothing but its own types, so `npm run test:guard` can
 * drive it under plain Node. That split matters more here than anywhere else
 * in the app: the native watchers on both platforms are impossible to unit
 * test, so the only way to be sure the escalation is right is to keep every
 * decision out of them and in here.
 *
 * The native side does two things and nothing else: it reports seconds, and it
 * does what `decide()` tells it.
 */

/** Fractions of the budget the child is warned at, in order. */
export const NOTICE_POINTS = [0.75, 1] as const;

const MINUTE = 60;

export function budgetSeconds(config: GuardConfig): number {
  return Math.max(0, Math.round(config.dailyBudgetMin * MINUTE));
}

/** Seconds left, never negative. Grace is added on top of what is left. */
export function remainingSeconds(config: GuardConfig, day: GuardDay): number {
  const left = budgetSeconds(config) - day.usedSec;
  return Math.max(0, left) + Math.max(0, day.graceLeftSec);
}

/** 0 to 1, clamped. Grace is deliberately not counted: the bar shows the real spend. */
export function fractionUsed(config: GuardConfig, day: GuardDay): number {
  const budget = budgetSeconds(config);
  if (budget <= 0) return 1;
  return Math.max(0, Math.min(1, day.usedSec / budget));
}

/**
 * Whether a minute of the day falls inside the curfew.
 *
 * Handles the window crossing midnight, which is the normal case: a bedtime
 * curfew is 22:00 to 07:00 and every naive implementation of this gets it
 * backwards for the nine hours that matter most.
 */
export function inCurfew(curfew: Curfew | null, minuteOfDay: number): boolean {
  if (!curfew) return false;
  const { startMin, endMin } = curfew;
  if (startMin === endMin) return false;
  const now = ((minuteOfDay % 1440) + 1440) % 1440;
  return startMin < endMin
    ? now >= startMin && now < endMin
    : now >= startMin || now < endMin;
}

/**
 * Which warnings are newly due.
 *
 * Returns the thresholds crossed since the last tick and not yet announced, so
 * a child who opens the app once at 90% gets the 75% warning they slept
 * through rather than nothing at all.
 */
export function pendingNotices(config: GuardConfig, day: GuardDay): number[] {
  if (config.tier === 'off') return [];
  const fraction = fractionUsed(config, day);
  return NOTICE_POINTS.filter((point) => fraction >= point && !day.noticed.includes(point));
}

/**
 * What to do right now.
 *
 * Reads only its arguments, so the same inputs always give the same answer and
 * the watcher can call it every second without worrying about drift.
 */
export function decide(
  config: GuardConfig,
  day: GuardDay,
  minuteOfDay: number,
): GuardDecision {
  const remaining = remainingSeconds(config, day);
  const gracesLeft = Math.max(0, config.graceCount - day.gracesUsed);
  const announce = pendingNotices(config, day);

  const idle: GuardDecision = {
    action: 'allow',
    remainingSec: remaining,
    gracesLeft,
    announce: [],
    reason: null,
  };

  if (!config.enabled || config.tier === 'off') return idle;

  // A parent lifting the block by hand outranks everything until the rollover,
  // including the curfew: they are standing there and they said yes.
  if (day.liftedByParent) return { ...idle, remainingSec: remaining, gracesLeft };

  const curfewed = inCurfew(config.curfew, minuteOfDay);
  const spent = remaining <= 0;

  if (!curfewed && !spent) {
    // Still inside the budget. The only thing that can happen is a warning.
    return { ...idle, announce };
  }

  const reason: 'curfew' | 'budget' = curfewed ? 'curfew' : 'budget';

  if (config.tier === 'notice') {
    // Counting and warning only. Nothing covers the screen at this tier, which
    // is the point of having it: a family can start here and move up.
    return { ...idle, announce, reason: null };
  }

  // A curfew is never negotiable. Grace buys time against the budget, not
  // against bedtime, or the whole window becomes advisory.
  if (config.tier === 'interrupt' && !curfewed && gracesLeft > 0) {
    return { action: 'interrupt', remainingSec: 0, gracesLeft, announce, reason };
  }

  return { action: 'block', remainingSec: 0, gracesLeft, announce, reason };
}

/** Folds a tick of usage in. Seconds come from the native watcher. */
export function addUsage(day: GuardDay, seconds: number): GuardDay {
  if (seconds <= 0) return day;
  const used = day.usedSec + seconds;
  // Grace is spent by the same seconds that spend the budget, so five minutes
  // of grace really is five minutes and not five minutes of wall clock.
  const graceLeftSec = Math.max(0, day.graceLeftSec - seconds);
  return { ...day, usedSec: used, graceLeftSec };
}

/** Sums what the native side reported across every watched app. */
export function totalSeconds(samples: UsageSample[]): number {
  return samples.reduce((sum, sample) => sum + Math.max(0, sample.seconds), 0);
}

/**
 * Replaces today's count with an absolute figure from the platform.
 *
 * Both platforms report a running total for the day rather than a delta, so
 * the day is overwritten rather than incremented — and it only ever moves
 * forwards, because a system that under-reports after a reboot must not hand
 * the child their afternoon back.
 */
export function setUsage(day: GuardDay, seconds: number): GuardDay {
  const used = Math.max(day.usedSec, Math.max(0, Math.round(seconds)));
  const spent = used - day.usedSec;
  return { ...day, usedSec: used, graceLeftSec: Math.max(0, day.graceLeftSec - spent) };
}

/**
 * The whole phone's screen time today, rather than the watched apps'.
 *
 * Forward only for the same reason as `setUsage`: the platform occasionally
 * under-reports after a reboot, and a figure that can fall would let a child
 * reclaim their afternoon by restarting the phone. Nothing is enforced on this
 * number; it exists so a parent can see the size of the thing the limit is a
 * part of.
 */
export function setDeviceUsage(day: GuardDay, seconds: number): GuardDay {
  const total = Math.max(day.deviceSec, Math.max(0, Math.round(seconds)));
  return total === day.deviceSec ? day : { ...day, deviceSec: total };
}

/**
 * Adds a stretch of time the child spent inside ScreenLess.
 *
 * A delta rather than a total, because unlike the platform figures this one is
 * measured by the app watching itself: there is no running total to read back,
 * only the seconds since the last time anyone looked.
 *
 * Long gaps are dropped. A phone suspended overnight with the app open wakes
 * up believing eight hours passed in the foreground, and that one number would
 * dominate a whole week of charts.
 */
export const MAX_APP_STRETCH_SEC = 30 * MINUTE;

export function addAppTime(day: GuardDay, seconds: number): GuardDay {
  const stretch = Math.round(seconds);
  if (stretch <= 0 || stretch > MAX_APP_STRETCH_SEC) return day;
  return { ...day, appSec: day.appSec + stretch };
}

/** Marks warnings as delivered so they do not fire again. */
export function markNoticed(day: GuardDay, points: number[]): GuardDay {
  if (points.length === 0) return day;
  return { ...day, noticed: [...new Set([...day.noticed, ...points])] };
}

/** The child takes one of their extensions. Refused once they are gone. */
export function takeGrace(config: GuardConfig, day: GuardDay): GuardDay {
  if (day.gracesUsed >= config.graceCount) return day;
  return {
    ...day,
    gracesUsed: day.gracesUsed + 1,
    graceLeftSec: Math.max(0, day.graceLeftSec) + config.graceMinutes * MINUTE,
  };
}

/** A parent unlocks the rest of the day. */
export function liftForToday(day: GuardDay): GuardDay {
  return { ...day, liftedByParent: true };
}

/**
 * Starts a fresh day when the date has moved on.
 *
 * Everything resets, including a parent's lift: an unlock granted on Tuesday
 * should not still be in force on Wednesday, which is the bug every version of
 * this feature ships with first.
 */
export function rollover(day: GuardDay, today: string): GuardDay {
  return day.date === today ? day : emptyGuardDay(today);
}

/** Minutes since midnight, for `decide`. Split out so tests can pin it. */
export function minuteOfDay(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** A friendly `1h 20m`, for the child's own screen. */
export function formatSpan(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
