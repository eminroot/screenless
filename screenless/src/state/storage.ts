import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Language } from '../i18n/types';
import { migrateMission, migrateProfile, reconcileSocial } from './migrate';
import { reconcileWardrobe } from '../engine/wardrobe';
import { emptyGuardDay, GUARD_HISTORY_DAYS, type GuardDay } from '../guard/types';
import {
  createEmptyData,
  defaultSettings,
  emptyInbox,
  emptyProgress,
  NOTE_REPLIES,
  SCHEMA_VERSION,
  type AppData,
  type BadgeSet,
  type Find,
  type HubLink,
  type IdeaVote,
  type Inbox,
  type RealReward,
  type TreeFriend,
  type WalkState,
  type WeekGoal,
} from './types';

const STORAGE_KEY = 'screenless.data.v1';

/** Chats are trimmed so storage stays small on low end phones. */
const MAX_CHAT_MESSAGES = 60;
const MAX_MISSIONS = 400;
/** Older thumbs count for almost nothing anyway, so the list is cut here. */
const MAX_IDEA_VOTES = 120;

export async function loadData(fallbackLanguage: Language): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyData(fallbackLanguage);
    return reconcile(JSON.parse(raw) as Partial<AppData>, fallbackLanguage);
  } catch (error) {
    if (__DEV__) console.warn('[storage] load failed, starting fresh', error);
    return createEmptyData(fallbackLanguage);
  }
}

export async function saveData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trim(data)));
  } catch (error) {
    if (__DEV__) console.warn('[storage] save failed', error);
  }
}

export async function clearData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function trim(data: AppData): AppData {
  return {
    ...data,
    missions: data.missions.slice(-MAX_MISSIONS),
    ideaVotes: data.ideaVotes.slice(-MAX_IDEA_VOTES),
    chat: data.chat.slice(-MAX_CHAT_MESSAGES),
    coachChat: data.coachChat.slice(-MAX_CHAT_MESSAGES),
    guardHistory: data.guardHistory.slice(-GUARD_HISTORY_DAYS),
  };
}

/** Fills in anything a stored payload from an older build is missing. */
function reconcile(stored: Partial<AppData>, fallbackLanguage: Language): AppData {
  const base = createEmptyData(fallbackLanguage);
  return {
    schema: SCHEMA_VERSION,
    settings: { ...defaultSettings, ...base.settings, ...stored.settings },
    profile: migrateProfile(stored.profile),
    progress: { ...emptyProgress, ...stored.progress, unlocked: stored.progress?.unlocked ?? [] },
    missions: Array.isArray(stored.missions) ? stored.missions.map(migrateMission) : [],
    chat: Array.isArray(stored.chat) ? stored.chat : [],
    coachChat: Array.isArray(stored.coachChat) ? stored.coachChat : [],
    // A scan older than a day describes a room that has probably moved on.
    room: isFreshScan(stored.room) ? stored.room : null,
    storiesHeard: Array.isArray(stored.storiesHeard) ? stored.storiesHeard : [],
    realRewards: Array.isArray(stored.realRewards) ? stored.realRewards.filter(isRealReward) : [],
    collection: Array.isArray(stored.collection) ? stored.collection.filter(isFind) : [],
    tree: isTree(stored.tree) ? stored.tree : null,
    walk: reconcileWalk(stored.walk),
    social: reconcileSocial(stored.social, Boolean(stored.profile)),
    // Before the wardrobe existed, level rewards lived only in
    // `progress.unlocked` and the buddy wore all of them at once. Those are
    // carried across as owned so nobody loses a crown they reached level six
    // for, and nothing is put on: the child chooses the outfit now.
    wardrobe: reconcileWardrobe({
      owned: [...(stored.wardrobe?.owned ?? []), ...(stored.progress?.unlocked ?? [])],
      worn: stored.wardrobe?.worn ?? [],
    }),
    // A limit written by an older build keeps its settings; a count from a
    // previous day is discarded by the rollover the moment it is read.
    guard: { ...base.guard, ...stored.guard },
    guardDay: { ...base.guardDay, ...stored.guardDay },
    guardHistory: Array.isArray(stored.guardHistory)
      ? stored.guardHistory
          .filter(isGuardDay)
          // A day written before the nudge counters existed is missing half
          // its fields; the defaults go underneath rather than on top.
          .map((day) => ({ ...emptyGuardDay(day.date), ...day }))
          .slice(-GUARD_HISTORY_DAYS)
      : [],
    hub: isHubLink(stored.hub) ? stored.hub : null,
    // Every field is rebuilt from `emptyInbox` rather than trusted, so a
    // stored reply that is no longer one of the four cannot survive an update
    // and be posted to the hub months later.
    inbox: reconcileInbox(stored.inbox),
    badges: isBadgeSet(stored.badges) ? stored.badges : null,
    weekGoal: isWeekGoal(stored.weekGoal) ? stored.weekGoal : null,
    ideaVotes: Array.isArray(stored.ideaVotes)
      ? stored.ideaVotes.filter(isIdeaVote).slice(-MAX_IDEA_VOTES)
      : [],
  };
}

