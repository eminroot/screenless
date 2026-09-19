/**
 * Where the hub lives.
 *
 * Set at build time with `EXPO_PUBLIC_HUB_URL`. With no url the whole feature
 * is simply absent: the parent area shows nothing about linking, no request is
 * ever made, and the app behaves exactly as it did before any of this existed.
 * That is the default and it has to stay a first class state, not a broken
 * one, because most families will never link a phone at all.
 *
 * Release builds talk to https only. Plain http is allowed under `__DEV__` so
 * the app can run against a laptop or a bare server IP while it is being
 * built. The rule is the same one `online/config.ts` uses for the friends
 * board, for the same reason: a bearer token over plain http is a bearer token
 * anyone on the wifi has.
 */
const raw = (process.env.EXPO_PUBLIC_HUB_URL ?? '').trim().replace(/\/+$/, '');

const secure = /^https:\/\//i.test(raw);
const localDev = __DEV__ && /^http:\/\//i.test(raw);

export const HUB_URL = secure || localDev ? raw : '';

export const isHubConfigured = Boolean(HUB_URL);

if (__DEV__ && raw && !HUB_URL) {
  console.warn('[hub] url ignored, it has to start with https:// or http://');
}

/**
 * Generous, because this runs in the background and nobody is watching it.
 * A slow answer that arrives is worth more than a fast failure.
 */
export const HUB_TIMEOUT_MS = 15_000;
