/**
 * Reading the accelerometer for the 6-9 self checks, as pure arithmetic.
 *
 * Imports nothing, like `step-detector.ts` next door, so the thresholds can be
 * driven by synthetic traces in plain Node (`scripts/test-verify.ts`). The
 * hooks that feed real samples live in `verify-sensors.ts`.
 *
 * Three questions, each deliberately modest:
 *
 * 1. **Is the phone lying down and left alone?** That is what "screen free
 *    time" can honestly mean on a phone with no special permissions. A phone
 *    flat on a table is still to within a few thousandths of a g; a phone in a
 *    hand, however steady, is not.
 * 2. **Has there been real movement, and for how long?** Counted in whole
 *    seconds of it, for a ball game or a dance where there is nothing discrete
 *    to count.
 * 3. **Does the movement look like a child or like a machine?** A phone taped
 *    to a fan or shaken in a fist produces a rhythm no child keeps up. That is
 *    reported as odd, which sends the mission to a parent. It never takes
 *    anything away.
 */

export type Sample = { x: number; y: number; z: number };

/* --------------------------------------------------------------- stillness */

/** Window the stillness test looks back over. */
const STILL_WINDOW_MS = 1500;
/** Largest swing on any axis inside the window that still counts as untouched. */
const STILL_SPREAD_G = 0.05;
/** Gravity has to sit on the screen axis: flat, face down or face up. */
const FLAT_G = 0.9;
/** How long it has to stay that way before it counts, so a pause is not a park. */
const SETTLE_MS = 2000;
/** A gap longer than this between samples is not counted, however still. */
const MAX_GAP_MS = 1000;

export type StillnessMeter = {
  /** Feed one reading. Returns whether the phone counts as put down now. */
  push: (sample: Sample, now: number) => boolean;
  parked: () => boolean;
  /** Milliseconds counted as put down since the last reset. */
  parkedMs: () => number;
  /** A touch on the screen. Stops the count until the phone settles again. */
  wake: (now: number) => void;
  reset: () => void;
};

export function createStillnessMeter(): StillnessMeter {
  let window: { at: number; s: Sample }[] = [];
  let stillSince: number | null = null;
  let isParked = false;
  let total = 0;
  let lastAt: number | null = null;

  const reset = () => {
    window = [];
    stillSince = null;
    isParked = false;
    total = 0;
    lastAt = null;
  };

  const push = (sample: Sample, now: number) => {
    const gap = lastAt === null ? 0 : now - lastAt;
    lastAt = now;

    // A long gap means the sensor stopped (the app went to the background).
    // Nothing is known about that time, so the settle starts over.
    if (gap > MAX_GAP_MS) {
      window = [];
      stillSince = null;
      isParked = false;
    }

    window.push({ at: now, s: sample });
    while (window.length > 0 && now - window[0].at > STILL_WINDOW_MS) window.shift();

    const flat = Math.abs(sample.z) >= FLAT_G;
    const full = window.length >= 3 && now - window[0].at >= STILL_WINDOW_MS * 0.6;
    const still = full && spread(window.map((w) => w.s)) < STILL_SPREAD_G;

    if (!flat || !still) {
      stillSince = null;
      isParked = false;
      return false;
    }

    if (stillSince === null) stillSince = now;
    if (!isParked && now - stillSince >= SETTLE_MS) isParked = true;
    else if (isParked && gap <= MAX_GAP_MS) total += gap;

    return isParked;
  };

  const wake = (now: number) => {
    stillSince = now;
    isParked = false;
    window = [];
  };

  return { push, parked: () => isParked, parkedMs: () => total, wake, reset };
}

function spread(samples: Sample[]): number {
  let widest = 0;
  for (const axis of ['x', 'y', 'z'] as const) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of samples) {
      if (s[axis] < lo) lo = s[axis];
      if (s[axis] > hi) hi = s[axis];
    }
    widest = Math.max(widest, hi - lo);
  }
  return widest;
}

/* ---------------------------------------------------------------- activity */

