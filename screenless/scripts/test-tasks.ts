/**
 * Holds the mission library to its own rules.
 *
 * The library is the one part of this app a parent is promised they can read
 * and predict, so the things that would quietly break that promise — a mission
 * missing a translation, a photo mission with nothing to photograph, a
 * three year old handed a fifteen minute job — are worth failing a build over
 * rather than finding on a device.
 *
 * Run with: npm run test:tasks
 */
import { juniorTasks } from '../src/data/junior-tasks';
import { taskLibrary } from '../src/data/tasks';
import { teenTasks } from '../src/data/teen-tasks';
import { checksFor, flatChecks } from '../src/engine/verify';
import { AGE_BANDS, INTERESTS, ROOM_OBJECTS, TASK_CATEGORIES } from '../src/state/types';
import type { AgeBand, InterestId, TaskContent } from '../src/state/types';
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

/** Every language filled in, and nothing left as an empty string. */
function complete(value: Localized | undefined): boolean {
  if (!value) return false;
  return LANGUAGES.every((lang) => typeof value[lang] === 'string' && value[lang].trim().length > 0);
}

/** Missions a child of this band could be given. */
function forBand(band: AgeBand): TaskContent[] {
  return taskLibrary.filter((task) => task.ageBands.includes(band));
}

/**
 * The longest a 3-5 mission may run.
 *
 * Generous on purpose. The thing a small child cannot sustain is following an
 * instruction, not playing — a cushion fort that eats twenty minutes is the
 * best outcome this app has. What the ceiling catches is a mission written for
 * an older child that has been handed down a band by accident.
 */
const LITTLE_MAX_MINUTES = 20;
/**
 * Steps a 3-5 child can hold in their head at once. One more is allowed when a
 * grown up is in the room, because then they are not the one holding it.
 */
const LITTLE_MAX_STEPS = 3;
const LITTLE_MAX_STEPS_DUO = 4;

/**
 * Interests with no missions in a band, knowingly.
 *
 * A parent can tick any of the twelve in setup, so an empty one means their
 * child is scored against nothing and quietly falls back to the interest-free
 * missions. That is worth failing a build over — except where it is a decision
 * rather than an oversight, in which case it belongs here with the reason.
 *
 * `bike` for 3-5: two wheels missions were written and then removed on Emin's
 * call, because the 3-5 library is his curriculum and cycling is not in it.
 * The hole is real and still open.
 */
const ACCEPTED_INTEREST_GAPS: Partial<Record<AgeBand, InterestId[]>> = {
  '3-5': ['bike'],
};

section('every mission is well formed');
{
  const ids = new Set<string>();
  for (const task of taskLibrary) {
    const at = `${task.id}`;

    ok(`${at}: id is unique`, !ids.has(task.id));
    ids.add(task.id);

    ok(`${at}: title in all languages`, complete(task.title));
    ok(`${at}: body in all languages`, complete(task.body));
    ok(`${at}: tip in all languages`, task.tip === undefined || complete(task.tip));
    ok(
      `${at}: parent brief in all languages`,
      task.parentBrief === undefined || complete(task.parentBrief),
    );
    ok(
      `${at}: every step in all languages`,
      (task.steps ?? []).every((step) => complete(step)),
    );

    ok(`${at}: known category`, (TASK_CATEGORIES as readonly string[]).includes(task.category));
    ok(
      `${at}: known interests`,
      task.interests.every((interest) => (INTERESTS as readonly string[]).includes(interest)),
    );
    ok(
      `${at}: known objects`,
      (task.objects ?? []).every((object) => (ROOM_OBJECTS as readonly string[]).includes(object)),
    );
    ok(`${at}: at least one age band`, task.ageBands.length > 0);
    ok(
      `${at}: known age bands`,
      task.ageBands.every((band) => (AGE_BANDS as readonly string[]).includes(band)),
    );

    ok(`${at}: has an emoji`, task.emoji.length > 0 && task.emoji.length <= 4);
    ok(`${at}: takes real time`, task.minutes >= 2 && task.minutes <= 30);
    // Stars are the currency the real life rewards are priced in, so a mission
    // that pays far more than the effort it took devalues every other one.
    ok(`${at}: stars track the minutes`, task.stars >= 4 && task.stars <= task.minutes + 6);
  }
}

