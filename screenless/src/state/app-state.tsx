import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getLocales } from 'expo-localization';

import { resolveDeviceLanguage } from '../i18n';
import type { Language } from '../i18n/types';
import { partOfDay } from '../engine/context';
import { seasonOf } from '../engine/find-engine';
import { applyCompletion, dayKey, decayStreak, revokeCompletion, type ProgressDelta } from '../engine/progress';
import { addSteps, decayGoalStreak, type WalkDelta } from '../engine/walk';
import { clampRewardStars, MAX_REAL_REWARDS, MAX_REWARD_LABEL, rewardsCrossed } from '../engine/rewards';
import { GUARD_HISTORY_DAYS, type GuardConfig, type GuardDay } from '../guard/types';
import { creditNudge } from '../guard/nudge';
import { buy, coinsForMission, grant, takeOffAll, toggle } from '../engine/wardrobe';
import { createBadgeKey } from '../engine/badges';
import { nextRating } from '../engine/taste';
import { canTakeBack, decideReview, planMission, selfChecks } from '../engine/verify';
import { cancelReviewNudge, scheduleReviewNudge } from '../lib/review-notify';
import { holdNetwork } from '../online/network';
import { discard } from '../vision/detector';
import { clearAlbum, remove } from '../vision/finder';
import { clearData, loadData, saveData } from './storage';
import {
  createEmptyData,
  type AppData,
  type ChatMessage,
  type ChildProfile,
  type Find,
  type FindKindId,
  type FindPlaceId,
  type HubLink,
  type ItemId,
  type LeafState,
  type IdeaVote,
  type Mission,
  type MissionReview,
  type OnlineAccount,
  type RealReward,
  type Rating,
  type RoomScan,
  type Settings,
  type SkipReason,
  type TaskContent,
  type TreeCheckIn,
  type TreeFriend,
} from './types';

/** What the runner measured while the child was doing the mission. */
export type MissionEvidence = Partial<
  Pick<
    Mission,
    | 'durationSec'
    | 'motionReps'
    | 'proofUri'
    | 'proofTags'
    | 'checkAnswer'
    | 'awaySec'
    | 'awaySensor'
    | 'steps'
    | 'activeSec'
    | 'motionOdd'
    | 'badgeHits'
    | 'badgeMisses'
    | 'secretFound'
    | 'secretMisses'
    | 'answerValue'
    | 'picked'
    | 'beforeUri'
    | 'photoRead'
    | 'photoOfScreen'
    | 'grownupAt'
    | 'note'
  >
>;

/**
 * How a finished mission came out. `approved` when the phone (or a grown up
 * on the spot) approved it straight away, in which case the stars are already
 * paid; otherwise it is waiting for a parent.
 */
export type SubmitResult =
  | { approved: true; by: MissionReview['by']; completion: CompletionResult }
  | { approved: false };

/** A name a child types stays short enough to fit on a card. */
const MAX_NICKNAME = 24;
/** Two years of fortnightly visits, which is more than anyone will manage. */
const MAX_CHECK_INS = 60;
/**
 * Cap on the collection. Trimming happens here rather than in the save path
 * because dropping a find has to take its photograph off the disk with it, and
 * a record trimmed without its file would leak the file forever.
 */
const MAX_FINDS = 300;

/** Everything the walkthrough collected about one thing the child found. */
export type NewFind = {
  kind: FindKindId;
  answers: string[];
  factIds: string[];
  /** Already copied into the album by the caller, so it survives the cache. */
  photoUri?: string;
  place?: FindPlaceId;
  nickname?: string;
  label?: string;
};

export function makeId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** What one confirmed mission changed, including any promise it just reached. */
export type CompletionResult = ProgressDelta & {
  reachedRewards: RealReward[];
  /** Coins the mission paid into the purse, for the celebration screen. */
  coins: number;
};

