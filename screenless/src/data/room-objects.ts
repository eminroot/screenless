import type { Localized } from '../i18n/types';
import { ROOM_OBJECTS, type RoomObjectId } from '../state/types';

export type RoomObjectMeta = {
  id: RoomObjectId;
  emoji: string;
  /**
   * Always the bare singular. Mission templates only ever place it after a
   * number or before "with", the two spots where Turkish and Azerbaijani take
   * no case ending, so no generated sentence needs to inflect it.
   */
  name: Localized;
  /**
   * Lower cased fragments of on device labeller output that mean this object.
   * Matched as substrings, so `ball` also catches `Football` and `Basketball`.
   */
  keywords: string[];
};

/**
 * The objects a room scan can end up with. Order is the order they appear in
 * the manual picker, so the most common toys come first.
 */
export const roomObjectList: RoomObjectMeta[] = [
  {
    id: 'ball',
    emoji: '⚽',
    name: { en: 'ball', tr: 'top', az: 'top' },
    keywords: ['ball', 'football', 'soccer', 'basketball', 'volleyball', 'tennis'],
  },
  {
    id: 'book',
    emoji: '📚',
    name: { en: 'book', tr: 'kitap', az: 'kitab' },
    keywords: ['book', 'novel', 'magazine', 'notebook', 'publication', 'library'],
  },
  {
    id: 'teddy',
    emoji: '🧸',
    name: { en: 'teddy', tr: 'peluş', az: 'oyuncaq ayı' },
    keywords: ['teddy', 'plush', 'stuffed', 'doll', 'bear', 'puppet', 'figurine'],
  },
  {
    id: 'blocks',
    emoji: '🧱',
    name: { en: 'building block', tr: 'lego', az: 'lego' },
    keywords: ['lego', 'block', 'brick', 'construction set', 'building toy'],
  },
  {
    id: 'puzzle',
    emoji: '🧩',
    name: { en: 'puzzle piece', tr: 'yapboz', az: 'pazl' },
    keywords: ['puzzle', 'jigsaw', 'board game', 'domino'],
  },
  {
    id: 'pencil',
    emoji: '🖍️',
    name: { en: 'pencil', tr: 'kalem', az: 'karandaş' },
    keywords: ['pencil', 'pen', 'crayon', 'marker', 'stationery', 'writing'],
  },
  {
    id: 'paper',
    emoji: '📄',
    name: { en: 'sheet of paper', tr: 'kağıt', az: 'kağız' },
    keywords: ['paper', 'sheet', 'card', 'envelope', 'poster', 'drawing'],
  },
  {
    id: 'cup',
    emoji: '🥤',
    name: { en: 'cup', tr: 'bardak', az: 'stəkan' },
    keywords: ['cup', 'mug', 'glass', 'tumbler', 'drinkware'],
  },
  {
    id: 'bottle',
    emoji: '🍶',
    name: { en: 'bottle', tr: 'şişe', az: 'şüşə' },
    keywords: ['bottle', 'flask', 'jar', 'container'],
  },
  {
    id: 'chair',
    emoji: '🪑',
    name: { en: 'chair', tr: 'sandalye', az: 'stul' },
    keywords: ['chair', 'stool', 'seat', 'armchair', 'sofa', 'couch'],
  },
  {
    id: 'pillow',
    emoji: '🛏️',
    name: { en: 'pillow', tr: 'yastık', az: 'yastıq' },
    keywords: ['pillow', 'cushion', 'bed', 'mattress'],
  },
  {
    id: 'blanket',
    emoji: '🧵',
    name: { en: 'blanket', tr: 'battaniye', az: 'yorğan' },
    keywords: ['blanket', 'quilt', 'duvet', 'linen', 'textile', 'bedding'],
  },
  {
    id: 'shoe',
    emoji: '👟',
    name: { en: 'shoe', tr: 'ayakkabı', az: 'ayaqqabı' },
    keywords: ['shoe', 'sneaker', 'boot', 'sandal', 'slipper', 'footwear'],
  },
  {
    id: 'sock',
    emoji: '🧦',
    name: { en: 'sock', tr: 'çorap', az: 'corab' },
    keywords: ['sock', 'stocking', 'glove', 'clothing', 'shirt', 'sleeve'],
  },
  {
    id: 'box',
    emoji: '📦',
    name: { en: 'box', tr: 'kutu', az: 'qutu' },
    keywords: ['box', 'carton', 'crate', 'basket', 'bag', 'packaging'],
  },
  {
    id: 'plant',
    emoji: '🪴',
    name: { en: 'plant', tr: 'saksı', az: 'dibçək' },
    keywords: ['plant', 'flowerpot', 'houseplant', 'leaf', 'flower', 'succulent'],
  },
  {
    id: 'toycar',
    emoji: '🚗',
    name: { en: 'toy car', tr: 'oyuncak araba', az: 'oyuncaq maşın' },
    keywords: ['toy car', 'model car', 'vehicle', 'truck', 'train', 'wheel'],
  },
  {
    id: 'hat',
    emoji: '🧢',
    name: { en: 'hat', tr: 'şapka', az: 'papaq' },
    keywords: ['hat', 'cap', 'helmet', 'headgear', 'beanie'],
  },
  {
    id: 'towel',
    emoji: '🧺',
    name: { en: 'towel', tr: 'havlu', az: 'dəsmal' },
    keywords: ['towel', 'napkin', 'cloth', 'rag', 'mat'],
  },
  {
    id: 'spoon',
    emoji: '🥄',
    name: { en: 'spoon', tr: 'kaşık', az: 'qaşıq' },
    keywords: ['spoon', 'fork', 'cutlery', 'plate', 'bowl', 'tableware', 'kitchen utensil'],
  },
];

export const roomObjectMeta = new Map(roomObjectList.map((o) => [o.id, o]));

export function objectEmoji(id: RoomObjectId): string {
  return roomObjectMeta.get(id)?.emoji ?? '✨';
}

export function objectName(id: RoomObjectId): Localized {
  return roomObjectMeta.get(id)?.name ?? { en: id, tr: id, az: id };
}

export function isRoomObject(value: string): value is RoomObjectId {
  return (ROOM_OBJECTS as readonly string[]).includes(value);
}
