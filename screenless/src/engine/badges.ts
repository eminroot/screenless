/**
 * Treasure badges: six printed QR codes for the 6-9 hunts.
 *
 * A parent prints one sheet, sticks badges 1 to 5 in safe spots around the
 * home and keeps badge 6 back for hiding. Missions then send the child to them
 * — find the one a grown up hid, or visit three in a set order — and scanning
 * the right badge is the proof, which is far stronger than a tap: the child
 * had to be standing in front of it.
 *
 * Every badge also carries a three digit code printed under the QR, for a
 * family without a printer (the parent copies the codes onto sticky notes) or
 * a phone whose camera cannot focus. Typing the code is accepted the same way.
 *
 * Pure and dependency free, so `scripts/test-verify.ts` can drive it.
 */

export const BADGE_COUNT = 6;
/** The badges that stay stuck up, for routes. */
export const ROUTE_BADGES: readonly number[] = [1, 2, 3, 4, 5];
/** The badge that lives in a drawer until a grown up hides it. */
export const HIDE_BADGE = 6;

/** No I, L, O, 0 or 1, so a key read off a sheet cannot be misread. */
const KEY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const KEY_LENGTH = 10;
/**
 * Upper case letters, digits and colons only, which is QR "alphanumeric" mode
 * and keeps the printed code small enough to scan from across a room.
 */
const PREFIX = 'SCREENLESS:B1';

export function createBadgeKey(random: () => number = Math.random): string {
  let key = '';
  for (let i = 0; i < KEY_LENGTH; i += 1) {
    key += KEY_ALPHABET[Math.floor(random() * KEY_ALPHABET.length) % KEY_ALPHABET.length];
  }
  return key;
}

/** FNV-1a, 32 bit. Not for secrecy; only so a badge cannot be typed up by hand. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function checksum(key: string, n: number): string {
  return (hash(`${key}:${n}`) % 1296).toString(36).toUpperCase().padStart(2, '0');
}

export function isBadgeNumber(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= BADGE_COUNT;
}

/** What the QR code on badge `n` says. */
export function badgePayload(key: string, n: number): string {
  return `${PREFIX}:${key}:${n}:${checksum(key, n)}`;
}

/**
 * Which of this family's badges a scanned code is, or null.
 *
 * Null covers everything else a camera might meet: a QR from a cereal box, a
 * badge from another family's sheet, a sheet this family retired.
 */
export function readBadge(key: string, scanned: string): number | null {
  const parts = scanned.trim().toUpperCase().split(':');
  if (parts.length !== 5) return null;
  const [brand, version, badgeKey, number, sum] = parts;
  if (`${brand}:${version}` !== PREFIX) return null;
  if (badgeKey !== key.toUpperCase()) return null;
  const n = Number(number);
  if (!isBadgeNumber(n)) return null;
  return sum === checksum(key.toUpperCase(), n) ? n : null;
}

/** True for anything that looks like a ScreenLess badge at all, ours or not. */
export function looksLikeBadge(scanned: string): boolean {
  return scanned.trim().toUpperCase().startsWith(`${PREFIX}:`);
}

/**
 * The three digit codes, one per badge, all different within a sheet.
 *
 * Derived from the key rather than stored, so there is nothing to keep in
 * step. A collision inside the sheet is resolved by salting and trying again.
 */
export function badgeCodes(key: string): string[] {
  const codes: string[] = [];
  for (let n = 1; n <= BADGE_COUNT; n += 1) {
    let salt = 0;
    let code = '';
    do {
      code = String(hash(`${key.toUpperCase()}:code:${n}:${salt}`) % 1000).padStart(3, '0');
      salt += 1;
    } while (codes.includes(code));
    codes.push(code);
  }
  return codes;
}

export function badgeCode(key: string, n: number): string {
  return badgeCodes(key)[n - 1] ?? '';
}

/** Which badge a typed code belongs to, or null. */
export function matchCode(key: string, typed: string): number | null {
  const code = typed.replace(/\D/g, '');
  if (code.length !== 3) return null;
  const index = badgeCodes(key).indexOf(code);
  return index === -1 ? null : index + 1;
}

/** A route through `count` different stuck-up badges, in a fresh order each time. */
export function planRoute(count: number, random: () => number = Math.random): number[] {
  const pool = [...ROUTE_BADGES];
  // Fisher-Yates, then take the front.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(1, Math.min(count, pool.length)));
}
