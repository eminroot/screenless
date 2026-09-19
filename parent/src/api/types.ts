/**
 * The shapes the hub returns.
 *
 * Hand written rather than generated, and deliberately narrower than what the
 * server sends: this app reads a handful of fields and every one of them is
 * listed here, so a change on the server that drops something shows up as a
 * type error rather than as an empty chart.
 */

export const AGE_BANDS = ['3-5', '6-9', '10-13'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const TIERS = ['off', 'notice', 'interrupt', 'block'] as const;
export type Tier = (typeof TIERS)[number];

export const CATEGORIES = ['move', 'outdoor', 'create', 'social', 'calm'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Parent = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export type Child = {
  id: string;
  name: string;
  ageBand: AgeBand;
  buddyId: string | null;
  level: number;
  stars: number;
  coins: number;
  totalMissions: number;
  streak: number;
  bestStreak: number;
  createdAt: string;
  /** When this child's phone last sent anything. Null before it ever has. */
  lastReport: string | null;
};

export type Limits = {
  revision: number;
  enabled: boolean;
  tier: Tier;
  dailyBudgetMin: number;
  nudgeEveryMin: number;
  graceCount: number;
  graceMinutes: number;
  /** Minutes from midnight, or -1 for none. May wrap past midnight. */
  curfewStartMin: number;
  curfewEndMin: number;
  watched: string[];
};

/**
 * One day.
 *
 * `reported` is the field that matters most and the one every chart has to
 * respect: a bar of height zero and no bar at all mean different things, and
 * drawing a phone that was switched off as a good day is the single easiest
 * way to make this whole app untrustworthy.
 */
export type Day = {
  date: string;
  reported: boolean;
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
  categories: Record<Category, number>;
};

/** A child on the list screen: who they are, today, and a week of bars. */
export type ChildCard = Child & {
  paired: boolean;
  limits: Limits;
  today: Day;
  week: Day[];
};

export type Weekday = {
  /** 0 is Monday. */
  weekday: number;
  /** How many of this weekday reported inside the range. */
  days: number;
  screenSec: number;
  missionsDone: number;
};

export type Summary = {
  range: { from: string; to: string; days: number };
  days: Day[];
  totals: {
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
    gracesUsed: number;
    reportedDays: number;
    overLimitDays: number;
    activeDays: number;
  };
  averages: {
    screenSec: number;
    missionsDone: number;
    activeMin: number;
    steps: number;
  };
  /** Percentage change against the window before, per reporting day. Null when there is nothing to compare. */
  change: {
    screenPerDay: number | null;
    missionsDone: number | null;
    activeMin: number | null;
    steps: number | null;
  };
  previous: {
    range: { from: string; to: string };
    screenPerDay: number;
    missionsDone: number;
    missionsPerDay: number;
    activeMin: number;
    activeMinPerDay: number;
    steps: number;
    stepsPerDay: number;
    reportedDays: number;
  };
  categories: Record<Category, number>;
  weekdays: Weekday[];
  streak: number;
  /** Active minutes as a share of active plus screen. Null with nothing to divide. */
  balance: number | null;
  /** Share of reminders followed by a mission. Null until one has fired. */
  nudgeResponse: number | null;
  best: {
    missions: { date: string; value: number } | null;
    steps: { date: string; value: number } | null;
    active: { date: string; value: number } | null;
  };
};

export type Pairing = {
  code: string;
  /** `ABC-123`, which is the form a parent reads aloud. */
  pretty: string;
  expiresAt: string;
};
