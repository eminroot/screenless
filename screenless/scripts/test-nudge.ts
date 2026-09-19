/**
 * Drives the screen time reminders under plain Node.
 *
 * The reminders are the half of Screen Guard that fires dozens of times a week
 * rather than once, so they are the half a family actually experiences. Every
 * decision about them lives in `src/guard/nudge.ts` and this walks whole days
 * through it a minute at a time, which is the only way to catch the two bugs
 * this feature attracts: the same reminder firing twice, and four of them
 * arriving at once after the phone has been in a drawer.
 *
 * Run with: npm run test:nudge
 */
import { setDeviceUsage, setUsage } from '../src/guard/budget';
import {
  creditNudge,
  markNudged,
  nextNudge,
  nudgeCopyId,
  pendingCheckpoints,
  plannedNudges,
  recordNudge,
  suggestionFor,
  wasHeeded,
  type Nudge,
} from '../src/guard/nudge';
import { nudgeText, renderNudgeList } from '../src/guard/nudge-copy';
import { defaultGuardConfig, emptyGuardDay, type GuardConfig, type GuardDay } from '../src/guard/types';
import { az } from '../src/i18n/locales/az';
import { en } from '../src/i18n/locales/en';
import { tr } from '../src/i18n/locales/tr';
import type { TKey, TVars } from '../src/i18n/shape';
import type { Language } from '../src/i18n/types';
import type { AgeBand } from '../src/state/types';

let failures = 0;
let checks = 0;

function ok(label: string, condition: boolean): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

const MIN = 60;
const NOON = 12 * 60;

function config(patch: Partial<GuardConfig> = {}): GuardConfig {
  return {
    ...defaultGuardConfig,
    enabled: true,
    tier: 'notice',
    dailyBudgetMin: 120,
    nudgeEveryMin: 30,
    watched: ['com.example.app'],
    ...patch,
  };
}

function day(patch: Partial<GuardDay> = {}): GuardDay {
  return { ...emptyGuardDay('2026-09-19'), ...patch };
}

/** Minutes of use, as the native watcher would report them. */
function used(minutes: number, patch: Partial<GuardDay> = {}): GuardDay {
  return { ...day(patch), usedSec: minutes * MIN };
}

/**
 * Runs a whole day through the engine the way the app does: measure, ask,
 * deliver, record. Returns every nudge that went out.
 */
function walkDay(
  cfg: GuardConfig,
  minutesOfUse: number,
  options: { stepMin?: number; minuteOfDay?: number; from?: GuardDay } = {},
): { nudges: Nudge[]; day: GuardDay } {
  const step = options.stepMin ?? 1;
  let state = options.from ?? day();
  const nudges: Nudge[] = [];

  for (let minute = step; minute <= minutesOfUse; minute += step) {
    state = setUsage(state, minute * MIN);
    // The app asks once per tick and delivers at most one.
    const nudge = nextNudge(cfg, state, options.minuteOfDay ?? NOON);
    if (nudge) {
      nudges.push(nudge);
      state = recordNudge(state, nudge, minute * 60_000, cfg.nudgeEveryMin);
    }
  }

  return { nudges, day: state };
}

/* -------------------------------------------------------------- intervals */

section('interval checkpoints');
{
  const cfg = config({ nudgeEveryMin: 30, dailyBudgetMin: 0 });
  ok('nothing before the first interval', pendingCheckpoints(cfg, used(29)).length === 0);
  ok('one on the dot', pendingCheckpoints(cfg, used(30)).join() === '30');
  ok('still one at 59 minutes', pendingCheckpoints(cfg, used(59)).join() === '30');
  ok('two by the hour', pendingCheckpoints(cfg, used(60)).join() === '30,60');
  ok(
    'an announced one does not come back',
    pendingCheckpoints(cfg, used(60, { nudgedMin: [30] })).join() === '60',
  );
}

section('an interval that is off, or too short to be sane');
{
  ok('zero means no reminders', pendingCheckpoints(config({ nudgeEveryMin: 0 }), used(200)).length === 0);
  ok('under five minutes is refused', pendingCheckpoints(config({ nudgeEveryMin: 3 }), used(200)).length === 0);
  ok('five is the floor and it works', pendingCheckpoints(config({ nudgeEveryMin: 5 }), used(10)).join() === '5,10');
}

