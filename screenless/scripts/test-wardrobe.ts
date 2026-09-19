/**
 * Drives the wardrobe economy under plain Node.
 *
 * This is the first thing in the app that takes something away from a child —
 * coins leave the purse when they buy — so the arithmetic is worth pinning
 * down properly. The rule that must never break is that coins and stars stay
 * separate: nothing here touches stars, and a bug that let coins buy a level
 * reward would let a child skip the levels a parent's real promises hang off.
 *
 * Run with: npm run test:wardrobe
 */
import { itemsInSlot, itemById, priceOf, wardrobeItems } from '../src/data/wardrobe';
import {
  buy,
  buyState,
  coinsForMission,
  grant,
  isWorn,
  nextAffordable,
  reconcileWardrobe,
  takeOff,
  takeOffAll,
  toggle,
  wear,
  wornBySlot,
} from '../src/engine/wardrobe';
import { LEVEL_REWARDS } from '../src/engine/progress';
import { REWARD_IDS, SHOP_ITEM_IDS, WEAR_SLOTS } from '../src/state/types';
import type { ItemId, Wardrobe } from '../src/state/types';
import { LANGUAGES } from '../src/i18n/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.log(`  FAIL  ${label}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const empty: Wardrobe = { owned: [], worn: [] };

section('the catalogue is well formed');
{
  ok('every item is listed once', new Set(wardrobeItems.map((i) => i.id)).size === wardrobeItems.length);
  ok(
    'every reward and shop item has an entry',
    [...REWARD_IDS, ...SHOP_ITEM_IDS].every((id) => itemById.has(id as ItemId)),
  );
  for (const item of wardrobeItems) {
    ok(`${item.id}: known slot`, (WEAR_SLOTS as readonly string[]).includes(item.slot));
    ok(`${item.id}: named in all languages`, LANGUAGES.every((l) => (item.name[l] ?? '').trim().length > 0));
    ok(`${item.id}: has an emoji`, item.emoji.length > 0);
    ok(`${item.id}: price is sane`, item.price >= 0 && item.price <= 50_000);
  }
  // A level reward that could also be bought would let coins skip a level.
  for (const id of REWARD_IDS) ok(`${id}: is not for sale`, priceOf(id as ItemId) === 0);
  for (const id of SHOP_ITEM_IDS) ok(`${id}: costs something`, priceOf(id as ItemId) > 0);
  // Every reward still arrives with a level, or it can never be got at all.
  const granted = new Set(Object.values(LEVEL_REWARDS).flat());
  for (const id of REWARD_IDS) ok(`${id}: some level hands it over`, granted.has(id));
  // Every slot needs a real choice in it or the wardrobe screen has dead rows.
  for (const slot of WEAR_SLOTS) ok(`${slot}: has at least two items`, itemsInSlot(slot).length >= 2);
}

section('what a mission pays');
{
  ok('a ten star mission pays 3000', coinsForMission(10) === 3000);
  ok('nothing earns nothing', coinsForMission(0) === 0);
  ok('a negative cannot mint coins', coinsForMission(-5) === 0);
  // The cheapest item should be about a day's work, the dearest a fortnight.
  const cheapest = Math.min(...SHOP_ITEM_IDS.map((id) => priceOf(id as ItemId)));
  const dearest = Math.max(...SHOP_ITEM_IDS.map((id) => priceOf(id as ItemId)));
  ok('the first item is about a day of missions', cheapest <= coinsForMission(10) * 2);
  ok('the last item is not reachable in a day', dearest > coinsForMission(10) * 3);
}

section('buying');
{
  const rich = buy(empty, 'cap', 10_000);
  ok('an affordable item is bought', rich.ok);
  ok('the coins are taken', rich.spent === priceOf('cap'));
  ok('it lands in the wardrobe', rich.wardrobe.owned.includes('cap'));
  ok('and goes straight on', isWorn(rich.wardrobe, 'cap'));

  const poor = buy(empty, 'wings', 10);
  ok('an unaffordable item is refused', !poor.ok);
  ok('and nothing is taken', poor.spent === 0);
  ok('and nothing is owned', poor.wardrobe.owned.length === 0);

  const exact = buy(empty, 'cap', priceOf('cap'));
  ok('exactly enough is enough', exact.ok);

  const twice = buy(rich.wardrobe, 'cap', 10_000);
  ok('buying the same thing twice is refused', !twice.ok);
  ok('and is not charged for', twice.spent === 0);

  // The one that would break the levels.
  const cheat = buy(empty, 'crown', 1_000_000);
  ok('no amount of coins buys a level reward', !cheat.ok);
  ok('and no coins are taken trying', cheat.spent === 0);

  const nonsense = buy(empty, 'not-a-thing' as ItemId, 10_000);
  ok('an unknown id buys nothing', !nonsense.ok);
}

