'use strict';

const { CATEGORIES, daysBetween, shiftDay } = require('./rules');

/**
 * Turning a pile of daily rows into the few numbers a parent actually reads.
 *
 * Pure, and importing nothing but the day helpers, so `npm test` can drive it
 * with hand-written rows and the parent app can stay a renderer. Every figure
 * the dashboard shows is computed here rather than in the client, for one
 * practical reason: two apps would otherwise each grow their own slightly
 * different idea of what "average screen time" means, and they would disagree
 * on screen in front of the person paying for this.
 *
 * Two decisions worth stating, because they change what the charts say:
 *
 * 1. **Averages are over days that reported, not over the calendar.** A phone
 *    that was off for a week should not drag the average down to look like
 *    progress. `reportedDays` is returned alongside so the app can say what
 *    the average is actually over.
 *
 * 2. **The comparison window is the same length, immediately before.** A week
 *    is compared to the week before it, a month to the month before. Anything
 *    cleverer invites an argument about seasonality that the data cannot
 *    settle.
 */

const EMPTY_DAY = {
  screenSec: 0,
  guardedSec: 0,
  appSec: 0,
  missionsDone: 0,
  missionsStarted: 0,
  stars: 0,
  coins: 0,
  steps: 0,
  activeMin: 0,
  nudges: 0,
  nudgeHeeded: 0,
  overLimit: false,
  gracesUsed: 0,
};

const SUMMED = [
  'screenSec',
  'guardedSec',
  'appSec',
  'missionsDone',
  'missionsStarted',
  'stars',
  'coins',
  'steps',
  'activeMin',
  'nudges',
  'nudgeHeeded',
  'gracesUsed',
];

function blankDay(date) {
  return { date, reported: false, ...EMPTY_DAY, categories: zeroCategories() };
}

function zeroCategories() {
  const out = {};
  for (const key of CATEGORIES) out[key] = 0;
  return out;
}

/**
 * The rows for a range, gap-filled.
 *
 * A missing day comes back as zeros with `reported: false` rather than being
 * absent. The distinction matters: a bar of height zero and no bar at all mean
 * different things to a parent, and the chart needs to be able to draw both.
 */
function series(rows, from, to) {
  const byDate = new Map();
  for (const row of rows) byDate.set(row.date, row);
  return daysBetween(from, to).map((date) => {
    const row = byDate.get(date);
    if (!row) return blankDay(date);
    return {
      date,
      reported: true,
      screenSec: row.screenSec || 0,
      guardedSec: row.guardedSec || 0,
      appSec: row.appSec || 0,
      missionsDone: row.missionsDone || 0,
      missionsStarted: row.missionsStarted || 0,
      stars: row.stars || 0,
      coins: row.coins || 0,
      steps: row.steps || 0,
      activeMin: row.activeMin || 0,
      nudges: row.nudges || 0,
      nudgeHeeded: row.nudgeHeeded || 0,
      overLimit: row.overLimit === true,
      gracesUsed: row.gracesUsed || 0,
      categories: { ...zeroCategories(), ...(row.categories || {}) },
    };
  });
}

function totalsOf(days) {
  const totals = {};
  for (const key of SUMMED) totals[key] = 0;
  const categories = zeroCategories();
  let reportedDays = 0;
  let overLimitDays = 0;
  let activeDays = 0;

  for (const day of days) {
    if (!day.reported) continue;
    reportedDays += 1;
    for (const key of SUMMED) totals[key] += day[key] || 0;
    for (const key of CATEGORIES) categories[key] += day.categories[key] || 0;
    if (day.overLimit) overLimitDays += 1;
    if (day.missionsDone > 0) activeDays += 1;
  }

  return { ...totals, categories, reportedDays, overLimitDays, activeDays };
}

function perDay(total, reportedDays) {
  return reportedDays > 0 ? Math.round(total / reportedDays) : 0;
}

/** Percentage change, or null when there is nothing meaningful to divide by. */
function changePct(now, before) {
  if (!Number.isFinite(now) || !Number.isFinite(before) || before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

/**
 * The longest run of consecutive days ending at `to` with at least one mission.
 *
 * Recomputed here rather than trusted from the phone's own `streak`, because
 * the phone's figure is about the child's own timezone and their own idea of
 * midnight, and this one has to agree with the bars drawn next to it.
 */
function trailingStreak(days) {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].reported && days[i].missionsDone > 0) streak += 1;
    else break;
  }
  return streak;
}

function bestDay(days, key) {
  let best = null;
  for (const day of days) {
    if (!day.reported) continue;
    if (!best || day[key] > best[key]) best = day;
  }
  return best ? { date: best.date, value: best[key] } : null;
}

/**
 * Average screen seconds by day of the week, Monday first.
 *
 * The single most useful chart in the whole dashboard, and the reason it earns
 * its place: almost every family discovers that one or two days carry most of
 * the problem, and those are the days a rule can actually be set on.
 */
