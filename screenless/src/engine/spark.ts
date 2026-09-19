import { slotBanks, sparkTemplates, type Filler, type SlotKind, type SparkTemplate } from '../data/spark-templates';
import { hashString, mulberry32, softmaxWeight, weightedPick } from '../lib/seeded';
import { affinityOfFacets, emptyTaste, facetsOf, strongestFacet, type Facet, type Taste } from './taste';
import { languageMeta, LANGUAGES, type Localized } from '../i18n/types';
import type {
  AgeBand,
  CheckRule,
  ChildProfile,
  EvidenceCheck,
  IdeaVote,
  InterestId,
  Mission,
  TaskContent,
} from '../state/types';

/**
 * Missions that are not in the library, built on the phone.
 *
 * The library is finite and it is the same library for every child in the
 * country. This is the part that is only theirs: skeletons from
 * `data/spark-templates.ts` chosen by what they have liked, with the holes
 * filled by pieces chosen the same way. A child who keeps thumbing up
 * building gets skeletons about building, filled with things that stack.
 *
 * Three things it deliberately is not:
 *
 * - It is not a language model and it does not call one. Everything here is
 *   a weighted draw from a list. The app works with the network off, which
 *   for an app about putting the phone down is not a detail, and a family
 *   pays nothing per idea.
 * - It is not random. The seed is the child, the day and the round, so the
 *   three ideas waiting this morning are still the same three ideas after
 *   the app is closed and reopened. Asking for more moves the round on.
 * - It is not unbounded. Every word it can produce is written down in a file
 *   a parent could read, in all three languages, by a person. Nothing here
 *   can say something nobody wrote.
 */

/** One made mission, with the workings kept so a screen can explain it. */
export type SparkIdea = {
  task: TaskContent;
  /** What it is made of, stored with a thumb so the vote survives an update. */
  facets: Facet[];
  /** The facet doing most to recommend it, for the "because you like" line. */
  why: Facet | null;
  /** Ids of the pieces used, so the next batch can avoid repeating them. */
  pieces: string[];
};

/** How strongly taste sorts the skeletons. Lower means more predictable. */
const TEMPLATE_TEMPERATURE = 0.35;

/** Weight given to a piece whose interest the child is warm about. */
const PIECE_TASTE_PULL = 2.5;
/** Weight given to a piece matching an interest a parent ticked at setup. */
const PIECE_PROFILE_PULL = 1.5;
/** How far a piece drops for having just been used. */
const PIECE_REPEAT_PENALTY = 2.6;

/** A skeleton used this recently is held back so the batch does not rhyme. */
const TEMPLATE_HISTORY = 8;

export type SparkInput = {
  profile: ChildProfile;
  /** History, for "not this one again" rather than for taste. */
  missions: Mission[];
  taste: Taste;
  votes: IdeaVote[];
  /** Anything that makes this batch this batch: child, day, round. */
  seed: string;
  count?: number;
  /** Ids already shown, so asking for more ideas gives different ones. */
  exclude?: string[];
};

/**
 * Builds a batch of ideas.
 *
 * Same seed, same ideas: the batch is derived, never stored, so the only way
 * it survives the app closing is for it to be reproducible.
 */
