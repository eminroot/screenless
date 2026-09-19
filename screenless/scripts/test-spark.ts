/**
 * Holds the taste engine and the made for you missions to their own rules.
 *
 * Two things are being protected here. The first is that a mission built on
 * the phone has to be as safe and as well formed as one written by hand: the
 * same length limits, the same caps on what a child is asked to do with their
 * body, translations in all three languages, and no sentence with a hole left
 * in it. The second is that the arithmetic actually works — that thumbs move
 * what gets offered, that a thin history moves nothing, and that a child who
 * loves building still gets sent outside.
 *
 * Run with: npm run test:spark
 */
import { slotBanks, sparkTemplates, type Filler, type SlotKind } from '../src/data/spark-templates';
import { pickTask } from '../src/engine/task-engine';
import { learnFromMissions } from '../src/engine/learning';
import { makeIdeas, previewIdea, type SparkIdea } from '../src/engine/spark';
import {
  affinity,
  emptyTaste,
  facetsOf,
  nextRating,
  readTaste,
  type Taste,
} from '../src/engine/taste';
import { hashString, mulberry32 } from '../src/lib/seeded';
import { AGE_BANDS, INTERESTS, TASK_CATEGORIES } from '../src/state/types';
import type {
  AgeBand,
  ChildProfile,
  IdeaVote,
  Mission,
  Rating,
  TaskCategory,
  TaskContent,
} from '../src/state/types';
import { LANGUAGES, type Localized } from '../src/i18n/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) return;
  failures += 1;
  console.log(`  FAIL  ${label}`);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

function complete(value: Localized | undefined): boolean {
  if (!value) return false;
  return LANGUAGES.every((lang) => typeof value[lang] === 'string' && value[lang].trim().length > 0);
}

