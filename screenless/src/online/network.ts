import { LEADERBOARD_TIMEOUT_MS, LEADERBOARD_URL } from './config';

/**
 * The only door from this app to the friends board.
 *
 * It is shut unless something holds it open, and only two things ever do:
 *
 *   account   a username exists, because a parent chose one
 *   picker    a parent has just said yes and is choosing one right now
 *
 * A child whose parent said no has neither, so no request leaves the phone,
 * whatever a screen, an effect or a future feature tries. The check lives here
 * in front of `fetch` rather than in the screens on purpose: a forgotten `if`
 * somewhere else cannot undo it.
 *
 * The Gemini features have their own consent in setup and do not go through
 * this door; they never see the username or the board.
 */

export type NetworkHolder = 'account' | 'picker';

const holders = new Set<NetworkHolder>();

export function holdNetwork(holder: NetworkHolder, open: boolean): void {
  if (open) holders.add(holder);
  else holders.delete(holder);
}

export function isNetworkOpen(): boolean {
  return holders.size > 0;
}

export type ApiError =
  /** The door is shut. Nothing was sent. */
  | 'offline'
  /** This build has no friends board url. Nothing was sent. */
  | 'unconfigured'
  | 'network'
  | 'unauthorized'
  | 'taken'
  | 'invalid'
  | 'notFound'
  | 'self'
  | 'full'
  | 'rateLimited'
  | 'server';

export type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ApiError; reason?: string };

export type Credentials = { playerId: string; token: string };

const KNOWN_ERRORS = new Set<ApiError>([
  'unauthorized',
  'taken',
  'invalid',
  'notFound',
  'self',
  'full',
  'rateLimited',
]);

function toError(status: number, error: unknown): ApiError {
  if (typeof error === 'string' && KNOWN_ERRORS.has(error as ApiError)) return error as ApiError;
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status === 429) return 'rateLimited';
  return 'server';
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; auth?: Credentials } = {},
): Promise<ApiResult<T>> {
  if (!isNetworkOpen()) return { ok: false, error: 'offline' };
  if (!LEADERBOARD_URL) return { ok: false, error: 'unconfigured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEADERBOARD_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth) headers.Authorization = `Bearer ${options.auth.playerId}.${options.auth.token}`;

    const response = await fetch(`${LEADERBOARD_URL}${path}`, {
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
    if (__DEV__) console.warn('[leaderboard] request failed', method, path, error);
    return { ok: false, error: 'network' };
  } finally {
    clearTimeout(timer);
  }
}