export function makeIdeas(input: SparkInput): SparkIdea[] {
  const { profile, missions, taste, votes, seed } = input;
  const wanted = input.count ?? 3;
  const random = mulberry32(hashString(seed));

  const band = profile.ageBand;
  const pool = sparkTemplates.filter((template) => template.band === band);
  if (pool.length === 0) return [];

  const excludedTemplates = new Set(
    (input.exclude ?? []).map((id) => id.slice('spark-'.length).split('--')[0]),
  );
  const refused = new Set([
    ...votes.filter((vote) => vote.value === -1).map((vote) => vote.id),
    ...(input.exclude ?? []),
  ]);
  const recentTemplates = templatesSeenRecently(missions);
  const recentPieces = piecesSeenRecently(missions);
  const chilledCategories = new Set(missions.slice(-3).map((mission) => mission.task.category));

  const ideas: SparkIdea[] = [];
  const usedTemplates = new Set<string>();
  const usedCategories = new Set<string>();
  const usedPieces = new Set<string>(recentPieces);

  // Tries beyond the number wanted, because a draw can land on something
  // already refused or already in this batch and simply has to be redrawn.
  for (let attempt = 0; attempt < wanted * 6 && ideas.length < wanted; attempt += 1) {
    const candidates = pool.filter(
      (template) =>
        !usedTemplates.has(template.id) &&
        // Only once every category is spoken for does a second of one kind
        // become acceptable, so three ideas are three different evenings.
        (!usedCategories.has(template.category) || usedCategories.size >= categoryCount(pool)),
    );
    if (candidates.length === 0) break;

    const template = weightedPick(
      candidates,
      (candidate) => {
        let score = affinityOfFacets(templateFacets(candidate), taste);
        if (excludedTemplates.has(candidate.id)) score -= 0.6;
        if (recentTemplates.has(candidate.id)) score -= 0.35;
        if (chilledCategories.has(candidate.category)) score -= 0.2;
        return softmaxWeight(score, TEMPLATE_TEMPERATURE);
      },
      random,
    );

    const idea = fillTemplate(template, { band, profile, taste, random, avoid: usedPieces });

    if (!idea) {
      usedTemplates.add(template.id);
      continue;
    }
    if (refused.has(idea.task.id) || ideas.some((made) => made.task.id === idea.task.id)) continue;

    ideas.push(idea);
    usedTemplates.add(template.id);
    usedCategories.add(template.category);
    for (const piece of idea.pieces) usedPieces.add(piece);
  }

  return ideas;
}

/**
 * One filled in example of a named skeleton.
 *
 * For the parent's screen, which shows what each pattern can turn into. The
 * taste is deliberately empty: a parent looking at what the app *could* say
 * should see the neutral version, not the one their child is being steered
 * towards.
 */
export function previewIdea(
  templateId: string,
  profile: ChildProfile,
  seed: string,
): SparkIdea | null {
  const template = sparkTemplates.find(
    (candidate) => candidate.id === templateId && candidate.band === profile.ageBand,
  );
  if (!template) return null;
  return fillTemplate(template, {
    band: profile.ageBand,
    profile,
    taste: emptyTaste,
    random: mulberry32(hashString(seed)),
    avoid: new Set(),
  });
}

/** What a skeleton is, before any piece has been chosen. */
function templateFacets(template: SparkTemplate): Facet[] {
  const facets: Facet[] = [`cat:${template.category}`];
  for (const interest of template.interests ?? []) facets.push(`interest:${interest}`);
  facets.push(
    template.minutes < 8 ? 'len:quick' : template.minutes <= 14 ? 'len:medium' : 'len:long',
  );
  facets.push(
    template.category === 'move' || template.category === 'outdoor' ? 'body:active' : 'body:still',
  );
  if (template.place === 'outdoor') facets.push('place:outdoor');
  if (template.proof === 'photo') facets.push('proof:photo');
  return facets;
}

function categoryCount(pool: SparkTemplate[]): number {
  return new Set(pool.map((template) => template.category)).size;
}

/** Skeleton ids behind the last few made missions the child was handed. */
function templatesSeenRecently(missions: Mission[]): Set<string> {
  const seen = new Set<string>();
  for (const mission of missions.slice(-TEMPLATE_HISTORY)) {
    const id = mission.task.id;
    if (!id.startsWith('spark-')) continue;
    const template = id.slice('spark-'.length).split('--')[0];
    if (template) seen.add(template);
  }
  return seen;
}

function piecesSeenRecently(missions: Mission[]): string[] {
  const pieces: string[] = [];
  for (const mission of missions.slice(-TEMPLATE_HISTORY)) {
    const id = mission.task.id;
    if (!id.startsWith('spark-')) continue;
    const [, rest] = id.slice('spark-'.length).split('--');
    if (rest) pieces.push(...rest.split('-'));
  }
  return pieces;
}

type FillContext = {
  band: AgeBand;
  profile: ChildProfile;
  taste: Taste;
  random: () => number;
  avoid: Set<string>;
};

