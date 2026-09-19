/**
 * Counting real walking off the accelerometer, as pure arithmetic.
 *
 * Deliberately imports nothing. The algorithm is the part worth testing, and a
 * file with no React and no sensor in it can be driven by a recorded trace in
 * plain Node, which is the only honest way to pick the numbers below.
 * `pedometer.ts` wraps this in the hook that feeds it real samples.
 *
 * The phone has a proper hardware step counter and this does not use it: on
 * Android that sensor needs `ACTIVITY_RECOGNITION`, which is a dangerous
 * permission, sits in `blockedPermissions`, and is one of the strings
 * `scripts/check-release.mjs` fails the build over. The plain accelerometer
 * needs no permission at all, so the whole feature costs a child nothing.
 *
 * The trade is accuracy. A hardware counter is calibrated per device and runs
 * in the background for free. This runs only while the walk screen is open,
 * which is good enough for a game where the number buys cartoon coins.
 *
 * The pipeline, which is the standard one:
 *
 *   magnitude -> smooth -> subtract slow mean (gravity and posture)
 *   -> adaptive threshold from an envelope that follows the signal
 *   -> falling edge through a hysteresis band, with a refractory gap
 *   -> cadence gate before anything is committed
 *
 * The cadence gate is what makes the number trustworthy. A child who shakes
 * the phone to farm coins produces intervals far too short and far too
 * irregular to pass it, so shaking earns almost nothing and walking earns
 * everything.
 */

/** 50 Hz. Walking is 1.3 to 2.8 Hz, so this is well clear of aliasing. */
export const SAMPLE_MS = 20;

/**
 * Intervals needed before regularity is judged. `warmupSteps` must stay above
 * this, or the warmup banks its steps before the rhythm is ever checked.
 */
const RHYTHM_SAMPLES = 4;

export type Tuning = {
  /** Tracks gravity and posture. Subtracted to leave the movement. */
  alphaSlow: number;
  /** Smooths the magnitude. Too much and real peaks get rounded off. */
  alphaFast: number;
  /** Peak to peak below this is a phone sitting still, not a child walking. */
  minAmplitude: number;
  /**
   * How fast the envelope closes back onto the signal. It follows the signal
   * rather than decaying to zero, so the threshold stays meaningful through
   * the long quiet part of a slow stride.
   */
  envelopeFollow: number;
  /** Fraction of the envelope the signal must swing through to cross. */
  hysteresis: number;
  /** Below this a crossing is too fast to be a step. */
  minIntervalMs: number;
  /** Above this the walk has stopped. */
  maxIntervalMs: number;
  /** Consecutive good candidates before any of them count. */
  warmupSteps: number;
  /** Back to back too-fast rejections before the walk is abandoned. */
  maxTooFastRun: number;
  /** Once walking, how far a step may stray from the established rhythm. */
  rhythmLow: number;
  rhythmHigh: number;
  /**
   * Ceiling on how ragged the rhythm may be, as standard deviation over mean
   * of the recent intervals.
   *
   * This is the gate that separates walking from a shaken phone. A child
   * walking holds a rhythm to within a few percent even when dawdling; a phone
   * being waved about does not hold one at all. Amplitude cannot do this job,
   * because running is louder than shaking.
   */
  maxRhythmCv: number;
};

/**
 * Picked by sweeping `scripts/tune-steps.ts` over synthetic gait traces, then
 * checked against the fixtures in that file. Change them there, not here.
 */
export const defaultTuning: Tuning = {
  alphaSlow: 0.015,
  alphaFast: 0.25,
  minAmplitude: 0.07,
  envelopeFollow: 0.006,
  hysteresis: 0.3,
  minIntervalMs: 220,
  maxIntervalMs: 2000,
  warmupSteps: 8,
  maxTooFastRun: 3,
  rhythmLow: 0.7,
  rhythmHigh: 1.4,
  maxRhythmCv: 0.15,
};

export type StepSample = { x: number; y: number; z: number };

export type StepDetector = {
  /** Feed one reading. Returns how many steps to add, usually 0. */
  push: (sample: StepSample, now: number) => number;
  /** Steps a minute over the recent window, or 0 when not walking. */
  cadence: () => number;
  /** True once the cadence gate has opened. */
  walking: () => boolean;
  /** 0 to 1, how hard the phone is moving. Drives the live ring. */
  intensity: () => number;
  /**
   * Walks abandoned because crossings came too fast to be steps, which is
   * what a shaken phone produces. Read by the 6-9 self check; the count here
   * changes nothing about what is counted.
   */
  shakes: () => number;
  reset: () => void;
};

