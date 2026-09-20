import type { RealReward } from '../state/types';

/**
 * Real life rewards.
 *
 * The app never decides that a child has earned something. It counts stars,
 * says when a number the parent chose has been reached, and waits. Handing the
 * reward over and ticking it off are both the parent's move.
 */

export const MIN_REWARD_STARS = 20;
export const MAX_REWARD_STARS = 2000;
export const REWARD_STAR_STEP = 10;
/** Enough for a term's worth of promises without turning the app into a shop. */
export const MAX_REAL_REWARDS = 8;
export const MAX_REWARD_LABEL = 40;

/** Star targets offered as one tap presets when a parent adds a reward. */
export const REWARD_PRESET_STARS = [50, 100, 150, 250] as const;

/** Everyday things parents actually promise, kept small and non commercial. */
export const REWARD_EMOJI = [
  '🍦',
  '🧸',
  '⚽',
  '🎨',
  '🚲',
  '🍕',
  '🎬',
  '🏊',
  '📚',
  '🎡',
  '🧁',
  '🎁',
] as const;

export type RealRewardState = 'locked' | 'ready' | 'given';

export function rewardState(reward: RealReward, stars: number): RealRewardState {
  if (reward.givenAt) return 'given';
  return stars >= reward.stars ? 'ready' : 'locked';
}

/** Lowest target first, so the child always reads the nearest promise first. */
export function sortRewards(rewards: RealReward[]): RealReward[] {
  return [...rewards].sort((a, b) => a.stars - b.stars);
}

/** Reached but not handed over yet. These are what the parent is nudged about. */
export function readyRewards(rewards: RealReward[], stars: number): RealReward[] {
  return sortRewards(rewards).filter((r) => rewardState(r, stars) === 'ready');
}

/** The next promise still out of reach, or null once they are all reached. */
export function nextReward(rewards: RealReward[], stars: number): RealReward | null {
  return sortRewards(rewards).find((r) => rewardState(r, stars) === 'locked') ?? null;
}

/**
 * Rewards crossed by a single confirmed mission. Used once, to tell the child
 * on the celebration screen. Anything already given is left out, so a parent
 * who ticks a reward off early does not get the announcement twice.
 */
export function rewardsCrossed(
  rewards: RealReward[],
  starsBefore: number,
  starsAfter: number,
): RealReward[] {
  return sortRewards(rewards).filter(
    (r) => !r.givenAt && r.stars > starsBefore && r.stars <= starsAfter,
  );
}

/** 0 to 1 towards a reward, for the bar on the goal card. */
export function rewardProgress(reward: RealReward, stars: number): number {
  if (reward.stars <= 0) return 1;
  return Math.min(1, Math.max(0, stars / reward.stars));
}

export function starsLeft(reward: RealReward, stars: number): number {
  return Math.max(0, reward.stars - stars);
}

/**
 * What to keep of the promises the hub is holding.
 *
 * The two ends do not agree about size and they do not have to. The hub stores
 * up to twenty rewards with any star target and a sixty character label,
 * because those are the widest values worth keeping; this app is built for
 * `MAX_REAL_REWARDS`, its own star range and shorter text. This end is the one
 * that cannot renegotiate, so it cuts things down rather than trusting the
 * wire and overflowing a card in front of a child.
 *
 * `room` is what is left after the promises a grown up typed on this phone,
 * which are kept in full: someone stood here behind the PIN and entered them.
 *
 * Outstanding promises are kept ahead of handed-over ones, then the nearest
 * first. What is still to be earned is the whole point of the card, and a
 * term of already-given rewards should not push it off the bottom.
 */
export function acceptFromHub(rewards: RealReward[], room: number): RealReward[] {
  if (room <= 0) return [];
  return [...rewards]
    .map((reward) => ({
      ...reward,
      stars: clampRewardStars(reward.stars),
      label: reward.label.slice(0, MAX_REWARD_LABEL),
      origin: 'hub' as const,
    }))
    .sort(
      (a, b) => Number(Boolean(a.givenAt)) - Number(Boolean(b.givenAt)) || a.stars - b.stars,
    )
    .slice(0, room);
}

/** Rounds a typed or stepped target into range and onto the step. */
export function clampRewardStars(value: number): number {
  const rounded = Math.round(value / REWARD_STAR_STEP) * REWARD_STAR_STEP;
  return Math.min(MAX_REWARD_STARS, Math.max(MIN_REWARD_STARS, rounded));
}