function weekdayProfile(days) {
  const sums = Array.from({ length: 7 }, () => ({ screenSec: 0, missionsDone: 0, count: 0 }));
  for (const day of days) {
    if (!day.reported) continue;
    // getUTCDay is Sunday-first; shift so Monday is index 0.
    const index = (new Date(day.date + 'T00:00:00Z').getUTCDay() + 6) % 7;
    sums[index].screenSec += day.screenSec;
    sums[index].missionsDone += day.missionsDone;
    sums[index].count += 1;
  }
  return sums.map((entry, index) => ({
    weekday: index,
    days: entry.count,
    screenSec: entry.count > 0 ? Math.round(entry.screenSec / entry.count) : 0,
    missionsDone: entry.count > 0 ? Math.round((entry.missionsDone / entry.count) * 10) / 10 : 0,
  }));
}

/**
 * How much of the reported time went on something other than a screen.
 *
 * Active minutes against screen minutes, as a percentage of the two together.
 * It is a crude ratio and it is not trying to be anything else, but it is the
 * one number that moves in the direction the whole app is for, so it is the
 * one the dashboard leads with.
 */
function balanceScore(totals) {
  const screenMin = Math.round(totals.screenSec / 60);
  const activeMin = totals.activeMin;
  const both = screenMin + activeMin;
  if (both <= 0) return null;
  return Math.round((activeMin / both) * 100);
}

/**
 * Everything the dashboard needs for one child over one range.
 *
 * `rows` may be for a wider span than the range asked for; anything outside is
 * ignored rather than trusted, so a caller that over-fetches is not punished.
 */
function summarise(rows, from, to) {
  const days = series(rows, from, to);
  const totals = totalsOf(days);

  const length = days.length;
  const prevTo = shiftDay(from, -1);
  const prevFrom = shiftDay(prevTo, -(length - 1));
  const prevDays = series(rows, prevFrom, prevTo);
  const prevTotals = totalsOf(prevDays);

  const screenPerDay = perDay(totals.screenSec, totals.reportedDays);
  const prevScreenPerDay = perDay(prevTotals.screenSec, prevTotals.reportedDays);

  return {
    range: { from, to, days: length },
    days,
    totals: {
      screenSec: totals.screenSec,
      guardedSec: totals.guardedSec,
      appSec: totals.appSec,
      missionsDone: totals.missionsDone,
      missionsStarted: totals.missionsStarted,
      stars: totals.stars,
      coins: totals.coins,
      steps: totals.steps,
      activeMin: totals.activeMin,
      nudges: totals.nudges,
      nudgeHeeded: totals.nudgeHeeded,
      gracesUsed: totals.gracesUsed,
      reportedDays: totals.reportedDays,
      overLimitDays: totals.overLimitDays,
      activeDays: totals.activeDays,
    },
    averages: {
      screenSec: screenPerDay,
      missionsDone:
        totals.reportedDays > 0
          ? Math.round((totals.missionsDone / totals.reportedDays) * 10) / 10
          : 0,
      activeMin: perDay(totals.activeMin, totals.reportedDays),
      steps: perDay(totals.steps, totals.reportedDays),
    },
    /**
     * Every figure here compares a rate, never a total.
     *
     * Totals would be the obvious thing and they are wrong: the window before
     * a family's first month contains hardly any reporting days, so comparing
     * sums says "missions up 280%" when the child did exactly the same amount
     * every day and simply had the app for longer. Per reporting day is the
     * only comparison that survives a phone being off for a week.
     */
    change: {
      screenPerDay: changePct(screenPerDay, prevScreenPerDay),
      missionsDone: changePct(
        perDay(totals.missionsDone * 100, totals.reportedDays),
        perDay(prevTotals.missionsDone * 100, prevTotals.reportedDays),
      ),
      activeMin: changePct(
        perDay(totals.activeMin, totals.reportedDays),
        perDay(prevTotals.activeMin, prevTotals.reportedDays),
      ),
      steps: changePct(
        perDay(totals.steps, totals.reportedDays),
        perDay(prevTotals.steps, prevTotals.reportedDays),
      ),
    },
    previous: {
      range: { from: prevFrom, to: prevTo },
      screenPerDay: prevScreenPerDay,
      missionsDone: prevTotals.missionsDone,
      missionsPerDay:
        prevTotals.reportedDays > 0
          ? Math.round((prevTotals.missionsDone / prevTotals.reportedDays) * 10) / 10
          : 0,
      activeMin: prevTotals.activeMin,
      activeMinPerDay: perDay(prevTotals.activeMin, prevTotals.reportedDays),
      steps: prevTotals.steps,
      stepsPerDay: perDay(prevTotals.steps, prevTotals.reportedDays),
      reportedDays: prevTotals.reportedDays,
    },
    categories: totals.categories,
    weekdays: weekdayProfile(days),
    streak: trailingStreak(days),
    balance: balanceScore(totals),
    /**
     * Of the nudges that fired, how many were followed by the child starting
     * something. The honest measure of whether the notifications work at all,
     * and the number to watch if they ever need retuning.
     */
    nudgeResponse:
      totals.nudges > 0 ? Math.round((totals.nudgeHeeded / totals.nudges) * 100) : null,
    best: {
      missions: bestDay(days, 'missionsDone'),
      steps: bestDay(days, 'steps'),
      active: bestDay(days, 'activeMin'),
    },
  };
}

module.exports = { blankDay, changePct, series, summarise, totalsOf, weekdayProfile };
