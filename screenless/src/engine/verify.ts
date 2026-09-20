import { clueObjects } from '../data/object-clues';
import type {
  AgeBand,
  CheckOutcome,
  CheckRule,
  EvidenceCheck,
  Mission,
  MissionPlan,
  MissionReview,
  ReviewReason,
  RoomObjectId,
  Settings,
  TaskContent,
} from '../state/types';
import { HIDE_BADGE, planRoute } from './badges';
import { readIntegrity } from './integrity';

/**
 * Who checks a finished mission: the phone, or a parent.
 *
 * From six the parent stops checking every mission and becomes the one who
 * looks at a sample. The phone carries the ordinary case with what it can
 * genuinely measure — the clock, time lying face down, steps, a scanned badge,
 * an answer — and a parent sees:
 *
 * - **Every mission whose checks did not pass.** Nothing is refused; it just
 *   waits for a grown up instead of being approved.
 * - **Anything that looks off**: a shaken rather than walked phone, badge
 *   codes being guessed, the same job three times today, a run of approvals
 *   minutes apart.
 * - **A random share of the rest**, which is what keeps the whole arrangement
 *   honest. A child who knows exactly which missions get looked at knows
 *   exactly which ones to fake. Never more than five in a row go unchecked.
 * - **The first few**, so a parent sees what the phone looks at before it
 *   starts deciding by itself.
 *
 * Pure: the clock and the dice are passed in, so `scripts/test-verify.ts` can
 * put them wherever it needs.
 */

/**
 * Who decides a finished mission, by age.
 *
 * - `parent` (3-5): every mission waits for a grown up, as it always has.
 * - `sample` (6-9): the phone approves what it can check and a parent sees a
 *   random share plus anything that did not pass.
 * - `self` (10-13): nothing waits for anybody. The phone records whether its
 *   own measurements backed the claim up or whether it is standing on the
 *   child's word, and a parent reads that log afterwards. Constant approval at
 *   this age reads as surveillance, and a teenager who feels watched stops
 *   telling you anything true.
 */
export type ReviewPolicy = 'parent' | 'sample' | 'self';

const POLICIES: Record<AgeBand, ReviewPolicy> = {
  '3-5': 'parent',
  '6-9': 'sample',
  '10-13': 'self',
};

export function reviewPolicy(band: AgeBand | undefined): ReviewPolicy {
  return band === undefined ? 'parent' : POLICIES[band];
}

export function selfChecks(band: AgeBand | undefined): boolean {
  return reviewPolicy(band) !== 'parent';
}

/** Missions a parent sees before the phone decides anything alone. */
export const FIRST_ONES = 3;
/** Share of passing missions sent to a parent anyway. */
export const SPOT_RATE = 0.2;
/** Longest run of phone approvals before one is checked for certain. */
export const MAX_UNCHECKED_RUN = 5;
/** Days a parent can take back a mission the phone approved. */
export const TAKE_BACK_DAYS = 7;

/** Two badges found closer together than this were not walked between. */
const MIN_BADGE_GAP_SEC = 4;
/** Wrong codes typed before it stops looking like typos. */
const MAX_BADGE_MISSES = 3;
/** Wrong guesses at the secret object that still count as finding it. */
export const MAX_SECRET_MISSES = 2;

/* ------------------------------------------------------------------ rules */

/**
 * The checks for a task: its own, or a default read from how it is proven.
 *
 * The defaults are what let the rest of the library work the same way as the
 * missions written for this: a plain mission needs half its minutes on the
 * clock and the phone put down for a good part of them; a photo mission needs
 * the photo to be readable; a movement mission needs the count. A mission done
 * with a grown up can also simply be approved by that grown up on the spot.
 */
