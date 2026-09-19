import { Platform } from 'react-native';

/**
 * Making a development URL reachable from wherever the app is actually running.
 *
 * `http://localhost:8099` is correct in a browser and wrong everywhere else,
 * because "localhost" means the device the app is on:
 *
 *   web            the browser and the server share a machine. Works.
 *   Android emu    localhost is the emulator's own loopback. The host machine
 *                  is reachable at the fixed alias 10.0.2.2.
 *   iOS simulator  shares the Mac's network stack. Works.
 *   a real phone   neither works. It needs the laptop's address on the wifi,
 *                  which only the person holding the phone can know.
 *
 * So the emulator case is rewritten automatically, because it is mechanical
 * and getting it wrong looks exactly like the server being down. The real
 * device case is left alone and documented: put the laptop's LAN address in
 * `.env` and restart the bundler.
 *
 * Only in development. A release build has an https url and this returns it
 * untouched, which matters: silently rewriting a production host would be a
 * very confusing bug to chase.
 */

const ANDROID_EMULATOR_HOST = '10.0.2.2';

export function reachableUrl(url: string): string {
  if (!__DEV__ || Platform.OS !== 'android') return url;
  return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i, `$1${ANDROID_EMULATOR_HOST}`);
}

/**
 * Whether the url was rewritten, so a screen can say so.
 *
 * Worth surfacing rather than hiding: someone testing on a *physical* Android
 * phone gets the emulator alias, which will not resolve, and "could not reach
 * the server" with no explanation sends them looking at the server.
 */
export function wasRewritten(original: string): boolean {
  return reachableUrl(original) !== original;
}
