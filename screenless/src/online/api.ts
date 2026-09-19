import { BUDDY_IDS, type BuddyId, type OnlineAccount } from '../state/types';
import { request, type ApiResult, type Credentials } from './network';
import type { ScoreSnapshot } from './score';
import type { UsernameProblem } from './username';

/**
 * Every call the app makes to the friends board. All of them go through
 * `request`, which refuses to send anything unless a parent allowed it.
 */

export type Availability = { available: boolean; reason?: UsernameProblem | 'taken' };

export type BoardEntry = {
  id: string;
  username: string;
  buddyId: BuddyId;
  level: number;
  stars: number;
  missions: number;
  streak: number;
  weekStars: number;
  weekSteps: number;
  me: boolean;
};

export type Board = {
  week: string;
  username: string;
  inviteCode: string;
  entries: BoardEntry[];
};

export function checkUsername(username: string): Promise<ApiResult<Availability>> {
  return request('GET', `/usernames/${encodeURIComponent(username)}`);
}

export async function claimUsername(
  username: string,
  buddyId: BuddyId | null,
): Promise<ApiResult<OnlineAccount>> {
  const result = await request<OnlineAccount>('POST', '/players', {
    body: { username, buddyId: buddyId ?? undefined },
  });
  if (!result.ok) return result;
  const { playerId, token, inviteCode, createdAt } = result.value;
  return {
    ok: true,
    value: { playerId, token, username: result.value.username, inviteCode, createdAt },
  };
}

export function renameUsername(auth: Credentials, username: string): Promise<ApiResult<{ username: string }>> {
  return request('PATCH', '/me', { auth, body: { username } });
}

export function sendScore(auth: Credentials, score: ScoreSnapshot): Promise<ApiResult<{ stars: number }>> {
  return request('PUT', '/me/score', { auth, body: score });
}

export function newInviteCode(auth: Credentials): Promise<ApiResult<{ inviteCode: string }>> {
  return request('POST', '/me/invite', { auth });
}

export function deleteAccount(auth: Credentials): Promise<ApiResult<{ deleted: boolean }>> {
  return request('DELETE', '/me', { auth });
}

export async function fetchBoard(auth: Credentials, week: string): Promise<ApiResult<Board>> {
  const result = await request<Board>('GET', `/board?week=${encodeURIComponent(week)}`, { auth });
  if (!result.ok) return result;
  const entries = Array.isArray(result.value.entries) ? result.value.entries.map(cleanEntry) : [];
  return { ok: true, value: { ...result.value, entries } };
}

export function addFriend(
  auth: Credentials,
  code: string,
): Promise<ApiResult<{ already: boolean; friend: BoardEntry }>> {
  return request('POST', '/friends', { auth, body: { code } });
}

export function removeFriend(auth: Credentials, friendId: string): Promise<ApiResult<{ removed: boolean }>> {
  return request('DELETE', `/friends/${encodeURIComponent(friendId)}`, { auth });
}

/** A board row is drawn with a buddy, so an unknown id would crash the screen. */
function cleanEntry(entry: BoardEntry): BoardEntry {
  const count = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return {
    id: String(entry.id),
    username: String(entry.username),
    buddyId: (BUDDY_IDS as readonly string[]).includes(entry.buddyId) ? entry.buddyId : 'fox',
    level: Math.max(1, count(entry.level)),
    stars: count(entry.stars),
    missions: count(entry.missions),
    streak: count(entry.streak),
    weekStars: count(entry.weekStars),
    weekSteps: count(entry.weekSteps),
    me: entry.me === true,
  };
}
