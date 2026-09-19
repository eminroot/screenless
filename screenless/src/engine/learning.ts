import { partOfDay } from './context';
import { readTaste, type Taste } from './taste';
import type { IdeaVote, InterestId, Mission, PartOfDay, TaskCategory } from '../state/types';

/**
 * What the app has worked out about this child from what they actually did,
 * as opposed to what a parent ticked during setup.
 *
 * Nothing here is stored: it is recomputed from the mission history, so there
 * is no hidden profile that can drift away from the record a parent can read.
 */
export type Learned = {
  /** Roughly -1 to +1 per interest. Above zero means missions here land well. */
  interests: Map<InterestId, number>;
  categories: Map<TaskCategory, number>;
  /** When this child actually finishes things, once there is enough history. */
  bestPartOfDay: PartOfDay | null;
  /**
   * Measured time over estimated time. Under 1 means they finish early, which
   * is the app's cue to offer longer missions.
   */
  pace: number | null;
  /** Confirmed duo missions, used to decide how often to offer another. */
  duoDone: number;
  /** Confirmed missions the read is based on. Under 4 and nothing is applied. */
  sample: number;
  /** The two interests doing best, for the parent's summary. */
  topInterests: InterestId[];
  /** Interests that keep getting skipped. */
  coldInterests: InterestId[];
  /**
   * The finer read, over every facet a task declares rather than only its
   * interests. This is what actually moves the picker; everything above it is
   * the summary a parent is shown.
   */
  taste: Taste;
};

/** Below this the history is noise, so the picker ignores everything learned. */
export const MIN_SAMPLE = 4;

const DONE_WEIGHT = 1;
const BORED_WEIGHT = -1.6;
const HARD_WEIGHT = -1.2;
const CANT_NOW_WEIGHT = -0.25;
/**
 * A thumb, up or down. It replaces the behavioural reading for that mission
 * rather than adding to it, and counts for more than finishing does, because
 * it is the child answering the question instead of the app inferring it.
 */
const RATED_WEIGHT = 2.4;
/** Older missions count for less, so a child is never stuck with last month's taste. */
const DECAY = 0.93;

export function learnFromMissions(missions: Mission[], ideaVotes: IdeaVote[] = []): Learned {
  const interests = new Map<InterestId, number>();
  const categories = new Map<TaskCategory, number>();
  const partCounts = new Map<PartOfDay, number>();

  let duoDone = 0;
  let sample = 0;
  let paceSum = 0;
  let paceCount = 0;

  const recent = missions.slice(-40);

  recent.forEach((mission, index) => {
    const weight = DECAY ** (recent.length - 1 - index);
    let value = 0;

    if (mission.status === 'done') {
      // A thumb says what they thought of it and replaces the reading taken
      // off the fact that they finished; when they did it and how long it
      // took are measurements either way, and are still worth having.
      value = mission.rating ? mission.rating * RATED_WEIGHT : DONE_WEIGHT;
      sample += 1;
      if (mission.task.mode === 'duo') duoDone += 1;

      const part = mission.partOfDay ?? partOfDayOf(mission);
      if (part) partCounts.set(part, (partCounts.get(part) ?? 0) + 1);

      if (mission.durationSec && mission.task.minutes > 0) {
        paceSum += mission.durationSec / (mission.task.minutes * 60);
        paceCount += 1;
      }
    } else if (mission.rating) {
      value = mission.rating * RATED_WEIGHT;
    } else if (mission.status === 'skipped') {
      value =
        mission.skipReason === 'boring'
          ? BORED_WEIGHT
          : mission.skipReason === 'hard'
            ? HARD_WEIGHT
            : CANT_NOW_WEIGHT;
    } else {
      return;
    }

    const scaled = value * weight;
    for (const interest of mission.task.interests) {
      interests.set(interest, (interests.get(interest) ?? 0) + scaled);
    }
    categories.set(mission.task.category, (categories.get(mission.task.category) ?? 0) + scaled);
  });

  normalise(interests);
  normalise(categories);

  const ordered = [...interests.entries()].sort((a, b) => b[1] - a[1]);

  return {
    interests,
    categories,
    bestPartOfDay: sample >= MIN_SAMPLE ? busiest(partCounts) : null,
    pace: paceCount >= 3 ? paceSum / paceCount : null,
    duoDone,
    sample,
    topInterests: ordered.filter(([, v]) => v > 0.15).slice(0, 2).map(([id]) => id),
    coldInterests: ordered.filter(([, v]) => v < -0.2).slice(-2).map(([id]) => id),
    taste: readTaste(missions, ideaVotes),
  };
}

/** Scales the largest magnitude to 1 so the picker's weights stay predictable. */
function normalise<K>(scores: Map<K, number>): void {
  let peak = 0;
  for (const value of scores.values()) peak = Math.max(peak, Math.abs(value));
  if (peak === 0) return;
  for (const [key, value] of scores) scores.set(key, value / peak);
}

function busiest(counts: Map<PartOfDay, number>): PartOfDay | null {
  let best: PartOfDay | null = null;
  let bestCount = 0;
  for (const [part, count] of counts) {
    if (count > bestCount) {
      best = part;
      bestCount = count;
    }
  }
  return best;
}

/** Older missions predate the stored part of day, so it is read off the timestamp. */
function partOfDayOf(mission: Mission): PartOfDay | null {
  const stamp = mission.confirmedAt ?? mission.claimedAt ?? mission.assignedAt;
  if (!stamp) return null;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : partOfDay(date);
}

/**
 * How long the next mission should be, given how fast the child gets through
 * them. Only ever a nudge of a few minutes in either direction.
 */
export function preferredMinutes(learned: Learned, base: number): number {
  if (learned.pace === null || learned.sample < MIN_SAMPLE) return base;
  if (learned.pace < 0.6) return base + 4;
  if (learned.pace > 1.4) return Math.max(5, base - 3);
  return base;
}
