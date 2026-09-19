import type { ItemId, RewardId, ShopItemId, WearSlot } from '../state/types';
import type { Localized } from '../i18n/types';
import { LEVEL_REWARDS } from '../engine/progress';

/**
 * Everything the buddy can wear, and what it costs.
 *
 * Two ways in, on purpose. Reaching a level still hands over an item for
 * nothing, because a milestone that costs money is not a milestone. Everything
 * else is bought with coins, which is the part a child can aim at deliberately
 * — "three more missions and I can get the headphones" is a sentence a nine
 * year old will say out loud, and a level is not something you can plan for in
 * the same way.
 *
 * Prices are set against the two things that mint coins, so that the ladder
 * runs from about a day's work at the bottom to a fortnight at the top. See
 * `COINS_PER_STAR` in `engine/wardrobe.ts` for the arithmetic.
 */
export type WardrobeItem = {
  id: ItemId;
  slot: WearSlot;
  /** Coins. Zero means it is not for sale — it arrives with a level. */
  price: number;
  /** The level that hands it over, when it is a level reward. */
  level?: number;
  /** A small stand-in drawn in lists, since the real item is SVG on the buddy. */
  emoji: string;
  name: Localized;
};

/** Level that grants each reward, read back off the progress table. */
const levelOf = (id: RewardId): number | undefined => {
  for (const [level, rewards] of Object.entries(LEVEL_REWARDS)) {
    if (rewards.includes(id)) return Number(level);
  }
  return undefined;
};

const earned: { id: RewardId; slot: WearSlot; emoji: string; name: Localized }[] = [
  { id: 'hat', slot: 'head', emoji: '🎉', name: { en: 'Party hat', tr: 'Parti şapkası', az: 'Şənlik papağı' } },
  { id: 'crown', slot: 'head', emoji: '👑', name: { en: 'Crown', tr: 'Taç', az: 'Tac' } },
  { id: 'glasses', slot: 'face', emoji: '🕶️', name: { en: 'Dark glasses', tr: 'Koyu gözlük', az: 'Tünd eynək' } },
  { id: 'scarf', slot: 'neck', emoji: '🧣', name: { en: 'Scarf', tr: 'Atkı', az: 'Şərf' } },
  { id: 'medal', slot: 'neck', emoji: '🏅', name: { en: 'Medal', tr: 'Madalya', az: 'Medal' } },
  { id: 'cape', slot: 'back', emoji: '🦸', name: { en: 'Cape', tr: 'Pelerin', az: 'Plaş' } },
  { id: 'ball', slot: 'hand', emoji: '⚽', name: { en: 'Football', tr: 'Futbol topu', az: 'Futbol topu' } },
  { id: 'balloon', slot: 'hand', emoji: '🎈', name: { en: 'Balloon', tr: 'Balon', az: 'Şar' } },
];

const bought: { id: ShopItemId; slot: WearSlot; price: number; emoji: string; name: Localized }[] = [
  {
    id: 'cap',
    slot: 'head',
    price: 2500,
    emoji: '🧢',
    name: { en: 'Backwards cap', tr: 'Ters kasket', az: 'Tərs kepka' },
  },
  {
    id: 'bandana',
    slot: 'neck',
    price: 3000,
    emoji: '🔻',
    name: { en: 'Bandana', tr: 'Bandana', az: 'Bandana' },
  },
  {
    id: 'shades',
    slot: 'face',
    price: 4000,
    emoji: '😎',
    name: { en: 'Shades', tr: 'Güneş gözlüğü', az: 'Günəş eynəyi' },
  },
  {
    id: 'bowtie',
    slot: 'neck',
    price: 4500,
    emoji: '🎀',
    name: { en: 'Bow tie', tr: 'Papyon', az: 'Papyon' },
  },
  {
    id: 'beanie',
    slot: 'head',
    price: 5000,
    emoji: '🧶',
    name: { en: 'Woolly hat', tr: 'Bere', az: 'Papaq' },
  },
  {
    id: 'backpack',
    slot: 'back',
    price: 7500,
    emoji: '🎒',
    name: { en: 'Backpack', tr: 'Sırt çantası', az: 'Bel çantası' },
  },
  {
    id: 'headphones',
    slot: 'head',
    price: 9000,
    emoji: '🎧',
    name: { en: 'Headphones', tr: 'Kulaklık', az: 'Qulaqlıq' },
  },
  {
    id: 'skateboard',
    slot: 'hand',
    price: 12000,
    emoji: '🛹',
    name: { en: 'Skateboard', tr: 'Kaykay', az: 'Skeytbord' },
  },
  {
    id: 'flag',
    slot: 'hand',
    price: 15000,
    emoji: '🚩',
    name: { en: 'Flag', tr: 'Bayrak', az: 'Bayraq' },
  },
  {
    id: 'wings',
    slot: 'back',
    price: 20000,
    emoji: '🪽',
    name: { en: 'Wings', tr: 'Kanatlar', az: 'Qanadlar' },
  },
];

export const wardrobeItems: WardrobeItem[] = [
  ...earned.map((item) => ({ ...item, price: 0, level: levelOf(item.id) })),
  ...bought,
];

export const itemById = new Map<ItemId, WardrobeItem>(
  wardrobeItems.map((item) => [item.id, item]),
);

/** Cheapest first inside each slot, which is the order the shop reads best in. */
export function itemsInSlot(slot: WearSlot): WardrobeItem[] {
  return wardrobeItems
    .filter((item) => item.slot === slot)
    .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
}

export function slotOf(id: ItemId): WearSlot | null {
  return itemById.get(id)?.slot ?? null;
}

export function priceOf(id: ItemId): number {
  return itemById.get(id)?.price ?? 0;
}

/** True for the items a level hands over, which are never for sale. */
export function isEarned(id: ItemId): boolean {
  return priceOf(id) === 0;
}
