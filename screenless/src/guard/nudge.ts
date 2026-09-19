import type { AgeBand, TaskCategory } from '../state/types';
import { budgetSeconds, fractionUsed, inCurfew, NOTICE_POINTS } from './budget';
import type { GuardConfig, GuardDay } from './types';

/**
 * The tap on the shoulder while the screen time is still running out.
 *
 * Separate from `budget.ts` because it answers a different question. The
 * budget decides whether to *stop* a child; this decides whether to *say
 * something*, and the two have almost nothing in common: one is a rule a
 * parent set and the other is a conversation, and the conversation happens
 * many times before the rule ever bites.
 *
 * Two kinds fire:
 *
 *   checkpoint   every `nudgeEveryMin` minutes of measured use. This is the
 *                one a parent asks for when they say "remind them every half
 *                hour". It fires whether or not there is a limit set, so a
 *                family can have the reminders without the enforcement.
 *   threshold    at three quarters of the budget and again when it is gone.
 *                Only meaningful when a budget exists.
 *
 * Pure, so `npm run test:nudge` can walk a whole day a minute at a time.
 *
 * ## Why the copy is not one message with the minutes swapped in
 *
 * "You are approaching your daily screen time limit" is a sentence written for
 * the parent who configured the limit, not for the child receiving it. A four
 * year old does not have a concept of a daily budget and cannot read the
 * notification anyway; a twelve year old reads it as nagging the moment it
 * sounds like a poster. So the three tiers say genuinely different things:
 *
 *   3-5     the buddy misses them. No numbers, no limit, no clock. An
 *           invitation, because at this age the notification is really aimed
 *           at the adult holding the phone.
 *   6-9     minutes left, framed as what is still possible today, plus one
 *           concrete thing to go and do.
 *   10-13   the number and nothing else. No exclamation mark, no mascot, no
 *           encouragement. Respecting that they can do the arithmetic
 *           themselves is the only register that survives being read twice.
 */

export type NudgeKind =
  /** An interval has gone by. */
  | 'checkpoint'
  /** Three quarters of the budget is gone. */
  | 'approaching'
  /** The budget is gone. */
  | 'spent'
  /** Inside the curfew window. */
  | 'curfew';

/**
 * What to offer instead of the screen.
 *
 * A nudge that only takes something away is a nudge a child learns to swipe
 * off. Naming one real thing turns it into an offer, and the categories match
 * the mission pool so the thing being offered actually exists in the app: the
 * notification opens the app and a mission of that kind is there.
 */
export type NudgeSuggestion = TaskCategory | 'read';

export const NUDGE_SUGGESTIONS: NudgeSuggestion[] = [
  'move',
  'outdoor',
  'read',
  'create',
  'calm',
  'social',
];

export type Nudge = {
  kind: NudgeKind;
  /**
   * The checkpoint this fired for, in minutes of use. Written to
   * `day.nudgedMin` so the same one never fires twice, and for a threshold
   * nudge it is the minute the threshold sits at.
   */
  atMin: number;
  usedMin: number;
  /** Minutes of budget left, or null when no budget is set. */
  leftMin: number | null;
  budgetMin: number | null;
  suggestion: NudgeSuggestion;
};

/** Below this there is nothing worth interrupting for. */
const MIN_INTERVAL_MIN = 5;

/**
 * How close to the end the wording changes from "how long is left" to "that is
 * the lot". Kept as a fraction rather than a fixed number of minutes so it
 * scales: five minutes left of thirty is a different moment to five minutes
 * left of three hours.
 */
const LAST_STRETCH = 0.9;

function minutesUsed(day: GuardDay): number {
  return Math.floor(day.usedSec / 60);
}

/**
 * Which suggestion this nudge offers.
 *
 * Walks the list rather than picking at random, so a child never gets "go
 * outside" three times running, and keyed off the date as well so the day does
 * not always open on the same one. Deterministic, which is what makes it
 * testable and what stops two devices disagreeing about the same day.
 *
 * `index` is how many nudges have already gone out today, not the minute they
 * went out at. Using the minute looks equivalent and is not: with a
 * half-hourly interval every checkpoint lands on a multiple of thirty, thirty
 * divides by six, and the rotation collapses to a single suggestion repeated
 * all day.
 */
export function suggestionFor(day: GuardDay, index: number): NudgeSuggestion {
  const seed = day.date.split('-').reduce((sum, part) => sum + Number(part), 0);
  return NUDGE_SUGGESTIONS[(seed + index) % NUDGE_SUGGESTIONS.length];
}