section('the proof matches the mission');
{
  for (const task of taskLibrary) {
    const at = `${task.id}`;

    if (task.proof === 'motion') {
      ok(`${at}: a motion mission says what to count`, task.motion !== undefined);
      ok(`${at}: a countable number of reps`, (task.motion?.count ?? 0) >= 3);
    }
    ok(
      `${at}: only motion missions carry a motion spec`,
      task.motion === undefined || task.proof === 'motion',
    );
    if (task.mode === 'duo') {
      ok(`${at}: a duo mission briefs the grown up`, complete(task.parentBrief));
    }
    ok(
      `${at}: only duo missions brief a grown up`,
      task.parentBrief === undefined || task.mode === 'duo',
    );
  }
}

section('the closing question');
{
  for (const task of taskLibrary) {
    if (!task.check) continue;
    const at = `${task.id}`;

    ok(`${at}: the question is in all languages`, complete(task.check.question));
    ok(
      `${at}: every answer is in all languages`,
      task.check.options.every((option) => complete(option)),
    );
    // Two is a real choice, four is as many fat buttons as fit on one screen.
    ok(
      `${at}: between two and four answers`,
      task.check.options.length >= 2 && task.check.options.length <= 4,
    );
    // Every tier's runner draws it now, but only for its own band: a question
    // on a mission shared across bands would be stored and never asked in one
    // of them, which is worse than not having one.
    ok(`${at}: a question only goes to one band`, task.ageBands.length === 1);
  }
}

section('the youngest band is sized for the youngest band');
{
  const little = forBand('3-5');
  ok('3-5 has enough missions to not repeat', little.length >= 60);

  for (const task of little) {
    const at = `${task.id}`;
    ok(`${at}: short enough for a 3-5`, task.minutes <= LITTLE_MAX_MINUTES);
    ok(
      `${at}: few enough steps for a 3-5`,
      (task.steps ?? []).length <=
        (task.mode === 'duo' ? LITTLE_MAX_STEPS_DUO : LITTLE_MAX_STEPS),
    );
  }
}

section('every band has somewhere to go');
{
  for (const band of AGE_BANDS) {
    const pool = forBand(band);
    ok(`${band}: has missions at all`, pool.length >= 20);

    // A band that can only offer one kind of thing produces the same evening
    // over and over, which is how a child stops opening the app.
    for (const category of TASK_CATEGORIES) {
      ok(
        `${band}: has ${category} missions`,
        pool.filter((task) => task.category === category).length >= 3,
      );
    }

    // Every interest a parent can tick in setup has to lead somewhere, bar
    // the gaps listed above as deliberate.
    const accepted = ACCEPTED_INTEREST_GAPS[band] ?? [];
    for (const interest of INTERESTS) {
      if (accepted.includes(interest)) continue;
      ok(
        `${band}: has ${interest} missions`,
        pool.filter((task) => task.interests.includes(interest)).length >= 1,
      );
    }
    // And a gap that quietly filled itself should stop being listed as one.
    for (const interest of accepted) {
      ok(
        `${band}: ${interest} is still genuinely empty`,
        pool.filter((task) => task.interests.includes(interest)).length === 0,
      );
    }

    // Enough to get through a rainy afternoon indoors.
    ok(
      `${band}: has indoor missions`,
      pool.filter((task) => task.category !== 'outdoor' && task.place !== 'outdoor').length >= 15,
    );
    // And enough that a child who cannot be trusted to tap honestly still has
    // missions the phone or a photograph settles.
    ok(
      `${band}: has missions that check themselves`,
      pool.filter((task) => task.proof === 'motion' || task.proof === 'photo' || task.check || task.checks).length >= 8,
    );
  }
}

