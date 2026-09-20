import type { Language, Localized } from '../i18n/types';
import { defaultGuardConfig, emptyGuardDay, type GuardConfig, type GuardDay } from '../guard/types';

/**
 * The link between this phone and a parent's account on the hub.
 *
 * Created once, by a grown up typing a six character code from the parent app
 * into the parent area here. Null on a phone that was never linked, which is
 * the default and stays a fully working app: the hub adds a second screen for
 * a parent to look at, it is not a dependency.
 *
 * The token is the only credential this phone holds and it can do exactly two
 * things: push this child's numbers up, and read this child's limits back.
 * It cannot read another child, it cannot see the parent's account, and it
 * cannot change a limit.
 */
export type HubLink = {
  /** `dev_xxx.secret`, handed over once when the code was accepted. */
  token: string;
  deviceId: string;
  childId: string;
  linkedAt: string;
  /**
   * The limits revision already applied. The phone polls for this and does
   * nothing at all unless it has moved, so a parent opening the limits screen
   * and changing nothing costs this phone one small GET and no work.
   */
  revision: number;
  /** The last day key the server confirmed, so a resend knows where to start. */
  lastSentDay: string | null;
  lastSentAt: string | null;
  /** Consecutive failures, which back the retry off rather than hammering. */
  failures: number;
};

/**
 * The three age groups a parent picks from. Missions, stories, the daily step
 * goal and the way the buddy talks are all sized by it. Stored profiles from
 * before September 2026 used 4-5, 6-7 and 8-10; `migrate.ts` moves them over.
 */
export const AGE_BANDS = ['3-5', '6-9', '10-13'] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const INTERESTS = [
  'football',
  'animals',
  'drawing',
  'space',
  'music',
  'dance',
  'building',
  'nature',
  'books',
  'science',
  'cooking',
  'bike',
] as const;
export type InterestId = (typeof INTERESTS)[number];

export const BUDDY_IDS = [
  'fox',
  // Three robots rather than one, each drawn in the register of an age
  // band: `robot` is round and pastel, `scout` is kitted out for going
  // somewhere, `byte` is near-black and says almost nothing. Any child can
  // still pick any of them; the ages are who each was drawn for. `sprout` is
  // the odd one out: a white helmet with real eyes rather than glow shapes,
  // and the only buddy in the set whose badge says what the app promises.
  'robot',
  'scout',
  'byte',
  'sprout',
  'cat',
  'dino',
  'owl',
  'star',
  'bear',
  'tiger',
  'bunny',
  'panda',
  'turtle',
  'rocket',
] as const;
export type BuddyId = (typeof BUDDY_IDS)[number];