/** Which banks a skeleton actually draws from, read off its own text. */
function slotsUsed(template: SparkTemplate): SlotKind[] {
  const text = [
    template.title.en,
    template.body.en,
    ...(template.steps ?? []).map((step) => step.en),
    template.ask?.question.en ?? '',
    template.note?.prompt.en ?? '',
  ].join(' ');

  const kinds: SlotKind[] = ['thing', 'place', 'move', 'twist', 'theme', 'person', 'subject'];
  return kinds.filter((kind) => text.includes(`{{${kind}}}`) || text.includes(`{{${kind}s}}`));
}

function fillTemplate(template: SparkTemplate, context: FillContext): SparkIdea | null {
  const { band, profile, taste, random, avoid } = context;

  const chosen = new Map<SlotKind, Filler>();
  for (const slot of slotsUsed(template)) {
    let eligible = slotBanks[slot].filter(
      (filler) =>
        (!filler.bands || filler.bands.includes(band)) &&
        (template.needs?.[slot] ?? []).every((tag) => (filler.tags ?? []).includes(tag)) &&
        !(template.avoids?.[slot] ?? []).some((tag) => (filler.tags ?? []).includes(tag)),
    );

    // Pieces that only belong in certain rooms rule each other in and out,
    // whichever was drawn first. Without this the generator cheerfully asks
    // for eight cushions in the kitchen, and one sentence like that is
    // enough for a parent to stop trusting any of them.
    if (slot === 'place') {
      for (const picked of chosen.values()) {
        if (picked.places) eligible = eligible.filter((place) => picked.places?.includes(place.id));
      }
    } else {
      const place = chosen.get('place');
      if (place) eligible = eligible.filter((filler) => !filler.places || filler.places.includes(place.id));
    }

    // A skeleton with nothing left for this age or this room is skipped
    // rather than half filled and shown with a hole in it.
    if (eligible.length === 0) return null;

    chosen.set(
      slot,
      weightedPick(eligible, (filler) => pieceWeight(filler, profile, taste, avoid), random),
    );
  }

  let count = template.count
    ? template.count.min + Math.floor(random() * (template.count.max - template.count.min + 1))
    : null;
  // Nine socks is a hunt; nine teddy bears is a house nobody lives in.
  if (count !== null) {
    for (const filler of chosen.values()) {
      if (filler.maxCount) count = Math.max(1, Math.min(count, filler.maxCount));
    }
  }

  const pieces = [...chosen.values()].map((filler) => filler.id);
  const id = `spark-${template.id}--${[...pieces, count ?? ''].filter(Boolean).join('-')}`;

  const interests = new Set<InterestId>(template.interests ?? []);
  for (const filler of chosen.values()) {
    for (const interest of filler.interests ?? []) interests.add(interest);
  }

  const values = new Map<string, Localized>();
  for (const [slot, filler] of chosen) {
    values.set(slot, filler.text);
    values.set(`${slot}s`, filler.many ?? filler.text);
  }
  if (count !== null) {
    values.set('count', { az: String(count), tr: String(count), en: String(count) });
  }

  const task: TaskContent = {
    id,
    category: template.category,
    minutes: template.minutes,
    stars: template.stars,
    emoji: starEmoji(template, chosen),
    interests: [...interests],
    ageBands: [band],
    title: fill(template.title, values),
    body: fill(template.body, values),
    source: 'spark',
    ...(template.steps ? { steps: template.steps.map((step) => fill(step, values)) } : {}),
    ...(template.proof ? { proof: template.proof } : {}),
    ...(template.place ? { place: template.place } : {}),
    ...(template.ask
      ? {
          answer: {
            kind: 'count' as const,
            question: fill(template.ask.question, values),
            min: template.ask.min,
            max: template.ask.max,
            ...(template.ask.goalFromCount && count !== null ? { goal: count } : {}),
          },
        }
      : {}),
    ...(template.note
      ? {
          note: {
            prompt: fill(template.note.prompt, values),
            ...(template.note.lines ? { lines: template.note.lines } : {}),
            ...(template.note.minChars ? { minChars: template.note.minChars } : {}),
          },
        }
      : {}),
  };

  const checks = checksForSpark(template, task);
  if (checks) task.checks = checks;

  const facets = facetsOf(task);
  return { task, facets, why: strongestFacet(facets, taste), pieces };
}

