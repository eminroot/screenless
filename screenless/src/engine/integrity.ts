import type { Mission } from '../state/types';

/**
 * What the record says about a claim, for the parent about to approve it.
 *
 * Three signals, all of them computed from timestamps the runner already
 * writes down: a mission claimed impossibly fast, the same small job claimed
 * over and over in one day, and a run of confirmations closer together than
 * anyone could actually have done them.
 *
 * None of it blocks anything. The parent is the only thing in this app that
 * can award a star, and no client-side check is going to out-think a
 * determined nine year old with the phone in their hand — so the honest design
 * is to hand the parent what the record shows and let them decide, the same
 * way the photo labeller is a hint rather than a verdict.
 *
 * The thresholds are deliberately generous. A note that fires on an ordinary
 * tidy-up teaches a parent to tap past it, and then it catches nothing at all.
 */
export type IntegrityFlag = 'tooFast' | 'repeated' | 'burst';

export type IntegrityRead = {
  flags: IntegrityFlag[];
  /** Seconds the runner measured, or null when the child never pressed start. */
  spentSec: number | null;
  /** Seconds the mission asks for. */
  expectedSec: number;
  /** Times this same mission has already been confirmed today. */
  repeatsToday: number;
  /** Missions confirmed in the few minutes before this one. */
  recentConfirms: number;
};

/** Below a quarter of the stated time, and never more than this, is not real. */
const FAST_FRACTION = 0.25;
const FAST_CEILING_SEC = 90;

/** Confirming the same small job a third time in one day is worth a word. */
const REPEAT_LIMIT = 2;

/** Three confirmations inside this window is faster than anyone does chores. */
const BURST_WINDOW_SEC = 5 * 60;
const BURST_LIMIT = 2;

function at(value: string | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function sameDay(a: number, b: number): boolean {
  const one = new Date(a);
  const two = new Date(b);
  return (
    one.getFullYear() === two.getFullYear() &&
    one.getMonth() === two.getMonth() &&
    one.getDate() === two.getDate()
  );
}

/**
 * Reads one claim against the history behind it.
 *
 * `mission` is the one waiting to be confirmed; `history` is every mission,
 * including that one. `now` is passed in so this stays a pure function and the
 * tests can put the clock wherever they need it.
 */
export function readIntegrity(
  mission: Mission,
  history: Mission[],
  now: number = Date.now(),
): IntegrityRead {
  const expectedSec = Math.max(1, mission.task.minutes * 60);
  const spentSec = typeof mission.durationSec === 'number' ? mission.durationSec : null;
  const claimedAt = at(mission.claimedAt) ?? now;

  const flags: IntegrityFlag[] = [];

  // 1. Impossibly fast. A missing duration says nothing — a child who did the
  //    job and forgot to press start is the ordinary case, not a suspect.
  if (spentSec !== null) {
    const floor = Math.min(expectedSec * FAST_FRACTION, FAST_CEILING_SEC);
    if (spentSec < floor) flags.push('tooFast');
  }

  // 2. The same job, again and again. Counted on confirmations rather than
  //    claims, because a claim the parent already refused should not be held
  //    against the child a second time.
  let repeatsToday = 0;
  for (const other of history) {
    if (other.id === mission.id) continue;
    if (other.task.id !== mission.task.id) continue;
    if (other.status !== 'done') continue;
    const done = at(other.confirmedAt);
    if (done !== null && sameDay(done, claimedAt)) repeatsToday += 1;
  }
  if (repeatsToday >= REPEAT_LIMIT) flags.push('repeated');

  // 3. A run of confirmations too close together to have been earned. This is
  //    the one that catches a parent handing the phone over and being asked to
  //    tap yes six times, which is how the whole thing quietly stops meaning
  //    anything.
  let recentConfirms = 0;
  for (const other of history) {
    if (other.id === mission.id) continue;
    if (other.status !== 'done') continue;
    const done = at(other.confirmedAt);
    if (done === null) continue;
    if (done <= claimedAt && claimedAt - done <= BURST_WINDOW_SEC * 1000) recentConfirms += 1;
  }
  if (recentConfirms >= BURST_LIMIT) flags.push('burst');

  return { flags, spentSec, expectedSec, repeatsToday, recentConfirms };
}

/** Whole minutes, rounded up, for the note the parent reads. */
export function minutesOf(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}