/**
 * Standard deviation of the magnitude over one second, in g, that counts as a
 * child moving. Walking with the phone in a pocket reads about 0.2, dancing
 * well above; a phone in the pocket of a child standing still reads 0.02.
 */
export const ACTIVE_STD_G = 0.12;
const SECOND_MS = 1000;
/** Keeps a very long session from growing the record without limit. */
const MAX_ENERGIES = 3600;

export type ActivityMeter = {
  push: (sample: Sample, now: number) => void;
  /** Whole seconds that felt like movement. */
  activeSec: () => number;
  /** The movement level of each counted second, oldest first. */
  energies: () => number[];
  /** 0 to 1 for the live bar: how hard the last full second moved. */
  level: () => number;
  reset: () => void;
};

export function createActivityMeter(): ActivityMeter {
  let bucket: number[] = [];
  let bucketStart: number | null = null;
  let lastAt: number | null = null;
  let active = 0;
  let record: number[] = [];
  let last = 0;

  const reset = () => {
    bucket = [];
    bucketStart = null;
    lastAt = null;
    active = 0;
    record = [];
    last = 0;
  };

  const push = ({ x, y, z }: Sample, now: number) => {
    // Nothing is known about a gap, so the half-filled second is dropped.
    if (lastAt !== null && now - lastAt > 2 * SECOND_MS) {
      bucket = [];
      bucketStart = null;
    }
    lastAt = now;

    if (bucketStart === null) bucketStart = now;
    bucket.push(Math.sqrt(x * x + y * y + z * z));

    if (now - bucketStart < SECOND_MS) return;

    const energy = bucket.length >= 4 ? deviation(bucket) : 0;
    last = energy;
    if (energy >= ACTIVE_STD_G) {
      active += 1;
      record.push(energy);
      if (record.length > MAX_ENERGIES) record.shift();
    }
    bucket = [];
    bucketStart = now;
  };

  return {
    push,
    activeSec: () => active,
    energies: () => [...record],
    level: () => Math.max(0, Math.min(1, last / 0.6)),
    reset,
  };
}

/** Fewest counted seconds before uniformity means anything. */
const ODD_MIN_SECONDS = 45;
/** A child's movement varies second to second far more than this. */
const ODD_MAX_CV = 0.12;

/**
 * True when counted movement is too even to be a child.
 *
 * Play is bursty: a kick, a run for the ball, a pause. A washing machine or a
 * fan holds one level for minutes. The coefficient of variation separates the
 * two cleanly, and a real child shaking the phone by hand varies enough to
 * pass, which is fine, because that child is moving.
 */
export function activityLooksOdd(energies: number[]): boolean {
  if (energies.length < ODD_MIN_SECONDS) return false;
  return coefficientOfVariation(energies) < ODD_MAX_CV;
}

/* ------------------------------------------------------------------ jumps */

/**
 * Median gap between counted jumps below which it is a shaken phone. A child
 * hopping as fast as they can manages about three a second; a fist shaking a
 * phone runs at the counter's refractory limit, around 260 ms.
 *
 * Evenness is deliberately not judged. The counter samples every 40 ms, and
 * that jitter alone makes a machine look as uneven as a child.
 */
const JUMP_MIN_MEDIAN_MS = 300;

/** True when the jumps came faster than legs manage. */
export function jumpsLookOdd(times: number[]): boolean {
  if (times.length < 6) return false;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i += 1) gaps.push(times[i] - times[i - 1]);
  return median(gaps) < JUMP_MIN_MEDIAN_MS;
}

/* ------------------------------------------------------------------ steps */

/** Walks the step detector abandoned because the phone was being shaken. */
const STEP_MAX_SHAKES = 6;

export function stepsLookOdd(shakes: number): boolean {
  return shakes >= STEP_MAX_SHAKES;
}

/* ---------------------------------------------------------------- helpers */

function deviation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

function coefficientOfVariation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean <= 0) return Infinity;
  return deviation(values) / mean;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
