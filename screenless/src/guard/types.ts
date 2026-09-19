/**
 * Screen Guard: the daily limit a parent sets on the apps a child loses hours
 * to, and what happens when it runs out.
 *
 * The shape of the feature is the same on both platforms even though almost
 * nothing about the implementation is. A parent picks the apps and a budget,
 * and the app escalates in three steps rather than slamming a door: a nudge
 * while there is still time left, a takeover that can be waved away a couple
 * of times, and finally a screen that does not move until tomorrow.
 *
 * The escalation is the whole design. A limit that only ever blocks teaches a
 * child to route around the app; a limit that only ever nudges teaches them to
 * ignore it. Walking up the ladder in one day is the part that actually
 * changes behaviour, and it is also what keeps the feature defensible: at no
 * point does the app do something the child did not see coming.
 */

/** How hard the limit bites. Each step contains the one before it. */
export type GuardTier =
  /** Nothing is enforced. Usage is still counted, so the numbers stay honest. */
  | 'off'
  /** A notification at three quarters and again at the limit. Nothing blocks. */
  | 'notice'
  /** Past the limit the app is covered, but the child can buy time back. */
  | 'interrupt'
  /** Past the limit the cover stays until tomorrow or a parent lifts it. */
  | 'block';

export const GUARD_TIERS: GuardTier[] = ['off', 'notice', 'interrupt', 'block'];

/**
 * A window of the day the limit always applies in, regardless of budget:
 * school hours, or after bedtime. Minutes from midnight, and `end` may be
 * smaller than `start` when the window crosses midnight.
 */
export type Curfew = { startMin: number; endMin: number };

export type GuardConfig = {
  /** The parent has turned the feature on at all. */
  enabled: boolean;
  tier: GuardTier;
  /** Minutes a day across every watched app together, not each. */
  dailyBudgetMin: number;
  /**
   * How many times a day the child may wave away the takeover, and for how
   * long each time. Only used at the `interrupt` tier.
   */
  graceCount: number;
  graceMinutes: number;
  /**
   * Minutes of measured use between one reminder and the next.
   *
   * The thing a parent means when they say "tell them every half hour". It is
   * separate from the tier and from the budget on purpose: a family can turn
   * the reminders on and leave everything else off, which is where most of
   * them should start. Zero, or anything under five, turns them off.
   */
  nudgeEveryMin: number;
  /** Always enforced inside this window, even with budget left. */
  curfew: Curfew | null;
  /**
   * What is being watched.
   *
   * On Android these are package names, which the parent picks from a list of
   * installed apps. On iOS they are an opaque blob from Apple's own picker —
   * the app is never told which apps a family chose, by design, so this string
   * is only ever handed straight back to the system.
   */
  watched: string[];
};

export const defaultGuardConfig: GuardConfig = {
  enabled: false,
  tier: 'notice',
  dailyBudgetMin: 60,
  graceCount: 2,
  graceMinutes: 5,
  nudgeEveryMin: 30,
  curfew: null,
  watched: [],
};

/** What has happened so far today. Reset when the date rolls over. */
export type GuardDay = {
  /** `dayKey()` of the day this belongs to. */
  date: string;
  /** Seconds spent in the watched apps today. */
  usedSec: number;
  /**
   * Seconds the phone was in use at all today, across every app.
   *
   * Kept apart from `usedSec` because they answer different questions and a
   * parent wants both: the limit bites on the apps they chose, but "how long
   * was this phone in a child's hands" is the number that opens the
   * conversation. Android measures it; on iOS it stays zero, because Apple
   * hands an app no figures at all.
   */
  deviceSec: number;
  /**
   * Seconds spent inside ScreenLess itself today.
   *
   * Counted by the app watching its own foreground time rather than read from
   * the platform, which makes it the one screen time figure that works
   * everywhere: Android, iOS and the web build all produce it, and it needs no
   * permission at all. It is also the number a parent is owed most directly,
   * because it is the screen time this app is itself responsible for.
   */
  appSec: number;
  /** Extensions taken. */
  gracesUsed: number;
  /** Seconds of grace currently outstanding, counted down by usage. */
  graceLeftSec: number;
  /**
   * Fractions of the budget already announced, so the same nudge never fires
   * twice. Stored as the threshold itself (0.75, 1) rather than a count. The
   * curfew nudge sits in here too, at -1, because it is also a once-a-day
   * thing and giving it a list of its own would be a field for one number.
   */
  noticed: number[];
  /** Interval checkpoints already announced, in minutes of use. */
  nudgedMin: number[];
  /** How many reminders fired today, for the parent's weekly figures. */
  nudgeCount: number;
  /**
   * How many of them were followed by the child starting a mission. The
   * honest measure of whether any of this works, and the one to watch if the
   * reminders ever need retuning.
   */
  nudgeHeeded: number;
  /** When the last one fired, so the next mission start can be credited to it. */
  lastNudgeAt: number | null;
  /** Set when a parent lifted the block by hand. Clears at the rollover. */
  liftedByParent: boolean;
};

export function emptyGuardDay(date: string): GuardDay {
  return {
    date,
    usedSec: 0,
    deviceSec: 0,
    appSec: 0,
    gracesUsed: 0,
    graceLeftSec: 0,
    noticed: [],
    nudgedMin: [],
    nudgeCount: 0,
    nudgeHeeded: 0,
    lastNudgeAt: null,
    liftedByParent: false,
  };
}

/**
 * How many days of screen time the phone keeps.
 *
 * Long enough that a phone which has been offline for a fortnight still has
 * everything to send, short enough that the stored blob stays small. The
 * server is the archive; this is a queue.
 */
export const GUARD_HISTORY_DAYS = 45;

/** What the watcher should do right now. */
export type GuardAction =
  /** Leave them alone. */
  | 'allow'
  /** Fire a nudge, then leave them alone. */
  | 'notice'
  /** Cover the screen, offer a way to buy time. */
  | 'interrupt'
  /** Cover the screen, no way through. */
  | 'block';

export type GuardDecision = {
  action: GuardAction;
  /** Seconds of budget left. Zero once it is spent. */
  remainingSec: number;
  /** Extensions the child could still take today. */
  gracesLeft: number;
  /** Thresholds to announce on this tick, empty most of the time. */
  announce: number[];
  /** Why the screen is covered, for the copy on it. */
  reason: 'budget' | 'curfew' | null;
};

/** What the native side reports back for one watched app. */
export type UsageSample = {
  /** Android package name, or an opaque iOS token. */
  id: string;
  /** Foreground seconds today. */
  seconds: number;
};

/** Whether enforcement can actually run on this device and build. */
export type GuardCapability = {
  /** The native module is present. False in Expo Go and on the web. */
  available: boolean;
  /** Usage figures can be read. */
  canReadUsage: boolean;
  /** The screen can actually be covered. */
  canEnforce: boolean;
  /** Everything still needed before the feature works, in the order to ask. */
  missing: GuardPermission[];
};

export type GuardPermission =
  /** Android: Settings > Special app access > Usage access. */
  | 'usageAccess'
  /** Android: Settings > Display over other apps. */
  | 'overlay'
  /** Android 13+: ordinary runtime notification permission. */
  | 'notifications'
  /** iOS: the Screen Time authorisation prompt. */
  | 'familyControls'
  /** iOS: a parent has not yet chosen any apps in Apple's picker. */
  | 'appSelection';
