import type { TKey, TVars } from '../i18n/shape';
import type { AgeBand } from '../state/types';
import {
  nudgeCopyId,
  nudgeTier,
  type Nudge,
  type NudgeCopyId,
  type NudgeSuggestion,
  type NudgeTier,
} from './nudge';

/**
 * Turning a nudge into the two lines a child reads.
 *
 * Split out from `lib/screen-nudge.ts` because that file imports `Platform`
 * and `expo-notifications`, neither of which loads under plain Node. Keeping
 * the wording here means `npm run test:nudge` can render every kind of
 * reminder in every language and every age band and assert that the result is
 * a sentence: no leftover `{{token}}`, no missing key, nothing empty.
 *
 * That test is worth more than it looks. The notification is the only part of
 * this feature most families will ever see, it is written in three languages
 * for three age bands, and a broken interpolation in Azerbaijani would
 * otherwise be found by a child.
 */

/** Which copy slot a nudge lands in, including the no-budget variants. */
export type CopySlot = NudgeCopyId | `${NudgeTier}TimeOnly`;

/**
 * Both halves of every slot, written out rather than built from a template.
 *
 * A template string would not be checked: `TKey` is a union of literals, so
 * `nudge.${slot}Title` widens to `string` and a typo ships. Spelling all
 * thirty out means a missing translation is a build error.
 */
export const NUDGE_TITLES: Record<CopySlot, TKey> = {
  littleCheckpoint: 'nudge.littleCheckpointTitle',
  littleApproaching: 'nudge.littleApproachingTitle',
  littleSpent: 'nudge.littleSpentTitle',
  littleCurfew: 'nudge.littleCurfewTitle',
  littleTimeOnly: 'nudge.littleTimeOnlyTitle',
  juniorCheckpoint: 'nudge.juniorCheckpointTitle',
  juniorApproaching: 'nudge.juniorApproachingTitle',
  juniorSpent: 'nudge.juniorSpentTitle',
  juniorCurfew: 'nudge.juniorCurfewTitle',
  juniorTimeOnly: 'nudge.juniorTimeOnlyTitle',
  teenCheckpoint: 'nudge.teenCheckpointTitle',
  teenApproaching: 'nudge.teenApproachingTitle',
  teenSpent: 'nudge.teenSpentTitle',
  teenCurfew: 'nudge.teenCurfewTitle',
  teenTimeOnly: 'nudge.teenTimeOnlyTitle',
};

export const NUDGE_BODIES: Record<CopySlot, TKey> = {
  littleCheckpoint: 'nudge.littleCheckpointBody',
  littleApproaching: 'nudge.littleApproachingBody',
  littleSpent: 'nudge.littleSpentBody',
  littleCurfew: 'nudge.littleCurfewBody',
  littleTimeOnly: 'nudge.littleTimeOnlyBody',
  juniorCheckpoint: 'nudge.juniorCheckpointBody',
  juniorApproaching: 'nudge.juniorApproachingBody',
  juniorSpent: 'nudge.juniorSpentBody',
  juniorCurfew: 'nudge.juniorCurfewBody',
  juniorTimeOnly: 'nudge.juniorTimeOnlyBody',
  teenCheckpoint: 'nudge.teenCheckpointBody',
  teenApproaching: 'nudge.teenApproachingBody',
  teenSpent: 'nudge.teenSpentBody',
  teenCurfew: 'nudge.teenCurfewBody',
  teenTimeOnly: 'nudge.teenTimeOnlyBody',
};

export const SUGGESTION_KEYS: Record<NudgeSuggestion, TKey> = {
  move: 'nudge.suggestMove',
  outdoor: 'nudge.suggestOutdoor',
  read: 'nudge.suggestRead',
  create: 'nudge.suggestCreate',
  calm: 'nudge.suggestCalm',
  social: 'nudge.suggestSocial',
};

export function slotFor(band: AgeBand, nudge: Nudge): CopySlot {
  // With no budget set there is no "left" and no "of", so the sentences that
  // name them are not available. This is the reminders-only setup, which is
  // where most families should start.
  if (nudge.budgetMin === null && nudge.kind !== 'curfew') {
    return `${nudgeTier(band)}TimeOnly`;
  }
  return nudgeCopyId(band, nudge);
}

export type Translate = (key: TKey, vars?: TVars) => string;

/** The two lines, ready to show. Split out so a screen can preview them. */
export function nudgeText(
  t: Translate,
  band: AgeBand,
  buddyName: string,
  nudge: Nudge,
): { title: string; body: string } {
  const slot = slotFor(band, nudge);
  const vars: TVars = {
    buddy: buddyName,
    used: nudge.usedMin,
    left: nudge.leftMin ?? 0,
    budget: nudge.budgetMin ?? 0,
    suggestion: t(SUGGESTION_KEYS[nudge.suggestion]),
  };
  return { title: t(NUDGE_TITLES[slot], vars), body: t(NUDGE_BODIES[slot], vars) };
}

/**
 * A whole day of reminders, rendered, for the native watcher to post by index.
 *
 * The watcher is the only thing running while a child is in another app, and
 * it cannot translate, cannot tell a four year old from a twelve year old and
 * cannot decide which suggestion comes next. So it is given the finished
 * sentences and a counter, which is the smallest thing worth trusting a
 * background service with.
 */
export function renderNudgeList(
  t: Translate,
  band: AgeBand,
  buddyName: string,
  nudges: Nudge[],
): { titles: string[]; bodies: string[] } {
  const titles: string[] = [];
  const bodies: string[] = [];
  for (const nudge of nudges) {
    const text = nudgeText(t, band, buddyName, nudge);
    titles.push(text.title);
    bodies.push(text.body);
  }
  return { titles, bodies };
}