export function checksFor(task: TaskContent): CheckRule[] {
  if (task.checks && task.checks.length > 0) return task.checks;

  if (task.proof === 'motion' && task.motion) {
    return [{ kind: 'reps', count: task.motion.count }];
  }

  const clock: EvidenceCheck = { kind: 'clock', minutes: Math.max(1, Math.ceil(task.minutes / 2)) };
  const shown: EvidenceCheck =
    task.proof === 'photo'
      ? { kind: 'photo' }
      : { kind: 'away', minutes: Math.max(1, Math.round(task.minutes * 0.4)) };

  const rules: CheckRule[] = [clock];
  rules.push(task.mode === 'duo' ? { kind: 'either', of: [shown, { kind: 'grownup' }] } : shown);
  if (task.check || task.answer) rules.push({ kind: 'answer' });
  if (task.pick) rules.push({ kind: 'picked', count: task.pick.min });
  if (task.note) rules.push({ kind: 'note' });
  return rules;
}

/** Every check in a rule list, `either` groups opened out. */
export function flatChecks(rules: CheckRule[]): EvidenceCheck[] {
  return rules.flatMap((rule) => (rule.kind === 'either' ? rule.of : [rule]));
}

export function hasCheck(task: TaskContent, kind: EvidenceCheck['kind']): boolean {
  return flatChecks(checksFor(task)).some((check) => check.kind === kind);
}

/** The check of a kind, with its parameters, if the task has one. */
export function findCheck<K extends EvidenceCheck['kind']>(
  task: TaskContent,
  kind: K,
): Extract<EvidenceCheck, { kind: K }> | undefined {
  return flatChecks(checksFor(task)).find((check) => check.kind === kind) as
    | Extract<EvidenceCheck, { kind: K }>
    | undefined;
}

/* -------------------------------------------------------------- answering */

/** True when every question the mission asks has an answer that counts. */
export function answered(task: TaskContent, mission: Mission): boolean {
  if (task.check && mission.checkAnswer === undefined) return false;
  if (task.answer) {
    const value = mission.answerValue;
    if (task.answer.kind === 'count') {
      if (typeof value !== 'number' || !Number.isFinite(value)) return false;
      if (value < task.answer.min || value > task.answer.max) return false;
      if (task.answer.goal !== undefined && value < task.answer.goal) return false;
    } else {
      // A real attempt at every way counts, right or wrong. Getting ten out of
      // 4 + 5 is still a child at a table moving buttons about.
      if (!Array.isArray(value) || value.length < task.answer.ways) return false;
      if (!value.every((way) => Array.isArray(way) && way.length >= 2)) return false;
    }
  }
  return true;
}

/** How many of the ways a `sums` answer actually make the target, all different. */
export function correctWays(target: number, ways: number[][]): number {
  const seen = new Set<string>();
  for (const way of ways) {
    if (way.reduce((sum, part) => sum + part, 0) !== target) continue;
    // 4 + 6 and 6 + 4 are the same split of the pile.
    seen.add([...way].sort((a, b) => a - b).join('+'));
  }
  return seen.size;
}

/* -------------------------------------------------------------- measuring */

function minutesOf(seconds: number | undefined): number {
  return Math.floor((seconds ?? 0) / 60);
}

/** What a `tally` check needs to look back over. */
export type TallyContext = { history: Mission[]; now: number };

/**
 * Missions of one kind approved since Monday, for the week long team goals.
 *
 * Counted off the record rather than kept as a running total, so a mission a
 * parent took back stops counting the moment they take it back.
 */
export function tallyProgress(
  check: Extract<EvidenceCheck, { kind: 'tally' }>,
  history: Mission[],
  now: number = Date.now(),
): number {
  const start = weekStart(now);
  return history.filter((mission) => {
    if (mission.status !== 'done' || mission.takenBackAt) return false;
    if (!mission.task.id.startsWith(check.missions)) return false;
    const at = Date.parse(mission.confirmedAt ?? '');
    return Number.isFinite(at) && at >= start;
  }).length;
}

/**
 * Screen free minutes the phone actually counted this week.
 *
 * Only time it measured itself lying face down during a mission, so it can be
 * put next to a target a 10-13 set for themselves without either number being
 * a guess.
 */
