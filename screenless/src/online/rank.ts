import type { BoardEntry } from './api';
import type { ScoreSnapshot } from './score';

/**
 * Ordering the board. Pure, so it is covered by `scripts/test-social.ts`.
 */

export type BoardPeriod = 'week' | 'all';

export type RankedEntry = BoardEntry & {
  /** 1 based. Children on the same number share a place: 1, 1, 3. */
  rank: number;
  /** The number the board is ordered by for the chosen period. */
  value: number;
};

export function rankBoard(entries: BoardEntry[], period: BoardPeriod): RankedEntry[] {
  const valueOf = (entry: BoardEntry) => (period === 'week' ? entry.weekStars : entry.stars);
  const sorted = [...entries].sort(
    (a, b) => valueOf(b) - valueOf(a) || a.username.localeCompare(b.username),
  );

  let rank = 0;
  let previous: number | null = null;
  return sorted.map((entry, index) => {
    const value = valueOf(entry);
    if (value !== previous) {
      rank = index + 1;
      previous = value;
    }
    return { ...entry, rank, value };
  });
}

/**
 * The child's own row, with the numbers on this phone.
 *
 * The server only knows what was last sent, so right after a mission the board
 * would show the old total. A child who just earned twelve stars should see
 * them. Friends still see what the server accepted.
 */
export function withLocalScore(entries: BoardEntry[], local: ScoreSnapshot | null): BoardEntry[] {
  if (!local) return entries;
  return entries.map((entry) =>
    entry.me
      ? {
          ...entry,
          buddyId: local.buddyId,
          stars: Math.max(entry.stars, local.stars),
          weekStars: Math.max(entry.weekStars, local.weekStars),
          weekSteps: Math.max(entry.weekSteps, local.weekSteps),
          missions: Math.max(entry.missions, local.missions),
          streak: local.streak,
        }
      : entry,
  );
}