type AppStateValue = {
  ready: boolean;
  data: AppData;
  language: Language;
  profile: ChildProfile | null;
  activeMission: Mission | null;
  pendingMissions: Mission[];
  doneMissions: Mission[];
  skippedMissions: Mission[];
  isOnboarded: boolean;

  setLanguage: (language: Language) => void;
  acceptConsent: () => void;
  saveProfile: (profile: ChildProfile) => void;
  updateProfile: (patch: Partial<ChildProfile>) => void;
  setParentPin: (pin: string) => void;
  setReminder: (enabled: boolean, hour?: number, minute?: number) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setDuoEnabled: (enabled: boolean) => void;
  /** Spends coins on a buddy item and puts it on. False when it did not happen. */
  buyItem: (id: ItemId) => boolean;
  /** Puts an owned item on, or takes it off if it is already on. */
  toggleItem: (id: ItemId) => void;
  clearOutfit: () => void;
  setGuardConfig: (config: GuardConfig) => void;
  setGuardDay: (day: GuardDay) => void;
  linkHub: (hub: HubLink) => void;
  patchHub: (patch: Partial<HubLink>) => void;
  unlinkHub: () => void;
  setTeenSkin: (skin: 'dark' | 'light') => void;

  /** The parent said no to a username, or took it away. The door to the board shuts. */
  goOffline: () => void;
  /** The server accepted a username for this child. */
  goOnline: (account: OnlineAccount) => void;
  /** A rename or a new invite code the server confirmed. */
  updateAccount: (patch: Partial<Pick<OnlineAccount, 'username' | 'inviteCode'>>) => void;
  markScoreSent: (serialised: string) => void;
  /** The server no longer knows this username. Goes offline and remembers why. */
  loseAccount: () => void;

  assignMission: (task: TaskContent) => Mission;
  startMission: (missionId: string) => void;
  claimMission: (missionId: string, evidence?: MissionEvidence) => void;
  /** Stores what the runner measured so far, without finishing the mission. */
  saveEvidence: (missionId: string, evidence: MissionEvidence) => void;
  /**
   * Finishes a mission. Ages 6-9 are decided here, by the phone or sent to a
   * parent; every other age simply waits for a parent, exactly as a claim does.
   */
  submitMission: (missionId: string, evidence?: MissionEvidence) => SubmitResult;
  confirmMission: (missionId: string) => CompletionResult | null;
  rejectMission: (missionId: string) => void;
  skipMission: (missionId: string, reason: SkipReason) => void;
  /** A parent undoing a mission the phone approved. False when it cannot be. */
  takeBackMission: (missionId: string) => boolean;

  /**
   * A thumb up or down from the child on a mission they were given. Pressing
   * the same thumb again clears it, because a five year old will press both.
   * It changes what gets offered next and nothing else.
   */
  rateMission: (missionId: string, rating: Rating) => void;
  /** A thumb on a made for you idea that was never started. */
  voteIdea: (input: { id: string; facets: string[]; value: Rating }) => void;

  /** Makes this family's treasure badge sheet, or a new one that retires the old. */
  createBadges: () => void;
  removeBadges: () => void;
  setSpotChecks: (mode: Settings['spotChecks']) => void;
  setReviewNotify: (enabled: boolean) => void;
  /** The 10-13 screen free target for this week, set by the child themselves. */
  setWeekGoal: (minutes: number) => void;

  addRealReward: (input: { label: string; emoji: string; stars: number }) => void;
  removeRealReward: (rewardId: string) => void;
  setRewardGiven: (rewardId: string, given: boolean) => void;

  setRoomScan: (scan: RoomScan) => void;
  clearRoomScan: () => void;
  markStoryHeard: (storyId: string) => void;

  addFind: (input: NewFind) => Find;
  renameFind: (findId: string, nickname: string) => void;
  removeFind: (findId: string) => void;
  adoptTree: (input: { name: string; photoUri?: string; leafState?: LeafState; hugs?: number }) => void;
  renameTree: (name: string) => void;
  addTreeCheckIn: (input: { photoUri?: string; leafState?: LeafState; hugs?: number }) => void;
  forgetTree: () => void;

  /** Folds counted steps in and reports what changed, or null if nothing did. */
  recordSteps: (steps: number) => WalkDelta | null;

  pushChat: (message: ChatMessage) => void;
  clearChat: () => void;
  pushCoachChat: (message: ChatMessage) => void;
  clearCoachChat: () => void;

  resetAll: () => Promise<void>;
  exportPayload: () => string;
};

const AppStateContext = createContext<AppStateValue | null>(null);

