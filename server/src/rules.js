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

const AGE_BANDS = ['3-5', '6-9', '10-13'];

const CATEGORIES = ['move', 'outdoor', 'create', 'social', 'calm'];
const TIERS = ['off', 'notice', 'interrupt', 'block'];
const PLATFORMS = ['android', 'ios', 'web'];

/**
 * Bands this server still understands on the way in, and what they become.
 *
 * The top band was 10-14 until September 2026. A phone that was set up before
 * that still has the old string in its profile and will keep sending it until
 * it updates, and rejecting it would mean a child's reports stop arriving for
 * a reason nobody at either end could see. So it is accepted and rewritten,
 * which is also what the app does to its own stored profile on first launch
 * after updating. Nothing is ever *stored* as a legacy band.
 */
const LEGACY_AGE_BANDS = { '10-14': '10-13' };

function normaliseAgeBand(value) {
  return Object.prototype.hasOwnProperty.call(LEGACY_AGE_BANDS, value) ? LEGACY_AGE_BANDS[value] : value;
}

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
  const band = normaliseAgeBand(value);
  return AGE_BANDS.includes(band) ? { ok: true, value: band } : { ok: false, reason: 'ageBand' };
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
    ageBand: AGE_BANDS.includes(normaliseAgeBand(input.ageBand)) ? normaliseAgeBand(input.ageBand) : null,
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

/* ------------------------------------------- what a parent sends down */

/**
 * The four things a child can say back to a note.
 *
 * A fixed set rather than a text box, and that is the whole design. A child
 * typing a reply would put a child's sentence on this server, which is the one
 * thing the report contract exists to prevent; four buttons put an enum on it
 * instead. `later` is in the list on purpose — a set of canned replies with no
 * way to decline is not a conversation, it is a receipt.
 */
const NOTE_REPLIES = ['ok', 'done', 'thanks', 'later'];

/** Library keys such as `duo-hide` or `spark-4f2`. Never free text. */
const TASK_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const NOTE_MAX = 200;
const LABEL_MAX = 60;
const EMOJI_MAX = 8;
/** Enough for a wall chart, few enough that nobody can fill a table with them. */
const MAX_REWARDS = 20;

/**
 * Trims a line a parent typed.
 *
 * Control characters go, including the newlines that would let one note take
 * over the child's screen, and the length is capped. Nothing else is touched:
 * these are a parent's own words to their own child, and a filter that
 * rewrites them would be both rude and useless.
 */
function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function checkTaskId(value) {
  return typeof value === 'string' && TASK_ID_RE.test(value);
}

function cleanNoteText(value) {
  return cleanText(value, NOTE_MAX);
}

function cleanReward(input) {
  const body = input && typeof input === 'object' ? input : {};
  return {
    stars: clampInt(body.stars, 1, 100_000),
    label: cleanText(body.label, LABEL_MAX),
    emoji: cleanText(body.emoji, EMOJI_MAX),
  };
}

/**
 * What a child's phone is allowed to say about any of it.
 *
 * This is the counterpart to `cleanReport`, and it is short for the same
 * reason. A phone may report which mission it took and which of the four
 * replies was tapped. Both are looked up against rows this server already
 * wrote, so nothing here can introduce a string the parent did not.
 */
function cleanAck(input) {
  const body = input && typeof input === 'object' ? input : {};
  const note = body.note && typeof body.note === 'object' ? body.note : null;
  return {
    tookTaskId: checkTaskId(body.tookTaskId) ? body.tookTaskId : null,
    note:
      note && checkTaskId(note.id) && NOTE_REPLIES.includes(note.reply)
        ? { id: note.id, reply: note.reply }
        : null,
  };
}

module.exports = {
  AGE_BANDS,
  MAX_REWARDS,
  NOTE_REPLIES,
  checkTaskId,
  cleanAck,
  cleanNoteText,
  cleanReward,
  normaliseAgeBand,
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
