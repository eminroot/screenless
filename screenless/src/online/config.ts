/**
 * Where the friends board lives.
 *
 * Release builds talk to https only. Under `__DEV__` plain http is allowed as
 * well, so the app can run against `server/firebase/leaderboard/dev-server.js`
 * on a laptop (`http://10.0.2.2:8787` from the Android emulator).
 *
 * With no url, usernames are simply unavailable: setup still asks the question,
 * but only "keep it on this phone" can be chosen.
 */
const raw = (process.env.EXPO_PUBLIC_LEADERBOARD_URL ?? '').trim().replace(/\/+$/, '');

const secure = /^https:\/\//i.test(raw);
const localDev = __DEV__ && /^http:\/\//i.test(raw);

export const LEADERBOARD_URL = secure || localDev ? raw : '';

export const isLeaderboardConfigured = Boolean(LEADERBOARD_URL);

if (__DEV__ && raw && !LEADERBOARD_URL) {
  console.warn('[leaderboard] url ignored, it has to start with https:// or http://');
}

export const LEADERBOARD_TIMEOUT_MS = 12_000;