/**
 * Every interval checkpoint that has gone by and not been announced.
 *
 * Returns them all rather than only the latest, so the caller can decide. In
 * practice `nextNudge` takes the last one: a phone that was off for an hour
 * should not deliver four notifications the moment it wakes up.
 */
export function pendingCheckpoints(config: GuardConfig, day: GuardDay): number[] {
  const every = Math.round(config.nudgeEveryMin ?? 0);
  if (every < MIN_INTERVAL_MIN) return [];

  const used = minutesUsed(day);
  const out: number[] = [];
  for (let mark = every; mark <= used; mark += every) {
    if (!day.nudgedMin.includes(mark)) out.push(mark);
  }
  return out;
}

/**
 * The one thing to say right now, or null.
 *
 * At most one nudge per call, and a threshold always outranks an interval: if
 * the budget just ran out, "that is today's screen time" matters more than
 * "that is ninety minutes" and firing both would be two notifications about
 * the same moment.
 */
export function nextNudge(
  config: GuardConfig,
  day: GuardDay,
  minuteOfDay: number,
): Nudge | null {
  if (!config.enabled) return null;

  const used = minutesUsed(day);
  const budget = budgetSeconds(config);
  const budgetMin = budget > 0 ? Math.round(budget / 60) : null;
  const leftMin = budgetMin === null ? null : Math.max(0, budgetMin - used);
  const fraction = fractionUsed(config, day);

  const make = (kind: NudgeKind, atMin: number): Nudge => ({
    kind,
    atMin,
    usedMin: used,
    leftMin,
    budgetMin,
    suggestion: suggestionFor(day, day.nudgeCount),
  });

  // A curfew is a different message from a spent budget: nothing ran out, it
  // is simply the wrong time of day, and telling a child they used up their
  // minutes when they did not is the kind of small lie they notice.
  if (inCurfew(config.curfew, minuteOfDay) && !day.noticed.includes(-1)) {
    return make('curfew', -1);
  }

  if (config.tier !== 'off' && budgetMin !== null) {
    for (const point of NOTICE_POINTS) {
      if (fraction >= point && !day.noticed.includes(point)) {
        return make(point >= 1 ? 'spent' : 'approaching', Math.round(budgetMin * point));
      }
    }

    // Past the limit, the intervals stop.
    //
    // The temptation is to keep counting, and it is wrong: "that is today's
    // screen time" has already been said, and repeating the point every half
    // hour afterwards is nagging, which teaches a child to turn notifications
    // off and costs the feature every nudge that would have mattered
    // tomorrow. Enforcement past the limit is the tier's job, not the
    // reminder's.
    if (used >= budgetMin) return null;
  }

  const checkpoints = pendingCheckpoints(config, day);
  if (checkpoints.length === 0) return null;

  // Only the most recent. A phone that was in a drawer through four
  // checkpoints owes the child one notification, not four.
  return make('checkpoint', checkpoints[checkpoints.length - 1]);
}

/**
 * Every reminder the rest of the day could need, written out in advance.
 *
 * The reminders matter most while the child is in another app, which is
 * exactly when this module cannot run: the JavaScript engine is asleep and the
 * Android watcher is the only thing awake. So the decisions are all made here,
 * now, and handed down as a flat list of sentences the watcher can post by
 * index without judging anything.
 *
 * Entry `i` is the `(i + 1)`th checkpoint of the day. Absolute rather than
 * relative to what has already been sent, because the watcher counts
 * checkpoints from midnight and the two have to agree on what "the third one"
 * means after the app has been closed and reopened twice.
 */
export function plannedNudges(config: GuardConfig, day: GuardDay, count = 24): Nudge[] {
  const every = Math.round(config.nudgeEveryMin ?? 0);
  if (!config.enabled || every < MIN_INTERVAL_MIN) return [];

  const budget = budgetSeconds(config);
  const budgetMin = config.tier !== 'off' && budget > 0 ? Math.round(budget / 60) : null;

  const out: Nudge[] = [];
  for (let i = 0; i < count; i += 1) {
    const atMin = (i + 1) * every;

    // Past the limit there is nothing left to say, for the same reason
    // `nextNudge` goes quiet there: the point has been made, and making it
    // again every half hour is what teaches a child to swipe these away.
    if (budgetMin !== null && atMin > budgetMin) break;

    const kind: NudgeKind =
      budgetMin === null
        ? 'checkpoint'
        : atMin >= budgetMin
          ? 'spent'
          : atMin >= budgetMin * NOTICE_POINTS[0]
            ? 'approaching'
            : 'checkpoint';

    out.push({
      kind,
      atMin,
      usedMin: atMin,
      leftMin: budgetMin === null ? null : Math.max(0, budgetMin - atMin),
      budgetMin,
      suggestion: suggestionFor(day, i),
    });
  }

  return out;
}