export function screenFreeThisWeek(history: Mission[], now: number = Date.now()): number {
  const start = weekStart(now);
  let seconds = 0;
  for (const mission of history) {
    if (mission.status !== 'done' || mission.takenBackAt) continue;
    const at = Date.parse(mission.confirmedAt ?? '');
    if (!Number.isFinite(at) || at < start) continue;
    seconds += mission.awaySec ?? 0;
  }
  return Math.floor(seconds / 60);
}

/** Midnight on the Monday of the week `now` falls in, in local time. */
function weekStart(now: number): number {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  // Monday is day 1; Sunday (0) belongs to the week that has just ended.
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.getTime();
}

export function evaluateCheck(
  check: EvidenceCheck,
  task: TaskContent,
  mission: Mission,
  context?: TallyContext,
): CheckOutcome {
  switch (check.kind) {
    case 'clock':
      return {
        kind: 'clock',
        passed: (mission.durationSec ?? 0) >= check.minutes * 60,
        value: minutesOf(mission.durationSec),
        target: check.minutes,
      };
    case 'away':
      return {
        kind: 'away',
        passed: mission.awaySensor !== false && (mission.awaySec ?? 0) >= check.minutes * 60,
        value: minutesOf(mission.awaySec),
        target: check.minutes,
      };
    case 'steps':
      return {
        kind: 'steps',
        passed: (mission.steps ?? 0) >= check.count && !mission.motionOdd,
        value: mission.steps ?? 0,
        target: check.count,
      };
    case 'reps':
      return {
        kind: 'reps',
        passed: (mission.motionReps ?? 0) >= check.count && !mission.motionOdd,
        value: mission.motionReps ?? 0,
        target: check.count,
      };
    case 'active':
      return {
        kind: 'active',
        passed: (mission.activeSec ?? 0) >= check.minutes * 60 && !mission.motionOdd,
        value: minutesOf(mission.activeSec),
        target: check.minutes,
      };
    case 'badges': {
      const hits = mission.badgeHits ?? [];
      const planned = mission.plan?.badges?.length ?? 0;
      return {
        kind: 'badges',
        passed: planned >= check.count && hits.length >= check.count && !badgesLookOdd(mission),
        value: hits.length,
        target: check.count,
      };
    }
    case 'secret':
      return {
        kind: 'secret',
        passed:
          mission.secretFound === 'camera' ||
          (mission.secretFound === 'picked' && (mission.secretMisses ?? 0) <= MAX_SECRET_MISSES),
      };
    case 'photo':
      return {
        kind: 'photo',
        passed: Boolean(mission.proofUri) && mission.photoRead === true && !mission.photoOfScreen,
      };
    case 'answer':
      return { kind: 'answer', passed: answered(task, mission) };
    case 'picked':
      return {
        kind: 'picked',
        passed: (mission.picked?.length ?? 0) >= check.count,
        value: mission.picked?.length ?? 0,
        target: check.count,
      };
    case 'grownup':
      return { kind: 'grownup', passed: Boolean(mission.grownupAt) };
    case 'note': {
      // Only that something was written, and roughly how much. What it says is
      // theirs, and nothing here ever reads it.
      const text = (mission.note ?? '').trim();
      const lines = text.split('\n').filter((line) => line.trim().length > 0);
      const wanted = task.note?.lines ?? 1;
      const enough = text.length >= (task.note?.minChars ?? 12);
      return { kind: 'note', passed: enough && lines.length >= wanted, value: lines.length, target: wanted };
    }
    case 'tally': {
      const done = context
        ? tallyProgress(check, context.history, context.now)
        : (mission.review?.checks.find((outcome) => outcome.kind === 'tally')?.value ?? 0);
      return { kind: 'tally', passed: done >= check.count, value: done, target: check.count };
    }
  }
}

/**
 * Whether a week long team goal has been earned yet.
 *
 * Missions with a tally are only handed out once it has, so a child never
 * opens one they cannot finish, and the mission itself is the moment the week
 * is celebrated rather than a chore list to work through.
 */
export function tallyReady(task: TaskContent, history: Mission[], now: number = Date.now()): boolean {
  const tally = findCheck(task, 'tally');
  if (!tally) return true;
  return tallyProgress(tally, history, now) >= tally.count;
}

