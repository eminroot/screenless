/**
 * How often the phone talks to the hub, and how it behaves when it cannot.
 *
 * Kept apart from `config.ts` so it can be unit tested: that file reads
 * `process.env` and `__DEV__`, neither of which exists under plain Node, and
 * the retry curve is the part worth proving.
 */

/** The most often the app will try. Checked on every return to the foreground. */
export const SYNC_EVERY_MS = 10 * 60_000;

/**
 * How long to wait after a failure, by consecutive failure count.
 *
 * Doubles to half an hour and stays there. A server that has been down since
 * breakfast should be asked twice an hour, not two hundred times, and the
 * phone loses nothing by waiting: every day it is holding is still queued and
 * none of it expires.
 */
export function retryDelayMs(failures: number): number {
  if (failures <= 0) return 0;
  return Math.min(30 * 60_000, 30_000 * 2 ** (failures - 1));
}

/** Whether enough time has passed to try again. */
export function isDue(lastAttemptAt: number | null, failures: number, now: number): boolean {
  if (lastAttemptAt === null) return true;
  const wait = failures > 0 ? retryDelayMs(failures) : SYNC_EVERY_MS;
  return now - lastAttemptAt >= wait;
}
