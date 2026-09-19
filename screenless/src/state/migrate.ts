import {
  AGE_BANDS,
  emptySocial,
  type AgeBand,
  type ChildProfile,
  type Mission,
  type OnlineAccount,
  type Social,
} from './types';

/**
 * Bringing stored data from older builds up to date.
 *
 * Pure and free of React Native imports, so `scripts/test-social.ts` can run
 * it under plain Node.
 */

/**
 * Every age group the app has ever had, and where each one goes now.
 *
 * Two rounds of regrouping are folded in here: the July 2026 groups (4-5, 6-7,
 * 8-10) and the September 2026 ones (6-8, 9-11). A band always moves *up* when
 * it straddles a boundary, because most of its ages sit in the higher group —
 * 9-11 is two thirds 10 and 11, and 8-10 is two thirds 9 and 10. A parent can
 * change it in the parent area either way, so erring upwards only ever costs
 * one tap and never leaves an older child with a toddler interface.
 */
const LEGACY_AGE_BANDS: Record<string, AgeBand> = {
  '4-5': '3-5',
  '6-7': '6-9',
  '8-10': '10-14',
  '6-8': '6-9',
  '9-11': '10-14',
};

export function migrateAgeBand(value: unknown, fallback: AgeBand = '6-9'): AgeBand {
  if (typeof value !== 'string') return fallback;
  if ((AGE_BANDS as readonly string[]).includes(value)) return value as AgeBand;
  return LEGACY_AGE_BANDS[value] ?? fallback;
}

export function migrateProfile(stored: ChildProfile | null | undefined): ChildProfile | null {
  if (!stored) return null;
  return { ...stored, ageBand: migrateAgeBand(stored.ageBand) };
}

/** History keeps its own copy of each task, including the bands it was written for. */
export function migrateMission(mission: Mission): Mission {
  const bands = mission.task?.ageBands;
  if (!Array.isArray(bands) || bands.every((band) => (AGE_BANDS as readonly string[]).includes(band))) {
    return mission;
  }
  return {
    ...mission,
    task: { ...mission.task, ageBands: [...new Set(bands.map((band) => migrateAgeBand(band)))] },
  };
}

function isAccount(value: unknown): value is OnlineAccount {
  const account = value as Partial<OnlineAccount> | null;
  return (
    typeof account?.playerId === 'string' &&
    typeof account.token === 'string' &&
    typeof account.username === 'string' &&
    typeof account.inviteCode === 'string'
  );
}

/**
 * A family that finished setup before the friends board existed never answered
 * the question, and must not be treated as having said yes. They come in as
 * offline, and the parent area offers the choice.
 */
export function reconcileSocial(stored: Partial<Social> | undefined, hasProfile: boolean): Social {
  const fallback: Social = { ...emptySocial, mode: hasProfile ? 'offline' : 'unset' };
  if (!stored || typeof stored !== 'object') return fallback;

  const lostUsername = typeof stored.lostUsername === 'string' ? stored.lostUsername : null;

  if (stored.mode === 'online' && isAccount(stored.account)) {
    return {
      mode: 'online',
      account: { ...stored.account, createdAt: stored.account.createdAt ?? new Date().toISOString() },
      lastSent: typeof stored.lastSent === 'string' ? stored.lastSent : null,
      lastSentAt: typeof stored.lastSentAt === 'string' ? stored.lastSentAt : null,
      lostUsername,
    };
  }

  if (stored.mode === 'offline') return { ...emptySocial, mode: 'offline', lostUsername };
  return { ...fallback, lostUsername };
}