/**
 * How a made mission is checked.
 *
 * Ages 3-5 get nothing, because a parent confirms every mission at that age
 * and a check would only be a second opinion nobody asked for. Above that the
 * default derived from `proof` already covers most of it, and the only thing
 * worth adding is the measurement a moving mission makes possible.
 */
function checksForSpark(template: SparkTemplate, task: TaskContent): CheckRule[] | null {
  if (template.band === '3-5') return null;
  if (template.measure === 'none') return null;

  const active = template.category === 'move';
  const outside = template.category === 'outdoor';
  if (!active && !outside) return null;

  const clock: EvidenceCheck = {
    kind: 'clock',
    minutes: Math.max(1, Math.ceil(template.minutes / 2)),
  };
  // Either the phone felt the child moving, or it lay untouched for most of
  // the mission. Both are evidence that something happened away from a
  // screen, and a phone left on a table during a football game is not a lie.
  const moved: CheckRule = {
    kind: 'either',
    of: [
      outside
        ? { kind: 'steps', count: Math.max(120, template.minutes * 45) }
        : { kind: 'active', minutes: Math.max(1, Math.round(template.minutes * 0.3)) },
      { kind: 'away', minutes: Math.max(1, Math.round(template.minutes * 0.4)) },
    ],
  };

  const rules: CheckRule[] = [clock, moved];
  if (task.answer) rules.push({ kind: 'answer' });
  if (task.note) rules.push({ kind: 'note' });
  return rules;
}

/**
 * The emoji the mission wears.
 *
 * A piece that is the point of the mission lends its own: a hunt for feathers
 * should not be a magnifying glass when it could be a feather.
 */
function starEmoji(template: SparkTemplate, chosen: Map<SlotKind, Filler>): string {
  const order: SlotKind[] = ['theme', 'subject', 'thing', 'move'];
  for (const slot of order) {
    const emoji = chosen.get(slot)?.emoji;
    if (emoji) return emoji;
  }
  return template.emoji;
}

function pieceWeight(
  filler: Filler,
  profile: ChildProfile,
  taste: Taste,
  avoid: Set<string>,
): number {
  let weight = 1;

  for (const interest of filler.interests ?? []) {
    const score = taste.scores.get(`interest:${interest}`) ?? 0;
    weight += score > 0 ? score * PIECE_TASTE_PULL : score * (PIECE_TASTE_PULL + 0.5);
    if (profile.interests.includes(interest)) weight += PIECE_PROFILE_PULL;
  }

  if (avoid.has(filler.id)) weight -= PIECE_REPEAT_PENALTY;

  // Never quite zero: a piece the child has been cool about should become
  // rare, not impossible, or the ideas narrow to a single subject.
  return Math.max(0.12, weight);
}

const SLOT_PATTERN = /\{\{(\w+)\}\}/g;

/** Puts the chosen pieces into a skeleton, in every language at once. */
export function fill(template: Localized, values: Map<string, Localized>): Localized {
  const filled = {} as Localized;
  for (const language of LANGUAGES) {
    const text = template[language].replace(SLOT_PATTERN, (whole, slot: string) => {
      const value = values.get(slot);
      return value ? value[language] : whole;
    });
    filled[language] = capitalise(text, language);
  }
  return filled;
}

/**
 * Capitalises the first letter, so a sentence that starts with a piece does
 * not start in lower case.
 *
 * Locale aware because Turkish and Azerbaijani have two letter i, and a
 * mission that opened with "Idman" instead of "İdman" would look like it was
 * written by a foreigner, which is exactly the impression this app cannot
 * afford in its own languages.
 */
function capitalise(text: string, language: keyof typeof languageMeta): string {
  if (text.length === 0) return text;
  const locale = languageMeta[language].locale;
  return text[0].toLocaleUpperCase(locale) + text.slice(1);
}

/** True for a mission this engine made, rather than one out of the library. */
export function isSpark(task: { id: string; source?: string }): boolean {
  return task.source === 'spark' || task.id.startsWith('spark-');
}