section('the 6-9 self checks are well formed');
{
  const MOTION_KINDS = ['steps', 'reps', 'active'];
  for (const task of taskLibrary) {
    const at = `${task.id}`;
    const own = task.checks ?? [];

    if (task.checks) {
      ok(
        `${at}: written checks belong to one self-checking band`,
        task.ageBands.length === 1 && (task.ageBands[0] === '6-9' || task.ageBands[0] === '10-13'),
      );
      ok(`${at}: at least one check`, own.length > 0);
    }
    for (const rule of own) {
      if (rule.kind === 'either') {
        ok(`${at}: an either offers a real choice`, rule.of.length >= 2);
      }
    }

    const flat = flatChecks(checksFor(task));
    const kinds = flat.map((check) => check.kind);

    // A text box is the 10-13 answer, and a spelling test below that age.
    ok(
      `${at}: notes are 10-13 only`,
      task.note === undefined || (task.ageBands.length === 1 && task.ageBands[0] === '10-13'),
    );
    if (task.note) {
      ok(`${at}: the note prompt is in all languages`, complete(task.note.prompt));
      ok(
        `${at}: the placeholder is in all languages`,
        task.note.placeholder === undefined || complete(task.note.placeholder),
      );
      ok(`${at}: a sane number of lines`, (task.note.lines ?? 1) >= 1 && (task.note.lines ?? 1) <= 5);
      ok(`${at}: a note check goes with the note`, kinds.includes('note'));
    }
    ok(`${at}: a note check has a note`, !kinds.includes('note') || Boolean(task.note));

    for (const check of flat) {
      if ('minutes' in check) {
        ok(`${at}: ${check.kind} asks for whole minutes`, Number.isInteger(check.minutes) && check.minutes >= 1);
        ok(`${at}: ${check.kind} fits inside the mission`, check.minutes <= task.minutes);
      }
      if ('count' in check) {
        ok(`${at}: ${check.kind} counts something`, Number.isInteger(check.count) && check.count >= 1);
      }
    }

    // Every question the child is asked is a check, and every answer check has
    // a question behind it, or the finish button waits on nothing.
    if (task.checks) {
      ok(`${at}: an answer check has a question`, !kinds.includes('answer') || Boolean(task.check || task.answer));
      ok(
        `${at}: a question is part of the checks`,
        !(task.check || task.answer) || kinds.includes('answer') || kinds.includes('grownup'),
      );
      ok(`${at}: a pick check has a list`, !kinds.includes('picked') || Boolean(task.pick));
      ok(`${at}: a list is part of the checks`, !task.pick || kinds.includes('picked'));
    }

    if (task.pick) {
      ok(`${at}: pick question in all languages`, complete(task.pick.question));
      ok(`${at}: every pick option in all languages`, task.pick.options.every((o) => complete(o)));
      ok(`${at}: between two and eight to pick from`, task.pick.options.length >= 2 && task.pick.options.length <= 8);
      ok(`${at}: pick minimum is reachable`, task.pick.min >= 1 && task.pick.min <= task.pick.options.length);
      ok(
        `${at}: pick maximum is sane`,
        task.pick.max === undefined || (task.pick.max >= task.pick.min && task.pick.max <= task.pick.options.length),
      );
      const picked = flat.find((check) => check.kind === 'picked');
      ok(`${at}: the pick check asks for the list minimum`, !picked || ('count' in picked && picked.count === task.pick.min));
    }

    if (task.answer) {
      ok(`${at}: answer question in all languages`, complete(task.answer.question));
      if (task.answer.kind === 'count') {
        ok(`${at}: a count has a range`, task.answer.min < task.answer.max);
        ok(
          `${at}: a count goal is inside the range`,
          task.answer.goal === undefined || (task.answer.goal >= task.answer.min && task.answer.goal <= task.answer.max),
        );
      } else {
        ok(`${at}: sums have a target worth splitting`, task.answer.target >= 2 && task.answer.target <= 20);
        ok(`${at}: one to four ways`, task.answer.ways >= 1 && task.answer.ways <= 4);
      }
    }

    const motionChecks = flat.filter((check) => MOTION_KINDS.includes(check.kind));
    ok(`${at}: one movement count at most`, motionChecks.length <= 1);
    const reps = flat.find((check) => check.kind === 'reps');
    if (reps && 'count' in reps) {
      ok(`${at}: a reps check counts with the motion sensor`, task.proof === 'motion' && task.motion?.count === reps.count);
    }

    // Tools and what they need.
    if (task.tool === 'badgeHunt') {
      const badges = flat.find((check) => check.kind === 'badges');
      ok(`${at}: a badge hunt checks one badge`, !!badges && 'count' in badges && badges.count === 1);
      ok(`${at}: a badge hunt needs a grown up to hide it`, task.mode === 'duo');
    }
    if (task.tool === 'badgeRoute') {
      const badges = flat.find((check) => check.kind === 'badges');
      ok(
        `${at}: a route checks two to five badges`,
        !!badges && 'count' in badges && badges.count >= 2 && badges.count <= 5,
      );
    }
    if (task.tool === 'secretObject') {
      ok(`${at}: a secret object mission checks the object`, kinds.includes('secret'));
    }
    ok(
      `${at}: badge missions wait for badges`,
      (task.tool === 'badgeHunt' || task.tool === 'badgeRoute') === (task.needs === 'badges'),
    );
    ok(`${at}: badge checks come with a badge tool`, !kinds.includes('badges') || task.needs === 'badges');
    ok(`${at}: a secret check comes with the tool`, !kinds.includes('secret') || task.tool === 'secretObject');
    ok(`${at}: a before photo pairs with an after photo`, !task.beforePhoto || kinds.includes('photo'));
  }
}

