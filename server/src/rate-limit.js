'use strict';

/**
 * Token buckets, held in memory.
 *
 * Per process. The hub runs as a single systemd unit on one box, so that is
 * the whole picture; if it is ever put behind more than one worker these
 * numbers divide, and the two that matter (`signin` and `pair`) are set low
 * enough that even a tenfold loosening leaves them doing their job.
 *
 * Two of these guard something real rather than just politeness:
 *
 *   signin   password attempts against one address. The only endpoint where
 *            guessing repeatedly is worth an attacker's time.
 *   pair     wrong pairing codes from one address. A six character code out of
 *            an alphabet of 28 is about 31 bits, which is comfortable only for
 *            as long as nobody is allowed to sit there trying them.
 */

const LIMITS = {
  /** Registrations from one address. A family sets up once; a script does not. */
  signup: { capacity: 5, perSecond: 5 / 3600 },
  /** Password attempts. Twelve, then one back every half minute. */
  signin: { capacity: 12, perSecond: 1 / 30 },
  /** Pairing attempts that were wrong. Correct ones are not charged. */
  pair: { capacity: 10, perSecond: 1 / 60 },
  /** Report uploads from one device. A phone syncing every ten minutes uses six an hour. */
  report: { capacity: 60, perSecond: 1 / 30 },
  /** Everything else, per address. */
  any: { capacity: 240, perSecond: 4 },
};

function createLimiter(clock = () => Date.now()) {
  const buckets = new Map();

  const refill = (kind, key) => {
    const limit = LIMITS[kind] || LIMITS.any;
    const id = kind + ':' + key;
    const now = clock();
    const bucket = buckets.get(id) || { tokens: limit.capacity, at: now };
    bucket.tokens = Math.min(
      limit.capacity,
      bucket.tokens + ((now - bucket.at) / 1000) * limit.perSecond,
    );
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
     * only for the attempts that cost something, such as a wrong code.
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
