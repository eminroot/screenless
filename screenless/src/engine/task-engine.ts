import { taskLibrary } from '../data/tasks';
import { partsFor, placeFor, type MissionContext } from './context';
import { MIN_SAMPLE, type Learned } from './learning';
import { affinity } from './taste';
import { tallyReady } from './verify';
import type { ChildProfile, Mission, TaskCategory, TaskContent } from '../state/types';

/** How many recent missions are considered "too soon to repeat". */
const RECENT_WINDOW = 14;
/** How many recent missions shape the category balance. */
const CATEGORY_WINDOW = 5;

/**
 * How long a kind of mission may go unoffered before it is pulled back in.
 *
 * A thumbs down is meant to thin a kind of mission, never to delete it: a
 * child who says no to moving about should still be sent outside now and
 * then, or the app has quietly agreed with them. Taste alone cannot promise
 * that. Enough thumbs plus an unlucky library and a category drops to nothing,
 * which is what `test-spark.ts` watches for and what this holds up.
 *
 * Thirty missions is about a month of them, so this is a floor rather than a
 * second opinion: it does nothing at all to a child who is being offered a bit
 * of everything, and the pull is no larger than the interests a parent ticked
 * at setup, so a thumbs down still decides how often a kind of mission comes
 * round. All it settles is that the answer is never never.
 */
const STARVED_WINDOW = 30;
const STARVED_PULL = 8;

/**
 * How hard taste pulls the pick, against the interests a parent ticked at
 * setup (worth 6 to 10 points here).
 *
 * Deliberately the same order of magnitude rather than larger. Taste should
 * be able to outweigh a box ticked once by a parent months ago, and should
 * not be able to outweigh it *plus* the time of day plus the length the child
 * asked for. A child who loves building still gets sent outside.
 */
const TASTE_PULL = 9;

type Options = {
  /** Push towards a category the child has not done lately. */
  favourVariety?: boolean;
  /** Never return this task, used when swapping the current one out. */
  exclude?: string[];
  /** Clock, calendar and the two taps on the home screen. */
  context?: MissionContext;
  /** What the mission history says about this child. */
  learned?: Learned;
  /** Missions needing a grown up are only offered when one is available. */
  allowDuo?: boolean;
  /** Treasure badge missions are only offered once a parent has printed the sheet. */
  badgesReady?: boolean;
};

/**
 * Picks the next mission from the library.
 *
 * The selection is rule based on purpose: a parent can look at the library and
 * know exactly what their child may be asked to do, which a generated list
 * cannot promise. Everything the app learns only moves the weights around
 * inside that fixed list.
 */
export function pickTask(
  profile: ChildProfile,
  missions: Mission[],
  options: Options = {},
): TaskContent {
  const { context, learned, allowDuo = true, badgesReady = false } = options;

  const pool = taskLibrary.filter(
    (task) =>
      task.ageBands.includes(profile.ageBand) &&
      !(options.exclude ?? []).includes(task.id) &&
      (allowDuo || task.mode !== 'duo') &&
      (badgesReady || task.needs !== 'badges') &&
      // A week long team goal is only offered once the week has earned it.
      tallyReady(task, missions),
  );
  if (pool.length === 0) return taskLibrary[0];

  const history = missions.slice(-RECENT_WINDOW);
  const recentIds = new Set(history.map((m) => m.task.id));
  const recentCategories = missions
    .slice(-CATEGORY_WINDOW)
    .map((m) => m.task.category as TaskCategory);
  // Kinds of mission that have not come up in a long time, once there is a
  // long time to look back over. Below that everything is starved and the
  // pull would mean nothing.
  const starved = new Set<TaskCategory>();
  if (missions.length >= STARVED_WINDOW) {
    const seen = new Set(missions.slice(-STARVED_WINDOW).map((m) => m.task.category));
    for (const task of pool) {
      if (!seen.has(task.category)) starved.add(task.category);
    }
  }

  const skipCounts = new Map<string, number>();
  const boredCounts = new Map<string, number>();
  for (const mission of missions) {
    if (mission.status !== 'skipped') continue;
    skipCounts.set(mission.task.id, (skipCounts.get(mission.task.id) ?? 0) + 1);
    if (mission.skipReason === 'boring' || mission.skipReason === 'hard') {
      boredCounts.set(mission.task.id, (boredCounts.get(mission.task.id) ?? 0) + 1);
    }
  }

  // A short history is mostly noise, so nothing learned is applied until there
  // is enough of it to mean something.
  const trusted = learned && learned.sample >= MIN_SAMPLE ? learned : null;

  let best: TaskContent = pool[0];
  let bestScore = -Infinity;

  for (const task of pool) {
    let score = 0;

    const matches = task.interests.filter((i) => profile.interests.includes(i)).length;
    if (matches > 0) score += 6 + matches * 2;
    // Interest free tasks stay in play so a child is not boxed into six ideas.
    else if (task.interests.length === 0) score += 3;

    if (recentIds.has(task.id)) score -= 14;

    const repeats = recentCategories.filter((c) => c === task.category).length;
    score -= repeats * (options.favourVariety ? 4 : 2);

    // Thinned, not deleted.
    if (starved.has(task.category)) score += STARVED_PULL;

    score -= (skipCounts.get(task.id) ?? 0) * 4;
    score -= (boredCounts.get(task.id) ?? 0) * 6;

    // Taste is applied from the very first signal, without waiting for the
    // sample above. It does not need a threshold: its own shrinkage keeps an
    // opinion built on one mission close to zero, so this term simply starts
    // small and grows as the child says more.
    if (learned) score += affinity(task, learned.taste) * TASTE_PULL;

    if (trusted) {
      for (const interest of task.interests) {
        score += (trusted.interests.get(interest) ?? 0) * 5;
      }
      score += (trusted.categories.get(task.category) ?? 0) * 3;
      // Duo missions are the point of the app, but three in a row is a chore
      // for the parent, so they thin out once the habit is clearly there.
      if (task.mode === 'duo' && trusted.duoDone > 4) score -= 3;
    }

    if (context) {
      const { parts, declared } = partsFor(task.category, task.partsOfDay);
      if (parts.includes(context.partOfDay)) score += 5;
      else if (declared) score -= 7;

      if (context.weekend && task.minutes >= 12) score += 3;
      if (context.indoorOnly && placeFor(task.category, task.place) === 'outdoor') score -= 40;
      if (context.maxMinutes !== null) {
        if (task.minutes > context.maxMinutes) score -= 40;
        // Inside the limit, closer to it is a better use of the time.
        else score += 4 - (context.maxMinutes - task.minutes) * 0.3;
      }
      // Duo missions land best when a parent is likely to be around.
      if (task.mode === 'duo' && (context.partOfDay === 'evening' || context.weekend)) score += 4;
      if (task.mode === 'duo' && context.partOfDay === 'morning') score -= 3;
    }

    // A little noise so the same profile does not see the same order every day.
    score += Math.random() * 3;

    if (score > bestScore) {
      bestScore = score;
      best = task;
    }
  }

  return best;
}

/** Every library task the child could currently be given, for the parent view. */
export function eligibleTasks(profile: ChildProfile): TaskContent[] {
  return taskLibrary.filter((task) => task.ageBands.includes(profile.ageBand));
}