section('the 6-9 curriculum is the one that was written');
{
  // Nine strands, five missions each, as supplied. A mission added to the
  // curriculum off the author's list belongs somewhere else in the library.
  const strands = ['adventure', 'move', 'make', 'home', 'think', 'book', 'play', 'kind', 'team'];
  ok('five missions per strand, and nothing else', juniorTasks.length === strands.length * 5);
  for (const strand of strands) {
    ok(
      `five ${strand} missions`,
      juniorTasks.filter((task) => task.id.startsWith(`junior-${strand}-`)).length === 5,
    );
  }
  for (const task of juniorTasks) {
    const at = `${task.id}`;
    ok(`${at}: 6-9 only`, task.ageBands.length === 1 && task.ageBands[0] === '6-9');
    // "Bu yaşda tapşırıqlar 5–15 dəqiqəlik" — five to fifteen minutes, except
    // the team's screen free half hour, which is asked for as half an hour.
    ok(`${at}: five to fifteen minutes`, task.minutes >= 5 && task.minutes <= (task.id === 'junior-team-screenfree' ? 30 : 15));
    ok(`${at}: says how the phone checks it`, (task.checks ?? []).length > 0);
    ok(`${at}: no more steps than a list can hold`, (task.steps ?? []).length <= 4);
  }

  // A week long goal counts real missions, so its prefix has to match some.
  for (const task of taskLibrary) {
    const tally = flatChecks(checksFor(task)).find((check) => check.kind === 'tally');
    if (!tally || tally.kind !== 'tally') continue;
    ok(`${task.id}: a week goal asks for more than one mission`, tally.count >= 2);
    ok(
      `${task.id}: the missions it counts exist`,
      taskLibrary.filter((other) => other.id !== task.id && other.id.startsWith(tally.missions)).length >= tally.count,
    );
    // Without a grown up saying so, a week goal would be one tap for stars.
    ok(
      `${task.id}: a week goal needs a grown up`,
      flatChecks(checksFor(task)).some((check) => check.kind === 'grownup'),
    );
  }
}

section('the 10-13 curriculum is the one that was written');
{
  // Ten strands, five each, as supplied. 3.1-3.4 first, then 3.5-3.10.
  const strands = [
    'goal',
    'body',
    'project',
    'family',
    'read',
    'make',
    'talk',
    'screen',
    'calm',
    'team',
  ];
  ok('five challenges per strand, and nothing else', teenTasks.length === strands.length * 5);
  for (const strand of strands) {
    ok(
      `five ${strand} challenges`,
      teenTasks.filter((task) => task.id.startsWith(`teen-${strand}-`)).length === 5,
    );
  }

  /**
   * The ceiling on anything physical.
   *
   * "Yaşa uyğun limitlər" and no comparative ranking on health: nothing here
   * may ask for more than a short walk's worth of movement, and nothing may
   * escalate. The numbers are low on purpose; the app is not a fitness tracker
   * and a child chasing a rising target is the failure mode.
   */
  const MAX_STEPS = 1500;
  const MAX_ACTIVE_MINUTES = 12;

  for (const task of teenTasks) {
    const at = `${task.id}`;
    ok(`${at}: 10-13 only`, task.ageBands.length === 1 && task.ageBands[0] === '10-13');
    ok(`${at}: five to thirty minutes`, task.minutes >= 5 && task.minutes <= 30);
    ok(`${at}: says how the phone checks it`, (task.checks ?? []).length > 0);

    const rules = task.checks ?? [];
    for (const check of flatChecks(rules)) {
      if (check.kind === 'steps') ok(`${at}: step target stays in range`, check.count <= MAX_STEPS);
      if (check.kind === 'active') {
        ok(`${at}: movement target stays in range`, check.minutes <= MAX_ACTIVE_MINUTES);
      }
    }
    // A grown up is only in the loop where the activity is genuinely risky.
    const needsGrownup = flatChecks(rules).some((check) => check.kind === 'grownup');
    const optional = rules.every((rule) => rule.kind !== 'grownup');
    // Cooking is risky; running the family's screen free hour is the family's
    // to agree to; and giving away books that belong to the household needs a
    // real yes from the household. Everywhere else a grown up may sign a
    // challenge off but is never what it waits for.
    const NEEDS_A_GROWNUP = [
      'teen-project-cook',
      'teen-family-screenfree',
      'teen-team-books',
      // A week counted off the record, with nobody signing it, is one tap for
      // five missions' worth of stars.
      'teen-team-week',
    ];
    ok(
      `${at}: a grown up is only required where it has to be`,
      !needsGrownup || optional || NEEDS_A_GROWNUP.includes(task.id),
    );
  }
}

console.log(
  failures === 0
    ? `\n  the mission library holds (${checks} checks, ${taskLibrary.length} missions)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