section('a phone that was in a drawer owes one reminder, not four');
{
  const cfg = config({ nudgeEveryMin: 15, dailyBudgetMin: 0 });
  // Two hours of use appear in a single tick, as they do when the app is
  // reopened after the watcher has been counting in the background.
  const state = setUsage(day(), 120 * MIN);
  const nudge = nextNudge(cfg, state, NOON);
  ok('one nudge, not eight', nudge !== null && nudge.kind === 'checkpoint');
  ok('and it is the latest checkpoint', nudge?.atMin === 120);

  const after = recordNudge(state, nudge!, 0, cfg.nudgeEveryMin);
  ok('every skipped checkpoint is settled', pendingCheckpoints(cfg, after).length === 0);
  ok('it counts as one reminder', after.nudgeCount === 1);
}

/* ------------------------------------------------------------- thresholds */

section('thresholds outrank intervals');
{
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  // 90 minutes is both a checkpoint and three quarters of the budget.
  const nudge = nextNudge(cfg, used(90), NOON);
  ok('the threshold wins', nudge?.kind === 'approaching');
  ok('and it knows how long is left', nudge?.leftMin === 30);

  const after = recordNudge(used(90), nudge!, 0, cfg.nudgeEveryMin);
  ok('the interval it landed on is settled too', pendingCheckpoints(cfg, after).length === 0);
}

section('a whole day, minute by minute');
{
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  const { nudges } = walkDay(cfg, 150);
  const kinds = nudges.map((n) => `${n.atMin}:${n.kind}`).join(' ');
  ok(`four reminders across 150 minutes (${kinds})`, nudges.length === 4);
  ok('30 and 60 are plain checkpoints', nudges[0].kind === 'checkpoint' && nudges[1].kind === 'checkpoint');
  ok('90 is the three quarter warning', nudges[2].kind === 'approaching');
  ok('120 is the budget running out', nudges[3].kind === 'spent');
  // Half an hour over the limit is another checkpoint, and it stays quiet.
  ok('nothing fires once the budget is gone', nudges.every((n) => n.atMin <= 120));
}

section('the same day walked twice never repeats itself');
{
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  const first = walkDay(cfg, 150);
  const second = walkDay(cfg, 150, { from: first.day });
  ok('a second pass is silent', second.nudges.length === 0);
}

section('reminders without a limit');
{
  // A family that wants the taps on the shoulder and nothing else.
  const cfg = config({ tier: 'off', dailyBudgetMin: 0, nudgeEveryMin: 60 });
  const { nudges } = walkDay(cfg, 180);
  ok('checkpoints still fire with no budget', nudges.length === 3);
  ok('they are all plain checkpoints', nudges.every((n) => n.kind === 'checkpoint'));
  ok('and they admit there is no budget', nudges[0].leftMin === null && nudges[0].budgetMin === null);
}

section('the whole feature switched off');
{
  const cfg = config({ enabled: false });
  ok('nothing fires', nextNudge(cfg, used(200), NOON) === null);
}

/* ----------------------------------------------------------------- curfew */

section('curfew');
{
  const cfg = config({ curfew: { startMin: 21 * 60, endMin: 7 * 60 }, nudgeEveryMin: 30 });
  const nudge = nextNudge(cfg, used(10), 22 * 60);
  ok('inside the window it says so', nudge?.kind === 'curfew');
  ok('and does not claim the budget ran out', nudge?.leftMin === 110);

  const after = recordNudge(used(10), nudge!, 0, cfg.nudgeEveryMin);
  ok('it only fires once a day', nextNudge(cfg, after, 22 * 60)?.kind !== 'curfew');
  ok('outside the window it is quiet', nextNudge(cfg, used(10), 15 * 60) === null);
}

/* ------------------------------------------------------------------- copy */

