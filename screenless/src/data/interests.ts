import type { InterestId } from '../state/types';
import type { TKey } from '../i18n/shape';

export type InterestMeta = {
  id: InterestId;
  emoji: string;
  labelKey: TKey;
};

export const interestList: InterestMeta[] = [
  { id: 'football', emoji: '⚽', labelKey: 'interestNames.football' },
  { id: 'animals', emoji: '🐾', labelKey: 'interestNames.animals' },
  { id: 'drawing', emoji: '🎨', labelKey: 'interestNames.drawing' },
  { id: 'space', emoji: '🚀', labelKey: 'interestNames.space' },
  { id: 'music', emoji: '🎵', labelKey: 'interestNames.music' },
  { id: 'dance', emoji: '💃', labelKey: 'interestNames.dance' },
  { id: 'building', emoji: '🧱', labelKey: 'interestNames.building' },
  { id: 'nature', emoji: '🌳', labelKey: 'interestNames.nature' },
  { id: 'books', emoji: '📚', labelKey: 'interestNames.books' },
  { id: 'science', emoji: '🔬', labelKey: 'interestNames.science' },
  { id: 'cooking', emoji: '🍳', labelKey: 'interestNames.cooking' },
  { id: 'bike', emoji: '🚲', labelKey: 'interestNames.bike' },
];

export const interestMeta = new Map(interestList.map((i) => [i.id, i]));

export const MIN_INTERESTS = 3;
