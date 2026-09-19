/**
 * ScreenLess friends board, as Firebase Functions.
 *
 * A separate codebase from the Gemini proxy in `../functions`, so the two
 * deploy, scale and fail independently. The data lives in its own Firestore
 * database, `screenless`, so nothing else in the Firebase project can read it
 * and it can be exported or deleted as one unit.
 *
 * Only children whose parent picked a username ever reach this. The app does
 * not call it at all otherwise; see `src/online/network.ts` in the app.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const { createApp, sweepInactive } = require('./src/app');
const { createFirestoreStore } = require('./src/store/firestore');

const REGION = 'europe-west1';
const DATABASE_ID = 'screenless';
/** The biggest request the app sends is a score, well under a kilobyte. */
const MAX_BODY_BYTES = 4_000;

initializeApp();
const store = createFirestoreStore(getFirestore(DATABASE_ID));
const app = createApp({ store, log: logger });

exports.leaderboard = onRequest(
  {
    region: REGION,
    // The ceiling on a runaway bill if the url is found and hammered.
    maxInstances: 10,
    concurrency: 80,
    timeoutSeconds: 15,
    memory: '256MiB',
    // Called by the app, never by a browser.
    cors: false,
  },
  async (request, response) => {
    response.set('Cache-Control', 'no-store');
    response.set('X-Content-Type-Options', 'nosniff');

    if (request.rawBody && request.rawBody.length > MAX_BODY_BYTES) {
      response.status(413).json({ error: 'tooLarge' });
      return;
    }

    const body =
      request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body) ? request.body : null;
    const forwarded = String(request.get('x-forwarded-for') ?? '').split(',')[0].trim();

    const result = await app.handle({
      method: request.method,
      path: request.path,
      query: request.query,
      headers: request.headers,
      body,
      ip: forwarded || request.ip,
    });

    response.status(result.status).json(result.body);
  },
);

/** A year without opening the app and the username, numbers and friend links are deleted. */
exports.leaderboardSweep = onSchedule(
  { region: REGION, schedule: 'every day 03:30', timeZone: 'Europe/Istanbul', maxInstances: 1 },
  async () => {
    await sweepInactive({ store, log: logger });
  },
);
