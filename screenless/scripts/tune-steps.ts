/**
 * Drives the step detector with synthetic gait traces.
 *
 * Real tuning needs real walks on real phones, and this is not a substitute
 * for that. What it does do is pin the failures that matter and stop a tidy
 * looking refactor quietly halving the count: an ordinary walk has to land
 * close, and a shaken phone, a phone on a table and a car ride all have to
 * score nothing.
 *
 *   node -r sucrase/register scripts/tune-steps.ts          check the defaults
 *   node -r sucrase/register scripts/tune-steps.ts --sweep  search for better
 */
import {
  createStepDetector,
  defaultTuning,
  SAMPLE_MS,
  type StepSample,
  type Tuning,
} from '../src/lib/step-detector';

/* ------------------------------------------------------------------ traces */

/** Repeatable pseudo-noise, so a sweep compares like with like. */
let seed = 12345;
function random(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function noise(scale: number): number {
  return (random() + random() + random() - 1.5) * scale;
}

/**
 * A walk. Each step is a vertical impulse, and the body also rocks side to
 * side at half the step rate, which is the component that makes naive
 * counters double count.
 */
function walk(steps: number, stepsPerMinute: number, amplitude: number, jitter = 0.08): StepSample[] {
  const period = 60_000 / stepsPerMinute;
  const out: StepSample[] = [];
  let phase = 0;

  for (let t = 0; t < steps * period; t += SAMPLE_MS) {
    // Phase advances per sample so jitter perturbs the rhythm rather than
    // stretching the whole trace.
    phase += (2 * Math.PI * SAMPLE_MS) / (period * (1 + noise(jitter)));
    const vertical = amplitude * Math.sin(phase);
    const rock = amplitude * 0.35 * Math.sin(phase / 2);

    out.push({
      x: rock + noise(0.02),
      y: 1 + vertical + noise(0.02), // gravity on y, phone upright in a pocket
      z: rock * 0.5 + noise(0.02),
    });
  }
  return out;
}

/** A phone being shaken to farm coins: fast, hard and irregular. */
function shake(seconds: number): StepSample[] {
  const out: StepSample[] = [];
  let phase = 0;
  for (let t = 0; t < seconds * 1000; t += SAMPLE_MS) {
    phase += (2 * Math.PI * SAMPLE_MS) / (145 + noise(50)); // ~7 Hz
    out.push({
      x: 0.9 * Math.sin(phase) + noise(0.2),
      y: 1 + 0.9 * Math.sin(phase * 1.3) + noise(0.2),
      z: 0.6 * Math.cos(phase) + noise(0.2),
    });
  }
  return out;
}

/** A phone lying on a table. */
function still(seconds: number): StepSample[] {
  const out: StepSample[] = [];
  for (let t = 0; t < seconds * 1000; t += SAMPLE_MS) {
    out.push({ x: noise(0.004), y: 1 + noise(0.004), z: noise(0.004) });
  }
  return out;
}

/** Sitting in a car: slow sway and road buzz, no gait. */
function car(seconds: number): StepSample[] {
  const out: StepSample[] = [];
  for (let t = 0; t < seconds * 1000; t += SAMPLE_MS) {
    const sway = 0.06 * Math.sin((2 * Math.PI * t) / 3000);
    out.push({ x: sway + noise(0.03), y: 1 + noise(0.05), z: sway * 0.5 + noise(0.03) });
  }
  return out;
}

/** Three bursts at different speeds with pauses, as a child actually moves. */
function mixedPace(): StepSample[] {
  return [
    ...walk(40, 95, 0.3, 0.15),
    ...still(3),
    ...walk(40, 130, 0.45, 0.15),
    ...still(2),
    ...walk(40, 85, 0.25, 0.15),
  ];
}

type Trace = { name: string; samples: StepSample[]; expected: number; tolerance: number };

function fixtures(): Trace[] {
  seed = 12345; // same noise every run
  return [
    { name: 'slow amble, 40 @ 80 spm', samples: walk(40, 80, 0.22), expected: 40, tolerance: 0.2 },
    { name: 'normal walk, 100 @ 110 spm', samples: walk(100, 110, 0.35), expected: 100, tolerance: 0.12 },
    { name: 'brisk walk, 200 @ 130 spm', samples: walk(200, 130, 0.5), expected: 200, tolerance: 0.12 },
    { name: 'running, 100 @ 170 spm', samples: walk(100, 170, 0.9), expected: 100, tolerance: 0.15 },
    { name: 'loose in pocket, 100 @ 110 spm', samples: walk(100, 110, 0.7, 0.18), expected: 100, tolerance: 0.2 },
    { name: 'held gently, 100 @ 110 spm', samples: walk(100, 110, 0.14), expected: 100, tolerance: 0.25 },
    // A child does not walk like an adult. They dawdle, speed up, stop to look
    // at things. Over-tightening the regularity gate to beat the shake trace
    // quietly destroys this one, which matters far more.
    { name: 'dawdling child, 100 @ 105 spm', samples: walk(100, 105, 0.3, 0.3), expected: 100, tolerance: 0.25 },
    { name: 'pace changes, 120 mixed', samples: mixedPace(), expected: 120, tolerance: 0.25 },
    { name: 'CHEAT: shaking, 30 s', samples: shake(30), expected: 0, tolerance: 0 },
    { name: 'still on a table, 60 s', samples: still(60), expected: 0, tolerance: 0 },
    { name: 'sitting in a car, 60 s', samples: car(60), expected: 0, tolerance: 0 },
  ];
}

/* ------------------------------------------------------------------- runner */

function count(samples: StepSample[], tuning: Tuning): number {
  const detector = createStepDetector(tuning);
  let total = 0;
  let clock = 0;
  for (const sample of samples) {
    total += detector.push(sample, clock);
    clock += SAMPLE_MS;
  }
  return total;
}

/** Lower is better. Cheat traces are weighted hard: a false step is worse. */
function score(traces: Trace[], tuning: Tuning): number {
  let total = 0;
  for (const trace of traces) {
    const counted = count(trace.samples, tuning);
    if (trace.expected === 0) total += counted * 4;
    else total += (Math.abs(counted - trace.expected) / trace.expected) * 100;
  }
  return total;
}

function report(traces: Trace[], tuning: Tuning): boolean {
  let failures = 0;
  console.log('');
  console.log('  trace                              expected  counted    error');
  console.log('  ' + '-'.repeat(64));

  for (const trace of traces) {
    const counted = count(trace.samples, tuning);
    const allowed = Math.max(3, Math.round(trace.expected * trace.tolerance));
    const error = counted - trace.expected;
    const ok = Math.abs(error) <= allowed;
    if (!ok) failures += 1;

    const pct = trace.expected > 0 ? ` (${((error / trace.expected) * 100).toFixed(1)}%)` : '';
    console.log(
      '  ' +
        trace.name.padEnd(35) +
        String(trace.expected).padStart(6) +
        String(counted).padStart(9) +
        (error >= 0 ? '+' : '') +
        String(error).padStart(5) +
        pct.padEnd(10) +
        (ok ? '  ok' : '  FAIL'),
    );
  }

  console.log('');
  console.log(failures === 0 ? '  all traces within tolerance' : `  ${failures} trace(s) out of tolerance`);
  console.log('');
  return failures === 0;
}

/* -------------------------------------------------------------------- sweep */

const GRID: Partial<Record<keyof Tuning, number[]>> = {
  alphaSlow: [0.015, 0.03, 0.05, 0.08],
  alphaFast: [0.25, 0.35, 0.45],
  minAmplitude: [0.05, 0.07, 0.1],
  envelopeFollow: [0.006, 0.012, 0.025, 0.05],
  hysteresis: [0.12, 0.18, 0.22, 0.3],
  minIntervalMs: [220, 260, 300],
  rhythmLow: [0.45, 0.6, 0.7],
  rhythmHigh: [1.4, 1.7, 2.2],
  maxRhythmCv: [0.15, 0.2, 0.25, 0.3],
  warmupSteps: [6, 8],
};

function sweep(traces: Trace[]): void {
  let best = { ...defaultTuning };
  let bestScore = score(traces, best);
  console.log(`\n  starting score ${bestScore.toFixed(1)} (lower is better)\n`);

  // Coordinate descent: cheap, and good enough for six loosely coupled knobs.
  for (let pass = 0; pass < 3; pass += 1) {
    for (const [key, values] of Object.entries(GRID) as [keyof Tuning, number[]][]) {
      for (const value of values) {
        const candidate = { ...best, [key]: value };
        const candidateScore = score(traces, candidate);
        if (candidateScore < bestScore - 0.001) {
          bestScore = candidateScore;
          best = candidate;
          console.log(`  ${key} = ${value}  ->  ${candidateScore.toFixed(1)}`);
        }
      }
    }
  }

  console.log(`\n  best score ${bestScore.toFixed(1)}`);
  console.log('  tuning:', JSON.stringify(best, null, 2).replace(/\n/g, '\n  '));
  report(traces, best);
}

const traces = fixtures();
if (process.argv.includes('--sweep')) {
  sweep(traces);
} else {
  process.exit(report(traces, defaultTuning) ? 0 : 1);
}
