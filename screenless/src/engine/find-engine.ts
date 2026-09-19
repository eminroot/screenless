import { findKind, findKinds, type FindFact, type FindKind, type FindVariant } from '../data/finds';
import type { Localized } from '../i18n/types';
import type {
  Find,
  FindKindId,
  Season,
  TreeCheckIn,
  TreeFriend,
} from '../state/types';

/**
 * The rules behind the explorer's notebook.
 *
 * All of it is plain arithmetic over what the child has already answered. The
 * point of keeping it rule based is the same as for the mission picker: a
 * parent can read the library and know exactly what their child will be told,
 * and the app can always explain why it said what it said.
 */

/* ------------------------------------------------------------------- facts */

/**
 * The next thing the buddy can tell this child about this kind.
 *
 * Facts are gated on how many questions the child actually answered, so the
 * good ones are behind more looking. `known` is every fact the child has ever
 * unlocked for this kind, which is what makes a second leaf worth finding: the
 * first one is the tiny kitchen, the second one is the pipes.
 */
export function nextFact(
  kind: FindKindId,
  answered: number,
  known: ReadonlySet<string>,
): FindFact | null {
  const facts = findKind(kind).facts;
  return (
    facts.find((fact) => fact.at <= answered && !known.has(fact.id)) ??
    null
  );
}

/** Facts unlocked so far, oldest first, for the collection card. */
export function knownFacts(kind: FindKindId, known: ReadonlySet<string>): FindFact[] {
  return findKind(kind).facts.filter((fact) => known.has(fact.id));
}

/** Every fact id this child has unlocked, across the whole collection. */
export function factsKnown(collection: Find[]): Set<string> {
  const known = new Set<string>();
  for (const find of collection) {
    for (const id of find.factIds) known.add(id);
  }
  return known;
}

/** How many facts are still waiting, for the "keep looking" line. */
export function factsLeft(kind: FindKindId, known: ReadonlySet<string>): number {
  return findKind(kind).facts.filter((fact) => !known.has(fact.id)).length;
}

/* --------------------------------------------------------------- variants */

/** The question whose answer names the sub kind, if the kind has one. */
export function decidingIndex(kind: FindKind): number {
  return kind.questions.findIndex((question) => question.decides);
}

/**
 * The sub kind the child's own answers settled on.
 *
 * Null while the deciding question is still unanswered, which is why the
 * collection card falls back to the plain kind name until it is.
 */
export function variantFor(kindId: FindKindId, answers: string[]): FindVariant | null {
  const kind = findKind(kindId);
  const index = decidingIndex(kind);
  if (index < 0) return null;
  const tag = answers[index];
  return kind.variants.find((variant) => variant.tag === tag) ?? null;
}

/** What to call a find on its card: the sub kind if known, the kind if not. */
export function findName(find: Find): Localized {
  return variantFor(find.kind, find.answers)?.name ?? findKind(find.kind).name;
}

export function findEmoji(find: Find): string {
  return variantFor(find.kind, find.answers)?.emoji ?? findKind(find.kind).emoji;
}

/* ------------------------------------------------------------- collection */

export type KindProgress = {
  kind: FindKind;
  /** Every find of this kind, newest first. */
  finds: Find[];
  /** Sub kinds the child has actually found. */
  variants: FindVariant[];
  factsKnown: number;
  factsTotal: number;
  /** The most recent photo, which becomes the picture on the card. */
  cover?: string;
};

/**
 * The cabinet, in shelf order.
 *
 * Every kind is always present, found or not: an empty slot is the reason to
 * go outside, so hiding it would remove the only thing it is there for.
 */
export function collectionShelf(collection: Find[]): KindProgress[] {
  const known = factsKnown(collection);

  return findKinds.map((kind) => {
    const finds = collection.filter((find) => find.kind === kind.id).slice().reverse();

    const tags = new Set<string>();
    for (const find of finds) {
      const variant = variantFor(find.kind, find.answers);
      if (variant) tags.add(variant.tag);
    }

    return {
      kind,
      finds,
      variants: kind.variants.filter((variant) => tags.has(variant.tag)),
      factsKnown: kind.facts.filter((fact) => known.has(fact.id)).length,
      factsTotal: kind.facts.length,
      cover: finds.find((find) => find.photoUri)?.photoUri,
    };
  });
}

export type CollectionSummary = {
  finds: number;
  kindsFound: number;
  kindsTotal: number;
  factsKnown: number;
  factsTotal: number;
};

