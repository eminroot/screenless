import { reachableUrl } from './host';
import type {
  AgeBand,
  Assignment,
  Child,
  ChildCard,
  Limits,
  Note,
  Pairing,
  Parent,
  Reward,
  Summary,
} from './types';

/**
 * Every call this app makes to the hub.
 *
 * One `request` in front of `fetch`, one place that knows about headers and
 * timeouts, and named functions for the rest so a screen never builds a URL.
 *
 * The parent's token is a bearer token and nothing else: there are no cookies,
 * so nothing is sent automatically and a request that forgets to pass it fails
 * loudly rather than quietly succeeding as somebody.
 */

const raw = (process.env.EXPO_PUBLIC_HUB_URL ?? '').trim().replace(/\/+$/, '');
const secure = /^https:\/\//i.test(raw);
const localDev = __DEV__ && /^http:\/\//i.test(raw);

/** What was configured, before the Android emulator rewrite. */
export const CONFIGURED_URL = secure || localDev ? raw : '';

/**
 * Where requests actually go.
 *
 * On an Android emulator in development this is not what `.env` says: see
 * `host.ts`. Everywhere else the two are identical.
 */
export const HUB_URL = reachableUrl(CONFIGURED_URL);

if (__DEV__ && raw && !HUB_URL) {
  console.warn('[hub] url ignored, it has to start with https:// or http://');
}

const TIMEOUT_MS = 15_000;

export type ApiError =
  /** No url in this build. Nothing was sent. */
  | 'unconfigured'
  | 'network'
  | 'timeout'
  /** Wrong email or password, or a session that has expired. */
  | 'unauthorized'
  /** That address already has an account. */
  | 'taken'
  /** The server refused the shape of something. `reason` says which field. */
  | 'invalid'
  | 'notFound'
  | 'full'
  | 'rateLimited'
  | 'server';

export type Result<T> = { ok: true; value: T } | { ok: false; error: ApiError; reason?: string };

export type Session = { token: string; parent: Parent };

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<Result<T>> {
  if (!HUB_URL) return { ok: false, error: 'unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
    return {
      ok: false,
      error: toError(response.status, json?.error),
      reason: typeof json?.reason === 'string' ? json.reason : undefined,
    };
  } catch (error) {
    const aborted = (error as { name?: string } | null)?.name === 'AbortError';
    if (__DEV__ && !aborted) console.warn('[hub]', method, path, error);
    return { ok: false, error: aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

const KNOWN = new Set<ApiError>(['taken', 'invalid', 'notFound', 'full', 'rateLimited']);

function toError(status: number, error: unknown): ApiError {
  if (typeof error === 'string' && KNOWN.has(error as ApiError)) return error as ApiError;
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status === 409) return 'taken';
  if (status === 429) return 'rateLimited';
  return 'server';
}

/* ------------------------------------------------------------------ account */

export function register(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<Result<Session>> {
  return request('POST', '/v1/parents', { body: input });
}

export function signIn(input: { email: string; password: string }): Promise<Result<Session>> {
  return request('POST', '/v1/parents/session', { body: input });
}

export function signOut(token: string): Promise<Result<{ ok: boolean }>> {
  return request('DELETE', '/v1/parents/session', { token });
}

export function deleteAccount(token: string, password: string): Promise<Result<{ deleted: boolean }>> {
  return request('DELETE', '/v1/parents/me', { token, body: { password } });
}

/* ----------------------------------------------------------------- children */

export function listChildren(token: string): Promise<Result<{ children: ChildCard[] }>> {
  return request('GET', '/v1/children', { token });
}

export function addChild(
  token: string,
  input: { name: string; ageBand: AgeBand },
): Promise<Result<{ child: Child; pairing: Pairing }>> {
  return request('POST', '/v1/children', { token, body: input });
}

export function removeChild(token: string, id: string): Promise<Result<{ deleted: boolean }>> {
  return request('DELETE', `/v1/children/${encodeURIComponent(id)}`, { token });
}

export function newPairingCode(token: string, id: string): Promise<Result<{ pairing: Pairing }>> {
  return request('POST', `/v1/children/${encodeURIComponent(id)}/code`, { token });
}

export type Range = 'week' | 'month' | 'quarter';

export function fetchSummary(
  token: string,
  id: string,
  range: Range,
): Promise<Result<{ child: Child; limits: Limits; paired: boolean; summary: Summary }>> {
  return request('GET', `/v1/children/${encodeURIComponent(id)}/summary?range=${range}`, { token });
}

export function saveLimits(
  token: string,
  id: string,
  limits: {
    enabled: boolean;
    tier: string;
    dailyBudgetMin: number;
    nudgeEveryMin: number;
    graceCount: number;
    graceMinutes: number;
    curfew: { startMin: number; endMin: number } | null;
  },
): Promise<Result<{ limits: Limits }>> {
  return request('PUT', `/v1/children/${encodeURIComponent(id)}/limits`, { token, body: limits });
}

/* ------------------------------------------- what a parent sends down */

/**
 * The four calls below write into the other half of the hub.
 *
 * None of them reaches a phone directly. The hub has no way to wake a device,
 * so everything written here waits until the child's app next syncs — a
 * foreground event or a ten minute timer. A note sent now is read when the
 * child next opens the app, and the screen that sends one says so.
 */

export function fetchAssignment(token: string, id: string): Promise<Result<{ assignment: Assignment | null }>> {
  return request('GET', `/v1/children/${encodeURIComponent(id)}/assignment`, { token });
}

/** `null` takes the mission back before the child has collected it. */
export function assignMission(
  token: string,
  id: string,
  taskId: string | null,
): Promise<Result<{ assignment: Assignment | null }>> {
  return request('PUT', `/v1/children/${encodeURIComponent(id)}/assignment`, {
    token,
    body: { taskId },
  });
}

export function fetchRewards(token: string, id: string): Promise<Result<{ rewards: Reward[] }>> {
  return request('GET', `/v1/children/${encodeURIComponent(id)}/rewards`, { token });
}

export function promiseReward(
  token: string,
  id: string,
  reward: { stars: number; label: string; emoji: string },
): Promise<Result<{ reward: Reward }>> {
  return request('POST', `/v1/children/${encodeURIComponent(id)}/rewards`, { token, body: reward });
}

export function markRewardGiven(
  token: string,
  id: string,
  rewardId: string,
  given: boolean,
): Promise<Result<{ reward: Reward }>> {
  return request('PATCH', `/v1/children/${encodeURIComponent(id)}/rewards/${encodeURIComponent(rewardId)}`, {
    token,
    body: { given },
  });
}

export function deleteReward(
  token: string,
  id: string,
  rewardId: string,
): Promise<Result<{ deleted: boolean }>> {
  return request('DELETE', `/v1/children/${encodeURIComponent(id)}/rewards/${encodeURIComponent(rewardId)}`, {
    token,
  });
}

export function fetchNotes(token: string, id: string): Promise<Result<{ notes: Note[] }>> {
  return request('GET', `/v1/children/${encodeURIComponent(id)}/notes`, { token });
}

export function sendNote(token: string, id: string, text: string): Promise<Result<{ note: Note }>> {
  return request('POST', `/v1/children/${encodeURIComponent(id)}/notes`, { token, body: { text } });
}