export const TASK_CATEGORIES = ['move', 'outdoor', 'create', 'social', 'calm'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

/**
 * Where a wearable sits on the buddy. One item per slot at a time, which is
 * the whole difference between a wardrobe and a pile: before this the buddy
 * wore everything it had ever been given at once, so by level seven it was a
 * fox in a crown, a cape, a scarf, a medal, sunglasses and a balloon.
 */
export const WEAR_SLOTS = ['head', 'face', 'neck', 'back', 'hand'] as const;
export type WearSlot = (typeof WEAR_SLOTS)[number];

export const REWARD_IDS = [
  'hat',
  'balloon',
  'scarf',
  'glasses',
  'ball',
  'cape',
  'crown',
  'medal',
] as const;
export type RewardId = (typeof REWARD_IDS)[number];

/**
 * Everything else the buddy can wear, bought with coins rather than reached.
 *
 * Coins were a dead currency until this existed: walking minted them and
 * nothing anywhere spent them. These are what they are for.
 */
export const SHOP_ITEM_IDS = [
  'cap',
  'bandana',
  'shades',
  'bowtie',
  'beanie',
  'backpack',
  'headphones',
  'skateboard',
  'flag',
  'wings',
] as const;
export type ShopItemId = (typeof SHOP_ITEM_IDS)[number];
export type ItemId = RewardId | ShopItemId;

/**
 * What the child owns and what the buddy has on.
 *
 * `owned` is additive and never shrinks — a level reward stays earned and a
 * purchase stays bought, so taking an item off is free and always reversible.
 * That matters at these ages: a four year old who takes the crown off and
 * cannot work out how to get it back has lost it, as far as they are concerned.
 */
export type Wardrobe = {
  owned: ItemId[];
  /** At most one per slot. Order is not meaningful. */
  worn: ItemId[];
};

/**
 * Everyday things a room scan can recognise. Deliberately short: each one has
 * to be safe to handle, common in an ordinary home, and something the on device
 * labeller gets right often enough to build a mission on.
 */
export const ROOM_OBJECTS = [
  'ball',
  'book',
  'teddy',
  'blocks',
  'puzzle',
  'pencil',
  'paper',
  'cup',
  'bottle',
  'chair',
  'pillow',
  'blanket',
  'shoe',
  'sock',
  'box',
  'plant',
  'toycar',
  'hat',
  'towel',
  'spoon',
] as const;
export type RoomObjectId = (typeof ROOM_OBJECTS)[number];

/**
 * Things a child can find outside and keep in their collection.
 *
 * Deliberately coarse. The labeller only has to get "plant or creature or sky"
 * right, which it does; everything finer than that comes from the child
 * answering questions about what is in front of them. That is the point rather
 * than a workaround: a child who has counted the legs has looked properly.
 */
export const FIND_KINDS = [
  'tree',
  'leaf',
  'flower',
  'bug',
  'bird',
  'animal',
  'stone',
  'cloud',
  'water',
  'feather',
  'seed',
  'mushroom',
] as const;
export type FindKindId = (typeof FIND_KINDS)[number];

/** Roughly where a find happened. Tapped by the child, never read off GPS. */
export const FIND_PLACES = ['home', 'park', 'school', 'family', 'elsewhere'] as const;
export type FindPlaceId = (typeof FIND_PLACES)[number];

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

/**
 * One thing the child found and classified themselves.
 *
 * The photo is theirs and it stays: it becomes the picture on the collection
 * card. It is copied into the app's own folder so the system cannot sweep it
 * out of the camera cache, and it is deleted when the find is.
 */
export type Find = {
  id: string;
  kind: FindKindId;
  /** Sub kind the child's own answer settled on, e.g. a pointy leaf. */
  variant?: string;
  /** Local file URI of the child's photo. Absent when they skipped the camera. */
  photoUri?: string;
  at: string;
  /** Answer tags in question order, so a card can be rebuilt from the record. */
  answers: string[];
  /** Facts unlocked on this find, by id. */
  factIds: string[];
  /** The child's own name for it. */
  nickname?: string;
  place?: FindPlaceId;
  /**
   * What the labeller actually said, kept verbatim so a parent reading the
   * export can see what the phone thought versus what the child decided.
   */
  label?: string;
};

/** What the leaves were doing on the day the child looked. */
export const LEAF_STATES = ['green', 'turning', 'bare', 'buds', 'needles'] as const;
export type LeafState = (typeof LEAF_STATES)[number];

/** One visit to the tree. The photos line up into the strip across the year. */
export type TreeCheckIn = {
  id: string;
  at: string;
  season: Season;
  photoUri?: string;
  leafState?: LeafState;
  /** Arm spans it takes to reach round the trunk. The child's own ruler. */
  hugs?: number;
};

/**
 * One tree, near home, that belongs to this child.
 *
 * The whole point is that it is the same tree every time: no recognition is
 * involved, the child simply goes back. What it buys is a reason to walk to the
 * same spot every few weeks for a year, and a strip of photographs at the end
 * that nothing on a screen could have produced.
 */
export type TreeFriend = {
  name: string;
  startedAt: string;
  checkIns: TreeCheckIn[];
};

/** One day's walking. Steps only, never where they were taken. */
export type DayWalk = { date: string; steps: number };

/**
 * The walking game.
 *
 * Steps, a per day tally and a coin count. Nothing positional is stored here
 * because nothing positional is ever read: the accelerometer says the phone
 * moved, not where it moved, and no part of this feature asks any further.
 */
export type WalkState = {
  /** Spendable in the app only. Never convertible to stars. */
  coins: number;
  lifetimeSteps: number;
  /** Recent days, oldest first, trimmed to a fortnight. */
  days: DayWalk[];
  bestDay: number;
  /** Consecutive days the daily goal was reached. */
  goalStreak: number;
};

/** Who a mission needs. `duo` missions ask for a parent in the room. */
export type MissionMode = 'solo' | 'duo';

/** How a child shows a mission actually happened. */
export type ProofKind = 'tap' | 'photo' | 'motion';

export type MotionKind = 'jump' | 'shake' | 'spin';

/**
 * One question the child answers when the mission is over.
 *
 * It is not a test and it cannot be failed. A four year old who taps the
 * "wrong" cushion has still been to the cushion, which is the only thing this
 * is checking: that the mission happened away from the screen and that they
 * were paying attention while it did. Every option is accepted, the answer is
 * put in front of the parent on the confirmation screen, and the parent is
 * still the one who decides.
 *
 * This is the verification that fits the missions a camera cannot see: which
 * of two things felt softer, who was in the story they made up. Only the 3-5
 * runner draws it, so `scripts/test-tasks.ts` refuses a check on any other
 * age band rather than letting it disappear silently.
 */
export type TaskCheck = {
  question: Localized;
  /** Two to four answers. All of them are accepted. */
  options: Localized[];
};

export type MotionSpec = { kind: MotionKind; count: number };

/**
 * One thing the phone can establish about a mission on its own, for ages 6-9.
 *
 * At that age the parent stops checking every mission and becomes the one who
 * looks at a sample, so the phone has to carry the ordinary case. Each kind is
 * something it can genuinely measure or be shown, never a button the child
 * presses to say so:
 *
 * - `clock`: the mission ran at least this long, start to finish.
 * - `away`: the phone lay flat and untouched this long. Screen free time,
 *   measured rather than claimed.
 * - `steps`, `reps`, `active`: the accelerometer counted it, and the pattern
 *   looked like a child moving rather than a phone being shaken.
 * - `badges`: this many treasure badges were scanned, in the planned order.
 * - `secret`: the child found the object the buddy was thinking of.
 * - `photo`: a photo was taken and the labeller on this phone could read it.
 * - `answer`: the closing question or number was answered.
 * - `picked`: at least this many things were ticked on the mission's list.
 * - `grownup`: a grown up entered the parent code on the spot.
 * - `tally`: this many missions whose id starts with `missions` were approved
 *   earlier in this week. It is what makes a week long team goal real: the
 *   mission is only ever handed out once the week's work is already done, so
 *   finishing it is the moment the team is told they managed it.
 * - `note`: the child wrote their own answer. Ages 10-13 only, where a plan or
 *   a self-assessment in their own words is the point of the task. What they
 *   write stays on their side: it is never shown in the parent area and never
 *   leaves the phone.
 *
 * Nothing here ever blocks a child. A check that does not pass sends the
 * mission to a parent instead of approving it, and that is the only thing it
 * does.
 */
export type EvidenceCheck =
  | { kind: 'clock'; minutes: number }
  | { kind: 'away'; minutes: number }
  | { kind: 'steps'; count: number }
  | { kind: 'reps'; count: number }
  | { kind: 'active'; minutes: number }
  | { kind: 'badges'; count: number }
  | { kind: 'secret' }
  | { kind: 'photo' }
  | { kind: 'answer' }
  | { kind: 'picked'; count: number }
  | { kind: 'grownup' }
  | { kind: 'tally'; missions: string; count: number }
  | { kind: 'note' };

export type EvidenceKind = EvidenceCheck['kind'];

/** Every check in the list must pass; `either` passes when any one of its checks does. */
export type CheckRule = EvidenceCheck | { kind: 'either'; of: EvidenceCheck[] };

/** A number the child reports afterwards: floors built, steps a plane flew. */
export type CountAnswer = {
  kind: 'count';
  question: Localized;
  min: number;
  max: number;
  /** When set, a smaller number does not count as the mission done. */
  goal?: number;
};

/** A target number made several different ways, e.g. ten as 4 + 6. */
export type SumsAnswer = {
  kind: 'sums';
  question: Localized;
  target: number;
  ways: number;
};

export type AnswerSpec = CountAnswer | SumsAnswer;

/**
 * Something written in the child's own words: three goals, tomorrow's plan,
 * how the day actually went.
 *
 * Ages 10-13 only. Below that a text box is a spelling test rather than a
 * record; from ten it is the only honest way to hold a plan or a reflection,
 * and the writing is the task. What is written is theirs: the parent area
 * shows that a note exists, never what it says, and `exportPayload` leaves the
 * text out.
 */
export type NoteSpec = {
  prompt: Localized;
  /** Grey text inside the empty box. */
  placeholder?: Localized;
  /** Separate lines wanted, e.g. three goals. */
  lines?: number;
  /** Shortest answer that counts as written. */
  minChars?: number;
};

/** A list the child ticks: what they did, which shapes they found. */
export type PickSpec = {
  question: Localized;
  options: Localized[];
  /** Fewest ticks that count. */
  min: number;
  /** Most ticks allowed, e.g. exactly three moves for an obstacle course. */
  max?: number;
  /** Shown before the steps, because choosing is part of the plan rather than a report afterwards. */
  first?: boolean;
};

/** What a mission needs set up at home before it can be handed out. */
export type TaskNeeds = 'badges';

/** The special tool a mission is built around, when it has one. */
export type TaskTool = 'badgeHunt' | 'badgeRoute' | 'secretObject' | 'weekGoal';

export const PARTS_OF_DAY = ['morning', 'afternoon', 'evening'] as const;
export type PartOfDay = (typeof PARTS_OF_DAY)[number];

export type Place = 'indoor' | 'outdoor' | 'any';

/**
 * A mission carries its own copy of the task text so history stays readable
 * even after the library changes or when the task came from the model.
 */
export type TaskContent = {
  id: string;
  category: TaskCategory;
  minutes: number;
  stars: number;
  emoji: string;
  interests: InterestId[];
  ageBands: AgeBand[];
  title: Localized;
  body: Localized;
  tip?: Localized;
  source: 'library' | 'ai' | 'room' | 'spark';

  /** Numbered steps. Missions without steps just show the body. */
  steps?: Localized[];
  /** Defaults to `solo`. */
  mode?: MissionMode;
  /** Shown to the parent before a duo mission starts. */
  parentBrief?: Localized;
  /** Defaults to `tap`. */
  proof?: ProofKind;
  /** Required when `proof` is `motion`. */
  motion?: MotionSpec;
  /** Things the mission uses, matched against a room scan and photo proof. */
  objects?: RoomObjectId[];
  /** When the mission fits best. Empty or missing means any time. */
  partsOfDay?: PartOfDay[];
  /** Defaults to `any`. */
  place?: Place;
  /** A question the child answers at the end. Ages 3-5 and 6-9. */
  check?: TaskCheck;

  /**
   * How the phone checks this mission by itself. Ages 6-9 only; missions
   * without it get a default read from `proof` in `engine/verify.ts`.
   */
  checks?: CheckRule[];
  /** A number the child reports at the end. */
  answer?: AnswerSpec;
  /** A list the child ticks. */
  pick?: PickSpec;
  /** Something written in their own words. Ages 10-13. */
  note?: NoteSpec;
  /** Offer a photo before the job starts, so a parent can compare. */
  beforePhoto?: boolean;
  /** Only handed out once this is set up at home. */
  needs?: TaskNeeds;
  /** The tool the runner draws for it. */
  tool?: TaskTool;
};

export type MissionStatus = 'active' | 'pending' | 'done' | 'skipped';
export type SkipReason = 'hard' | 'boring' | 'cantNow';

/**
 * What the child said about a task afterwards: thumb up or thumb down.
 *
 * The app already reads taste from behaviour, which is quiet but slow and
 * guesses wrong in the obvious way: a mission finished because it was short
 * looks exactly like a mission finished because it was loved. This is the
 * child saying it outright, so it counts for several times as much as
 * finishing does. It is always optional and always reversible, and it changes
 * what gets offered, never what gets approved.
 */
export type Rating = 1 | -1;

/**
 * A thumb on a made for you idea that was never started.
 *
 * The facets are copied in rather than looked up later: an idea is rebuilt
 * from templates, and a template that changes in an update would otherwise
 * quietly rewrite what the child said about it.
 */
export type IdeaVote = {
  id: string;
  facets: string[];
  value: Rating;
  at: string;
};

/**
 * What was decided for one run of a mission when it was handed out: which
 * badges to find, which object the buddy is thinking of. Stored on the mission
 * so swapping screens or restarting the app does not reshuffle it.
 */
export type MissionPlan = {
  /** Badge numbers in the order they have to be found. */
  badges?: number[];
  secret?: RoomObjectId;
};

/** Why a finished mission went to a parent rather than being approved by the phone. */
export type ReviewReason =
  /** Picked at random. The whole point is that nobody can tell which. */
  | 'spotCheck'
  /** One of the first few, so the parent sees what the phone looks at. */
  | 'firstOnes'
  /** The parent asked to see every mission. */
  | 'everyOne'
  /** Finished before the mission's own minimum. */
  | 'tooFast'
  /** A check the phone needed did not pass. */
  | 'missing'
  /** The sensor pattern, the badge codes or the guesses looked wrong. */
  | 'odd'
  /** The same mission already approved twice today. */
  | 'repeated'
  /** Several missions approved in the last few minutes. */
  | 'burst';

/** One check, as the phone found it. */
export type CheckOutcome = {
  kind: EvidenceKind;
  passed: boolean;
  /** What was measured, in the check's own unit: minutes, steps, badges. */
  value?: number;
  /** What the mission asked for, in the same unit. */
  target?: number;
};

export type MissionReview = {
  /**
   * Who approved it, or `parent` while it waits for one. `self` is the 10-13
   * case: the phone had nothing to go on, so it stands on what they said, and
   * says as much in the audit a parent reads later.
   */
  by: 'app' | 'parent' | 'grownup' | 'self';
  reasons: ReviewReason[];
  checks: CheckOutcome[];
  at: string;
};

export type Mission = {
  id: string;
  task: TaskContent;
  status: MissionStatus;
  assignedAt: string;
  /** When the child pressed start on the runner. */
  startedAt?: string;
  /** Seconds actually spent, measured by the runner. Feeds the difficulty read. */
  durationSec?: number;
  /** Part of day the mission was handed out, used to learn when the child plays. */
  partOfDay?: PartOfDay;
  /** When the child tapped "I did it". */
  claimedAt?: string;
  /** When the parent confirmed it. */
  confirmedAt?: string;
  skipReason?: SkipReason;
  /** Thumb up or down from the child, given on the finish screen. */
  rating?: Rating;
  ratedAt?: string;
  /** Local file URI of the proof photo, removed once the parent decides. */
  proofUri?: string;
  /** What the on device labeller found in the proof photo. */
  proofTags?: RoomObjectId[];
  /** Reps counted by the accelerometer for a motion mission. */
  motionReps?: number;
  /** Index into `task.check.options`. No index is wrong; none is unanswered. */
  checkAnswer?: number;

  /* ------------------------------------------ measured on the 6-9 runner */
  plan?: MissionPlan;
  /** Seconds the phone lay flat and untouched while the mission ran. */
  awaySec?: number;
  /** False when this phone could not tell whether it was put down. */
  awaySensor?: boolean;
  /** Steps counted for a walking mission. */
  steps?: number;
  /** Seconds the accelerometer felt real movement. */
  activeSec?: number;
  /** The movement looked like a shaken or machine-driven phone. */
  motionOdd?: boolean;
  /** Seconds into the mission each planned badge was found, in order. */
  badgeHits?: number[];
  /** Wrong badge codes typed. A few is a typo; many is guessing. */
  badgeMisses?: number;
  /** How the secret object was found, if it was. */
  secretFound?: 'camera' | 'picked';
  /** Wrong guesses at the secret object. */
  secretMisses?: number;
  /** A `count` answer, or each way of making a `sums` target as its parts. */
  answerValue?: number | number[][];
  /** Indexes into `task.pick.options`. */
  picked?: number[];
  /**
   * What they wrote for `task.note`. Theirs: never shown in the parent area,
   * and stripped from the export.
   */
  note?: string;
  /** Local file URI of the optional before photo. Deleted with the proof photo. */
  beforeUri?: string;
  /** Set when the labeller could read the proof photo at all. */
  photoRead?: boolean;
  /** The labeller thought the proof photo was of a screen. */
  photoOfScreen?: boolean;
  /** When a grown up entered the parent code on the mission screen. */
  grownupAt?: string;
  /** How the finished mission was decided. Ages 6-9. */
  review?: MissionReview;
  /** A parent took back a mission the phone had approved. */
  takenBackAt?: string;
};

export type Progress = {
  stars: number;
  level: number;
  totalMissions: number;
  totalMinutes: number;
  streak: number;
  bestStreak: number;
  /** yyyy-mm-dd of the last confirmed mission. */
  lastDoneDate: string | null;
  unlocked: RewardId[];
};

export type ChildProfile = {
  /**
   * The child's name as the parent typed it. It never leaves the phone: the
   * friends board only ever sees the username, and Gemini sees neither.
   */
  nickname: string;
  ageBand: AgeBand;
  interests: InterestId[];
  buddyId: BuddyId;
  buddyName: string;
  createdAt: string;
};

export type Settings = {
  language: Language;
  parentPin: string;
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** ISO timestamp of the parent's KVKK consent, null before onboarding. */
  consentAt: string | null;
  /** The buddy reads missions and stories out loud. */
  voiceEnabled: boolean;
  /** Missions that need a grown up in the room are allowed into the mix. */
  duoEnabled: boolean;
  /**
   * Light or dark, for the 10-13 interface only. The younger tiers have one
   * look each; by ten the phone is a personal object and which way round it
   * runs is the child's call.
   */
  teenSkin: 'dark' | 'light';
  /**
   * Ages 6-9: whether a parent sees a random share of finished missions or
   * every one. The phone approves the rest by itself.
   */
  spotChecks: 'some' | 'all';
  /** A notification when a finished mission has been waiting a minute. */
  reviewNotify: boolean;
};

/**
 * The printed treasure badges for the 6-9 hunts.
 *
 * `key` makes this family's badges different from anyone else's: a QR code
 * off the internet or another family's sheet does not count. It lives only on
 * this phone, and making a new one retires the old sheet.
 */
export type BadgeSet = {
  key: string;
  createdAt: string;
};

/**
 * A screen free target the child set for themselves, ages 10-13.
 *
 * Their own number, not a parent's: the point of the task is choosing it. What
 * it is measured against is the screen free time the phone actually counted
 * during missions that week, so planned and real sit side by side.
 */
export type WeekGoal = {
  minutes: number;
  setAt: string;
};

/**
 * What the last room scan found. Only the object names survive; the frames are
 * read and thrown away inside the scanner and never leave the phone.
 */
export type RoomScan = {
  objects: RoomObjectId[];
  at: string;
  source: 'camera' | 'manual';
};

/**
 * A promise the parent makes in real life: an ice cream at 100 stars, the toy
 * at 150. The app only holds the promise and the moment it was kept. It buys
 * nothing, unlocks nothing and tells nobody. A reward is only ever handed over
 * because a parent decided to, and marked it here afterwards.
 */
export type RealReward = {
  id: string;
  /** Star total that earns it. */
  stars: number;
  /** The parent's own words for what they promised. */
  label: string;
  emoji: string;
  createdAt: string;
  /** Set when the parent confirms the child actually got it. */
  givenAt?: string;
  /**
   * Where it came from.
   *
   * Absent means a grown up typed it on this phone, behind the PIN, and this
   * phone owns it. `hub` means they typed it in the parent app on their own
   * phone, and the hub owns it — the sync replaces every `hub` reward on each
   * pass, so editing one here would be undone within ten minutes.
   */
  origin?: 'hub';
};

/** One of the four things a child can answer a parent's note with. */
export const NOTE_REPLIES = ['ok', 'done', 'thanks', 'later'] as const;
export type NoteReply = (typeof NOTE_REPLIES)[number];

/**
 * What a grown up sent from the parent app, waiting to be seen.
 *
 * Three things arrive this way and all three are the parent's, not the
 * child's: a mission they picked out of the library, a line they typed, and
 * the rewards they promised (those are merged straight into `realRewards`, so
 * they are not repeated here).
 *
 * The two `pending` fields are this phone's side of the conversation, held
 * until the next sync can deliver them. Both are ids and enums. There is no
 * field on this type, or on the hub, that a child's own sentence could go in.
 */
/**
 * Where something in the inbox came from.
 *
 * `hub` is a parent on their own phone. `local` is a parent who picked up this
 * phone, unlocked the parent area and chose something — which is how most
 * families will use it, because most families share a device. The two behave
 * differently in exactly two places: a local item is never sent to the hub and
 * never owes an acknowledgement, and a hub sync cannot clear one.
 */
export type InboxSource = 'hub' | 'local';

export type Inbox = {
  /** A library key the parent chose, or null when they have not chosen one. */
  assignment: { taskId: string; assignedAt: string; source: InboxSource } | null;
  /** The line a parent typed, until one of the four replies is tapped. */
  note: { id: string; text: string; at: string; source: InboxSource } | null;
  /** An answer tapped while offline, owed to the hub. Never set for a local note. */
  pendingReply: { id: string; reply: NoteReply } | null;
  /** A mission accepted here, owed to the hub so it stops being sent. */
  pendingTook: string | null;
};

export const emptyInbox: Inbox = {
  assignment: null,
  note: null,
  pendingReply: null,
  pendingTook: null,
};

export type ChatRole = 'user' | 'buddy';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  at: string;
};

