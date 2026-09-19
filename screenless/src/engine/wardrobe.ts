import { isEarned, itemById, priceOf, slotOf } from '../data/wardrobe';
import type { ItemId, Wardrobe, WearSlot } from '../state/types';

/**
 * Buying and wearing, as pure rules.
 *
 * The whole point of this feature is that the coin finally buys something. It
 * was minted by walking from the first version and spent on nothing, which a
 * child works out in about a week — a currency that buys nothing stops being a
 * reason to do anything shortly afterwards.
 *
 * The rule the rest of the app depends on is unchanged and worth restating:
 * **coins and stars are not interchangeable in either direction.** Stars are
 * what a parent has promised a real bicycle against; coins buy pixels on a
 * cartoon fox. Nothing here reads or writes stars, and nothing in
 * `engine/rewards.ts` reads coins.
 */

/**
 * Coins a confirmed mission pays, per star it was worth.
 *
 * Set so that a mission is worth roughly a good walk. Walking mints one coin
 * per step against daily goals of 5,000 to 10,000, so a ten star mission at
 * 300 a star lands at 3,000 — two or three missions in an afternoon out-earn a
 * day of walking, which is the right way round for an app whose entire premise
 * is that the missions are the point.
 */
export const COINS_PER_STAR = 300;

export function coinsForMission(stars: number): number {
  return Math.max(0, Math.round(stars)) * COINS_PER_STAR;
}

/** Everything currently on, keyed by slot. */
export function wornBySlot(wardrobe: Wardrobe): Partial<Record<WearSlot, ItemId>> {
  const out: Partial<Record<WearSlot, ItemId>> = {};
  for (const id of wardrobe.worn) {
    const slot = slotOf(id);
    // An id from a newer build, or one removed since, simply does not place.
    if (slot && !out[slot]) out[slot] = id;
  }
  return out;
}

export function owns(wardrobe: Wardrobe, id: ItemId): boolean {
  return wardrobe.owned.includes(id);
}

export function isWorn(wardrobe: Wardrobe, id: ItemId): boolean {
  return wornBySlot(wardrobe)[slotOf(id) ?? 'head'] === id;
}

export type BuyState = 'owned' | 'affordable' | 'tooDear' | 'locked';

/**
 * What the shop should say about one item.
 *
 * `locked` is a level reward not reached yet — shown rather than hidden, so a
 * child can see what is coming. Nothing about it is buyable, at any price:
 * letting coins skip a level would make the levels meaningless and would teach
 * exactly the lesson this app exists to avoid.
 */
export function buyState(wardrobe: Wardrobe, id: ItemId, coins: number): BuyState {
  if (owns(wardrobe, id)) return 'owned';
  if (isEarned(id)) return 'locked';
  return coins >= priceOf(id) ? 'affordable' : 'tooDear';
}

export type BuyResult = {
  wardrobe: Wardrobe;
  /** Coins actually taken. Zero when the purchase did not happen. */
  spent: number;
  ok: boolean;
};

/**
 * Buys an item and puts it straight on.
 *
 * Wearing it immediately is deliberate: a child who has just spent two weeks
 * of coins wants to see the thing, not to then find a second button.
 */
export function buy(wardrobe: Wardrobe, id: ItemId, coins: number): BuyResult {
  if (!itemById.has(id)) return { wardrobe, spent: 0, ok: false };
  if (owns(wardrobe, id)) return { wardrobe, spent: 0, ok: false };
  if (isEarned(id)) return { wardrobe, spent: 0, ok: false };

  const price = priceOf(id);
  if (coins < price) return { wardrobe, spent: 0, ok: false };

  const owned = [...wardrobe.owned, id];
  return { wardrobe: wear({ ...wardrobe, owned }, id), spent: price, ok: true };
}

/** Puts an item on, taking off whatever shared its slot. */
export function wear(wardrobe: Wardrobe, id: ItemId): Wardrobe {
  if (!owns(wardrobe, id)) return wardrobe;
  const slot = slotOf(id);
  if (!slot) return wardrobe;
  const worn = wardrobe.worn.filter((other) => slotOf(other) !== slot);
  return { ...wardrobe, worn: [...worn, id] };
}

export function takeOff(wardrobe: Wardrobe, id: ItemId): Wardrobe {
  return { ...wardrobe, worn: wardrobe.worn.filter((other) => other !== id) };
}

/** What tapping an owned item does: on if it is off, off if it is on. */
export function toggle(wardrobe: Wardrobe, id: ItemId): Wardrobe {
  return isWorn(wardrobe, id) ? takeOff(wardrobe, id) : wear(wardrobe, id);
}

/** Everything off. One tap back to the buddy as it started. */
export function takeOffAll(wardrobe: Wardrobe): Wardrobe {
  return { ...wardrobe, worn: [] };
}

/**
 * Hands over items a level has reached.
 *
 * Called with whatever `applyCompletion` reports as newly unlocked. Nothing is
 * put on automatically: a child who has spent coins arranging an outfit should
 * not have a medal appear on it without being asked.
 */
export function grant(wardrobe: Wardrobe, ids: ItemId[]): Wardrobe {
  const owned = [...wardrobe.owned];
  for (const id of ids) if (!owned.includes(id)) owned.push(id);
  return { ...wardrobe, owned };
}

/** The next thing worth saving towards: cheapest item not yet owned. */
export function nextAffordable(wardrobe: Wardrobe, coins: number): ItemId | null {
  const candidates = [...itemById.values()]
    .filter((item) => !isEarned(item.id) && !owns(wardrobe, item.id))
    .sort((a, b) => a.price - b.price);
  if (candidates.length === 0) return null;
  const reach = candidates.find((item) => item.price > coins);
  return (reach ?? candidates[0]).id;
}

/**
 * Drops ids the build no longer knows about and enforces one item per slot.
 *
 * Runs on load. Stored data outlives any single version of this list, and a
 * wardrobe holding two hats would otherwise draw both.
 */
export function reconcileWardrobe(stored: Partial<Wardrobe> | undefined): Wardrobe {
  const owned = (stored?.owned ?? []).filter((id) => itemById.has(id));
  const unique = [...new Set(owned)];
  const worn: ItemId[] = [];
  const taken = new Set<WearSlot>();
  for (const id of stored?.worn ?? []) {
    if (!unique.includes(id)) continue;
    const slot = slotOf(id);
    if (!slot || taken.has(slot)) continue;
    taken.add(slot);
    worn.push(id);
  }
  return { owned: unique, worn };
}
