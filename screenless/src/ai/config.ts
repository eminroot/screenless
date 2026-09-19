/**
 * Gemini access.
 *
 * Anything a React Native bundle can read, anyone holding the APK can read.
 * `EXPO_PUBLIC_*` values are inlined as string literals at build time, so a key
 * put there is a published key, not a hidden one.
 *
 * So there are two modes and only two:
 *
 *   development  a key in a local, gitignored `.env` talks to Google directly,
 *                so the AI parts can be worked on without running a server.
 *   release      the only route out is `EXPO_PUBLIC_GEMINI_PROXY_URL`, an https
 *                endpoint that holds the key server side. The dev key is forced
 *                empty by the production build profile in `eas.json` and is
 *                refused here as well, so neither one alone can leak it.
 *
 * With no proxy configured, a release build simply has no AI. Everything that
 * matters, the mission library, the room scan, the whole progress loop, is
 * rule based and keeps working. See `server/gemini-proxy` for a worker that
 * takes about five minutes to deploy.
 */
export const GEMINI_MODEL = 'gemini-2.5-flash';

const rawProxy = (process.env.EXPO_PUBLIC_GEMINI_PROXY_URL ?? '').trim();
const rawDevKey = (process.env.EXPO_PUBLIC_GEMINI_DEV_KEY ?? '').trim();

/** Plain http would put the whole request on the wire in clear. */
export const GEMINI_PROXY_URL = /^https:\/\//i.test(rawProxy) ? rawProxy : '';

/** Empty in every release build, whatever is sitting in a local `.env`. */
export const GEMINI_API_KEY = __DEV__ ? rawDevKey : '';

if (__DEV__ && rawProxy && !GEMINI_PROXY_URL) {
  console.warn('[gemini] proxy url ignored, it has to start with https://');
}

if (!__DEV__ && rawDevKey) {
  // Reaching here means the key was inlined into a shipping bundle. It is
  // already exposed at that point, so the only useful thing left is to make it
  // impossible to miss before the build reaches anyone.
  console.error(
    '[gemini] a dev key was bundled into a release build. Rotate that key now, ' +
      'then rebuild with EXPO_PUBLIC_GEMINI_DEV_KEY unset.',
  );
}

export const geminiEndpoint = GEMINI_PROXY_URL
  ? GEMINI_PROXY_URL
  : `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const isGeminiConfigured = Boolean(GEMINI_PROXY_URL || GEMINI_API_KEY);

export const REQUEST_TIMEOUT_MS = 20_000;
