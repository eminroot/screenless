import { interestMeta } from './interests';
import type { Facet } from '../engine/taste';
import type { TKey } from '../i18n/shape';
import { INTERESTS, type InterestId } from '../state/types';

/**
 * Words for the things the taste engine counts.
 *
 * Only the facets a child would recognise get a name. `tool:badgeHunt` is a
 * real preference and the picker uses it, but "you like tool:badgeHunt" is
 * not a sentence, so it stays out of the screens and out of the parent
 * summary. A facet with no name here is simply not shown.
 */
const NAMES: Record<string, TKey> = {
  'cat:move': 'facets.catMove',
  'cat:outdoor': 'facets.catOutdoor',
  'cat:create': 'facets.catCreate',
  'cat:social': 'facets.catSocial',
  'cat:calm': 'facets.catCalm',
  'body:active': 'facets.bodyActive',
  'body:still': 'facets.bodyStill',
  'len:quick': 'facets.lenQuick',
  'len:medium': 'facets.lenMedium',
  'len:long': 'facets.lenLong',
  'mode:duo': 'facets.modeDuo',
  'place:indoor': 'facets.placeIndoor',
  'place:outdoor': 'facets.placeOutdoor',
  'proof:photo': 'facets.proofPhoto',
  'proof:motion': 'facets.proofMotion',
};

/** The interests already have names everywhere else in the app. */
for (const interest of INTERESTS) {
  NAMES[`interest:${interest}`] = `interestNames.${interest}` as TKey;
}

export function facetName(facet: Facet): TKey | null {
  return NAMES[facet] ?? null;
}

/** The emoji for a facet, where one reads better than a word alone. */
const EMOJI: Record<string, string> = {
  'cat:move': '🏃',
  'cat:outdoor': '🌳',
  'cat:create': '🎨',
  'cat:social': '🤝',
  'cat:calm': '🧩',
  'body:active': '⚡',
  'body:still': '🪑',
  'len:quick': '⚡',
  'len:medium': '⏱️',
  'len:long': '🕰️',
  'mode:duo': '👨‍👧',
  'place:indoor': '🏠',
  'place:outdoor': '🌤️',
  'proof:photo': '📷',
  'proof:motion': '📈',
};

export function facetEmoji(facet: Facet): string {
  if (facet.startsWith('interest:')) {
    return interestMeta.get(facet.slice('interest:'.length) as InterestId)?.emoji ?? '⭐';
  }
  return EMOJI[facet] ?? '⭐';
}

/** Facet kinds the child's own screens have words for. */
export const SHOWN_KINDS = ['cat', 'interest', 'body', 'len', 'place', 'mode'];
