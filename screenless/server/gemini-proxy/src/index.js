/**
 * ScreenLess AI proxy.
 *
 * The app posts a Gemini request body here and this forwards it to Google with
 * the real key attached. The key lives in Cloudflare, never in the APK.
 *
 * A public url with someone else's quota behind it is worth abusing, so this
 * does not simply pass anything through:
 *
 *   - only POST /, only the four fields the app actually sends
 *   - a body size ceiling and an output token ceiling
 *   - the child safety thresholds are set here, not taken from the caller, so
 *     a hand written request cannot turn them off
 *   - a per address daily cap when a KV namespace is bound
 *   - an optional shared token, so a leaked url alone is not enough
 *
 * None of that makes the endpoint secret. It makes it cheap to abuse and easy
 * to rotate, which is the realistic goal for a client side app.
 */

const MODEL = 'gemini-2.5-flash';
const UPSTREAM = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const MAX_BODY_BYTES = 16_000;
const MAX_OUTPUT_TOKENS = 600;
const MAX_CONTENTS = 20;
const DAILY_LIMIT_PER_IP = 300;

/** Fixed here so the caller cannot relax them. */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function fail(status, message) {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return fail(405, 'method not allowed');
    if (!env.GEMINI_API_KEY) return fail(500, 'proxy is not configured');

    // Set APP_TOKEN in Cloudflare and EXPO_PUBLIC_GEMINI_PROXY_TOKEN in the app
    // to require it. Rotating it locks out old builds, so treat it as a tap you
    // can turn off rather than as authentication.
    if (env.APP_TOKEN && request.headers.get('x-app-token') !== env.APP_TOKEN) {
      return fail(401, 'unauthorized');
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return fail(413, 'request too large');

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return fail(400, 'invalid json');
    }

    const clean = sanitise(body);
    if (!clean) return fail(400, 'unexpected request shape');

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    if (await overDailyLimit(env, ip)) return fail(429, 'daily limit reached');

    let upstream;
    try {
      upstream = await fetch(UPSTREAM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify(clean),
      });
    } catch {
      return fail(502, 'upstream unreachable');
    }

    // Passed straight back: the app already parses the Gemini response shape and
    // re-checks every reply before a child sees it.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: JSON_HEADERS,
    });
  },
};

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

function clamp(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** No KV bound means no counting. The other limits still apply. */
async function overDailyLimit(env, ip) {
  if (!env.RATE) return false;
  const key = `${ip}:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await env.RATE.get(key)) ?? 0);
  if (used >= DAILY_LIMIT_PER_IP) return true;
  await env.RATE.put(key, String(used + 1), { expirationTtl: 60 * 60 * 26 });
  return false;
}
