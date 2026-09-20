import { LEVEL_THRESHOLDS, levelForStars, MAX_LEVEL } from '../../engine/progress';

/**
 * The shape of the journey map for ages 3 to 5.
 *
 * The map is one tall picture in fixed units, 390 wide, scaled to the screen.
 * It is drawn in seven bands, one place each, camp at the bottom and the launch
 * pad at the top, and a single trail winds up through all of them.
 *
 * Between two places sit stepping stones. They light up as stars come in, so
 * a child who is 12 stars into a 50 star stretch sees one stone lit instead of
 * nothing at all. Waiting weeks for the next place with no visible change is
 * exactly how a four year old decides the map is broken.
 *
 * Pure and free of React Native, so the geometry can be checked in Node.
 */

export type Point = { x: number; y: number };

export const MAP_W = 390;
export const SECTION_H = 440;
export const SECTIONS = MAX_LEVEL;

/** Stones between two places. */
export const STONES_PER_LEG = 5;

/** The places, bottom to top: camp, forest, mountain, ocean, desert, castle, space. */
export const NODES: Point[] = [
  { x: 118, y: 2940 },
  { x: 272, y: 2470 },
  { x: 112, y: 2030 },
  { x: 278, y: 1580 },
  { x: 108, y: 1140 },
  { x: 274, y: 690 },
  { x: 196, y: 200 },
];

/** Where the trail bends on its way between one place and the next. */
const BENDS: Point[][] = [
  [{ x: 262, y: 2842 }, { x: 132, y: 2650 }],
  [{ x: 140, y: 2372 }, { x: 262, y: 2206 }],
  [{ x: 252, y: 1940 }, { x: 126, y: 1760 }],
  [{ x: 150, y: 1486 }, { x: 270, y: 1318 }],
  [{ x: 246, y: 1054 }, { x: 118, y: 874 }],
  [{ x: 136, y: 588 }, { x: 254, y: 382 }],
];

const POINTS: Point[] = NODES.flatMap((node, i) => (i < BENDS.length ? [node, ...BENDS[i]] : [node]));

/** Index into POINTS of each place. */
const NODE_POINT_INDEX = NODES.map((_, i) => i * 3);

type Segment = { p0: Point; c1: Point; c2: Point; p1: Point };

/** Catmull-Rom through every point, as cubic Béziers, so the trail has no corners. */
const SEGMENTS: Segment[] = POINTS.slice(0, -1).map((p0, i) => {
  const prev = POINTS[i - 1] ?? p0;
  const p1 = POINTS[i + 1];
  const next = POINTS[i + 2] ?? p1;
  const smooth = 1 / 6;
  return {
    p0,
    c1: { x: p0.x + (p1.x - prev.x) * smooth, y: p0.y + (p1.y - prev.y) * smooth },
    c2: { x: p1.x - (next.x - p0.x) * smooth, y: p1.y - (next.y - p0.y) * smooth },
    p1,
  };
});

const round1 = (value: number) => Math.round(value * 10) / 10;

/** The whole trail as one SVG path, in map units. */
export const TRAIL_PATH = SEGMENTS.reduce(
  (d, s, i) =>
    `${d}${i === 0 ? `M${round1(s.p0.x)},${round1(s.p0.y)}` : ''} C${round1(s.c1.x)},${round1(s.c1.y)} ${round1(s.c2.x)},${round1(s.c2.y)} ${round1(s.p1.x)},${round1(s.p1.y)}`,
  '',
);

function bezier(s: Segment, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
  };
}

const STEPS = 48;

/** The trail as a dense polyline with running length, for walking along it. */
const SAMPLES: (Point & { at: number })[] = (() => {
  const out: (Point & { at: number })[] = [{ ...SEGMENTS[0].p0, at: 0 }];
  for (const segment of SEGMENTS) {
    for (let step = 1; step <= STEPS; step += 1) {
      const point = bezier(segment, step / STEPS);
      const last = out[out.length - 1];
      out.push({ ...point, at: last.at + Math.hypot(point.x - last.x, point.y - last.y) });
    }
  }
  return out;
})();

export const TRAIL_LENGTH = SAMPLES[SAMPLES.length - 1].at;

/** Distance along the trail of each place. */
const NODE_AT = NODE_POINT_INDEX.map((pointIndex) => SAMPLES[pointIndex * STEPS].at);

export function pointAt(distance: number): Point {
  const target = Math.max(0, Math.min(TRAIL_LENGTH, distance));
  let lo = 0;
  let hi = SAMPLES.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (SAMPLES[mid].at < target) lo = mid;
    else hi = mid;
  }
  const a = SAMPLES[lo];
  const b = SAMPLES[hi];
  const span = b.at - a.at || 1;
  const t = (target - a.at) / span;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export type Stone = Point & { leg: number; index: number };

/** Every stepping stone, leg by leg, bottom to top. */
export const STONES: Stone[] = NODE_AT.slice(0, -1).flatMap((from, leg) => {
  const to = NODE_AT[leg + 1];
  return Array.from({ length: STONES_PER_LEG }, (_, i) => ({
    ...pointAt(from + ((to - from) * (i + 1)) / (STONES_PER_LEG + 1)),
    leg,
    index: i + 1,
  }));
});

export type TrailProgress = {
  /** The place the child has reached, 0 for camp. */
  place: number;
  /** Stones lit on the way to the next place, 0 to STONES_PER_LEG. */
  lit: number;
  /** Stars still needed for the next place, or null at the top. */
  starsToNext: number | null;
  /** Where the buddy stands, in map units. */
  at: Point;
};

/** Reads the map off the star total. Nothing about the map is stored. */
export function trailProgress(stars: number): TrailProgress {
  const level = levelForStars(stars);
  const place = Math.min(level, NODES.length) - 1;

  if (place >= NODES.length - 1) {
    return { place, lit: STONES_PER_LEG, starsToNext: null, at: NODES[NODES.length - 1] };
  }

  const floor = LEVEL_THRESHOLDS[place];
  const ceiling = LEVEL_THRESHOLDS[place + 1];
  const fraction = Math.max(0, Math.min(1, (stars - floor) / (ceiling - floor)));
  const lit = Math.min(STONES_PER_LEG, Math.floor(fraction * (STONES_PER_LEG + 1)));
  const stone = lit > 0 ? STONES.find((s) => s.leg === place && s.index === lit) : undefined;

  return {
    place,
    lit,
    starsToNext: Math.max(0, ceiling - stars),
    at: stone ?? NODES[place],
  };
}

/** How far along the trail the buddy has walked, for colouring the walked part. */
export function walkedDistance(progress: TrailProgress): number {
  if (progress.place >= NODES.length - 1) return TRAIL_LENGTH;
  const from = NODE_AT[progress.place];
  const to = NODE_AT[progress.place + 1];
  return from + ((to - from) * progress.lit) / (STONES_PER_LEG + 1);
}

/** Whether a given stone is lit for this progress. */
export function isStoneLit(stone: Stone, progress: TrailProgress): boolean {
  return stone.leg < progress.place || (stone.leg === progress.place && stone.index <= progress.lit);
}
