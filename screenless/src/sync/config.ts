import { Platform } from 'react-native';

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

/** What was configured, before the Android emulator rewrite below. */
const configured = secure || localDev ? raw : '';

/**
 * `localhost` means the device the app is on, which is the emulator rather
 * than the laptop the hub is running on. Android exposes the host machine at
 * the fixed alias 10.0.2.2, so a development url is rewritten to reach it.
 *
 * Development only. A release build has an https host and gets it untouched:
 * silently rewriting a production address would be a miserable bug to chase.
 *
 * A real phone on the wifi needs the laptop's LAN address in `.env`. That one
 * cannot be guessed from in here.
 */
export const HUB_URL =
  __DEV__ && Platform.OS === 'android'
    ? configured.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i, '$110.0.2.2')
    : configured;

export const isHubConfigured = Boolean(HUB_URL);

if (__DEV__ && raw && !HUB_URL) {
  console.warn('[hub] url ignored, it has to start with https:// or http://');
}

/**
 * Generous, because this runs in the background and nobody is watching it.
 * A slow answer that arrives is worth more than a fast failure.
 */
export const HUB_TIMEOUT_MS = 15_000;
