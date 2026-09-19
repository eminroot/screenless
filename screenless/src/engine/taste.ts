import type { IdeaVote, Mission, Rating, TaskContent } from '../state/types';

/**
 * What this child actually goes for, worked out with arithmetic.
 *
 * Age decides which missions a child *may* be offered. This decides which of
 * them they are offered first, and it is the difference between an app that
 * hands out age appropriate chores and one that knows who is holding it. A
 * seven year old who lights up at building things and goes quiet at drawing
 * should stop being offered drawing, and no parent should have to configure
 * that.
 *
 * There is no model here and nothing is trained. Every task is broken into
 * plain facets it already declares (its category, its interests, whether it
 * moves the body, whether it needs a grown up, how long it is), each signal
 * the child gives is added to those facets with a weight, and the score for a
 * facet is the weighted average of everything ever said about it, pulled
 * towards zero while the evidence is thin:
 *
 *     taste(f) = sum(weight x value) / (sum(weight) + PRIOR)
 *
 * That last term is the whole trick. It means a single finished mission
 * cannot convince the app of anything, the same number means the same thing
 * whether it came from two missions or two hundred, and there is no threshold
 * to cross and no cold start to handle: everything starts at zero and moves
 * as evidence arrives.
 *
 * Arithmetic rather than a model, on purpose. A parent can be told exactly
 * why their child was offered something, the whole thing runs in under a
 * millisecond on a cheap phone with no network, and nothing about the child
 * is ever sent anywhere to be scored.
 */

/** One plain thing about a task that a child can have an opinion about. */
export type Facet = string;

/**
 * How much each kind of facet counts towards a task's score.
 *
 * Category and interest lead because they are what a child would actually
 * name. Length trails because "long" is rarely the reason anything is liked.
 */
const IMPORTANCE: Record<string, number> = {
  cat: 1,
  interest: 0.9,
  body: 0.8,
  mode: 0.7,
  place: 0.7,
  proof: 0.6,
  tool: 0.6,
  len: 0.5,
};

const DEFAULT_IMPORTANCE = 0.5;

/** Keeps a thin history near zero. Roughly: three ordinary signals to be sure. */
export const PRIOR = 2.5;

/**
 * What each signal is worth.
 *
 * A thumb is worth several finishes because it is the child answering the
 * actual question. Finishing is weak evidence of liking: plenty of missions
 * get finished because they were short. Skipping for want of time says almost
 * nothing about taste, which is why `cantNow` barely registers.
 */
export const WEIGHTS = {
  rating: 3,
  ideaVote: 1.5,
  done: 1,
  boring: 1.6,
  hard: 1.2,
  cantNow: 0.25,
} as const;

/** Each signal older than the last counts for a little less. */
const DECAY = 0.94;

/** Beyond this the oldest signals have decayed into noise anyway. */
const WINDOW = 60;

export type Taste = {
  /** Facet to score, between -1 and 1. Zero means nothing is known. */
  scores: Map<Facet, number>;
  /** Facet to how much evidence stands behind it, in signal weights. */
  evidence: Map<Facet, number>;
  /** Total weight of every signal read, for "is this worth showing yet". */
  sample: number;
  /** How many of those signals were the child saying it outright. */
  spoken: number;
};

export const emptyTaste: Taste = {
  scores: new Map(),
  evidence: new Map(),
  sample: 0,
  spoken: 0,
};

/**
 * The facets of a task, as the task itself already declares them.
 *
 * Only informative ones are emitted. Every task would carry `mode:solo` and
 * `place:any`, so those would be evidence of nothing while diluting the
 * average of everything they touched.
 */
export function facetsOf(task: TaskContent): Facet[] {
  const facets: Facet[] = [`cat:${task.category}`];

  for (const interest of task.interests) facets.push(`interest:${interest}`);

  facets.push(task.minutes < 8 ? 'len:quick' : task.minutes <= 14 ? 'len:medium' : 'len:long');

  const active = task.category === 'move' || task.category === 'outdoor' || task.proof === 'motion';
  facets.push(active ? 'body:active' : 'body:still');

  if (task.mode === 'duo') facets.push('mode:duo');
  if (task.place === 'indoor' || task.place === 'outdoor') facets.push(`place:${task.place}`);
  if (task.proof === 'photo' || task.proof === 'motion') facets.push(`proof:${task.proof}`);
  if (task.tool) facets.push(`tool:${task.tool}`);

  return facets;
}

/** One thing the child said or did, already reduced to facets and a number. */
type Signal = {
  facets: Facet[];
  /** -1 to 1. */
  value: number;
  weight: number;
  /** The child said it outright, rather than the app reading it off behaviour. */
  spoken: boolean;
};

/**
 * Reads the whole history into a taste.
 *
 * Missions and idea votes are merged in time order so the decay treats both
 * the same way: a thumb given this morning should not be outranked by a
 * mission finished last month.
 */