/**
 * Whether the runner should open the camera at the end.
 *
 * Only when a photo would change something. A child who already put the phone
 * down for long enough does not need to take a picture as well; asking would
 * add screen time for nothing. A photo the mission requires outright is always
 * asked for, and so is the "after" to go with a "before".
 */
export function photoWanted(task: TaskContent, mission: Mission): boolean {
  if (task.proof === 'photo') return true;
  if (task.beforePhoto && mission.beforeUri) return true;
  for (const rule of checksFor(task)) {
    if (rule.kind === 'photo') return true;
    if (rule.kind === 'either' && rule.of.some((check) => check.kind === 'photo')) {
      const covered = rule.of.some(
        (check) => check.kind !== 'photo' && evaluateCheck(check, task, mission).passed,
      );
      if (!covered) return true;
    }
  }
  return false;
}

function badgesLookOdd(mission: Mission): boolean {
  if ((mission.badgeMisses ?? 0) >= MAX_BADGE_MISSES) return true;
  const hits = mission.badgeHits ?? [];
  for (let i = 1; i < hits.length; i += 1) {
    if (hits[i] - hits[i - 1] < MIN_BADGE_GAP_SEC) return true;
  }
  return false;
}

/** Anything in the evidence that looks wrong, as opposed to merely missing. */
export function looksOdd(mission: Mission): boolean {
  return Boolean(mission.motionOdd) || badgesLookOdd(mission) || Boolean(mission.photoOfScreen);
}

/* --------------------------------------------------------------- deciding */

export type ReviewInput = {
  /** The finished mission, evidence already on it. */
  mission: Mission;
  /** Every mission on record. May include this one. */
  history: Mission[];
  band: AgeBand;
  spotChecks: Settings['spotChecks'];
  now: number;
  random: () => number;
};

export type ReviewDecision = {
  approve: boolean;
  review: MissionReview;
};

export function decideReview(input: ReviewInput): ReviewDecision {
  const { mission, history, band, spotChecks, now, random } = input;
  const task = mission.task;
  const rules = checksFor(task);
  const at = new Date(now).toISOString();

  const context: TallyContext = { history, now };
  const outcomes = flatChecks(rules).map((check) => evaluateCheck(check, task, mission, context));
  const passed = (check: EvidenceCheck) => evaluateCheck(check, task, mission, context).passed;

  const policy = reviewPolicy(band);

  // Ages a parent decides for. Kept here so every caller asks one function,
  // and the answer for 3-5 stays what it always was.
  if (policy === 'parent') {
    return { approve: false, review: { by: 'parent', reasons: ['everyOne'], checks: outcomes, at } };
  }

  // A grown up who typed the parent code on the spot has already looked.
  if (outcomes.some((outcome) => outcome.kind === 'grownup' && outcome.passed)) {
    return { approve: true, review: { by: 'grownup', reasons: [], checks: outcomes, at } };
  }

  const reasons: ReviewReason[] = [];

  let clockFailed = false;
  let otherFailed = false;
  for (const rule of rules) {
    if (rule.kind === 'either') {
      if (!rule.of.some(passed)) otherFailed = true;
    } else if (!passed(rule)) {
      if (rule.kind === 'clock') clockFailed = true;
      else otherFailed = true;
    }
  }
  if (clockFailed) reasons.push('tooFast');
  if (otherFailed) reasons.push('missing');
  if (looksOdd(mission)) reasons.push('odd');

  // Repeats and bursts are read off approvals, which now include the phone's.
  const integrity = readIntegrity({ ...mission, claimedAt: mission.claimedAt ?? at }, history, now);
  if (integrity.flags.includes('repeated')) reasons.push('repeated');
  if (integrity.flags.includes('burst')) reasons.push('burst');

  // Ages 10-13 finish where they stand. What the record says is whether the
  // phone's own measurements backed it up or whether it rests on their word,
  // which is what a parent reads in the audit afterwards.
  if (policy === 'self') {
    const backed = reasons.length === 0;
    return {
      approve: true,
      review: { by: backed ? 'app' : 'self', reasons, checks: outcomes, at },
    };
  }

  if (spotChecks === 'all') reasons.push('everyOne');

  if (reasons.length === 0) {
    const decided = history
      .filter((other) => other.id !== mission.id && other.review && !other.takenBackAt)
      .sort((a, b) => Date.parse(a.review!.at) - Date.parse(b.review!.at));

    if (decided.length < FIRST_ONES) {
      reasons.push('firstOnes');
    } else {
      let run = 0;
      for (let i = decided.length - 1; i >= 0 && decided[i].review!.by === 'app'; i -= 1) run += 1;
      if (run >= MAX_UNCHECKED_RUN || random() < SPOT_RATE) reasons.push('spotCheck');
    }
  }

  const approve = reasons.length === 0;
  return { approve, review: { by: approve ? 'app' : 'parent', reasons, checks: outcomes, at } };
}

