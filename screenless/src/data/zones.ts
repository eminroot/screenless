import type { TKey } from '../i18n/shape';
import { LEVEL_THRESHOLDS } from '../engine/progress';
import { palette } from '../theme/tokens';

export const ZONE_IDS = [
  'camp',
  'forest',
  'mountain',
  'ocean',
  'desert',
  'castle',
  'space',
] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export type Zone = {
  id: ZoneId;
  /** The level that opens this place up. Camp is where everyone starts. */
  level: number;
  emoji: string;
  color: string;
  nameKey: TKey;
  blurbKey: TKey;
  /** Position on the island, as a fraction of the map's width and height. */
  x: number;
  y: number;
};

/**
 * The journey across the island.
 *
 * Levels already move with the stars a child earns for real missions, so the
 * map is a picture of that same number rather than a second currency. Nothing
 * here can be reached by using the app more.
 */
export const zones: Zone[] = [
  {
    id: 'camp',
    level: 1,
    emoji: '🏕️',
    color: palette.sun,
    nameKey: 'zones.camp',
    blurbKey: 'zones.campBlurb',
    x: 0.19,
    y: 0.885,
  },
  {
    id: 'forest',
    level: 2,
    emoji: '🌲',
    color: palette.mint,
    nameKey: 'zones.forest',
    blurbKey: 'zones.forestBlurb',
    x: 0.47,
    y: 0.785,
  },
  {
    id: 'mountain',
    level: 3,
    emoji: '🏔️',
    color: palette.clay,
    nameKey: 'zones.mountain',
    blurbKey: 'zones.mountainBlurb',
    x: 0.7,
    y: 0.665,
  },
  {
    id: 'ocean',
    level: 4,
    emoji: '🌊',
    color: palette.sky,
    nameKey: 'zones.ocean',
    blurbKey: 'zones.oceanBlurb',
    x: 0.27,
    y: 0.56,
  },
  {
    id: 'desert',
    level: 5,
    emoji: '🏜️',
    color: palette.sunDeep,
    nameKey: 'zones.desert',
    blurbKey: 'zones.desertBlurb',
    x: 0.56,
    y: 0.45,
  },
  {
    id: 'castle',
    level: 6,
    emoji: '🏰',
    color: palette.bubble,
    nameKey: 'zones.castle',
    blurbKey: 'zones.castleBlurb',
    x: 0.73,
    y: 0.335,
  },
  {
    id: 'space',
    level: 7,
    emoji: '🚀',
    color: palette.grape,
    nameKey: 'zones.space',
    blurbKey: 'zones.spaceBlurb',
    x: 0.44,
    y: 0.18,
  },
];

export const zoneByLevel = new Map(zones.map((zone) => [zone.level, zone]));

/** The furthest place the child has reached. */
export function currentZone(level: number): Zone {
  return zoneByLevel.get(Math.min(level, zones.length)) ?? zones[0];
}

/** Stars still needed to open the next place, or null once the island is done. */
export function starsToNextZone(stars: number, level: number): number | null {
  if (level >= zones.length) return null;
  return Math.max(0, LEVEL_THRESHOLDS[level] - stars);
}