/**
 * Whether this child plays with friends. Only a parent decides.
 *
 * `unset` until the parent answers in setup. `offline` means the app never
 * contacts the friends board, not even to check a username; the gate that
 * enforces it is in `src/online/network.ts`. Profiles from before the board
 * existed arrive as `offline`.
 */
export type SocialMode = 'unset' | 'offline' | 'online';

/** What the server handed back when the parent claimed a username. */
export type OnlineAccount = {
  playerId: string;
  /** Proves this phone owns the username. Never shown, never exported. */
  token: string;
  username: string;
  /** Six characters. A friend's parent types it in to add this child. */
  inviteCode: string;
  createdAt: string;
};

export type Social = {
  mode: SocialMode;
  /** Present exactly when `mode` is `online`. */
  account: OnlineAccount | null;
  /** The score the server last accepted, serialised, so an unchanged score is not sent twice. */
  lastSent: string | null;
  lastSentAt: string | null;
  /**
   * A username the server no longer recognised, usually after a year unused.
   * Kept only so the parent area can say what happened.
   */
  lostUsername: string | null;
};

export type AppData = {
  schema: number;
  settings: Settings;
  profile: ChildProfile | null;
  progress: Progress;
  missions: Mission[];
  chat: ChatMessage[];
  coachChat: ChatMessage[];
  /** Result of the most recent room scan, or null if the room was never scanned. */
  room: RoomScan | null;
  /** Ids of stories the buddy has already told. */
  storiesHeard: string[];
  /** Real life rewards the parent set up, oldest first. */
  realRewards: RealReward[];
  /** Everything the child has found outside, oldest first. */
  collection: Find[];
  /** The one tree this child looks after, or null before they pick one. */
  tree: TreeFriend | null;
  /** Steps, coins and daily goals. */
  walk: WalkState;
  /** Username and friends board, if a parent allowed them. */
  social: Social;
  /** Bought and earned buddy items, and what the buddy currently has on. */
  wardrobe: Wardrobe;
  /** The daily app limit a parent set up, if any. */
  guard: GuardConfig;
  /** What the limit has counted today. Rolls over on the date. */
  guardDay: GuardDay;
  /**
   * Finished days, oldest first, trimmed to `GUARD_HISTORY_DAYS`.
   *
   * A queue rather than an archive. It exists so a phone that has been offline
   * for a fortnight still has every day to send when it next reaches the hub,
   * and so the child's own screen can draw a week without a network. The
   * server is where the long history lives.
   */
  guardHistory: GuardDay[];
  /** The parent's account this phone reports to, or null if it was never linked. */
  hub: HubLink | null;
  /** What the parent has sent down and not had an answer to. */
  inbox: Inbox;
  /** Treasure badges a parent set up, or null before they did. */
  badges: BadgeSet | null;
  /** The 10-13 screen free target for this week, if they set one. */
  weekGoal: WeekGoal | null;
  /** Thumbs on made for you ideas the child never started, newest last. */
  ideaVotes: IdeaVote[];
};