export function summarise(collection: Find[]): CollectionSummary {
  const known = factsKnown(collection);
  const kinds = new Set(collection.map((find) => find.kind));
  return {
    finds: collection.length,
    kindsFound: kinds.size,
    kindsTotal: findKinds.length,
    factsKnown: known.size,
    factsTotal: findKinds.reduce((sum, kind) => sum + kind.facts.length, 0),
  };
}

/** Where this child has been finding things, busiest first. */
export function placeTally(collection: Find[]): { place: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const find of collection) {
    if (!find.place) continue;
    counts.set(find.place, (counts.get(find.place) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------------------------------------------ seasons */

/**
 * Northern hemisphere, which is where Turkey and Azerbaijan are. It only ever
 * labels a photo in the strip, so being a few days out at the edges is fine.
 */
export function seasonOf(date: Date = new Date()): Season {
  const month = date.getMonth();
  if (month <= 1 || month === 11) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

/* -------------------------------------------------------------- tree friend */

/** Days between visits. Long enough that something has actually changed. */
export const CHECK_IN_DAYS = 14;

export type TreeStatus = {
  /** Visits so far. */
  visits: number;
  /** Days since the last visit, or null before the first one. */
  daysSince: number | null;
  /** Days until the next check in is due. Zero or less means it is due now. */
  daysUntil: number;
  due: boolean;
  /** Seasons the child has photographed the tree in. */
  seasons: Season[];
  /** True once the tree has been seen in every season, which takes a year. */
  fullYear: boolean;
  /** Set when the trunk was measured twice and the second reading was bigger. */
  grew: boolean;
  /** Set when the leaves are doing something different from last time. */
  changed: boolean;
};

export function treeStatus(tree: TreeFriend | null, now = new Date()): TreeStatus | null {
  if (!tree) return null;

  const visits = tree.checkIns.length;
  const last = tree.checkIns[visits - 1];
  const previous = tree.checkIns[visits - 2];

  const daysSince = last ? daysBetween(new Date(last.at), now) : null;
  const daysUntil = daysSince === null ? 0 : CHECK_IN_DAYS - daysSince;
  const seasons = [...new Set(tree.checkIns.map((checkIn) => checkIn.season))];

  return {
    visits,
    daysSince,
    daysUntil,
    due: daysUntil <= 0,
    seasons,
    fullYear: seasons.length >= 4,
    grew: Boolean(
      last?.hugs !== undefined && previous?.hugs !== undefined && last.hugs > previous.hugs,
    ),
    changed: Boolean(last?.leafState && previous?.leafState && last.leafState !== previous.leafState),
  };
}

/**
 * What the buddy says about the tree on the home screen.
 *
 * Returns a key rather than a string so the caller can translate it. The order
 * matters: something that actually changed beats a plain reminder, because the
 * change is the reason the child went.
 */
export function treeHeadline(status: TreeStatus | null): {
  key: 'adopt' | 'first' | 'grew' | 'changed' | 'due' | 'soon';
  days: number;
} {
  if (!status) return { key: 'adopt', days: 0 };
  if (status.visits === 0) return { key: 'first', days: 0 };
  if (status.grew) return { key: 'grew', days: 0 };
  if (status.changed) return { key: 'changed', days: 0 };
  if (status.due) return { key: 'due', days: 0 };
  return { key: 'soon', days: Math.max(1, status.daysUntil) };
}

/** Check ins grouped for the strip, oldest first so the year reads left to right. */
export function treeStrip(tree: TreeFriend): TreeCheckIn[] {
  return [...tree.checkIns].sort((a, b) => a.at.localeCompare(b.at));
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}

/* ----------------------------------------------------------------- compare */

/**
 * Three questions for holding two things side by side.
 *
 * Telling two things apart is far easier than naming either of them, for the
 * child and for the phone, and it is what a scientist actually does first. A
 * child who decides two leaves are different has sorted them into species
 * without needing either name.
 */
export const COMPARE_QUESTIONS = ['size', 'colour', 'edge'] as const;
export type CompareQuestion = (typeof COMPARE_QUESTIONS)[number];

/** Which of the two won each question, or `same` when the child says neither. */
export type CompareAnswer = 'a' | 'b' | 'same';

export type CompareVerdict = {
  /** How many of the three questions came out different. */
  differences: number;
  different: boolean;
  /** Answered questions, so the screen can wait for all three. */
  answered: number;
};

export function compareVerdict(answers: (CompareAnswer | null)[]): CompareVerdict {
  const given = answers.filter((answer): answer is CompareAnswer => answer !== null);
  const differences = given.filter((answer) => answer !== 'same').length;
  return { differences, different: differences >= 2, answered: given.length };
}
