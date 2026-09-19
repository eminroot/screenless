/**
 * ScreenLess AI proxy, as a Firebase Function.
 *
 * The app posts a Gemini request body here and this forwards it to Google with
 * the real key attached. The key lives in Cloud Secret Manager, never in the APK.
 *
 * Note which Firebase credential is which. This uses a **Gemini API key held as
 * a server side secret**, which the client never sees. It is not the Firebase web
 * API key: that one ships publicly in client apps by design, and Google's own
 * guidance is to keep the Gemini Developer API off its allowlist, because any
 * unrestricted key in a project with the Generative Language API enabled can
 * spend that project's Gemini quota.
 *
 * A public url with someone else's quota behind it is worth abusing, so this
 * does not simply pass anything through:
 *
 *   - only POST, only the four fields the app actually sends
 *   - a body size ceiling and an output token ceiling
 *   - the child safety thresholds are set here, not taken from the caller, so a
 *     hand written request cannot turn them off
 *   - `maxInstances` caps the worst case bill
 *   - an optional shared token, so a leaked url alone is not enough
 *
 * None of that makes the endpoint secret. It makes it cheap to abuse and easy to
 * rotate, which is the realistic goal for a client side app.
 *
 * Kept behaviourally identical to `server/gemini-proxy/src/index.js`. Change one,
 * change the other.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/**
 * Optional shared token, off by default.
 *
 * It is deliberately *not* a `defineSecret`. Firebase prompts for the value of
 * any declared secret that does not exist yet, so declaring it would block
 * `firebase deploy` on an interactive question, and answering that question
 * would switch on a header the app does not send yet, turning every request
 * into a 401.
 *
 * To switch it on: uncomment the two lines below, add APP_TOKEN to the
 * `secrets` array, run `firebase functions:secrets:set APP_TOKEN`, and send the
 * same value as an `x-app-token` header from `src/ai/gemini.ts`.
 */
// const APP_TOKEN = defineSecret('APP_TOKEN');
const APP_TOKEN = { value: () => process.env.APP_TOKEN ?? '' };

const MODEL = 'gemini-2.5-flash';
const UPSTREAM = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const MAX_BODY_BYTES = 16_000;
const MAX_OUTPUT_TOKENS = 600;
const MAX_CONTENTS = 20;

/** Fixed here so the caller cannot relax them. */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

const TASK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    body: { type: 'STRING' },
    minutes: { type: 'INTEGER' },
    category: { type: 'STRING', enum: ['move', 'outdoor', 'create', 'social', 'calm'] },
    emoji: { type: 'STRING' },
  },
  required: ['title', 'body', 'minutes', 'category', 'emoji'],
};

exports.gemini = onRequest(
  {
    region: 'europe-west1',
    // The ceiling on a runaway bill if the url is found and hammered.
    maxInstances: 10,
    timeoutSeconds: 30,
    memory: '256MiB',
    // Add APP_TOKEN here too if you switch the shared token on.
    secrets: [GEMINI_API_KEY],
    cors: false,
  },
  async (request, response) => {
    response.set('Cache-Control', 'no-store');
    response.set('X-Content-Type-Options', 'nosniff');

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'method not allowed' });
      return;
    }

    const key = GEMINI_API_KEY.value();
    if (!key) {
      logger.error('GEMINI_API_KEY is not set');
      response.status(500).json({ error: 'proxy is not configured' });
      return;
    }

    // Set APP_TOKEN in Secret Manager and EXPO_PUBLIC_GEMINI_PROXY_TOKEN in the
    // app to require it. Rotating it locks out old builds, so treat it as a tap
    // you can turn off rather than as authentication.
    const expected = APP_TOKEN.value();
    if (expected && request.get('x-app-token') !== expected) {
      response.status(401).json({ error: 'unauthorized' });
      return;
    }

    // `request.rawBody` is the bytes as received, before any body parser.
    if (request.rawBody && request.rawBody.length > MAX_BODY_BYTES) {
      response.status(413).json({ error: 'request too large' });
      return;
    }

    const clean = sanitise(request.body);
    if (!clean) {
      response.status(400).json({ error: 'unexpected request shape' });
      return;
    }

    let upstream;
    try {
      upstream = await fetch(UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(clean),
      });
    } catch (error) {
      logger.error('upstream unreachable', error);
      response.status(502).json({ error: 'upstream unreachable' });
      return;
    }

    const text = await upstream.text();
    // Passed straight back: the app already parses the Gemini response shape and
    // re-checks every reply before a child sees it.
    response.status(upstream.status).type('application/json').send(text);
  },
);

/** Rebuilds the request from scratch, so nothing unexpected reaches Google. */
function sanitise(body) {
  if (!body || typeof body !== 'object') return null;

  const contents = Array.isArray(body.contents) ? body.contents.slice(-MAX_CONTENTS) : null;
  if (!contents || contents.length === 0) return null;

  const parsedContents = [];
  for (const item of contents) {
    if (!item || (item.role !== 'user' && item.role !== 'model')) return null;
    const parts = Array.isArray(item.parts) ? item.parts : null;
    if (!parts || parts.length === 0) return null;
    const texts = parts.map((p) => (typeof p?.text === 'string' ? p.text : null));
    if (texts.some((t) => t === null)) return null;
    parsedContents.push({ role: item.role, parts: texts.map((text) => ({ text })) });
  }

  const out = { contents: parsedContents, safetySettings: SAFETY_SETTINGS };

  const instruction = body.systemInstruction?.parts;
  if (Array.isArray(instruction)) {
    const texts = instruction.map((p) => (typeof p?.text === 'string' ? p.text : null));
    if (texts.some((t) => t === null)) return null;
    out.systemInstruction = { parts: texts.map((text) => ({ text })) };
  }

  const config = body.generationConfig;
  if (config && typeof config === 'object') {
    out.generationConfig = {
      temperature: clamp(config.temperature, 0, 2, 0.9),
      maxOutputTokens: clamp(config.maxOutputTokens, 1, MAX_OUTPUT_TOKENS, 220),
      thinkingConfig: { thinkingBudget: 0 },
    };
    if (typeof config.topP === 'number') out.generationConfig.topP = clamp(config.topP, 0, 1, 0.95);
    if (config.responseMimeType === 'application/json') {
      out.generationConfig.responseMimeType = 'application/json';
      // Only the app's own task schema is accepted, never a caller supplied one.
      out.generationConfig.responseSchema = TASK_SCHEMA;
    }
  }

  return out;
}

function clamp(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