section('the three tiers say different things');
{
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  const nudge = nextNudge(cfg, used(30), NOON)!;
  ok('3-5 gets the little copy', nudgeCopyId('3-5', nudge) === 'littleCheckpoint');
  ok('6-9 gets the junior copy', nudgeCopyId('6-9', nudge) === 'juniorCheckpoint');
  ok('10-13 gets the teen copy', nudgeCopyId('10-13', nudge) === 'teenCheckpoint');
}

section('a checkpoint near the end reads as a warning');
{
  const cfg = config({ dailyBudgetMin: 200, nudgeEveryMin: 30 });
  // 180 of 200 is 90%: an ordinary interval, arriving far too late in the day
  // to be chatty about. The three quarter warning has already gone out.
  const late = nextNudge(cfg, used(180, { noticed: [0.75] }), NOON)!;
  ok('it is still a checkpoint underneath', late.kind === 'checkpoint');
  ok('but it is written as a warning', nudgeCopyId('6-9', late) === 'juniorApproaching');

  const early = nextNudge(cfg, used(30), NOON)!;
  ok('an early one is not', nudgeCopyId('6-9', early) === 'juniorCheckpoint');
}

section('suggestions rotate rather than repeat');
{
  const d = day();
  const run = [0, 1, 2, 3, 4, 5].map((i) => suggestionFor(d, i));
  ok('six in a row are all different', new Set(run).size === 6);
  ok('it is stable for the same day and index', suggestionFor(d, 2) === suggestionFor(d, 2));
  ok(
    'a different day starts somewhere else',
    suggestionFor(day({ date: '2026-09-20' }), 0) !== suggestionFor(d, 0),
  );
}

section('a real day never offers the same thing twice running');
{
  const cfg = config({ dailyBudgetMin: 240, nudgeEveryMin: 30 });
  const { nudges } = walkDay(cfg, 240);
  let repeated = false;
  for (let i = 1; i < nudges.length; i += 1) {
    if (nudges[i].suggestion === nudges[i - 1].suggestion) repeated = true;
  }
  ok(`${nudges.length} reminders, none repeating (${nudges.map((n) => n.suggestion).join(', ')})`, !repeated);
}

/* ------------------------------------------------------------- did it work */

section('crediting a reminder that worked');
{
  const at = 1_000_000;
  ok('a mission two minutes later counts', wasHeeded(at, at + 2 * 60_000));
  ok('fourteen minutes still counts', wasHeeded(at, at + 14 * 60_000));
  ok('twenty minutes does not', !wasHeeded(at, at + 20 * 60_000));
  ok('a mission before the nudge does not', !wasHeeded(at, at - 60_000));

  const nudged = { ...day(), lastNudgeAt: at, nudgeCount: 1 };
  const credited = creditNudge(nudged, at + 60_000);
  ok('the credit lands', credited.nudgeHeeded === 1);
  const again = creditNudge(credited, at + 120_000);
  ok('a second mission does not double count it', again.nudgeHeeded === 1);
  ok('a day with no nudge credits nothing', creditNudge(day(), at).nudgeHeeded === 0);
}

/* ------------------------------------------------------------ device time */

section('whole-device screen time');
{
  const fresh = setDeviceUsage(day(), 3600);
  ok('it records', fresh.deviceSec === 3600);
  ok('it never falls', setDeviceUsage(fresh, 60).deviceSec === 3600);
  ok('it is separate from the watched apps', fresh.usedSec === 0);
  ok('a negative reading is ignored', setDeviceUsage(fresh, -5).deviceSec === 3600);
}

/* ------------------------------------------------------------------ marks */

section('marking');
{
  const marked = markNudged(day(), 90, 30);
  ok('every step up to the mark is set', marked.nudgedMin.join() === '30,60,90');
  ok('marking again is stable', markNudged(marked, 90, 30).nudgedMin.join() === '30,60,90');
  ok('an off interval marks nothing', markNudged(day(), 90, 0).nudgedMin.length === 0);
}


/* ------------------------------------------------------------------- copy */

/**
 * The real `t`, reading the real bundles.
 *
 * Worth the twenty lines. The notification is the only part of this feature
 * most families will ever see, it is written in three languages for three age
 * bands, and a broken interpolation in Azerbaijani would otherwise be found
 * by a child rather than by a build.
 */
