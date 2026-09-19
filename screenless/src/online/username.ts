/**
 * Username format, checked while the parent types.
 *
 * A copy of `usernameFormatProblem` in `server/firebase/leaderboard/src/rules.js`
 * so "too short" appears instantly rather than after a round trip. The server
 * stays the authority and also refuses rude and reserved names, which the app
 * does not try to know. `scripts/test-social.ts` checks both agree on every
 * case in its table. Change one, change the other.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 16;
const USERNAME_MAX_DIGITS = 4;

const LETTERS = 'A-Za-zÇçĞğİıÖöŞşÜüƏə';
const USERNAME_CHARS = new RegExp(`^[${LETTERS}0-9_]+$`, 'u');
const STARTS_WITH_LETTER = new RegExp(`^[${LETTERS}]`, 'u');

const FOLD: Record<string, string> = {
  Ç: 'c', ç: 'c',
  Ğ: 'g', ğ: 'g',
  İ: 'i', I: 'i', ı: 'i',
  Ö: 'o', ö: 'o',
  Ş: 's', ş: 's',
  Ü: 'u', ü: 'u',
  Ə: 'e', ə: 'e',
};

/** Format reasons, then the two only the server can give. */
export type UsernameProblem = 'short' | 'long' | 'chars' | 'start' | 'digits' | 'rude' | 'reserved';

export function usernameKey(display: string): string {
  let key = '';
  for (const char of display) key += FOLD[char] ?? char;
  return key.toLowerCase().replace(/_/g, '');
}

export function cleanUsername(raw: string): string {
  return raw.normalize('NFC').trim();
}

export function usernameFormatProblem(raw: string): UsernameProblem | null {
  const name = cleanUsername(raw);
  const length = [...name].length;
  if (length < USERNAME_MIN) return 'short';
  if (length > USERNAME_MAX) return 'long';
  if (!USERNAME_CHARS.test(name)) return 'chars';
  if (!STARTS_WITH_LETTER.test(name)) return 'start';
  if ((name.match(/[0-9]/g) ?? []).length > USERNAME_MAX_DIGITS) return 'digits';
  if (usernameKey(name).length < USERNAME_MIN) return 'short';
  return null;
}

/**
 * Close alternatives for a name that is taken. Not checked in advance: each
 * one costs a request, and tapping one runs the normal check anyway.
 */
export function suggestUsernames(base: string, count = 3): string[] {
  const stem = cleanUsername(base).replace(/[0-9]+$/, '').slice(0, USERNAME_MAX - 4) || 'Star';
  const out = new Set<string>();
  for (let attempt = 0; out.size < count && attempt < 20; attempt += 1) {
    const number = 10 + Math.floor(Math.random() * 990);
    const candidate = attempt % 3 === 2 ? `${stem}_${number}` : `${stem}${number}`;
    if (!usernameFormatProblem(candidate)) out.add(candidate);
  }
  return [...out];
}

/** Invite codes as a parent types them: any case, with or without the dash. */
export function normaliseInviteCode(raw: string): string | null {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(code) ? code : null;
}

/** `K7M2QX` as `K7M-2QX`, easier to read off one screen and type into another. */
export function formatInviteCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}
