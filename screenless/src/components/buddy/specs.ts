import type { BuddyId, InterestId } from '../../state/types';

export type BuddySpec = {
  id: BuddyId;
  /** Main body fill. */
  body: string;
  /** Belly, muzzle and inner ear fill. */
  light: string;
  /** Ear insides, tail tip and other secondary marks. */
  accent: string;
  /** Darker body tone, used for the shading under the head and body. */
  shade: string;
  /** Interests this buddy is nudged towards during the suggestion step. */
  affinity: InterestId[];
};

export const INK = '#2A2118';

export const buddySpecs: Record<BuddyId, BuddySpec> = {
  fox: {
    id: 'fox',
    body: '#FF8A47',
    light: '#FFEBD8',
    accent: '#FFB27A',
    shade: '#E86E2C',
    affinity: ['football', 'bike', 'nature'],
  },
  robot: {
    id: 'robot',
    body: '#5BB4F0',
    light: '#E2F1FF',
    accent: '#9BD4FF',
    shade: '#3A93D0',
    affinity: ['science', 'building', 'space'],
  },
  cat: {
    id: 'cat',
    body: '#B79BFF',
    light: '#F1EBFF',
    accent: '#D6C4FF',
    shade: '#9679E8',
    affinity: ['music', 'drawing', 'books'],
  },
  dino: {
    id: 'dino',
    body: '#5FD08A',
    light: '#E4F8EC',
    accent: '#96E2B4',
    shade: '#3FAE6B',
    affinity: ['building', 'nature', 'football'],
  },
  owl: {
    id: 'owl',
    body: '#66BFC4',
    light: '#E7F7F7',
    accent: '#A6DEE0',
    shade: '#45A0A6',
    affinity: ['books', 'science', 'animals'],
  },
  star: {
    id: 'star',
    body: '#FFCE3D',
    light: '#FFF3CC',
    accent: '#FFE288',
    shade: '#E9B01C',
    affinity: ['dance', 'space', 'music'],
  },

  /* -------------------------------------------------------------- new set */

  bear: {
    id: 'bear',
    body: '#C98B5C',
    light: '#FBE9D6',
    accent: '#A56A3E',
    shade: '#A96F44',
    affinity: ['books', 'science', 'nature'],
  },
  tiger: {
    id: 'tiger',
    body: '#FFA630',
    light: '#FFF0D6',
    accent: '#3E2C1C',
    shade: '#E5871A',
    affinity: ['football', 'bike', 'dance'],
  },
  bunny: {
    id: 'bunny',
    body: '#F7C0D6',
    light: '#FFF2F7',
    accent: '#E79BB8',
    shade: '#E0A2BF',
    affinity: ['drawing', 'music', 'books'],
  },
  panda: {
    id: 'panda',
    body: '#F7F3EA',
    light: '#FFFFFF',
    accent: '#3E3428',
    shade: '#DCD4C4',
    affinity: ['cooking', 'building', 'animals'],
  },
  turtle: {
    id: 'turtle',
    body: '#7BC96F',
    light: '#EDF9E9',
    accent: '#D8A93A',
    shade: '#5AA84F',
    affinity: ['nature', 'animals', 'science'],
  },
  rocket: {
    id: 'rocket',
    body: '#FF5D73',
    light: '#FFE9EC',
    accent: '#FFD166',
    shade: '#DB3E55',
    affinity: ['space', 'science', 'building'],
  },
};

/** Picker order, alternating the original set with the new one. */
export const buddyOrder: BuddyId[] = [
  'fox',
  'tiger',
  'bear',
  'cat',
  'bunny',
  'dino',
  'turtle',
  'panda',
  'owl',
  'robot',
  'rocket',
  'star',
];

/** Buddies added after the first release, badged as new in the picker. */
export const newBuddies = new Set<BuddyId>(['bear', 'tiger', 'bunny', 'panda', 'turtle', 'rocket']);

function affinityScore(id: BuddyId, interests: InterestId[]): number {
  return buddySpecs[id].affinity.filter((i) => interests.includes(i)).length;
}

/**
 * Ranks buddies by how well they match the chosen interests, best first.
 * Ties keep the picker order so the list does not reshuffle on every render.
 */
export function rankBuddies(interests: InterestId[]): BuddyId[] {
  return [...buddyOrder].sort((a, b) => affinityScore(b, interests) - affinityScore(a, interests));
}

export function suggestBuddy(interests: InterestId[]): BuddyId {
  return rankBuddies(interests)[0];
}

/** True when this buddy shares at least two interests with the child. */
export function isStrongMatch(id: BuddyId, interests: InterestId[]): boolean {
  return affinityScore(id, interests) >= 2;
}