export const SCHEMA_VERSION = 10;

export const emptySocial: Social = {
  mode: 'unset',
  account: null,
  lastSent: null,
  lastSentAt: null,
  lostUsername: null,
};

export const emptyProgress: Progress = {
  stars: 0,
  level: 1,
  totalMissions: 0,
  totalMinutes: 0,
  streak: 0,
  bestStreak: 0,
  lastDoneDate: null,
  unlocked: [],
};

export const defaultSettings: Settings = {
  language: 'tr',
  parentPin: '',
  remindersEnabled: false,
  reminderHour: 17,
  reminderMinute: 0,
  consentAt: null,
  voiceEnabled: true,
  duoEnabled: true,
  teenSkin: 'dark',
  spotChecks: 'some',
  reviewNotify: false,
};

export function createEmptyData(language: Language): AppData {
  return {
    schema: SCHEMA_VERSION,
    settings: { ...defaultSettings, language },
    profile: null,
    progress: { ...emptyProgress, unlocked: [] },
    missions: [],
    chat: [],
    coachChat: [],
    room: null,
    storiesHeard: [],
    realRewards: [],
    collection: [],
    tree: null,
    walk: { coins: 0, lifetimeSteps: 0, days: [], bestDay: 0, goalStreak: 0 },
    social: { ...emptySocial },
    wardrobe: { owned: [], worn: [] },
    guard: { ...defaultGuardConfig },
    guardDay: emptyGuardDay(''),
    guardHistory: [],
    hub: null,
    inbox: { ...emptyInbox },
    badges: null,
    weekGoal: null,
    ideaVotes: [],
  };
}