/**
 * A day of screen time from the queue.
 *
 * Checked because a half written payload here would put a hole in the chart
 * the parent sees, and because the fields grew after the first release: an
 * older stored day has no `deviceSec` and no nudge counters, so the defaults
 * are merged in rather than trusted to be there.
 */
function isGuardDay(value: unknown): value is GuardDay {
  const day = value as Partial<GuardDay> | null;
  return typeof day?.date === 'string' && day.date.length === 10 && typeof day.usedSec === 'number';
}

/** The hub link, which is useless without every part of it. */
function isHubLink(value: unknown): value is HubLink {
  const link = value as Partial<HubLink> | null;
  return (
    typeof link?.token === 'string' &&
    link.token.includes('.') &&
    typeof link.deviceId === 'string' &&
    typeof link.childId === 'string'
  );
}

function isIdeaVote(value: unknown): value is IdeaVote {
  const vote = value as Partial<IdeaVote> | null;
  return (
    typeof vote?.id === 'string' &&
    (vote.value === 1 || vote.value === -1) &&
    typeof vote.at === 'string' &&
    Array.isArray(vote.facets) &&
    vote.facets.every((facet) => typeof facet === 'string')
  );
}

function isWeekGoal(value: unknown): value is WeekGoal {
  const goal = value as Partial<WeekGoal> | null;
  return typeof goal?.minutes === 'number' && goal.minutes > 0 && typeof goal.setAt === 'string';
}

/** A badge key that came back malformed would make every printed badge unreadable. */
function isBadgeSet(value: unknown): value is BadgeSet {
  const set = value as Partial<BadgeSet> | null;
  return typeof set?.key === 'string' && set.key.length >= 6 && typeof set.createdAt === 'string';
}

/** Guards against a hand edited or half written export coming back in. */
function isRealReward(value: unknown): value is RealReward {
  const reward = value as Partial<RealReward> | null;
  return (
    typeof reward?.id === 'string' &&
    typeof reward.label === 'string' &&
    typeof reward.emoji === 'string' &&
    typeof reward.stars === 'number' &&
    Number.isFinite(reward.stars) &&
    reward.stars > 0
  );
}

/** Guards the child's own records against a hand edited export coming back in. */
function isFind(value: unknown): value is Find {
  const find = value as Partial<Find> | null;
  return (
    typeof find?.id === 'string' &&
    typeof find.kind === 'string' &&
    typeof find.at === 'string' &&
    Array.isArray(find.answers) &&
    Array.isArray(find.factIds)
  );
}

/** Walking totals arrive from an older build, or from a hand edited export. */
function reconcileInbox(stored: Inbox | undefined): Inbox {
  if (!stored || typeof stored !== 'object') return { ...emptyInbox };
  const assignment = stored.assignment;
  const note = stored.note;
  const pending = stored.pendingReply;
  return {
    assignment:
      assignment && typeof assignment.taskId === 'string' && assignment.taskId
        ? {
            taskId: assignment.taskId,
            assignedAt: String(assignment.assignedAt ?? ''),
            // Written before the source existed, so it can only have come
            // from the hub: that was the only way in at the time.
            source: assignment.source === 'local' ? 'local' : 'hub',
          }
        : null,
    note:
      note && typeof note.id === 'string' && typeof note.text === 'string'
        ? {
            id: note.id,
            text: note.text,
            at: String(note.at ?? ''),
            source: note.source === 'local' ? 'local' : 'hub',
          }
        : null,
    pendingReply:
      pending && typeof pending.id === 'string' && NOTE_REPLIES.includes(pending.reply)
        ? { id: pending.id, reply: pending.reply }
        : null,
    pendingTook: typeof stored.pendingTook === 'string' ? stored.pendingTook : null,
  };
}

function reconcileWalk(stored: WalkState | undefined): WalkState {
  const safe = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

  return {
    coins: safe(stored?.coins),
    lifetimeSteps: safe(stored?.lifetimeSteps),
    days: Array.isArray(stored?.days)
      ? stored.days
          .filter((day) => typeof day?.date === 'string')
          .map((day) => ({ date: day.date, steps: safe(day.steps) }))
          .slice(-14)
      : [],
    bestDay: safe(stored?.bestDay),
    goalStreak: safe(stored?.goalStreak),
  };
}

function isTree(value: unknown): value is TreeFriend {
  const tree = value as Partial<TreeFriend> | null;
  return (
    typeof tree?.name === 'string' &&
    typeof tree.startedAt === 'string' &&
    Array.isArray(tree.checkIns)
  );
}

const SCAN_TTL_MS = 24 * 60 * 60 * 1000;

function isFreshScan(scan: AppData['room'] | undefined): scan is NonNullable<AppData['room']> {
  if (!scan?.at || !Array.isArray(scan.objects)) return false;
  const age = Date.now() - new Date(scan.at).getTime();
  return Number.isFinite(age) && age >= 0 && age < SCAN_TTL_MS;
}