export function readTaste(missions: Mission[], ideaVotes: IdeaVote[] = []): Taste {
  const signals: { at: number; signal: Signal }[] = [];

  for (const mission of missions) {
    const signal = signalOf(mission);
    if (signal) signals.push({ at: stampOf(mission), signal });
  }

  for (const vote of ideaVotes) {
    if (vote.facets.length === 0) continue;
    signals.push({
      at: Date.parse(vote.at) || 0,
      signal: {
        facets: vote.facets,
        value: vote.value,
        weight: WEIGHTS.ideaVote,
        spoken: true,
      },
    });
  }

  signals.sort((a, b) => a.at - b.at);
  const recent = signals.slice(-WINDOW);

  const totals = new Map<Facet, number>();
  const evidence = new Map<Facet, number>();
  let sample = 0;
  let spoken = 0;

  recent.forEach(({ signal }, index) => {
    const weight = signal.weight * DECAY ** (recent.length - 1 - index);
    sample += weight;
    if (signal.spoken) spoken += 1;

    for (const facet of signal.facets) {
      totals.set(facet, (totals.get(facet) ?? 0) + weight * signal.value);
      evidence.set(facet, (evidence.get(facet) ?? 0) + weight);
    }
  });

  const scores = new Map<Facet, number>();
  for (const [facet, total] of totals) {
    scores.set(facet, total / ((evidence.get(facet) ?? 0) + PRIOR));
  }

  return { scores, evidence, sample, spoken };
}

/** A mission as one signal, or null when it has not said anything yet. */
function signalOf(mission: Mission): Signal | null {
  const facets = facetsOf(mission.task);

  // A thumb replaces the behavioural read rather than adding to it. A mission
  // finished and then thumbed down is a mission the child did not enjoy, and
  // counting the finish as well would cancel out what they just told us.
  if (mission.rating) {
    return { facets, value: mission.rating, weight: WEIGHTS.rating, spoken: true };
  }

  if (mission.status === 'done') {
    return { facets, value: 1, weight: WEIGHTS.done, spoken: false };
  }

  if (mission.status === 'skipped') {
    const weight =
      mission.skipReason === 'boring'
        ? WEIGHTS.boring
        : mission.skipReason === 'hard'
          ? WEIGHTS.hard
          : WEIGHTS.cantNow;
    return { facets, value: -1, weight, spoken: false };
  }

  return null;
}

function stampOf(mission: Mission): number {
  const stamp = mission.ratedAt ?? mission.confirmedAt ?? mission.claimedAt ?? mission.assignedAt;
  return Date.parse(stamp ?? '') || 0;
}

/**
 * How well a task matches this child, between -1 and 1.
 *
 * A weighted average rather than a sum, so a task that happens to carry five
 * facets is not automatically preferred to one carrying two. Unknown facets
 * score zero and pull the average towards the middle, which is the right
 * behaviour: a task the app knows nothing about should look ordinary, not
 * good and not bad.
 */
export function affinity(task: TaskContent, taste: Taste): number {
  return affinityOfFacets(facetsOf(task), taste);
}

export function affinityOfFacets(facets: Facet[], taste: Taste): number {
  let total = 0;
  let weight = 0;
  for (const facet of facets) {
    const importance = IMPORTANCE[facet.split(':')[0]] ?? DEFAULT_IMPORTANCE;
    total += (taste.scores.get(facet) ?? 0) * importance;
    weight += importance;
  }
  return weight === 0 ? 0 : total / weight;
}

/**
 * The single facet doing most to make a task look good, so a screen can say
 * why. Null when nothing about the task is known well enough to name.
 */
export function strongestFacet(facets: Facet[], taste: Taste, minimum = 0.12): Facet | null {
  let best: Facet | null = null;
  let bestScore = minimum;
  for (const facet of facets) {
    const score = taste.scores.get(facet) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = facet;
    }
  }
  return best;
}

export type FacetRead = { facet: Facet; score: number; evidence: number };

/**
 * The facets this child is clearest about, strongest first.
 *
 * `kinds` narrows it to the ones a screen has words for: there is no point
 * telling a child they prefer `proof:photo`.
 */
export function rankFacets(
  taste: Taste,
  options: { kinds?: string[]; minEvidence?: number; min?: number } = {},
): FacetRead[] {
  const { kinds, minEvidence = 1.5, min = 0.1 } = options;
  const reads: FacetRead[] = [];

  for (const [facet, score] of taste.scores) {
    if (kinds && !kinds.includes(facet.split(':')[0])) continue;
    const evidence = taste.evidence.get(facet) ?? 0;
    if (evidence < minEvidence || Math.abs(score) < min) continue;
    reads.push({ facet, score, evidence });
  }

  return reads.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
}

/** Facets the child is warm about, strongest first. */
export function likedFacets(taste: Taste, kinds?: string[]): FacetRead[] {
  return rankFacets(taste, { kinds }).filter((read) => read.score > 0);
}

/** Facets the child keeps turning down, coldest first. */
export function coolFacets(taste: Taste, kinds?: string[]): FacetRead[] {
  return rankFacets(taste, { kinds })
    .filter((read) => read.score < 0)
    .sort((a, b) => a.score - b.score);
}

/**
 * Enough of a history to say anything out loud.
 *
 * Below this the screens say they are still watching rather than inventing a
 * personality out of two taps. The scores themselves are used from the very
 * first signal, because the shrinkage already keeps them small.
 */
export const READABLE_SAMPLE = 4;

export function hasReadableTaste(taste: Taste): boolean {
  return taste.sample >= READABLE_SAMPLE;
}

/** The rating a thumb press should store, or null when it undoes the current one. */
export function nextRating(current: Rating | undefined, pressed: Rating): Rating | null {
  return current === pressed ? null : pressed;
}