export function createStepDetector(tuning: Tuning = defaultTuning): StepDetector {
  const t = tuning;

  let slow = 1; // a phone at rest reads 1g
  let fast = 1;
  let signal = 0;
  let high = 0;
  let low = 0;
  let armed = false;

  let lastStepAt = 0;
  let pending = 0;
  let tooFastRun = 0;
  let shakes = 0;
  let confirmed = false;
  const intervals: number[] = [];

  /** Drops back to warmup. Never touches the caller's running total. */
  const endWalk = () => {
    confirmed = false;
    pending = 0;
    tooFastRun = 0;
    intervals.length = 0;
  };

  const reset = () => {
    slow = 1;
    fast = 1;
    signal = 0;
    high = 0;
    low = 0;
    armed = false;
    lastStepAt = 0;
    shakes = 0;
    endWalk();
  };

  const push = ({ x, y, z }: StepSample, now: number): number => {
    // Magnitude rather than any single axis, so it makes no difference whether
    // the phone is in a pocket, a hand, upside down or in a backpack.
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    fast += t.alphaFast * (magnitude - fast);
    slow += t.alphaSlow * (magnitude - slow);
    signal = fast - slow;

    // The envelope follows the signal instead of decaying towards zero. The
    // decaying version collapsed during the quiet half of a slow stride and
    // took the threshold with it, which cost most of a slow walk.
    high = signal > high ? signal : high - (high - signal) * t.envelopeFollow;
    low = signal < low ? signal : low + (signal - low) * t.envelopeFollow;

    const amplitude = high - low;
    if (amplitude < t.minAmplitude) {
      if (confirmed && now - lastStepAt > t.maxIntervalMs) endWalk();
      armed = false;
      return 0;
    }

    // Hysteresis rather than a bare threshold. A signal hovering around the
    // midline would otherwise cross it several times per stride, and every one
    // of those chatter crossings ate a real step.
    const mid = (high + low) / 2;
    const band = amplitude * t.hysteresis;

    if (signal > mid + band) {
      armed = true;
      return 0;
    }
    if (!armed || signal > mid - band) return 0;

    // One clean falling edge through the band: a candidate step.
    armed = false;

    if (lastStepAt === 0) {
      lastStepAt = now;
      pending = 1;
      return 0;
    }

    const since = now - lastStepAt;

    if (since < t.minIntervalMs) {
      // Too fast to be a step. This deliberately leaves the timing anchor
      // alone, because letting a rejected crossing reset the clock made the
      // next real step measure from the wrong place and the rejections
      // cascaded. On its own that lets a steady shake through, since every
      // other cycle clears the gap, so a run of rejections ends the walk.
      tooFastRun += 1;
      if (tooFastRun >= t.maxTooFastRun) {
        shakes += 1;
        endWalk();
        lastStepAt = 0;
      }
      return 0;
    }
    tooFastRun = 0;

    if (since > t.maxIntervalMs) {
      endWalk();
      lastStepAt = now;
      pending = 1;
      return 0;
    }

    // Once walking, a step also has to keep roughly to the established rhythm.
    // This is the part a shaken phone cannot fake: its intervals are erratic.
    if (confirmed && intervals.length >= 3) {
      const typical = median(intervals);
      if (since < typical * t.rhythmLow || since > typical * t.rhythmHigh) {
        endWalk();
        lastStepAt = now;
        pending = 1;
        return 0;
      }
    }

    lastStepAt = now;
    intervals.push(since);
    if (intervals.length > 8) intervals.shift();

    // Regularity, once there is enough to judge it by. This has to sit before
    // the warmup commits, or a ragged burst banks a whole warmup's worth of
    // steps on its way to being rejected, which is exactly how a shaken phone
    // used to earn anything at all.
    if (intervals.length >= RHYTHM_SAMPLES && coefficientOfVariation(intervals) > t.maxRhythmCv) {
      endWalk();
      lastStepAt = now;
      pending = 1;
      return 0;
    }

    if (confirmed) return 1;

    pending += 1;
    if (pending < t.warmupSteps) return 0;

    // Warmup is over, so everything held back counts now. Holding them rather
    // than dropping them means a child never loses the start of a walk.
    confirmed = true;
    const committed = pending;
    pending = 0;
    return committed;
  };

  const cadence = () => {
    if (!confirmed || intervals.length === 0) return 0;
    const mean = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
    return mean > 0 ? Math.round(60_000 / mean) : 0;
  };

  return {
    push,
    cadence,
    walking: () => confirmed,
    intensity: () => Math.max(0, Math.min(1, (high - low) / 1.2)),
    shakes: () => shakes,
    reset,
  };
}

function coefficientOfVariation(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean <= 0) return Infinity;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
