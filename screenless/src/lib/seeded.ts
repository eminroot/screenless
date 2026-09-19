/**
 * A random number generator that gives the same answers twice.
 *
 * The made for you ideas are built rather than stored, so the only way "the
 * three ideas you had this morning" survives closing the app is for the
 * generator to be a pure function of a seed. Same child, same day, same three
 * ideas; tap for more and the round number moves the seed on.
 *
 * mulberry32, which is about as small as a usable generator gets and needs no
 * dependency. It is not cryptography and is never used as if it were.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, so a name or a date can be turned into a seed. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Picks one item, with items of higher weight picked more often.
 *
 * Weights at or below zero are skipped, and everything being zero returns the
 * first item rather than nothing, so a caller never has to handle null.
 */
export function weightedPick<T>(items: T[], weightOf: (item: T) => number, random: () => number): T {
  let total = 0;
  for (const item of items) total += Math.max(0, weightOf(item));
  if (total <= 0) return items[0];

  let ticket = random() * total;
  for (const item of items) {
    ticket -= Math.max(0, weightOf(item));
    if (ticket <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * Turns a score of any size into a weight that can be sampled from, with
 * `temperature` deciding how strongly the best scores win.
 *
 * Softmax rather than "always take the highest" because a child who likes
 * building should get more building, not only building. The exponent is
 * clamped so one very high score cannot swallow the whole distribution.
 */
export function softmaxWeight(score: number, temperature: number): number {
  return Math.exp(Math.max(-6, Math.min(6, score / Math.max(0.01, temperature))));
}
