import type { Language } from '../i18n';

/**
 * Turning the hub's numbers into something readable at arm's length.
 *
 * Pure and importing nothing but a type, so `npm run test:format` can drive it
 * under plain Node. Worth testing rather than eyeballing: almost everything
 * here has an edge case that only shows up on the day it matters, and most of
 * them are about zero, midnight or a week that has not happened yet.
 */

const MINUTE = 60;

/**
 * Seconds as `2h 10m`.
 *
 * Rounded to the nearest minute, and never shown as `0h 14m`: an hour that is
 * not there should not take up space in a column of figures.
 */
export function formatSpan(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / MINUTE));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** The same, split, for drawing the number and the unit at different sizes. */
export function splitSpan(seconds: number): { value: string; unit: string } {
  const total = Math.max(0, Math.round(seconds / MINUTE));
  if (total < 60) return { value: String(total), unit: 'm' };
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0
    ? { value: String(hours), unit: 'h' }
    : { value: `${hours}:${String(minutes).padStart(2, '0')}`, unit: 'h' };
}

/** Minutes from midnight as `21:00`. */
export function formatClock(minuteOfDay: number): string {
  const wrapped = ((Math.round(minuteOfDay) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Thousands separated, because five digit step counts are unreadable without it. */
export function formatCount(value: number, language: Language): string {
  const locale = language === 'en' ? 'en-GB' : language === 'tr' ? 'tr-TR' : 'az-AZ';
  try {
    return new Intl.NumberFormat(locale).format(Math.round(value));
  } catch {
    return String(Math.round(value));
  }
}

/**
 * How a change should read.
 *
 * Anything inside five percent is "about the same". A family whose screen time
 * moved by three percent has not done anything; calling that an improvement
 * teaches them to ignore the arrow the week it means something.
 *
 * Note that `down` is not automatically good. Screen time falling is; active
 * minutes falling is not, and the caller says which by passing `lowerIsBetter`.
 */
export type Change = {
  direction: 'up' | 'down' | 'flat';
  /** Always positive. The direction carries the sign. */
  percent: number;
  /** Whether this moved the way a family wants. Null when it is flat. */
  good: boolean | null;
};

export const FLAT_BAND = 5;

export function describeChange(percent: number | null, lowerIsBetter: boolean): Change | null {
  if (percent === null || !Number.isFinite(percent)) return null;
  const size = Math.abs(Math.round(percent));
  if (size < FLAT_BAND) return { direction: 'flat', percent: size, good: null };
  const direction = percent > 0 ? 'up' : 'down';
  return { direction, percent: size, good: lowerIsBetter ? direction === 'down' : direction === 'up' };
}

const WEEKDAY_NAMES: Record<Language, string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  az: ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz'],
};

const WEEKDAY_LONG: Record<Language, string[]> = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  tr: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'],
  az: ['Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə', 'Bazar'],
};

/** Monday is 0, matching the hub's weekday profile. */
export function weekdayShort(index: number, language: Language): string {
  return WEEKDAY_NAMES[language][((index % 7) + 7) % 7];
}

export function weekdayLong(index: number, language: Language): string {
  return WEEKDAY_LONG[language][((index % 7) + 7) % 7];
}

/** The weekday of a day key, Monday first. */
export function weekdayOf(dayKey: string): number {
  return (new Date(dayKey + 'T00:00:00Z').getUTCDay() + 6) % 7;
}

/** `19 Sep`, for an axis or a "best day" line. */
export function formatDayShort(dayKey: string, language: Language): string {
  const date = new Date(dayKey + 'T12:00:00Z');
  if (Number.isNaN(date.getTime())) return dayKey;
  const locale = language === 'en' ? 'en-GB' : language === 'tr' ? 'tr-TR' : 'az-AZ';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return dayKey.slice(5);
  }
}

/** The day of the month alone, for a dense bar chart axis. */
export function dayOfMonth(dayKey: string): string {
  return String(Number(dayKey.slice(8, 10)));
}

/**
 * How long ago something happened, in words.
 *
 * Coarse on purpose. A parent glancing at a list wants "this morning" or
 * "yesterday", and "14 minutes ago" is precision nobody asked for about a
 * number that is only refreshed every ten minutes anyway.
 */
export function relativeTime(iso: string | null, language: Language, now = Date.now()): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;

  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  const pick = (en: string, tr: string, az: string) =>
    language === 'tr' ? tr : language === 'az' ? az : en;

  if (minutes < 5) return pick('just now', 'az önce', 'indicə');
  if (minutes < 60) return pick(`${minutes} min ago`, `${minutes} dk önce`, `${minutes} dəq əvvəl`);

  const hours = Math.round(minutes / 60);
  if (hours < 24) return pick(`${hours}h ago`, `${hours} sa önce`, `${hours} saat əvvəl`);

  const days = Math.round(hours / 24);
  if (days === 1) return pick('yesterday', 'dün', 'dünən');
  if (days < 7) return pick(`${days} days ago`, `${days} gün önce`, `${days} gün əvvəl`);

  const weeks = Math.round(days / 7);
  if (weeks < 5) return pick(`${weeks}w ago`, `${weeks} hafta önce`, `${weeks} həftə əvvəl`);
  return pick('a while ago', 'bir süre önce', 'bir müddət əvvəl');
}

/**
 * The tallest value a chart has to fit, rounded up to something readable.
 *
 * Charts are compared to one another across weeks, so the axis has to land on
 * round numbers rather than on whatever today's maximum happens to be. Always
 * at least one step, so an empty chart still has a frame.
 */
export function niceMax(values: number[], step: number): number {
  const top = values.reduce((max, value) => Math.max(max, value), 0);
  if (top <= 0) return step;
  return Math.ceil(top / step) * step;
}
