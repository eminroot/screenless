'use strict';

/**
 * What the hub will accept, and what it silently refuses to store.
 *
 * Every field that arrives from a phone passes through here first. The rule is
 * a whitelist, not a filter: an unknown key is dropped rather than rejected,
 * so an older app can keep reporting after the shape grows and a newer one can
 * send a field this build has never heard of without being turned away.
 *
 * The important part is what is *not* in the daily report. A child's name,
 * their mission text, their private notes, their photos, their interests and
 * anything they typed never leave the phone. The parent app shows a name
 * because the parent typed it into the parent app; the child's device has
 * never sent one, and this file would drop it if it did.
 */

const AGE_BANDS = ['3-5', '6-9', '10-14'];
const CATEGORIES = ['move', 'outdoor', 'create', 'social', 'calm'];
const TIERS = ['off', 'notice', 'interrupt', 'block'];
const PLATFORMS = ['android', 'ios', 'web'];

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A day's numbers are capped at something a day cannot exceed, so one phone
 * with a broken clock cannot skew a month of charts into uselessness.
 */
const DAY_SECONDS = 86_400;

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function isDayKey(value) {
  if (typeof value !== 'string' || !DAY_RE.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/* ------------------------------------------------------------------ parent */

function checkEmail(value) {
  const email = String(value == null ? '' : value).trim().toLowerCase();
  if (email.length < 5 || email.length > 190) return { ok: false, reason: 'email' };
  if (!EMAIL_RE.test(email)) return { ok: false, reason: 'email' };
  return { ok: true, value: email };
}

/**
 * Ten characters, and no other rule.
 *
 * Length beats composition rules by every measure anyone has published, and a
 * parent forced to bolt a punctuation mark onto the end of a word picks a
 * worse password than one simply asked for a longer one. The ceiling is there
 * because scrypt has to hash whatever arrives.
 */
function checkPassword(value) {
  const password = String(value == null ? '' : value);
  if (password.length < 10) return { ok: false, reason: 'short' };
  if (password.length > 200) return { ok: false, reason: 'long' };
  return { ok: true, value: password };
}

function checkChildName(value) {
  const name = String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  if (name.length < 1 || name.length > 40) return { ok: false, reason: 'name' };
  return { ok: true, value: name };
}

function checkAgeBand(value) {
  return AGE_BANDS.includes(value) ? { ok: true, value } : { ok: false, reason: 'ageBand' };
}

function checkPlatform(value) {
  return PLATFORMS.includes(value) ? value : 'android';
}

/* -------------------------------------------------------------- the limits */

/**
 * The settings a parent sets for one child.
 *
 * `revision` is bumped by the store rather than here: the device polls for it
 * and only re-applies its plan when the number moves, so a parent opening the
 * limits screen and changing nothing costs the child's phone nothing.
 */
function cleanLimits(input) {
  const body = input && typeof input === 'object' ? input : {};
  const curfew = body.curfew && typeof body.curfew === 'object' ? body.curfew : null;
  return {
    enabled: body.enabled === true,
    tier: TIERS.includes(body.tier) ? body.tier : 'notice',
    dailyBudgetMin: clampInt(body.dailyBudgetMin, 0, 1440),
    /** Zero turns the interval nudges off and leaves only the threshold ones. */
    nudgeEveryMin: clampInt(body.nudgeEveryMin, 0, 240),
    graceCount: clampInt(body.graceCount, 0, 10),
    graceMinutes: clampInt(body.graceMinutes, 0, 60),
    curfewStartMin: curfew ? clampInt(curfew.startMin, 0, 1439) : -1,
    curfewEndMin: curfew ? clampInt(curfew.endMin, 0, 1439) : -1,
    /**
     * Android package names. iOS sends nothing here by design: Apple never
     * tells an app which apps a family picked.
     */
    watched: Array.isArray(body.watched)
      ? body.watched
          .filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 190)
          .slice(0, 60)
      : [],
  };
}

function defaultLimits() {
  return cleanLimits({
    enabled: false,
    tier: 'notice',
    dailyBudgetMin: 120,
    nudgeEveryMin: 30,
    graceCount: 2,
    graceMinutes: 5,
  });
}

/* -------------------------------------------------------- the daily report */

/**
 * One day of one child, as the phone measured it.
 *
 * Returns null for a row that cannot be trusted at all, meaning a missing or
 * impossible date, because a report keyed to nothing has nowhere to go. Every
 * other bad value is clamped rather than refused: a phone reporting forty
 * hours of screen time has a clock problem, and throwing the whole day away
 * would lose the mission counts that were fine.
 */
function cleanDay(input) {
  const body = input && typeof input === 'object' ? input : {};
  if (!isDayKey(body.date)) return null;

  const categories = {};
  const source = body.categories && typeof body.categories === 'object' ? body.categories : {};
  for (const key of CATEGORIES) categories[key] = clampInt(source[key], 0, 200);

  return {
    date: body.date,
    /** Everything the phone was awake and in use for. */
    screenSec: clampInt(body.screenSec, 0, DAY_SECONDS),
    /** The part of that spent in the apps a parent is watching. */
    guardedSec: clampInt(body.guardedSec, 0, DAY_SECONDS),
    /** Time inside ScreenLess itself, which is screen time the parent asked for. */
    appSec: clampInt(body.appSec, 0, DAY_SECONDS),
    missionsDone: clampInt(body.missionsDone, 0, 200),
    missionsStarted: clampInt(body.missionsStarted, 0, 400),
    stars: clampInt(body.stars, 0, 5_000),
    coins: clampInt(body.coins, 0, 500_000),
    steps: clampInt(body.steps, 0, 200_000),
    /** Minutes the child was actually moving, from the mission timers. */
    activeMin: clampInt(body.activeMin, 0, 1440),
    nudges: clampInt(body.nudges, 0, 200),
    /** Nudges followed by a mission start soon after. The number that matters. */
    nudgeHeeded: clampInt(body.nudgeHeeded, 0, 200),
    overLimit: body.overLimit === true,
    gracesUsed: clampInt(body.gracesUsed, 0, 20),
    categories,
  };
}

/**
 * The running totals, sent alongside the days.
 *
 * Cumulative rather than daily, so the parent app can answer "where is this
 * child now" without adding up a year of rows first.
 */
function cleanSnapshot(input) {
  if (!input || typeof input !== 'object') return null;
  return {
    ageBand: AGE_BANDS.includes(input.ageBand) ? input.ageBand : null,
    buddyId: typeof input.buddyId === 'string' ? input.buddyId.slice(0, 20) : null,
    level: clampInt(input.level, 1, 999),
    stars: clampInt(input.stars, 0, 1_000_000),
    coins: clampInt(input.coins, 0, 10_000_000),
    totalMissions: clampInt(input.totalMissions, 0, 100_000),
    streak: clampInt(input.streak, 0, 3_650),
    bestStreak: clampInt(input.bestStreak, 0, 3_650),
    /** Minutes offset from UTC, so "today" on the chart is the child's today. */
    tzOffsetMin: clampInt(input.tzOffsetMin, -840, 840),
    appVersion: typeof input.appVersion === 'string' ? input.appVersion.slice(0, 20) : null,
  };
}

function cleanReport(input) {
  const body = input && typeof input === 'object' ? input : {};
  const incoming = Array.isArray(body.days) ? body.days : [];
  const days = [];
  const seen = new Set();
  // Sixty days is two months of catch-up, far more than a phone that syncs
  // once a week will ever need, and a firm ceiling on what one request costs.
  for (const day of incoming.slice(0, 120)) {
    const row = cleanDay(day);
    if (!row || seen.has(row.date)) continue;
    seen.add(row.date);
    days.push(row);
    if (days.length >= 60) break;
  }
  return { days, snapshot: cleanSnapshot(body.snapshot) };
}

/* ------------------------------------------------------------------ ranges */

/** Adds days to a day key without going anywhere near a local timezone. */
function shiftDay(key, days) {
  const date = new Date(key + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayKeyFor(date = new Date(), tzOffsetMin = 0) {
  return new Date(date.getTime() + tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

/** Every day from `from` to `to` inclusive, so a chart comes out with no holes. */
function daysBetween(from, to) {
  const out = [];
  let cursor = from;
  for (let i = 0; i < 400 && cursor <= to; i += 1) {
    out.push(cursor);
    cursor = shiftDay(cursor, 1);
  }
  return out;
}

module.exports = {
  AGE_BANDS,
  CATEGORIES,
  PLATFORMS,
  TIERS,
  checkAgeBand,
  checkChildName,
  checkEmail,
  checkPassword,
  checkPlatform,
  clampInt,
  cleanDay,
  cleanLimits,
  cleanReport,
  cleanSnapshot,
  dayKeyFor,
  daysBetween,
  defaultLimits,
  isDayKey,
  shiftDay,
};
