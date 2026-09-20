import { HUB_TIMEOUT_MS, HUB_URL } from './config';
import type { Report } from './report';

/**
 * Every call this phone makes to the hub. There are three.
 *
 *   POST /v1/devices              pair, once, with a code a grown up typed
 *   GET  /v1/devices/me           the limits a parent set, and their revision
 *   POST /v1/devices/me/reports   the numbers
 *
 * Nothing else is reachable with a device token, by design on the server side
 * as well as this one: it cannot read another child, cannot see the parent's
 * account and cannot change a limit. A child's phone is a reporter.
 *
 * Deliberately not routed through `online/network.ts`. That door is held open
 * by the friends board's own consent and it would be wrong to let one consent
 * open the other: a parent who linked this phone to their dashboard has not
 * thereby agreed to a username on a leaderboard, and a parent who agreed to a
 * username has not agreed to a dashboard. Two features, two answers.
 */

export type HubError =
  /** No url in this build. Nothing was sent. */
  | 'unconfigured'
  | 'network'
  | 'timeout'
  /** The code was not six characters from the right alphabet. */
  | 'badCode'
  /** No child is holding that code, or it expired. */
  | 'noCode'
  /** The token was refused. The parent removed this phone. */
  | 'unlinked'
  | 'rateLimited'
  | 'server';

export type HubResult<T> = { ok: true; value: T } | { ok: false; error: HubError };

/** What the hub hands back when a code is accepted. */
export type PairResult = {
  deviceId: string;
  token: string;
  childId: string;
  ageBand: string;
  limits: HubLimits;
};

/** The settings a parent set, as the hub stores them. */
export type HubLimits = {
  revision: number;
  enabled: boolean;
  tier: string;
  dailyBudgetMin: number;
  nudgeEveryMin: number;
  graceCount: number;
  graceMinutes: number;
  curfewStartMin: number;
  curfewEndMin: number;
  watched: string[];
};

/**
 * A mission a parent picked, as a library key.
 *
 * The title and the steps are not here and never will be: both apps ship the
 * same library, so the hub sends the key and this phone looks the rest up in
 * its own language. A key the library does not know is ignored.
 */
export type HubAssignment = {
  taskId: string;
  assignedAt: number;
  takenAt: number | null;
};

/** A reward a parent promised, in their own words. */
export type HubReward = {
  id: string;
  stars: number;
  label: string;
  emoji: string;
  createdAt: number;
  givenAt: number | null;
};

/** A line a parent typed, waiting for one of four answers. */
export type HubNote = {
  id: string;
  text: string;
  createdAt: number;
  reply: NoteReply | null;
  repliedAt: number | null;
};

/**
 * Everything a child is allowed to say back.
 *
 * Four buttons rather than a text box, and that is deliberate: a typed reply
 * would put a child's sentence on a server, which is the one thing the whole
 * sync contract exists to prevent. `later` is in the set because a list of
 * canned replies with no way to decline is a receipt, not an answer.
 */
export const NOTE_REPLIES = ['ok', 'done', 'thanks', 'later'] as const;
export type NoteReply = (typeof NOTE_REPLIES)[number];

export type DeviceConfig = {
  childId: string;
  ageBand: string;
  limits: HubLimits;
  assignment: HubAssignment | null;
  rewards: HubReward[];
  note: HubNote | null;
  serverTime: string;
};

async function call<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<HubResult<T>> {
  if (!HUB_URL) return { ok: false, error: 'unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HUB_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const response = await fetch(`${HUB_URL}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => null)) as
      | (T & { error?: unknown; reason?: unknown })
      | null;

    if (response.ok && json) return { ok: true, value: json };
    return { ok: false, error: toError(response.status, json?.error, json?.reason) };
  } catch (error) {
    const aborted = (error as { name?: string } | null)?.name === 'AbortError';
    if (__DEV__ && !aborted) console.warn('[hub] request failed', method, path, error);
    return { ok: false, error: aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function toError(status: number, error: unknown, reason: unknown): HubError {
  if (status === 401) return 'unlinked';
  if (status === 429) return 'rateLimited';
  if (status === 404) return 'noCode';
  if (status === 400) return reason === 'code' ? 'badCode' : 'server';
  return 'server';
}

/** A grown up typed the code from the parent app. Accepts `ABC-123` or `abc123`. */
export function pairDevice(code: string, platform: string): Promise<HubResult<PairResult>> {
  return call('POST', '/v1/devices', { body: { code, platform } });
}

/** What the parent has set. Called on every foreground; it is tiny. */
export function fetchConfig(token: string): Promise<HubResult<DeviceConfig>> {
  return call('GET', '/v1/devices/me', { token });
}

export function sendReport(
  token: string,
  report: Report,
): Promise<HubResult<{ stored: number; limits: HubLimits }>> {
  return call('POST', '/v1/devices/me/reports', { token, body: report });
}

/**
 * What this phone says back about what the parent sent.
 *
 * The counterpart to `sendReport`, and the same rule applies: ids and enums
 * only. `tookTaskId` is a library key the hub sent down in the first place and
 * `reply` is one of four fixed words, so there is no shape this function can
 * be handed that would carry a sentence a child wrote.
 */
export function sendAck(
  token: string,
  ack: { tookTaskId?: string; note?: { id: string; reply: NoteReply } },
): Promise<HubResult<{ took: boolean; answered: boolean }>> {
  return call('POST', '/v1/devices/me/ack', { token, body: ack });
}

/** A parent unlinking this phone from the child's side. */
export function unpairDevice(token: string): Promise<HubResult<{ unpaired: boolean }>> {
  return call('DELETE', '/v1/devices/me', { token });
}
