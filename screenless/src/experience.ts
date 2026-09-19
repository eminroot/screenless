import { useApp } from './state/app-state';
import type { AgeBand } from './state/types';

/**
 * Which child interface a profile gets.
 *
 * Every age group gets a design of its own, because the difference between
 * them is not a matter of degree. The research on this is blunt: a six year
 * old will reject an interface built for a five year old on sight, and a
 * twelve year old will not open something on the bus that looks like it was
 * made for their little brother. So the tiers have to look like different
 * apps, not like the same app with bigger buttons.
 *
 * - Ages 3-5 get `src/little`: a painted pastel world, one decision per
 *   screen, a mascot the height of the screen, everything moulded and
 *   pressable. Pictures carry the meaning because nobody here reads.
 * - Ages 6-9 get `src/junior`: an expedition on a deep indigo ground, vivid
 *   comic blocks cut out in ink and dropped on hard shadows, icons that are
 *   objects rather than symbols, and the numbers written out.
 * - Ages 10-13 get `src/teen`: near-black, hairline rules, one acid accent,
 *   large tight numerals, and the buddy shrunk to an avatar beside a line of
 *   text. The framing shifts from a mission handed over to a log kept.
 *
 * `classic` is the original interface. No age band maps to it any more; it is
 * kept as the fallback so an unreadable stored profile still renders something
 * rather than a blank screen.
 *
 * Adding one: extend `Experience`, map the age band here, give it a folder
 * next to the others, and branch on it in the route files that already branch
 * (the tab screens, the tab bar, mission and celebrate). Only the child's
 * screens branch. Setup and the parent area stay shared.
 */
export type Experience = 'little' | 'junior' | 'teen' | 'classic';

export function experienceFor(band: AgeBand | undefined): Experience {
  if (band === '3-5') return 'little';
  if (band === '6-9') return 'junior';
  if (band === '10-13') return 'teen';
  return 'classic';
}

export function useExperience(): Experience {
  const { profile } = useApp();
  return experienceFor(profile?.ageBand);
}
