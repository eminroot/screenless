'use strict';

const path = require('node:path');

const { createApp } = require('../src/app');
const { createStore } = require('../src/store/sqlite');
const rules = require('../src/rules');

/**
 * Fills an account with six weeks of plausible history.
 *
 * For the demo, and for working on the parent app's charts without waiting a
 * month for real data to accumulate. A dashboard drawn against two days of
 * numbers looks fine and tells you nothing about whether the weekday chart is
 * legible or the trend arrow points the right way.
 *
 *   node scripts/seed.js                        into ./data/hub.db
 *   DB_FILE=/var/lib/screenless/hub.db node scripts/seed.js
 *
 * The shape is deliberate rather than random: screen time falls over the six
 * weeks while missions rise, weekends are worse than weekdays, and there are a
 * few days with no report at all. That is the story the app is meant to show,
 * and seeding it is how you find out whether the charts actually show it.
 */

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'hub.db');
const EMAIL = process.env.SEED_EMAIL || 'demo@screenless.app';
const PASSWORD = process.env.SEED_PASSWORD || 'screenless-demo-2026';
const WEEKS = 6;

const CHILDREN = [
  { name: 'Ayla', ageBand: '6-9', buddyId: 'fox', tone: { screen: 1, missions: 1.15 } },
  { name: 'Kerem', ageBand: '10-14', buddyId: 'rocket', tone: { screen: 1.45, missions: 0.8 } },
  { name: 'Deniz', ageBand: '3-5', buddyId: 'bunny', tone: { screen: 0.55, missions: 1.3 } },
];

/** Deterministic noise, so two runs produce the same charts. */
function noise(seed) {
  let value = seed * 2654435761;
  value ^= value >>> 15;
  value = Math.imul(value, 2246822507);
  value ^= value >>> 13;
  return ((value >>> 0) % 1000) / 1000;
}

function main() {
  const store = createStore({ file: DB_FILE });
  const app = createApp({ store, log: { error: console.error } });

  const call = (method, path, body, token) =>
    app.handle({
      method,
      path: path.split('?')[0],
      query: Object.fromEntries(new URLSearchParams(path.split('?')[1] || '').entries()),
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: body || null,
      ip: '127.0.0.1',
    });

  (async () => {
    let session = await call('POST', '/v1/parents', {
      email: EMAIL,
      password: PASSWORD,
      name: 'Demo',
    });
    if (session.status === 409) {
      session = await call('POST', '/v1/parents/session', { email: EMAIL, password: PASSWORD });
    }
    if (session.status >= 400) {
      console.error('[seed] could not sign in', session.body);
      process.exit(1);
    }
    const token = session.body.token;

    const existing = (await call('GET', '/v1/children', null, token)).body.children;
    const byName = new Map(existing.map((child) => [child.name, child]));

    const today = rules.dayKeyFor(new Date(), 240);

    for (const [index, spec] of CHILDREN.entries()) {
      let child = byName.get(spec.name);
      let deviceToken = null;

      if (!child) {
        const created = await call(
          'POST',
          '/v1/children',
          { name: spec.name, ageBand: spec.ageBand },
          token,
        );
        child = created.body.child;
        const paired = await call('POST', '/v1/devices', {
          code: created.body.pairing.code,
          platform: 'android',
        });
        deviceToken = paired.body.token;
        console.log(`[seed] ${spec.name}: added and paired`);
      } else {
        console.log(`[seed] ${spec.name}: already there, topping up history`);
      }

      const days = [];
      const span = WEEKS * 7;
      for (let back = span - 1; back >= 0; back -= 1) {
        const date = rules.shiftDay(today, -back);
        // Seeded per child as well as per day, or two children whose names
        // happen to be the same length get byte-identical histories.
        const wobble = noise(Number(date.split('-').join('')) + index * 7919);

        // Four days in six weeks with the phone off. A dashboard has to cope.
        if (wobble > 0.94) continue;

        const weekday = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
        const weekend = weekday >= 5;
        // Progress: screen time drifts down and missions drift up across the run.
        const through = (span - 1 - back) / (span - 1);
        const screenMin = Math.round(
          (135 - through * 45) * spec.tone.screen * (weekend ? 1.4 : 1) * (0.85 + wobble * 0.3),
        );
        // A gentle ramp. Starting from nearly zero would make the trend arrow
        // read "+400%", which is true of the seed and useless as a demo.
        const missions = Math.max(
          0,
          Math.round((1.6 + through * 1.4) * spec.tone.missions * (0.7 + wobble * 0.7)),
        );
        const activeMin = Math.round(missions * (12 + wobble * 14));
        const budgetMin = 120;

        days.push({
          date,
          screenSec: screenMin * 60,
          guardedSec: Math.round(screenMin * 60 * 0.72),
          appSec: Math.round(activeMin * 60 * 0.25),
          missionsDone: missions,
          missionsStarted: missions + (wobble > 0.7 ? 1 : 0),
          stars: missions * 2,
          coins: missions * 600,
          steps: Math.round(activeMin * (85 + wobble * 60)),
          activeMin,
          nudges: screenMin > 60 ? Math.floor(screenMin / 30) : 1,
          nudgeHeeded: missions > 0 ? Math.min(missions, 2) : 0,
          overLimit: screenMin > budgetMin,
          gracesUsed: screenMin > budgetMin && wobble > 0.5 ? 1 : 0,
          categories: {
            move: Math.round(missions * 0.4),
            outdoor: Math.round(missions * 0.25),
            create: Math.round(missions * 0.2),
            social: wobble > 0.6 ? 1 : 0,
            calm: wobble > 0.8 ? 1 : 0,
          },
        });
      }

      const totalMissions = days.reduce((sum, day) => sum + day.missionsDone, 0);
      const snapshot = {
        ageBand: spec.ageBand,
        buddyId: spec.buddyId,
        level: 1 + Math.floor(totalMissions / 8),
        stars: totalMissions * 2,
        coins: totalMissions * 600,
        totalMissions,
        streak: 4,
        bestStreak: 11,
        tzOffsetMin: 240,
        appVersion: '1.1.0',
      };

      if (deviceToken) {
        // In batches, the way a phone catching up after a week offline would.
        for (let i = 0; i < days.length; i += 30) {
          await call(
            'POST',
            '/v1/devices/me/reports',
            { days: days.slice(i, i + 30), snapshot },
            deviceToken,
          );
        }
      } else {
        for (const day of days) store.putDay(child.id, rules.cleanDay(day));
        store.applySnapshot(child.id, rules.cleanSnapshot(snapshot));
      }

      await call(
        'PUT',
        `/v1/children/${child.id}/limits`,
        {
          enabled: true,
          tier: spec.ageBand === '10-14' ? 'notice' : 'interrupt',
          dailyBudgetMin: 120,
          nudgeEveryMin: 30,
          graceCount: 2,
          graceMinutes: 5,
          curfew: { startMin: 21 * 60, endMin: 7 * 60 },
          watched: ['com.google.android.youtube', 'com.zhiliaoapp.musically'],
        },
        token,
      );
    }

    const counts = store.stats();
    console.log(
      `[seed] done. ${counts.parents} parent(s), ${counts.children} children, ${counts.days} days`,
    );
    console.log(`[seed] sign in to the parent app as ${EMAIL} / ${PASSWORD}`);
    store.close();
  })().catch((error) => {
    console.error('[seed] failed', error);
    process.exit(1);
  });
}

main();
