/**
 * Everything the server holds the line on.
 *
 * A phone is not trusted with anything here. Usernames are checked, invite
 * codes are generated, and every number on the board is clamped before it
 * reaches the database.
 *
 * The username format and the uniqueness key are mirrored in the app, in
 * `src/online/username.ts`, so a parent sees "too short" while typing instead
 * of after a round trip. `scripts/test-social.ts` runs both against the same
 * table of names. Change one, change the other.
 */

const crypto = require('node:crypto');

/* ---------------------------------------------------------------- usernames */

/**
 * Latin letters plus the Turkish and Azerbaijani ones, so Çağla and Əli can
 * spell their own names. Nothing else: no spaces, no emoji, no Cyrillic `а`
 * that looks exactly like a Latin `a`.
 */
const LETTERS = 'A-Za-zÇçĞğİıÖöŞşÜüƏə';
const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
/** Enough for "Arif2017", not enough for a phone number. */
const USERNAME_MAX_DIGITS = 4;

const USERNAME_CHARS = new RegExp(`^[${LETTERS}0-9_]+$`, 'u');
const STARTS_WITH_LETTER = new RegExp(`^[${LETTERS}]`, 'u');

/**
 * Folded before comparing, so `Çağla`, `cagla` and `CAGLA` are one username.
 * Done by hand rather than with `toLowerCase`, which turns `İ` into `i` plus a
 * combining dot and would let `EMİN` and `emin` exist side by side.
 */
const FOLD = {
  Ç: 'c', ç: 'c',
  Ğ: 'g', ğ: 'g',
  İ: 'i', I: 'i', ı: 'i',
  Ö: 'o', ö: 'o',
  Ş: 's', ş: 's',
  Ü: 'u', ü: 'u',
  Ə: 'e', ə: 'e',
};

/**
 * Checked as substrings of the folded key. Kept to roots that do not turn up
 * inside ordinary words, because a list that blocks "kanal" or "ışık" hurts
 * more children than it protects.
 */
const RUDE = [
  // English
  'fuck', 'shit', 'bitch', 'cunt', 'whore', 'slut', 'porn', 'nigg', 'fagg', 'rapist',
  'hitler', 'nazi', 'penis', 'vagina', 'dildo', 'boob', 'bastard', 'asshole', 'wank', 'jizz',
  // Turkish
  'amina', 'sikis', 'sikim', 'siktim', 'sikerim', 'sikik', 'yarrak', 'yarak', 'orospu',
  'orosbu', 'kahpe', 'pezevenk', 'gavat', 'ibne', 'gotveren', 'kerhane', 'kaltak', 'surtuk',
  // Azerbaijani, and the Russian that turns up in it
  'qehbe', 'peyser', 'gicdillaq', 'sikdim', 'blyat', 'blyad', 'nahuy', 'pidar',
];

/** Names that could pass for the app talking. */
const RESERVED_ANYWHERE = ['screenless', 'admin', 'moderator'];
const RESERVED_EXACT = ['support', 'official', 'system', 'root', 'teknofest'];

function usernameKey(display) {
  let key = '';
  for (const char of display) key += FOLD[char] ?? char;
  return key.toLowerCase().replace(/_/g, '');
}

/**
 * Format only. Shared with the app, which cannot know what is rude or taken.
 * Returns null when the format is fine, otherwise the first thing wrong.
 */
function usernameFormatProblem(raw) {
  const name = String(raw ?? '').normalize('NFC').trim();
  const length = [...name].length;
  if (length < USERNAME_MIN) return 'short';
  if (length > USERNAME_MAX) return 'long';
  if (!USERNAME_CHARS.test(name)) return 'chars';
  if (!STARTS_WITH_LETTER.test(name)) return 'start';
  if ((name.match(/[0-9]/g) ?? []).length > USERNAME_MAX_DIGITS) return 'digits';
  if (usernameKey(name).length < USERNAME_MIN) return 'short';
  return null;
}

/** The full server check: format, then the words nobody gets to use. */
function checkUsername(raw) {
  const problem = usernameFormatProblem(raw);
  if (problem) return { ok: false, reason: problem };

  const username = String(raw).normalize('NFC').trim();
  const key = usernameKey(username);
  if (RUDE.some((word) => key.includes(word))) return { ok: false, reason: 'rude' };
  if (RESERVED_ANYWHERE.some((word) => key.includes(word)) || RESERVED_EXACT.includes(key)) {
    return { ok: false, reason: 'reserved' };
  }
  return { ok: true, username, key };
}

/* ------------------------------------------------------------- invite codes */

/** No I, L, O, 0 or 1, so a code read off a friend's screen cannot be misread. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

function newInviteCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return code;
}

/** Accepts `k7m-2qx`, `K7M 2QX` and the like, as typed by a parent. */
function normaliseInviteCode(raw) {
  const code = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
}

/* ------------------------------------------------------------ credentials */

/** Prefixed so an id can never start with `__`, which Firestore reserves. */
function newPlayerId() {
  return `p${crypto.randomBytes(12).toString('base64url')}`;
}

