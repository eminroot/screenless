import { GUARD_TIERS, type GuardConfig, type GuardTier } from '../guard/types';
import type { HubLimits } from './api';

/**
 * Folding a parent's settings from the hub into this phone's own.
 *
 * Pure, so `npm run test:sync` can prove the two rules below rather than
 * leaving them to be discovered on a demo day.
 *
 * ## The parent app wins, except about which apps
 *
 * Everything a parent can sensibly decide from their own phone comes down
 * from the hub and overwrites what is here: the budget, how hard the limit
 * bites, how often to remind, the quiet hours.
 *
 * The watched app list does not. It is a list of Android package names that
 * only exist on the child's device, and the parent picked them there, with
 * that phone in their hand, from the apps actually installed on it. The parent
 * app has no way to show that list and no business guessing at it, so a list
 * arriving from the hub is only used when this phone has none at all. In
 * practice the parent app never sends one; the field is there for the day it
 * grows a picker.
 *
 * ## Nothing here can turn enforcement on by itself
 *
 * A limit still needs the two Android special-access permissions that only a
 * human standing at the phone can grant. `enabled` coming down as true means
 * "the parent wants this on", and the capability check in `useGuard` decides
 * whether it can be. That order matters: the alternative is a parent app that
 * cheerfully reports a limit is running when nothing on the child's phone is
 * able to enforce it.
 */

function tierOf(value: string): GuardTier {
  return (GUARD_TIERS as readonly string[]).includes(value) ? (value as GuardTier) : 'notice';
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function applyLimits(config: GuardConfig, limits: HubLimits): GuardConfig {
  const hasCurfew = limits.curfewStartMin >= 0 && limits.curfewEndMin >= 0;

  return {
    ...config,
    enabled: limits.enabled === true,
    tier: tierOf(limits.tier),
    dailyBudgetMin: clamp(limits.dailyBudgetMin, 0, 1440),
    nudgeEveryMin: clamp(limits.nudgeEveryMin, 0, 240),
    graceCount: clamp(limits.graceCount, 0, 10),
    graceMinutes: clamp(limits.graceMinutes, 0, 60),
    curfew: hasCurfew
      ? { startMin: clamp(limits.curfewStartMin, 0, 1439), endMin: clamp(limits.curfewEndMin, 0, 1439) }
      : null,
    watched:
      config.watched.length > 0
        ? config.watched
        : Array.isArray(limits.watched)
          ? limits.watched.filter((id) => typeof id === 'string' && id.length > 0)
          : [],
  };
}

/**
 * Whether anything actually moved.
 *
 * Compared field by field rather than by revision alone, because the revision
 * moves every time a parent presses save even when they changed nothing, and
 * re-applying a plan restarts the native watcher.
 */
export function limitsDiffer(config: GuardConfig, limits: HubLimits): boolean {
  const next = applyLimits(config, limits);
  return (
    next.enabled !== config.enabled ||
    next.tier !== config.tier ||
    next.dailyBudgetMin !== config.dailyBudgetMin ||
    next.nudgeEveryMin !== config.nudgeEveryMin ||
    next.graceCount !== config.graceCount ||
    next.graceMinutes !== config.graceMinutes ||
    next.curfew?.startMin !== config.curfew?.startMin ||
    next.curfew?.endMin !== config.curfew?.endMin ||
    next.watched.join() !== config.watched.join()
  );
}