/**
 * Whether a parent can still take back a mission they did not decide
 * themselves in the parent area.
 *
 * That includes a mission approved by a grown up's code on the spot, because
 * children watch parents type, and the parent area is the only place that
 * establishes who is really holding the phone.
 */
export function canTakeBack(mission: Mission, now: number = Date.now()): boolean {
  const by = mission.review?.by;
  if (mission.status !== 'done' || mission.takenBackAt) return false;
  if (by !== 'app' && by !== 'grownup' && by !== 'self') return false;
  const approved = Date.parse(mission.confirmedAt ?? '');
  return Number.isFinite(approved) && now - approved <= TAKE_BACK_DAYS * 86_400_000;
}

/* --------------------------------------------------------------- planning */

/** Things the buddy can be thinking of when there is no room scan to go on. */
const EVERY_HOME: RoomObjectId[] = ['spoon', 'cup', 'pillow', 'sock', 'shoe', 'towel', 'chair', 'book', 'blanket'];
/** Options on the "pick what it was" board. */
export const SECRET_CHOICES = 9;

/**
 * What this run of a mission is built around, decided once when it is handed
 * out. `recent` is the mission history, so the same secret object does not
 * come up twice running.
 */
export function planMission(
  task: TaskContent,
  context: { recent: Mission[]; roomObjects: RoomObjectId[] | null },
  random: () => number = Math.random,
): MissionPlan | undefined {
  if (task.tool === 'badgeHunt') return { badges: [HIDE_BADGE] };
  if (task.tool === 'badgeRoute') {
    const count = findCheck(task, 'badges')?.count ?? 3;
    return { badges: planRoute(count, random) };
  }
  if (task.tool === 'secretObject') {
    return { secret: planSecret(context.recent, context.roomObjects, random) };
  }
  return undefined;
}

export function planSecret(
  recent: Mission[],
  roomObjects: RoomObjectId[] | null,
  random: () => number = Math.random,
): RoomObjectId {
  const known = new Set(clueObjects.map((entry) => entry.id));
  const lately = new Set(
    recent
      .slice(-12)
      .map((mission) => mission.plan?.secret)
      .filter((id): id is RoomObjectId => Boolean(id)),
  );

  // Something the last scan actually saw is certain to be in the home.
  const seen = (roomObjects ?? []).filter((id) => known.has(id) && !lately.has(id));
  const common = EVERY_HOME.filter((id) => known.has(id) && !lately.has(id));
  const pool = seen.length > 0 ? seen : common.length > 0 ? common : EVERY_HOME;
  return pool[Math.floor(random() * pool.length) % pool.length];
}

/**
 * The board of pictures the child picks from when the camera cannot help.
 * Seeded by the mission id, so it does not reshuffle between renders.
 */
export function secretChoices(secret: RoomObjectId, seed: string): RoomObjectId[] {
  const rng = seeded(seed);
  const others = clueObjects.map((entry) => entry.id).filter((id) => id !== secret);
  shuffle(others, rng);
  const board = [secret, ...others.slice(0, SECRET_CHOICES - 1)];
  shuffle(board, rng);
  return board;
}

function seeded(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) state = Math.imul(state ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
}