function profileFor(band: AgeBand, interests: string[] = ['building', 'animals']): ChildProfile {
  return {
    nickname: 'Test',
    ageBand: band,
    interests: interests as ChildProfile['interests'],
    buddyId: 'fox',
    buddyName: 'Fox',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

/** A finished mission carrying a made up task, for feeding the taste engine. */
function mission(input: {
  id: string;
  task: Partial<TaskContent> & { category: TaskCategory };
  status?: Mission['status'];
  rating?: Rating;
  at?: string;
  skipReason?: Mission['skipReason'];
}): Mission {
  const task: TaskContent = {
    id: `t-${input.id}`,
    minutes: input.task.minutes ?? 10,
    stars: input.task.stars ?? 10,
    emoji: '🙂',
    interests: input.task.interests ?? [],
    ageBands: input.task.ageBands ?? ['6-9'],
    title: { az: 'a', tr: 'a', en: 'a' },
    body: { az: 'b', tr: 'b', en: 'b' },
    source: 'library',
    ...input.task,
  };
  return {
    id: input.id,
    task,
    status: input.status ?? 'done',
    assignedAt: input.at ?? '2026-09-01T10:00:00.000Z',
    confirmedAt: input.at ?? '2026-09-01T10:00:00.000Z',
    ...(input.rating ? { rating: input.rating, ratedAt: input.at ?? '2026-09-01T10:00:00.000Z' } : {}),
    ...(input.skipReason ? { skipReason: input.skipReason } : {}),
  };
}

/* ------------------------------------------------------------- the pieces */

section('every piece is well formed');
{
  const kinds = Object.keys(slotBanks) as SlotKind[];
  for (const kind of kinds) {
    const ids = new Set<string>();
    for (const filler of slotBanks[kind]) {
      const at = `${kind}/${filler.id}`;
      ok(`${at}: id is unique in its bank`, !ids.has(filler.id));
      ids.add(filler.id);
      ok(`${at}: text in all languages`, complete(filler.text));
      ok(`${at}: plural in all languages`, filler.many === undefined || complete(filler.many));
      ok(
        `${at}: known interests`,
        (filler.interests ?? []).every((interest) => (INTERESTS as readonly string[]).includes(interest)),
      );
      ok(
        `${at}: known age bands`,
        (filler.bands ?? []).every((band) => (AGE_BANDS as readonly string[]).includes(band)),
      );
      // The id is the record of what a child voted on, and it is split on
      // hyphens to read the pieces back out of it.
      ok(`${at}: id has no hyphen`, !filler.id.includes('-'));
      ok(
        `${at}: only places names a real place`,
        (filler.places ?? []).every((place) => slotBanks.place.some((option) => option.id === place)),
      );
    }
  }

  // Places are the only bank that may be named by another piece, so they have
  // to stay distinguishable from each other.
  ok('every place says whether it is indoors or out', slotBanks.place.every((place) =>
    (place.tags ?? []).includes('indoor') || (place.tags ?? []).includes('outdoor'),
  ));
}

/* ---------------------------------------------------------- the skeletons */

section('every skeleton is well formed');
{
  const ids = new Set<string>();
  for (const template of sparkTemplates) {
    const at = template.id;
    ok(`${at}: id is unique`, !ids.has(template.id));
    ids.add(template.id);
    ok(`${at}: id has no double hyphen`, !template.id.includes('--'));
    ok(`${at}: title in all languages`, complete(template.title));
    ok(`${at}: body in all languages`, complete(template.body));
    ok(`${at}: every step in all languages`, (template.steps ?? []).every((step) => complete(step)));
    ok(`${at}: the question is in all languages`, !template.ask || complete(template.ask.question));
    ok(`${at}: the prompt is in all languages`, !template.note || complete(template.note.prompt));
    ok(`${at}: known category`, (TASK_CATEGORIES as readonly string[]).includes(template.category));
    ok(`${at}: known age band`, (AGE_BANDS as readonly string[]).includes(template.band));
    ok(`${at}: takes real time`, template.minutes >= 2 && template.minutes <= 30);
    ok(`${at}: stars track the minutes`, template.stars >= 4 && template.stars <= template.minutes + 6);
    ok(`${at}: has an emoji`, template.emoji.length > 0 && template.emoji.length <= 4);
    ok(
      `${at}: a count that makes sense`,
      !template.count || (template.count.min >= 1 && template.count.max >= template.count.min),
    );
    // Free text is a 10-14 thing. Below that a text box is a spelling test.
    ok(`${at}: only the oldest band writes`, !template.note || template.band === '10-14');

    // Every blank must have something to put in it, or the skeleton can never
    // be used and quietly disappears from the batch.
    const text = [template.title.en, template.body.en, ...(template.steps ?? []).map((s) => s.en)].join(' ');
    for (const kind of Object.keys(slotBanks) as SlotKind[]) {
      if (!text.includes(`{{${kind}}}`) && !text.includes(`{{${kind}s}}`)) continue;
      const eligible = slotBanks[kind].filter(
        (filler) =>
          (!filler.bands || filler.bands.includes(template.band)) &&
          (template.needs?.[kind] ?? []).every((tag) => (filler.tags ?? []).includes(tag)) &&
          !(template.avoids?.[kind] ?? []).some((tag) => (filler.tags ?? []).includes(tag)),
      );
      ok(`${at}: the ${kind} blank has pieces for ${template.band}`, eligible.length >= 2);
    }
  }

  for (const band of AGE_BANDS) {
    const forBand = sparkTemplates.filter((template) => template.band === band);
    ok(`${band}: has skeletons`, forBand.length >= 6);
    // One kind of idea over and over is the same evening over and over.
    ok(
      `${band}: covers at least four categories`,
      new Set(forBand.map((template) => template.category)).size >= 4,
    );
  }
}

/* ---------------------------------------------------- what they turn into */

/** Reads the pieces back out of a made mission's id. */
function partsOf(id: string): { template: string; pieces: string[]; count: number | null } {
  const [template, rest = ''] = id.slice('spark-'.length).split('--');
  const parts = rest.split('-').filter(Boolean);
  const last = parts[parts.length - 1];
  const count = last !== undefined && /^\d+$/.test(last) ? Number(last) : null;
  return { template, pieces: count === null ? parts : parts.slice(0, -1), count };
}

function fillerById(id: string): Filler | undefined {
  for (const bank of Object.values(slotBanks)) {
    const found = bank.find((filler) => filler.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Every idea the generator produces over a wide sweep of seeds. */
function sweep(band: AgeBand, rounds = 60): SparkIdea[] {
  const profile = profileFor(band);
  const all: SparkIdea[] = [];
  for (let round = 0; round < rounds; round += 1) {
    all.push(
      ...makeIdeas({
        profile,
        missions: [],
        taste: emptyTaste,
        votes: [],
        seed: `sweep-${band}-${round}`,
        count: 3,
      }),
    );
  }
  return all;
}

/**
 * The longest a 3-5 mission may run, and the most steps they can hold in
 * their head. The same numbers the written library is held to.
 */
const LITTLE_MAX_MINUTES = 20;
const LITTLE_MAX_STEPS = 3;
/** Ages 10-14, per "yaşa uyğun limitlər": nothing here escalates. */
const TEEN_MAX_REPS = 60;

section('a made mission is as well formed as a written one');
{
  for (const band of AGE_BANDS) {
    const ideas = sweep(band);
    ok(`${band}: the generator produces ideas at all`, ideas.length >= 100);

    for (const idea of ideas) {
      const task = idea.task;
      const at = task.id;

      for (const lang of LANGUAGES) {
        // The one failure mode that would be visible to a child: a blank
        // that never got filled, printed as it is written in the source.
        ok(
          `${at}: no hole left in the ${lang} text`,
          !task.title[lang].includes('{{') && !task.body[lang].includes('{{'),
        );
        ok(`${at}: ${lang} title starts upper case`, task.title[lang][0] === task.title[lang][0].toLocaleUpperCase());
      }
      ok(`${at}: title in all languages`, complete(task.title));
      ok(`${at}: body in all languages`, complete(task.body));
      ok(`${at}: every step in all languages`, (task.steps ?? []).every((step) => complete(step)));
      ok(`${at}: the question is in all languages`, !task.answer || complete(task.answer.question));

      ok(`${at}: marked as made`, task.source === 'spark');
      ok(`${at}: one age band`, task.ageBands.length === 1 && task.ageBands[0] === band);
      ok(`${at}: takes real time`, task.minutes >= 2 && task.minutes <= 30);
      ok(`${at}: stars track the minutes`, task.stars >= 4 && task.stars <= task.minutes + 6);
      ok(`${at}: has an emoji`, task.emoji.length > 0 && task.emoji.length <= 4);
      ok(
        `${at}: known interests`,
        task.interests.every((interest) => (INTERESTS as readonly string[]).includes(interest)),
      );
      // Nothing generated may need a grown up in the room: the brief a duo
      // mission owes a parent cannot be written by a template.
      ok(`${at}: never demands a grown up`, task.mode !== 'duo');
      ok(`${at}: no motion spec it cannot fill`, task.proof !== 'motion');

      if (band === '3-5') {
        ok(`${at}: short enough for a 3-5`, task.minutes <= LITTLE_MAX_MINUTES);
        ok(`${at}: few enough steps for a 3-5`, (task.steps ?? []).length <= LITTLE_MAX_STEPS);
        ok(`${at}: nothing to write at 3-5`, task.note === undefined);
      }

      const { pieces, count } = partsOf(task.id);
      const chosen = pieces.map(fillerById);
      ok(`${at}: every piece in the id is real`, chosen.every((filler) => filler !== undefined));

      // Cushions in the kitchen and footballs in the hallway are the whole
      // reason the pieces carry a room list.
      const place = chosen.find((filler) => filler && slotBanks.place.includes(filler));
      if (place) {
        ok(
          `${at}: every piece belongs in ${place.id}`,
          chosen.every((filler) => !filler?.places || filler.places.includes(place.id)),
        );
      }

      if (count !== null) {
        const cap = Math.min(...chosen.map((filler) => filler?.maxCount ?? Infinity));
        ok(`${at}: asks for a plausible number`, count <= cap);
        if (band === '10-14') ok(`${at}: no escalating rep count`, count <= TEEN_MAX_REPS);
      }
    }
  }
}

section('a batch is a choice rather than a list');
{
  for (const band of AGE_BANDS) {
    const profile = profileFor(band);
    let duplicates = 0;
    let sameCategory = 0;
    const rounds = 40;

    for (let round = 0; round < rounds; round += 1) {
      const ideas = makeIdeas({
        profile,
        missions: [],
        taste: emptyTaste,
        votes: [],
        seed: `batch-${band}-${round}`,
        count: 3,
      });
      ok(`${band}/${round}: a full batch`, ideas.length === 3);
      if (new Set(ideas.map((idea) => idea.task.id)).size !== ideas.length) duplicates += 1;
      if (new Set(ideas.map((idea) => idea.task.category)).size !== ideas.length) sameCategory += 1;
    }

    ok(`${band}: never repeats an idea inside one batch`, duplicates === 0);
    ok(`${band}: three different kinds of evening every time`, sameCategory === 0);
  }
}

section('the same seed gives the same morning');
{
  const profile = profileFor('6-9');
  const once = makeIdeas({ profile, missions: [], taste: emptyTaste, votes: [], seed: 'stable', count: 3 });
  const twice = makeIdeas({ profile, missions: [], taste: emptyTaste, votes: [], seed: 'stable', count: 3 });
  ok(
    'the batch is reproducible',
    once.map((idea) => idea.task.id).join() === twice.map((idea) => idea.task.id).join(),
  );

  const other = makeIdeas({ profile, missions: [], taste: emptyTaste, votes: [], seed: 'stable-2', count: 3 });
  ok(
    'a different seed gives a different batch',
    once.map((idea) => idea.task.id).join() !== other.map((idea) => idea.task.id).join(),
  );

  // The parent's screen needs one settled example of each pattern.
  for (const template of sparkTemplates) {
    const band = template.band;
    const first = previewIdea(template.id, profileFor(band), `preview-${template.id}`);
    const again = previewIdea(template.id, profileFor(band), `preview-${template.id}`);
    ok(`${template.id}: has a preview`, first !== null);
    ok(`${template.id}: the preview is settled`, first?.task.id === again?.task.id);
    ok(`${template.id}: the preview is of this pattern`, partsOf(first?.task.id ?? '').template === template.id);
  }
}

section('a thumb down is final');
{
  const profile = profileFor('6-9');
  const first = makeIdeas({ profile, missions: [], taste: emptyTaste, votes: [], seed: 'refuse', count: 3 });
  const refused = first[0];
  const votes: IdeaVote[] = [
    { id: refused.task.id, facets: refused.facets, value: -1, at: '2026-09-19T10:00:00.000Z' },
  ];

  let seenAgain = 0;
  for (let round = 0; round < 30; round += 1) {
    const ideas = makeIdeas({
      profile,
      missions: [],
      taste: readTaste([], votes),
      votes,
      seed: `refuse-${round}`,
      count: 3,
    });
    if (ideas.some((idea) => idea.task.id === refused.task.id)) seenAgain += 1;
  }
  ok('a refused idea never comes back', seenAgain === 0);

  // Asking for more has to actually give more.
  const shown = first.map((idea) => idea.task.id);
  const next = makeIdeas({
    profile,
    missions: [],
    taste: emptyTaste,
    votes: [],
    seed: 'refuse-more',
    count: 3,
    exclude: shown,
  });
  ok('more means different', next.every((idea) => !shown.includes(idea.task.id)));
}

/* ------------------------------------------------------------ the numbers */

section('the taste engine says nothing until it knows something');
{
  const nothing = readTaste([], []);
  ok('an empty history knows nothing', nothing.scores.size === 0);
  ok('an empty history scores every task at zero', affinity(
    { category: 'move', minutes: 10, interests: ['football'] } as TaskContent,
    nothing,
  ) === 0);

  const one = readTaste([mission({ id: 'm1', task: { category: 'create', interests: ['building'] } })], []);
  const single = one.scores.get('cat:create') ?? 0;
  // One finished mission is not evidence of a personality. The shrinkage is
  // what makes this true without a threshold anywhere in the code.
  ok('one mission barely moves anything', single > 0 && single < 0.35);

  const many = readTaste(
    Array.from({ length: 12 }, (_, i) =>
      mission({ id: `m${i}`, task: { category: 'create', interests: ['building'] } }),
    ),
    [],
  );
  ok('a dozen missions moves it a lot more', (many.scores.get('cat:create') ?? 0) > single * 2);
  ok('nothing ever leaves the range', [...many.scores.values()].every((v) => v >= -1 && v <= 1));
}

section('a thumb outweighs a habit');
{
  const done = readTaste(
    Array.from({ length: 3 }, (_, i) =>
      mission({ id: `d${i}`, task: { category: 'calm', interests: ['books'] } }),
    ),
    [],
  );
  const thumbed = readTaste(
    [mission({ id: 'r1', task: { category: 'calm', interests: ['books'] }, rating: 1 })],
    [],
  );
  ok(
    'one thumb up beats three quiet finishes',
    (thumbed.scores.get('cat:calm') ?? 0) > (done.scores.get('cat:calm') ?? 0),
  );

  // The case the behavioural read gets wrong on its own: finished, disliked.
  const disliked = readTaste(
    [mission({ id: 'r2', task: { category: 'calm', interests: ['books'] }, rating: -1 })],
    [],
  );
  ok('finishing something you hated reads as negative', (disliked.scores.get('cat:calm') ?? 0) < 0);

  const skipped = readTaste(
    [mission({ id: 's1', task: { category: 'move' }, status: 'skipped', skipReason: 'boring' })],
    [],
  );
  const busy = readTaste(
    [mission({ id: 's2', task: { category: 'move' }, status: 'skipped', skipReason: 'cantNow' })],
    [],
  );
  ok(
    'boring counts against it more than no time does',
    (skipped.scores.get('cat:move') ?? 0) < (busy.scores.get('cat:move') ?? 0),
  );

  ok('the same thumb again clears it', nextRating(1, 1) === null);
  ok('the other thumb replaces it', nextRating(1, -1) === -1);
  ok('a first thumb sticks', nextRating(undefined, -1) === -1);
}

section('yesterday counts for more than last month');
{
  const old = Array.from({ length: 8 }, (_, i) =>
    mission({
      id: `old${i}`,
      task: { category: 'move' },
      rating: 1,
      at: `2026-08-0${(i % 9) + 1}T10:00:00.000Z`,
    }),
  );
  const recent = Array.from({ length: 8 }, (_, i) =>
    mission({
      id: `new${i}`,
      task: { category: 'create' },
      rating: 1,
      at: `2026-09-1${i % 10}T10:00:00.000Z`,
    }),
  );
  const taste = readTaste([...old, ...recent], []);
  ok(
    'the newer liking is the stronger one',
    (taste.scores.get('cat:create') ?? 0) > (taste.scores.get('cat:move') ?? 0),
  );
}

section('an idea vote counts without a mission behind it');
{
  const votes: IdeaVote[] = Array.from({ length: 6 }, (_, i) => ({
    id: `spark-j-build--block-engineer-${i}`,
    facets: ['cat:create', 'interest:building'],
    value: -1 as Rating,
    at: `2026-09-1${i}T10:00:00.000Z`,
  }));
  const taste = readTaste([], votes);
  ok('turning ideas down is heard', (taste.scores.get('cat:create') ?? 0) < -0.4);
  ok('and it is counted as the child speaking', taste.spoken === 6);
}

/* ------------------------------------------- what it does to what is shown */

/** Runs the picker with a settled random source, so a run is reproducible. */
function withSeededRandom<T>(seed: string, run: () => T): T {
  const real = Math.random;
  const next = mulberry32(hashString(seed));
  Math.random = next;
  try {
    return run();
  } finally {
    Math.random = real;
  }
}

/**
 * A run of the app, mission after mission.
 *
 * The picker is only half of what decides what a child sees: the other half
 * is the history it reads, and every pick becomes part of that history. So
 * measuring one pick two hundred times measures something that never happens
 * to anybody. This plays the missions out in order, thumbing each one the way
 * the child in question would, and reports what they were offered along the
 * way.
 */
function simulate(input: {
  seed: string;
  draws: number;
  /** What this child thinks of a mission they were just given. */
  thumb: (task: TaskContent) => Rating | undefined;
}): { share: Map<TaskCategory, number>; kinds: number } {
  const profile = profileFor('6-9', ['building', 'animals', 'space']);
  const missions: Mission[] = [];
  const counts = new Map<TaskCategory, number>();

  withSeededRandom(input.seed, () => {
    for (let i = 0; i < input.draws; i += 1) {
      const learned = learnFromMissions(missions, []);
      const task = pickTask(profile, missions, { learned, allowDuo: false });

      // Only the second half is counted, so what is measured is the settled
      // behaviour rather than the first few days of knowing nothing.
      if (i >= input.draws / 2) counts.set(task.category, (counts.get(task.category) ?? 0) + 1);

      const day = String(10 + (i % 20)).padStart(2, '0');
      const hour = String(8 + (i % 12)).padStart(2, '0');
      missions.push(
        mission({
          id: `sim${i}`,
          task,
          rating: input.thumb(task),
          at: `2026-09-${day}T${hour}:00:00.000Z`,
        }),
      );
    }
  });

  const counted = input.draws / 2;
  const share = new Map<TaskCategory, number>();
  for (const category of TASK_CATEGORIES) {
    share.set(category, (counts.get(category) ?? 0) / counted);
  }
  return { share, kinds: [...counts.keys()].length };
}

section('thumbs change what turns up');
{
  // The same child and the same dice, so the only difference between the two
  // runs is whether the thumbs were pressed.
  const quiet = simulate({ seed: 'run', draws: 120, thumb: () => undefined });
  const opinionated = simulate({
    seed: 'run',
    draws: 120,
    thumb: (task) => (task.category === 'create' ? 1 : task.category === 'move' ? -1 : undefined),
  });

  const createBefore = quiet.share.get('create') ?? 0;
  const createAfter = opinionated.share.get('create') ?? 0;
  const moveBefore = quiet.share.get('move') ?? 0;
  const moveAfter = opinionated.share.get('move') ?? 0;

  console.log(
    `  making things: ${Math.round(createBefore * 100)}% -> ${Math.round(createAfter * 100)}%, ` +
      `moving about: ${Math.round(moveBefore * 100)}% -> ${Math.round(moveAfter * 100)}%`,
  );

  ok('saying yes to a kind of mission brings more of it', createAfter - createBefore >= 0.08);
  ok('saying no to a kind of mission halves it at least', moveAfter <= moveBefore * 0.5);

  // The thing that matters more than either: it must not narrow to one
  // subject. A child who loves building still gets sent outside, and the
  // kind they turned down is thinned rather than deleted.
  ok('the picker still offers every kind of thing', opinionated.kinds === TASK_CATEGORIES.length);
  ok('the kind they turned down has not vanished', moveAfter > 0);

  // And the quiet child, who never presses a thumb, is not quietly narrowed
  // by the app reading their finishes as enthusiasm. Finishing is weak
  // evidence and is weighted as weak evidence; this is what holds it there.
  const widest = Math.max(...quiet.share.values());
  console.log(`  a child who never presses a thumb: biggest share ${Math.round(widest * 100)}%`);
  ok('finishing things does not narrow what you are offered', widest < 0.6);
}

section('thumbs change what gets made');
{
  const profile = profileFor('6-9', ['building']);
  const liked: Mission[] = Array.from({ length: 10 }, (_, i) =>
    mission({
      id: `nature${i}`,
      task: { category: 'outdoor', interests: ['nature'], ageBands: ['6-9'], place: 'outdoor' },
      rating: 1,
      at: `2026-09-1${i}T10:00:00.000Z`,
    }),
  );
  const taste: Taste = readTaste(liked, []);

  let natureIdeas = 0;
  let plainIdeas = 0;
  for (let round = 0; round < 30; round += 1) {
    const warm = makeIdeas({ profile, missions: [], taste, votes: [], seed: `warm-${round}`, count: 3 });
    const cold = makeIdeas({
      profile,
      missions: [],
      taste: emptyTaste,
      votes: [],
      seed: `warm-${round}`,
      count: 3,
    });
    natureIdeas += warm.filter((idea) => idea.task.interests.includes('nature')).length;
    plainIdeas += cold.filter((idea) => idea.task.interests.includes('nature')).length;
  }

  console.log(`  ideas about nature: ${plainIdeas} without the thumbs, ${natureIdeas} with them`);
  ok('liking the outdoors makes more outdoor ideas', natureIdeas > plainIdeas);
}

section('the reason shown is a reason that holds');
{
  const liked = Array.from({ length: 10 }, (_, i) =>
    mission({
      id: `build${i}`,
      task: { category: 'create', interests: ['building'], ageBands: ['6-9'] },
      rating: 1,
      at: `2026-09-1${i}T10:00:00.000Z`,
    }),
  );
  const taste = readTaste(liked, []);
  const ideas = makeIdeas({
    profile: profileFor('6-9'),
    missions: [],
    taste,
    votes: [],
    seed: 'why',
    count: 3,
  });

  for (const idea of ideas) {
    if (!idea.why) continue;
    ok(
      `${idea.task.id}: the reason is something the mission actually is`,
      idea.facets.includes(idea.why),
    );
    ok(
      `${idea.task.id}: the reason is something they are warm about`,
      (taste.scores.get(idea.why) ?? 0) > 0,
    );
  }
}

section('the facets of a task are the facets of a task');
{
  const task: TaskContent = {
    id: 'x',
    category: 'outdoor',
    minutes: 20,
    stars: 18,
    emoji: '🌳',
    interests: ['nature'],
    ageBands: ['6-9'],
    title: { az: 'a', tr: 'a', en: 'a' },
    body: { az: 'b', tr: 'b', en: 'b' },
    source: 'library',
    place: 'outdoor',
    proof: 'photo',
    mode: 'duo',
  };
  const facets = facetsOf(task);
  ok('the category is always there', facets.includes('cat:outdoor'));
  ok('the interests are there', facets.includes('interest:nature'));
  ok('the length is there', facets.includes('len:long'));
  ok('being outside counts as moving', facets.includes('body:active'));
  ok('needing a grown up is a facet', facets.includes('mode:duo'));
  ok('where it happens is a facet', facets.includes('place:outdoor'));
  ok('being asked for a photo is a facet', facets.includes('proof:photo'));

  // Solo and "anywhere" are the defaults, and would be evidence of nothing
  // while diluting the average of everything they touched.
  const plain = facetsOf({ ...task, mode: undefined, place: undefined, proof: undefined });
  ok('doing it alone is not a facet', !plain.some((facet) => facet.startsWith('mode:')));
  ok('anywhere is not a facet', !plain.some((facet) => facet.startsWith('place:')));
  ok('a tap is not a facet', !plain.some((facet) => facet.startsWith('proof:')));
}

console.log(`\n${checks - failures}/${checks} checks passed`);
console.log(`${sparkTemplates.length} skeletons, ${Object.values(slotBanks).flat().length} pieces`);
if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
