import type { PartOfDay, Place, TaskCategory } from '../state/types';

/**
 * What the app knows about right now without asking for a single permission:
 * the clock, the calendar, and two things the child taps on the home screen.
 */
export type MissionContext = {
  partOfDay: PartOfDay;
  weekend: boolean;
  /** How long the child says they have. Null means no limit. */
  maxMinutes: number | null;
  /** Set when the child says they are stuck indoors, e.g. it is raining. */
  indoorOnly: boolean;
};

/** How long the child has, offered as three taps rather than a number pad. */
export const TIME_CHOICES = [5, 15, null] as const;
export type TimeChoice = (typeof TIME_CHOICES)[number];

export function partOfDay(date: Date = new Date()): PartOfDay {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function currentContext(
  options: { maxMinutes?: number | null; indoorOnly?: boolean } = {},
): MissionContext {
  return {
    partOfDay: partOfDay(),
    weekend: isWeekend(),
    maxMinutes: options.maxMinutes ?? null,
    indoorOnly: options.indoorOnly ?? false,
  };
}

/**
 * When a mission fits, for the ones that do not say so themselves.
 *
 * Quiet things land in the evening, running about lands after school, and
 * making things works whenever. This is a preference, never a filter: a child
 * who wants to run at eight in the morning still can.
 */
const inferredParts: Record<TaskCategory, PartOfDay[]> = {
  move: ['afternoon'],
  outdoor: ['morning', 'afternoon'],
  create: ['morning', 'afternoon', 'evening'],
  social: ['afternoon', 'evening'],
  calm: ['evening'],
};

export function partsFor(
  category: TaskCategory,
  declared: PartOfDay[] | undefined,
): { parts: PartOfDay[]; declared: boolean } {
  if (declared && declared.length > 0) return { parts: declared, declared: true };
  return { parts: inferredParts[category], declared: false };
}

export function placeFor(category: TaskCategory, declared: Place | undefined): Place {
  if (declared) return declared;
  return category === 'outdoor' ? 'outdoor' : 'any';
}