section('one item per slot');
{
  const owned: Wardrobe = { owned: ['cap', 'beanie', 'crown', 'shades', 'glasses'], worn: [] };
  const capped = wear(owned, 'cap');
  ok('the cap goes on', isWorn(capped, 'cap'));

  const swapped = wear(capped, 'beanie');
  ok('the beanie replaces it', isWorn(swapped, 'beanie'));
  ok('and the cap comes off', !isWorn(swapped, 'cap'));
  ok('only one head item is worn', swapped.worn.filter((id) => itemById.get(id)?.slot === 'head').length === 1);

  const withFace = wear(swapped, 'shades');
  ok('a different slot does not clash', isWorn(withFace, 'beanie') && isWorn(withFace, 'shades'));
  ok('two slots are filled', Object.keys(wornBySlot(withFace)).length === 2);

  ok('wearing something unowned does nothing', wear(empty, 'cap').worn.length === 0);
}

section('taking things off');
{
  const dressed: Wardrobe = { owned: ['cap', 'shades'], worn: ['cap', 'shades'] };
  ok('taking one off leaves the other', takeOff(dressed, 'cap').worn.length === 1);
  ok('taking it off does not lose it', takeOff(dressed, 'cap').owned.includes('cap'));
  ok('everything off empties worn', takeOffAll(dressed).worn.length === 0);
  ok('everything off keeps them owned', takeOffAll(dressed).owned.length === 2);

  ok('tapping a worn item takes it off', !isWorn(toggle(dressed, 'cap'), 'cap'));
  const off: Wardrobe = { owned: ['cap'], worn: [] };
  ok('tapping an unworn item puts it on', isWorn(toggle(off, 'cap'), 'cap'));
}

section('what the shop says');
{
  ok('an owned item reads as owned', buyState({ owned: ['cap'], worn: [] }, 'cap', 0) === 'owned');
  ok('a reachable item reads as affordable', buyState(empty, 'cap', 999_999) === 'affordable');
  ok('an out of reach item reads as too dear', buyState(empty, 'wings', 10) === 'tooDear');
  ok('an unearned level reward reads as locked', buyState(empty, 'crown', 999_999) === 'locked');
  ok('an earned level reward reads as owned', buyState({ owned: ['crown'], worn: [] }, 'crown', 0) === 'owned');
}

section('levels still hand things over');
{
  const granted = grant(empty, ['crown', 'medal']);
  ok('a level reward is added', granted.owned.includes('crown') && granted.owned.includes('medal'));
  ok('but is not put on unasked', granted.worn.length === 0);
  ok('granting twice does not duplicate', grant(granted, ['crown']).owned.filter((id) => id === 'crown').length === 1);
}

section('what to save towards');
{
  ok('with nothing, the cheapest is the target', nextAffordable(empty, 0) === 'cap');
  // Once the cheap ones are affordable the target moves up, so the card always
  // shows something still out of reach rather than something already bought.
  const target = nextAffordable(empty, 3000);
  ok('with some coins the target moves up', target !== null && priceOf(target) > 3000);
  const everything: Wardrobe = { owned: [...SHOP_ITEM_IDS], worn: [] };
  ok('owning everything leaves nothing to aim at', nextAffordable(everything, 0) === null);
}

section('stored data from another build');
{
  const messy = reconcileWardrobe({
    owned: ['cap', 'cap', 'ghost-item' as ItemId, 'shades'],
    worn: ['cap', 'beanie', 'shades', 'ghost-item' as ItemId],
  });
  ok('unknown items are dropped from owned', !messy.owned.includes('ghost-item' as ItemId));
  ok('duplicates are collapsed', messy.owned.filter((id) => id === 'cap').length === 1);
  ok('wearing something unowned is dropped', !messy.worn.includes('beanie'));
  ok('the rest survives', messy.worn.includes('cap') && messy.worn.includes('shades'));

  const twoHats = reconcileWardrobe({ owned: ['cap', 'beanie'], worn: ['cap', 'beanie'] });
  ok('two hats cannot both be worn', twoHats.worn.length === 1);

  ok('nothing stored gives an empty wardrobe', reconcileWardrobe(undefined).owned.length === 0);
}

console.log(
  failures === 0
    ? `\n  the wardrobe holds (${checks} checks, ${wardrobeItems.length} items)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