const BUNDLES: Record<Language, Record<string, Record<string, string>>> = {
  en: en as never,
  tr: tr as never,
  az: az as never,
};

function translator(language: Language) {
  return (key: TKey, vars?: TVars): string => {
    const [group, leaf] = key.split('.');
    const template = BUNDLES[language]?.[group]?.[leaf];
    if (typeof template !== 'string') return `MISSING:${key}`;
    if (!vars) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (whole, name: string) =>
      vars[name] === undefined ? whole : String(vars[name]),
    );
  };
}

section('every reminder is a finished sentence, in every language');
{
  const languages: Language[] = ['en', 'tr', 'az'];
  const bands: AgeBand[] = ['3-5', '6-9', '10-13'];
  const setups: [string, GuardConfig][] = [
    ['with a limit', config({ dailyBudgetMin: 120, nudgeEveryMin: 30 })],
    ['reminders only', config({ tier: 'off', dailyBudgetMin: 0, nudgeEveryMin: 30 })],
    ['with a curfew', config({ curfew: { startMin: 21 * 60, endMin: 7 * 60 }, nudgeEveryMin: 30 })],
  ];

  let rendered = 0;
  const broken: string[] = [];

  for (const language of languages) {
    const t = translator(language);
    for (const band of bands) {
      for (const [name, cfg] of setups) {
        const all = [...plannedNudges(cfg, day(), 12)];
        const curfew = nextNudge(cfg, used(10), 22 * 60);
        if (curfew) all.push(curfew);

        for (const nudge of all) {
          const text = nudgeText(t, band, 'Tilki', nudge);
          rendered += 2;
          const where = `${language}/${band}/${name}/${nudge.kind}@${nudge.atMin}`;
          if (text.title.includes('MISSING:') || text.body.includes('MISSING:')) {
            broken.push(`${where} missing key`);
          }
          if (text.title.includes('{{') || text.body.includes('{{')) {
            broken.push(`${where} unfilled token`);
          }
          if (text.title.trim().length < 3 || text.body.trim().length < 3) {
            broken.push(`${where} empty`);
          }
        }
      }
    }
  }

  ok(`${rendered} lines rendered across three languages`, rendered > 300);
  ok(
    broken.length === 0
      ? 'no missing keys, no unfilled tokens, nothing empty'
      : broken.slice(0, 3).join(' | '),
    broken.length === 0,
  );
}

section('the three tiers really do say different things');
{
  const t = translator('en');
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  const nudge = nextNudge(cfg, used(30), NOON)!;
  const little = nudgeText(t, '3-5', 'Tilki', nudge);
  const junior = nudgeText(t, '6-9', 'Tilki', nudge);
  const teen = nudgeText(t, '10-13', 'Tilki', nudge);

  ok('all three differ', new Set([little.title, junior.title, teen.title]).size === 3);
  ok('the 3-5 line names the buddy', little.title.includes('Tilki'));
  // A four year old has no concept of a daily budget and cannot read this
  // anyway; the notification is really aimed at the adult holding the phone.
  ok('and carries no numbers at all', !/\d/.test(little.title) && !/\d/.test(little.body));
  ok('the 6-9 line says how long is left', junior.body.includes('90'));
  ok('the 10-13 line is the figure and nothing else', teen.title === '30 of 120 min');
  ok('none of them shouts', ![little, junior, teen].every((x) => x.title.includes('!')));
}

section('the list handed down to the watcher');
{
  const t = translator('tr');
  const cfg = config({ dailyBudgetMin: 120, nudgeEveryMin: 30 });
  const planned = plannedNudges(cfg, day(), 24);
  const list = renderNudgeList(t, '6-9', 'Tilki', planned);

  ok('one entry per checkpoint up to the limit', planned.length === 4);
  ok('titles and bodies line up', list.titles.length === list.bodies.length);
  ok('nothing is blank', list.titles.every((line) => line.trim().length > 0));
  ok('it is written in Turkish', list.titles[0].includes('dakika'));
  ok('and it ends at the limit', planned[planned.length - 1].kind === 'spent');
}

console.log(
  failures === 0
    ? `\n  the reminders behave (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