/** Handed to the phone once. Only its hash is ever stored. */
function newToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function tokenMatches(token, expectedHash) {
  if (typeof token !== 'string' || typeof expectedHash !== 'string') return false;
  const actual = Buffer.from(hashToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/* ------------------------------------------------------------------ scores */

const BUDDY_IDS = [
  'fox', 'robot', 'cat', 'dino', 'owl', 'star', 'bear', 'tiger', 'bunny', 'panda', 'turtle', 'rocket',
];

/** Same thresholds as `src/engine/progress.ts`. The level is worked out here, never taken from the phone. */
const LEVEL_THRESHOLDS = [0, 30, 80, 160, 280, 450, 700];

function levelForStars(stars) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (stars >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/**
 * How fast stars are allowed to arrive.
 *
 * A mission is worth 5 to 20 stars and needs a parent to confirm it, so a busy
 * day is well under a hundred. A phone that sends more than the allowance keeps
 * the rest and sends it again later, so an honest child who was offline for a
 * week catches up, and a patched app gains 25 stars an hour at most.
 */
const STAR_BURST = 150;
const STARS_PER_HOUR = 25;
/** A child who played for months before the parent picked a username brings it all along. */
const FIRST_IMPORT = 3000;
const MAX_STARS = 1_000_000;
const MAX_MISSIONS = 100_000;
const MAX_STREAK = 3650;
/** Seven days at the app's own daily step ceiling. */
const MAX_WEEK_STEPS = 7 * 40_000;

const MAX_FRIENDS = 50;

function wholeNumber(value, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

/* -------------------------------------------------------------------- weeks */

const WEEK_PATTERN = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

/** ISO 8601 week of a moment, in UTC. The app works its own out in local time. */
function isoWeekKey(ms) {
  const date = new Date(ms);
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function isWeekKey(value) {
  return typeof value === 'string' && WEEK_PATTERN.test(value);
}

/**
 * The weeks a phone may report against. Its local week can be a day either
 * side of ours, and nothing more: a week key from 2099 would otherwise freeze
 * the weekly numbers for good.
 */
function plausibleWeeks(now) {
  const week = 7 * 86_400_000;
  return new Set([isoWeekKey(now - week), isoWeekKey(now), isoWeekKey(now + week)]);
}

/**
 * Folds a score from the phone into what is stored.
 *
 * Stars never go down: the app has nothing that spends them, and a reset
 * deletes the username. Week stars are capped by the stars that actually
 * arrived since the week began, so the weekly board cannot be bought with an
 * old total.
 */
function acceptScore(player, input, now) {
  const since = player.scoredAt ?? player.createdAt;
  const hours = Math.max(0, (now - since) / 3_600_000);
  const allowance = player.scoredAt ? STAR_BURST + STARS_PER_HOUR * hours : FIRST_IMPORT;

  const wanted = wholeNumber(input.stars, MAX_STARS) ?? player.stars;
  const gain = Math.min(Math.max(0, wanted - player.stars), Math.floor(allowance));
  const stars = Math.min(MAX_STARS, player.stars + gain);

  const next = {
    stars,
    missions: Math.min(wholeNumber(input.missions, MAX_MISSIONS) ?? player.missions, stars),
    streak: wholeNumber(input.streak, MAX_STREAK) ?? player.streak,
    buddyId: BUDDY_IDS.includes(input.buddyId) ? input.buddyId : player.buddyId,
    weekKey: player.weekKey,
    weekBase: player.weekBase,
    weekStars: player.weekStars,
    weekSteps: player.weekSteps,
    scoredAt: now,
    updatedAt: now,
  };

  const week = input.weekKey;
  const usable =
    isWeekKey(week) && plausibleWeeks(now).has(week) && (!player.weekKey || week >= player.weekKey);

  if (usable) {
    if (week !== player.weekKey) {
      next.weekKey = week;
      // Whatever the server held before this week started is last week's.
      next.weekBase = player.stars;
    }
    const earnedThisWeek = Math.max(0, stars - next.weekBase);
    next.weekStars = Math.min(wholeNumber(input.weekStars, MAX_STARS) ?? 0, earnedThisWeek);
    next.weekSteps = wholeNumber(input.weekSteps, MAX_WEEK_STEPS) ?? 0;
  }

  return next;
}

module.exports = {
  USERNAME_MIN,
  USERNAME_MAX,
  USERNAME_MAX_DIGITS,
  usernameKey,
  usernameFormatProblem,
  checkUsername,
  CODE_ALPHABET,
  CODE_LENGTH,
  newInviteCode,
  normaliseInviteCode,
  newPlayerId,
  newToken,
  hashToken,
  tokenMatches,
  BUDDY_IDS,
  levelForStars,
  STAR_BURST,
  STARS_PER_HOUR,
  FIRST_IMPORT,
  MAX_FRIENDS,
  MAX_WEEK_STEPS,
  isoWeekKey,
  isWeekKey,
  acceptScore,
};