/** Marks an interval checkpoint as delivered, along with any it skipped past. */
export function markNudged(day: GuardDay, upToMin: number, everyMin: number): GuardDay {
  if (everyMin < MIN_INTERVAL_MIN) return day;
  const marks = new Set(day.nudgedMin);
  for (let mark = everyMin; mark <= upToMin; mark += everyMin) marks.add(mark);
  return { ...day, nudgedMin: [...marks].sort((a, b) => a - b) };
}

/**
 * Writes a delivered nudge into the day.
 *
 * Does all three things that have to happen together: marks the checkpoint or
 * the threshold so it cannot fire again, counts it, and remembers when it went
 * out so a mission started soon after can be credited to it. Splitting these
 * across three call sites is how a nudge ends up firing twice.
 */
export function recordNudge(
  day: GuardDay,
  nudge: Nudge,
  at: number,
  everyMin: number,
): GuardDay {
  let next = day;

  if (nudge.kind === 'checkpoint') {
    next = markNudged(next, nudge.atMin, everyMin);
  } else if (nudge.kind === 'curfew') {
    next = next.noticed.includes(-1) ? next : { ...next, noticed: [...next.noticed, -1] };
  } else {
    // A threshold nudge is keyed by its fraction, which is what `budget.ts`
    // already reads, so the two agree about what has been announced.
    const point = nudge.kind === 'spent' ? 1 : 0.75;
    next = next.noticed.includes(point) ? next : { ...next, noticed: [...next.noticed, point] };
    // Crossing a threshold also settles every interval before it, or the child
    // gets "that is ninety minutes" seconds after "that is today's lot".
    if (everyMin >= MIN_INTERVAL_MIN) next = markNudged(next, nudge.usedMin, everyMin);
  }

  return { ...next, nudgeCount: next.nudgeCount + 1, lastNudgeAt: at };
}

/**
 * A mission started. If a nudge is still warm, that nudge worked.
 *
 * Credited at most once per nudge: `lastNudgeAt` is cleared, so a child who
 * does three missions in a row after one reminder counts as one reminder that
 * landed rather than three.
 */
export function creditNudge(day: GuardDay, startedAt: number): GuardDay {
  if (day.lastNudgeAt === null || !wasHeeded(day.lastNudgeAt, startedAt)) return day;
  return { ...day, nudgeHeeded: day.nudgeHeeded + 1, lastNudgeAt: null };
}

/**
 * Which piece of copy a nudge should be written with.
 *
 * Carries the age band as well as the kind, because the three tiers are not
 * translations of one another: `juniorCheckpoint` and `littleCheckpoint` are
 * different sentences with different subjects, and one of them does not
 * mention time at all.
 *
 * Returned as a plain id rather than an i18n key so this module stays free of
 * the app. `lib/screen-nudge.ts` maps the id onto the two keys it needs, and
 * the compiler checks that every id has both.
 */
export type NudgeTier = 'little' | 'junior' | 'teen';

export type NudgeCopyId = `${NudgeTier}${Capitalize<NudgeKind>}`;

export function nudgeTier(band: AgeBand): NudgeTier {
  if (band === '3-5') return 'little';
  if (band === '6-9') return 'junior';
  return 'teen';
}

export function nudgeCopyId(band: AgeBand, nudge: Nudge): NudgeCopyId {
  // Near the end, a checkpoint stops being "here is the time" and becomes a
  // warning, whether or not a threshold happened to land on this minute.
  const kind: NudgeKind =
    nudge.kind === 'checkpoint' &&
    nudge.budgetMin !== null &&
    nudge.usedMin >= nudge.budgetMin * LAST_STRETCH
      ? 'approaching'
      : nudge.kind;
  const suffix = (kind.charAt(0).toUpperCase() + kind.slice(1)) as Capitalize<NudgeKind>;
  return `${nudgeTier(band)}${suffix}`;
}

/**
 * Whether a child acted on a nudge.
 *
 * A mission started within this long of a nudge counts as having worked. The
 * window is generous on purpose: the useful signal is "the notification led
 * somewhere", and a child who reads it, finishes the video they were watching
 * and then opens the app has still been nudged.
 */
export const HEEDED_WINDOW_MS = 15 * 60_000;

export function wasHeeded(nudgeAt: number, missionStartedAt: number): boolean {
  const gap = missionStartedAt - nudgeAt;
  return gap >= 0 && gap <= HEEDED_WINDOW_MS;
}