const deviceLanguage = (() => {
  try {
    return resolveDeviceLanguage(getLocales().map((l) => l.languageTag));
  } catch {
    return 'tr' as Language;
  }
})();

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => createEmptyData(deviceLanguage));
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // Read by `recordSteps`, which is called from a sensor loop. Keeping the
  // callback stable matters more here than anywhere else in the app: a new
  // identity every render would resubscribe the accelerometer constantly.
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let cancelled = false;
    loadData(deviceLanguage).then((stored) => {
      if (cancelled) return;
      setData({
        ...stored,
        progress: decayStreak(stored.progress),
        walk: stored.profile
          ? decayGoalStreak(stored.walk, stored.profile.ageBand)
          : stored.walk,
      });
      hydrated.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The friends board is reachable only while a username exists. Anything else,
  // including a family that never answered, keeps the door shut.
  const onlineMode = data.social.mode === 'online' && data.social.account !== null;
  useEffect(() => {
    holdNetwork('account', onlineMode);
  }, [onlineMode]);

  // Persist after hydration only, so an empty initial state never overwrites disk.
  useEffect(() => {
    if (!hydrated.current) return;
    const handle = setTimeout(() => void saveData(data), 120);
    return () => clearTimeout(handle);
  }, [data]);

  const setLanguage = useCallback((language: Language) => {
    setData((d) => ({ ...d, settings: { ...d.settings, language } }));
  }, []);

  const acceptConsent = useCallback(() => {
    setData((d) => ({
      ...d,
      settings: { ...d.settings, consentAt: new Date().toISOString() },
    }));
  }, []);

  const saveProfile = useCallback((profile: ChildProfile) => {
    setData((d) => ({ ...d, profile }));
  }, []);

  const updateProfile = useCallback((patch: Partial<ChildProfile>) => {
    setData((d) => (d.profile ? { ...d, profile: { ...d.profile, ...patch } } : d));
  }, []);

  const setParentPin = useCallback((parentPin: string) => {
    setData((d) => ({ ...d, settings: { ...d.settings, parentPin } }));
  }, []);

  const setReminder = useCallback((enabled: boolean, hour?: number, minute?: number) => {
    setData((d) => ({
      ...d,
      settings: {
        ...d.settings,
        remindersEnabled: enabled,
        reminderHour: hour ?? d.settings.reminderHour,
        reminderMinute: minute ?? d.settings.reminderMinute,
      },
    }));
  }, []);

  const setVoiceEnabled = useCallback((voiceEnabled: boolean) => {
    setData((d) => ({ ...d, settings: { ...d.settings, voiceEnabled } }));
  }, []);

  const setDuoEnabled = useCallback((duoEnabled: boolean) => {
    setData((d) => ({ ...d, settings: { ...d.settings, duoEnabled } }));
  }, []);

  const setTeenSkin = useCallback((teenSkin: 'dark' | 'light') => {
    setData((d) => ({ ...d, settings: { ...d.settings, teenSkin } }));
  }, []);

  /**
   * Buys an item.
   *
   * Reads the purse through the ref rather than from `data`, so the callback
   * stays stable and a double tap cannot spend the same coins twice: the check
   * and the deduction happen against the same snapshot.
   */
  const buyItem = useCallback((id: ItemId) => {
    const current = dataRef.current;
    const result = buy(current.wardrobe, id, current.walk.coins);
    if (!result.ok) return false;
    setData((d) => ({
      ...d,
      wardrobe: result.wardrobe,
      walk: { ...d.walk, coins: Math.max(0, d.walk.coins - result.spent) },
    }));
    return true;
  }, []);

  const toggleItem = useCallback((id: ItemId) => {
    setData((d) => ({ ...d, wardrobe: toggle(d.wardrobe, id) }));
  }, []);

  const clearOutfit = useCallback(() => {
    setData((d) => ({ ...d, wardrobe: takeOffAll(d.wardrobe) }));
  }, []);

  const setGuardConfig = useCallback((guard: GuardConfig) => {
    setData((d) => ({ ...d, guard }));
  }, []);

  /**
   * Today's count. Written from the sync in `useGuard`, which is the only
   * place that reconciles what the native watcher measured with the rules.
   *
   * When the date moves on, the day that just ended is pushed into the queue
   * rather than overwritten. It is the only copy of it anywhere until the hub
   * has it, and the rollover is the one moment it can be caught: a child's
   * Tuesday is gone the instant Wednesday's zero is written over it.
   */
  const setGuardDay = useCallback((guardDay: GuardDay) => {
    setData((d) => {
      if (d.guardDay.date === guardDay.date) return { ...d, guardDay };
      // An empty date is the placeholder a fresh install starts with, and
      // there is nothing in it worth keeping.
      const history = d.guardDay.date
        ? [...d.guardHistory.filter((day) => day.date !== d.guardDay.date), d.guardDay]
        : d.guardHistory;
      return { ...d, guardDay, guardHistory: history.slice(-GUARD_HISTORY_DAYS) };
    });
  }, []);

  /** After a successful upload: what the hub has, and how far it got. */
  const patchHub = useCallback((patch: Partial<HubLink>) => {
    setData((d) => (d.hub ? { ...d, hub: { ...d.hub, ...patch } } : d));
  }, []);

  /**
   * A grown up typed the pairing code and it worked.
   *
   * Linking never touches anything else: the missions, the buddy, the wardrobe
   * and every setting stay exactly as they were, and unlinking puts the phone
   * back to where it was before. That is deliberate. A family trying this out
   * has to be able to undo it in one tap without losing a month of work.
   */
  const linkHub = useCallback((hub: HubLink) => {
    setData((d) => ({ ...d, hub }));
  }, []);

  const unlinkHub = useCallback(() => {
    setData((d) => ({ ...d, hub: null }));
  }, []);

  const goOffline = useCallback(() => {
    setData((d) => ({
      ...d,
      social: { mode: 'offline', account: null, lastSent: null, lastSentAt: null, lostUsername: null },
    }));
  }, []);

  const goOnline = useCallback((account: OnlineAccount) => {
    setData((d) => ({
      ...d,
      social: { mode: 'online', account, lastSent: null, lastSentAt: null, lostUsername: null },
    }));
  }, []);

  const updateAccount = useCallback(
    (patch: Partial<Pick<OnlineAccount, 'username' | 'inviteCode'>>) => {
      setData((d) =>
        d.social.account
          ? { ...d, social: { ...d.social, account: { ...d.social.account, ...patch } } }
          : d,
      );
    },
    [],
  );

  const markScoreSent = useCallback((serialised: string) => {
    setData((d) =>
      d.social.mode === 'online'
        ? {
            ...d,
            social: { ...d.social, lastSent: serialised, lastSentAt: new Date().toISOString() },
          }
        : d,
    );
  }, []);

  const loseAccount = useCallback(() => {
    setData((d) => ({
      ...d,
      social: {
        mode: 'offline',
        account: null,
        lastSent: null,
        lastSentAt: null,
        lostUsername: d.social.account?.username ?? null,
      },
    }));
  }, []);

  const assignMission = useCallback((task: TaskContent) => {
    const current = dataRef.current;
    const mission: Mission = {
      id: makeId('m'),
      task,
      status: 'active',
      assignedAt: new Date().toISOString(),
      // Stamped now rather than at completion, so the learning read reflects
      // when the child was asked, not when a parent got round to confirming.
      partOfDay: partOfDay(),
      // Which badges, which secret object. Decided once, so leaving the screen
      // and coming back does not reshuffle the hunt.
      plan: planMission(task, { recent: current.missions, roomObjects: current.room?.objects ?? null }),
    };
    setData((d) => ({
      ...d,
      // Only one mission is ever active; anything stale becomes skipped.
      missions: [
        ...d.missions.map((m) =>
          m.status === 'active' ? { ...m, status: 'skipped' as const } : m,
        ),
        mission,
      ],
    }));
    return mission;
  }, []);

  const startMission = useCallback((missionId: string) => {
    const at = Date.now();
    setData((d) => {
      const target = d.missions.find((m) => m.id === missionId);
      if (!target || target.status !== 'active' || target.startedAt) return d;
      return {
        ...d,
        missions: d.missions.map((m) =>
          m.id === missionId ? { ...m, startedAt: new Date(at).toISOString() } : m,
        ),
        // A mission started soon after a screen time reminder is that reminder
        // having worked, which is the only honest measure of whether any of
        // them are worth sending. Credited here rather than in the runner
        // because this is the moment the child acted.
        guardDay: creditNudge(d.guardDay, at),
      };
    });
  }, []);

  /** Tells the parent a minute from now, unless somebody decides first. */
  const nudgeParent = useCallback((mission: Mission) => {
    const current = dataRef.current;
    if (!current.settings.reviewNotify || !current.profile) return;
    void scheduleReviewNudge({
      missionId: mission.id,
      language: current.settings.language,
      childName: current.profile.nickname,
      missionTitle: mission.task.title[current.settings.language],
    });
  }, []);

  const claimMission = useCallback(
    (missionId: string, evidence?: MissionEvidence) => {
      const mission = dataRef.current.missions.find((m) => m.id === missionId && m.status === 'active');
      setData((d) => ({
        ...d,
        missions: d.missions.map((m) =>
          m.id === missionId && m.status === 'active'
            ? { ...m, ...evidence, status: 'pending', claimedAt: new Date().toISOString() }
            : m,
        ),
      }));
      if (mission) nudgeParent(mission);
    },
    [nudgeParent],
  );

  const saveEvidence = useCallback((missionId: string, evidence: MissionEvidence) => {
    setData((d) => ({
      ...d,
      missions: d.missions.map((m) =>
        m.id === missionId && m.status === 'active' ? { ...m, ...evidence } : m,
      ),
    }));
  }, []);

  /**
   * Pays out one mission, whoever approved it.
   *
   * Reads through the ref rather than a closure over `data`, because the phone
   * approving a mission happens in the same tick as the evidence landing, and
   * a stale closure would pay the stars against an old total.
   */
  const completeMission = useCallback(
    (missionId: string, extra: Partial<Mission>): CompletionResult | null => {
      const current = dataRef.current;
      const mission = current.missions.find((m) => m.id === missionId);
      if (!mission || mission.status === 'done' || mission.status === 'skipped') return null;

      // Computed here rather than inside the updater: the caller needs the
      // delta straight away to show the level up, and a state updater does not
      // run synchronously.
      const delta = applyCompletion(
        current.progress,
        mission.task.stars,
        mission.task.minutes,
        dayKey(),
      );

      // The photos have done their job the moment the mission is decided.
      discard(mission.proofUri);
      discard(mission.beforeUri);
      void cancelReviewNudge(missionId);

      // Coins as well as stars. They are not the same thing and never convert:
      // the stars are what a parent priced a real bicycle against, the coins
      // buy a hat for a cartoon fox.
      const coins = coinsForMission(mission.task.stars);
      const now = new Date().toISOString();

      const apply = (d: AppData): AppData => {
        const target = d.missions.find((m) => m.id === missionId);
        if (!target || target.status === 'done' || target.status === 'skipped') return d;
        // Recomputed against the state the update actually lands on, so steps
        // banked in the same moment by the walk counter are not overwritten.
        const landed = applyCompletion(d.progress, mission.task.stars, mission.task.minutes, dayKey());
        return {
          ...d,
          progress: landed.progress,
          walk: { ...d.walk, coins: d.walk.coins + coins },
          // A level reward is filed in the wardrobe but not put on. An outfit
          // the child arranged should not change because they finished a mission.
          wardrobe: grant(d.wardrobe, landed.newRewards),
          missions: d.missions.map((m) =>
            m.id === missionId
              ? {
                  ...m,
                  ...extra,
                  status: 'done',
                  claimedAt: extra.claimedAt ?? m.claimedAt ?? now,
                  confirmedAt: now,
                  proofUri: undefined,
                  beforeUri: undefined,
                }
              : m,
          ),
        };
      };
      // The ref moves ahead of the render, so a second call in the same tick
      // (a double tap) finds the mission already done instead of paying twice.
      dataRef.current = apply(current);
      setData(apply);

      // Nothing is marked given here. Crossing the number only earns the child
      // the right to go and ask.
      return {
        ...delta,
        coins,
        reachedRewards: rewardsCrossed(current.realRewards, current.progress.stars, delta.progress.stars),
      };
    },
    [],
  );

  const confirmMission = useCallback(
    (missionId: string) => {
      const mission = dataRef.current.missions.find((m) => m.id === missionId);
      // A mission the phone sent to a parent keeps its record of why, with the
      // parent now written in as the one who approved it.
      const review = mission?.review ? { ...mission.review, by: 'parent' as const } : undefined;
      return completeMission(missionId, review ? { review } : {});
    },
    [completeMission],
  );

  const submitMission = useCallback(
    (missionId: string, evidence?: MissionEvidence): SubmitResult => {
      const current = dataRef.current;
      const active = current.missions.find((m) => m.id === missionId && m.status === 'active');
      if (!active || !current.profile) return { approved: false };

      // Anything other than 6-9 is a plain claim, as it always was.
      if (!selfChecks(current.profile.ageBand)) {
        claimMission(missionId, evidence);
        return { approved: false };
      }

      const now = Date.now();
      const claimedAt = new Date(now).toISOString();
      const finished: Mission = { ...active, ...evidence, claimedAt };
      const decision = decideReview({
        mission: finished,
        history: current.missions,
        band: current.profile.ageBand,
        spotChecks: current.settings.spotChecks,
        now,
        random: Math.random,
      });

      if (decision.approve) {
        const completion = completeMission(missionId, { ...evidence, claimedAt, review: decision.review });
        if (completion) return { approved: true, by: decision.review.by, completion };
        return { approved: false };
      }

      const apply = (d: AppData): AppData => ({
        ...d,
        missions: d.missions.map((m) =>
          m.id === missionId && m.status === 'active'
            ? { ...m, ...evidence, claimedAt, status: 'pending' as const, review: decision.review }
            : m,
        ),
      });
      dataRef.current = apply(current);
      setData(apply);
      nudgeParent(finished);
      return { approved: false };
    },
    [claimMission, completeMission, nudgeParent],
  );

  const takeBackMission = useCallback((missionId: string) => {
    const current = dataRef.current;
    const mission = current.missions.find((m) => m.id === missionId);
    if (!mission || !canTakeBack(mission)) return false;

    const at = new Date().toISOString();
    const apply = (d: AppData): AppData => {
      const target = d.missions.find((m) => m.id === missionId);
      if (!target || !canTakeBack(target)) return d;
      return {
        ...d,
        progress: revokeCompletion(d.progress, mission.task.stars, mission.task.minutes),
        // Coins already spent stay spent; the purse simply cannot go below zero.
        walk: { ...d.walk, coins: Math.max(0, d.walk.coins - coinsForMission(mission.task.stars)) },
        missions: d.missions.map((m) =>
          m.id === missionId ? { ...m, status: 'skipped' as const, takenBackAt: at } : m,
        ),
      };
    };
    dataRef.current = apply(current);
    setData(apply);
    return true;
  }, []);

  const createBadges = useCallback(() => {
    setData((d) => ({ ...d, badges: { key: createBadgeKey(), createdAt: new Date().toISOString() } }));
  }, []);

  const removeBadges = useCallback(() => setData((d) => ({ ...d, badges: null })), []);

  const setSpotChecks = useCallback((spotChecks: Settings['spotChecks']) => {
    setData((d) => ({ ...d, settings: { ...d.settings, spotChecks } }));
  }, []);

  const setReviewNotify = useCallback((reviewNotify: boolean) => {
    setData((d) => ({ ...d, settings: { ...d.settings, reviewNotify } }));
  }, []);

  const setWeekGoal = useCallback((minutes: number) => {
    setData((d) => ({
      ...d,
      weekGoal: { minutes: Math.max(1, Math.round(minutes)), setAt: new Date().toISOString() },
    }));
  }, []);

  const rejectMission = useCallback((missionId: string) => {
    setData((d) => {
      const mission = d.missions.find((m) => m.id === missionId && m.status === 'pending');
      if (!mission) return d;
      discard(mission.proofUri);
      discard(mission.beforeUri);
      void cancelReviewNudge(missionId);

      return {
        ...d,
        missions: d.missions.map((m) => {
          if (m.id === missionId) {
            // The evidence and the phone's read go with it: whatever the child
            // does next is judged afresh when they finish again.
            return {
              ...m,
              status: 'active',
              claimedAt: undefined,
              proofUri: undefined,
              beforeUri: undefined,
              review: undefined,
              grownupAt: undefined,
            };
          }
          // The child may have picked up a new mission while this one waited.
          // Sending one back keeps exactly one active, so it wins.
          return m.status === 'active' ? { ...m, status: 'skipped' as const } : m;
        }),
      };
    });
  }, []);

  const skipMission = useCallback((missionId: string, reason: SkipReason) => {
    setData((d) => ({
      ...d,
      missions: d.missions.map((m) =>
        m.id === missionId ? { ...m, status: 'skipped', skipReason: reason } : m,
      ),
    }));
  }, []);

  const rateMission = useCallback((missionId: string, rating: Rating) => {
    setData((d) => ({
      ...d,
      missions: d.missions.map((m) => {
        if (m.id !== missionId) return m;
        const next = nextRating(m.rating, rating);
        if (next === null) {
          const { rating: _rating, ratedAt: _ratedAt, ...rest } = m;
          return rest;
        }
        return { ...m, rating: next, ratedAt: new Date().toISOString() };
      }),
    }));
  }, []);

  const voteIdea = useCallback((input: { id: string; facets: string[]; value: Rating }) => {
    setData((d) => {
      const existing = d.ideaVotes.find((vote) => vote.id === input.id);
      const rest = d.ideaVotes.filter((vote) => vote.id !== input.id);
      // The same thumb twice takes it back, as on a mission.
      if (existing && existing.value === input.value) return { ...d, ideaVotes: rest };
      const vote: IdeaVote = {
        id: input.id,
        facets: input.facets,
        value: input.value,
        at: new Date().toISOString(),
      };
      return { ...d, ideaVotes: [...rest, vote] };
    });
  }, []);

  const addRealReward = useCallback((input: { label: string; emoji: string; stars: number }) => {
    const label = input.label.trim().slice(0, MAX_REWARD_LABEL);
    if (!label) return;
    setData((d) => {
      if (d.realRewards.length >= MAX_REAL_REWARDS) return d;
      const reward: RealReward = {
        id: makeId('rr'),
        label,
        emoji: input.emoji,
        stars: clampRewardStars(input.stars),
        createdAt: new Date().toISOString(),
      };
      return { ...d, realRewards: [...d.realRewards, reward] };
    });
  }, []);

  const removeRealReward = useCallback((rewardId: string) => {
    setData((d) => ({ ...d, realRewards: d.realRewards.filter((r) => r.id !== rewardId) }));
  }, []);

  const setRewardGiven = useCallback((rewardId: string, given: boolean) => {
    setData((d) => ({
      ...d,
      realRewards: d.realRewards.map((r) =>
        r.id === rewardId ? { ...r, givenAt: given ? new Date().toISOString() : undefined } : r,
      ),
    }));
  }, []);

  const setRoomScan = useCallback((room: RoomScan) => {
    setData((d) => ({ ...d, room }));
  }, []);

  const clearRoomScan = useCallback(() => setData((d) => ({ ...d, room: null })), []);

  const markStoryHeard = useCallback((storyId: string) => {
    setData((d) =>
      d.storiesHeard.includes(storyId)
        ? d
        : { ...d, storiesHeard: [...d.storiesHeard, storyId].slice(-40) },
    );
  }, []);

  /**
   * Keeps one thing the child found.
   *
   * No stars. Stars only ever come from a mission a parent confirmed, and
   * pointing a camera at forty leaves should not be able to buy an ice cream.
   * What a find earns is the card, the photo on it and the fact behind it,
   * which is the reward this part of the app is built on.
   */
  const addFind = useCallback((input: NewFind) => {
    const find: Find = {
      id: makeId('f'),
      at: new Date().toISOString(),
      ...input,
    };
    setData((d) => {
      const collection = [...d.collection, find];
      if (collection.length <= MAX_FINDS) return { ...d, collection };
      const dropped = collection.slice(0, collection.length - MAX_FINDS);
      for (const old of dropped) remove(old.photoUri);
      return { ...d, collection: collection.slice(-MAX_FINDS) };
    });
    return find;
  }, []);

  const renameFind = useCallback((findId: string, nickname: string) => {
    const trimmed = nickname.trim().slice(0, MAX_NICKNAME);
    setData((d) => ({
      ...d,
      collection: d.collection.map((find) =>
        find.id === findId ? { ...find, nickname: trimmed || undefined } : find,
      ),
    }));
  }, []);

  const removeFind = useCallback((findId: string) => {
    setData((d) => {
      const find = d.collection.find((f) => f.id === findId);
      if (!find) return d;
      remove(find.photoUri);
      return { ...d, collection: d.collection.filter((f) => f.id !== findId) };
    });
  }, []);

  const adoptTree = useCallback(
    (input: { name: string; photoUri?: string; leafState?: LeafState; hugs?: number }) => {
      const name = input.name.trim().slice(0, MAX_NICKNAME);
      if (!name) return;
      const now = new Date();
      const first: TreeCheckIn = {
        id: makeId('tc'),
        at: now.toISOString(),
        season: seasonOf(now),
        photoUri: input.photoUri,
        leafState: input.leafState,
        hugs: input.hugs,
      };
      const tree: TreeFriend = {
        name,
        startedAt: now.toISOString(),
        checkIns: [first],
      };
      setData((d) => ({ ...d, tree }));
    },
    [],
  );

  const renameTree = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, MAX_NICKNAME);
    if (!trimmed) return;
    setData((d) => (d.tree ? { ...d, tree: { ...d.tree, name: trimmed } } : d));
  }, []);

  const addTreeCheckIn = useCallback(
    (input: { photoUri?: string; leafState?: LeafState; hugs?: number }) => {
      const now = new Date();
      const checkIn: TreeCheckIn = {
        id: makeId('tc'),
        at: now.toISOString(),
        season: seasonOf(now),
        photoUri: input.photoUri,
        leafState: input.leafState,
        hugs: input.hugs,
      };
      setData((d) =>
        d.tree
          ? { ...d, tree: { ...d.tree, checkIns: [...d.tree.checkIns, checkIn].slice(-MAX_CHECK_INS) } }
          : d,
      );
    },
    [],
  );

  /**
   * Adds steps the detector has already confirmed.
   *
   * Deliberately returns the delta rather than only writing state: the screen
   * needs to know the instant a goal is crossed so it can celebrate, and a
   * state updater does not run synchronously.
   */
  const recordSteps = useCallback(
    (steps: number) => {
      const profile = dataRef.current.profile;
      if (!profile) return null;

      const delta = addSteps(dataRef.current.walk, steps, profile.ageBand);
      if (delta.coins === 0) return null;

      setData((d) => ({ ...d, walk: delta.walk }));
      return delta;
    },
    [],
  );

  /** Letting the tree go takes its photographs with it. */
  const forgetTree = useCallback(() => {
    setData((d) => {
      for (const checkIn of d.tree?.checkIns ?? []) remove(checkIn.photoUri);
      return { ...d, tree: null };
    });
  }, []);

  const pushChat = useCallback((message: ChatMessage) => {
    setData((d) => ({ ...d, chat: [...d.chat, message] }));
  }, []);

  const clearChat = useCallback(() => setData((d) => ({ ...d, chat: [] })), []);

  const pushCoachChat = useCallback((message: ChatMessage) => {
    setData((d) => ({ ...d, coachChat: [...d.coachChat, message] }));
  }, []);

  const clearCoachChat = useCallback(() => setData((d) => ({ ...d, coachChat: [] })), []);

  const resetAll = useCallback(async () => {
    const language = data.settings.language;
    // The album is on disk rather than in storage, so it needs clearing too.
    clearAlbum();
    await clearData();
    setData(createEmptyData(language));
  }, [data.settings.language]);

  // The export leaves the app through the share sheet and can end up in mail or
  // a chat, so neither the parent code nor the username's token travels with it.
  const exportPayload = useCallback(
    () =>
      JSON.stringify(
        {
          ...data,
          settings: { ...data.settings, parentPin: undefined },
          social: {
            ...data.social,
            account: data.social.account ? { ...data.social.account, token: undefined } : null,
          },
          // A 10-13 is told their own notes stay on their side, so the file
          // that leaves the phone says a note exists and not what it said.
          missions: data.missions.map((mission) =>
            mission.note ? { ...mission, note: `[${mission.note.length} characters]` } : mission,
          ),
        },
        null,
        2,
      ),
    [data],
  );

  const derived = useMemo(() => {
    const active = data.missions.find((m) => m.status === 'active') ?? null;
    return {
      activeMission: active,
      pendingMissions: data.missions.filter((m) => m.status === 'pending'),
      doneMissions: data.missions.filter((m) => m.status === 'done').slice().reverse(),
      skippedMissions: data.missions.filter((m) => m.status === 'skipped').slice().reverse(),
    };
  }, [data.missions]);

  const value = useMemo<AppStateValue>(
    () => ({
      ready,
      data,
      language: data.settings.language,
      profile: data.profile,
      isOnboarded: Boolean(
        data.profile &&
          data.settings.consentAt &&
          data.settings.parentPin &&
          data.social.mode !== 'unset',
      ),
      ...derived,
      setLanguage,
      acceptConsent,
      saveProfile,
      updateProfile,
      setParentPin,
      setReminder,
      setVoiceEnabled,
      setDuoEnabled,
      setTeenSkin,
      buyItem,
      toggleItem,
      clearOutfit,
      setGuardConfig,
      setGuardDay,
      linkHub,
      patchHub,
      unlinkHub,
      goOffline,
      goOnline,
      updateAccount,
      markScoreSent,
      loseAccount,
      assignMission,
      startMission,
      claimMission,
      saveEvidence,
      submitMission,
      confirmMission,
      rejectMission,
      skipMission,
      takeBackMission,
      rateMission,
      voteIdea,
      createBadges,
      removeBadges,
      setSpotChecks,
      setReviewNotify,
      setWeekGoal,
      addRealReward,
      removeRealReward,
      setRewardGiven,
      setRoomScan,
      clearRoomScan,
      markStoryHeard,
      addFind,
      renameFind,
      removeFind,
      adoptTree,
      renameTree,
      addTreeCheckIn,
      forgetTree,
      recordSteps,
      pushChat,
      clearChat,
      pushCoachChat,
      clearCoachChat,
      resetAll,
      exportPayload,
    }),
    [
      ready,
      data,
      derived,
      setLanguage,
      acceptConsent,
      saveProfile,
      updateProfile,
      setParentPin,
      setReminder,
      setVoiceEnabled,
      setDuoEnabled,
      setTeenSkin,
      setGuardConfig,
      setGuardDay,
      linkHub,
      patchHub,
      unlinkHub,
      goOffline,
      goOnline,
      updateAccount,
      markScoreSent,
      loseAccount,
      assignMission,
      startMission,
      claimMission,
      saveEvidence,
      submitMission,
      confirmMission,
      rejectMission,
      skipMission,
      takeBackMission,
      rateMission,
      voteIdea,
      createBadges,
      removeBadges,
      setSpotChecks,
      setReviewNotify,
      setWeekGoal,
      addRealReward,
      removeRealReward,
      setRewardGiven,
      setRoomScan,
      clearRoomScan,
      markStoryHeard,
      addFind,
      renameFind,
      removeFind,
      adoptTree,
      renameTree,
      addTreeCheckIn,
      forgetTree,
      recordSteps,
      pushChat,
      clearChat,
      pushCoachChat,
      clearCoachChat,
      resetAll,
      exportPayload,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useApp(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useApp must be used inside AppStateProvider');
  return value;
}
