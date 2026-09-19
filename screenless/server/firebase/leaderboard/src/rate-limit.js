/**
 * Token buckets, held in memory.
 *
 * Per instance, so ten instances allow ten times the rate. That is still the
 * difference between guessing an invite code in an afternoon and never
 * guessing one, which is the job these do. `maxInstances` in `index.js` is the
 * other half of it.
 */

const LIMITS = {
  /** Availability checks while a parent types. Debounced in the app, so this is generous. */
  check: { capacity: 40, perSecond: 0.5 },
  /**
   * New usernames and renames from one address. Sized for a school evening
   * where a teacher helps a whole class set up on the same wifi.
   */
  claim: { capacity: 30, perSecond: 20 / 3600 },
  /** Invite codes that turned out not to exist, per player. The only thing worth guessing. */
  friend: { capacity: 8, perSecond: 1 / 60 },
  /** Everything else, per address. */
  any: { capacity: 120, perSecond: 2 },
};

function createLimiter(clock = () => Date.now()) {
  const buckets = new Map();

  const refill = (kind, key) => {
    const limit = LIMITS[kind];
    const id = `${kind}:${key}`;
    const now = clock();
    const bucket = buckets.get(id) ?? { tokens: limit.capacity, at: now };
    bucket.tokens = Math.min(limit.capacity, bucket.tokens + ((now - bucket.at) / 1000) * limit.perSecond);
    bucket.at = now;
    buckets.set(id, bucket);
    if (buckets.size > 10_000) sweep(buckets, now);
    return bucket;
  };

  return {
    /** Spends a token. False when there was none to spend. */
    take(kind, key) {
      const bucket = refill(kind, key);
      if (bucket.tokens < 1) return false;
      bucket.tokens -= 1;
      return true;
    },
    /**
     * Whether a token is there, without spending it. Lets an endpoint charge
     * only for the attempts that cost something, such as a wrong invite code.
     */
    peek(kind, key) {
      return refill(kind, key).tokens >= 1;
    },
  };
}

/** Drops buckets idle long enough to have refilled, so memory stays flat. */
function sweep(buckets, now) {
  for (const [id, bucket] of buckets) {
    if (now - bucket.at > 3_600_000) buckets.delete(id);
  }
}

module.exports = { createLimiter, LIMITS };
