import type { Inbox, NoteReply } from '../state/types';

/**
 * The rules for what a grown up sent, kept away from React so they can be
 * tested.
 *
 * This is a small state machine with four moves — something arrives, the child
 * answers, the child accepts, the hub confirms — and every one of them has an
 * edge that only shows up after a parent changes their mind. Both of the bugs
 * this module was extracted to fix were in that category, and neither was
 * visible from reading the reducer inline.
 *
 * ## What is owed, and to whom
 *
 * The child's phone holds two debts: a mission it accepted and a reply it
 * tapped. Both are written down locally the instant the child acts, so tapping
 * in a tunnel works, and both are cleared only once the hub has been *told* —
 * which is not the same as the hub having *agreed*. See `settle`.
 */

export type Incoming = {
  /** What the hub is holding for this child, or null when it holds nothing. */
  assignment: { taskId: string; assignedAt: string } | null;
  note: { id: string; text: string; at: string } | null;
};

/** The ids this phone sent up, so `settle` knows what it was asking about. */
export type AckSent = { tookTaskId?: string; noteId?: string };

/**
 * Folds what the hub is holding into what this phone is showing.
 *
 * Two rules, and the second one is the bug this module exists for.
 *
 * **Null means gone.** Whatever the hub sends is the whole truth about what it
 * holds, so a null clears the card. The earlier version fell back to the local
 * value when the incoming one was null, which meant a parent could assign a
 * mission but never withdraw it: the card sat on the child's home screen for
 * the life of the install, and tapping it accepted something the parent had
 * already taken back.
 *
 * **Except what is still in flight.** An item this phone has acted on but not
 * yet reported is held out, because the hub will keep sending it until the
 * acknowledgement lands and re-showing it would undo the child's own tap in
 * front of them.
 */
export function receive(inbox: Inbox, incoming: Incoming): Inbox {
  const assignment = inbox.assignment?.source === 'local'
    ? inbox.assignment
    : incoming.assignment && incoming.assignment.taskId !== inbox.pendingTook
      ? { ...incoming.assignment, source: 'hub' as const }
      : null;

  const note = inbox.note?.source === 'local'
    ? inbox.note
    : incoming.note && incoming.note.id !== inbox.pendingReply?.id
      ? { ...incoming.note, source: 'hub' as const }
      : null;

  if (same(assignment, inbox.assignment) && same(note, inbox.note)) return inbox;
  return { ...inbox, assignment, note };
}

/**
 * A grown up picked something on this phone rather than on their own.
 *
 * The common case, not the fallback: most families have one phone between
 * them, and a parent who is in the room should not have to install a second
 * app and make an account to hand their child a mission. It writes into the
 * same two slots, so all three child tiers draw it with the code they already
 * have, and it is marked `local` so a hub sync cannot quietly delete it.
 *
 * It replaces whatever is in the slot, including something from the hub. The
 * person holding the phone wins.
 */
export function sendMission(inbox: Inbox, taskId: string, at: string): Inbox {
  return { ...inbox, assignment: { taskId, assignedAt: at, source: 'local' } };
}

export function sendNote(inbox: Inbox, id: string, text: string, at: string): Inbox {
  return { ...inbox, note: { id, text, at, source: 'local' } };
}

/** Takes back whatever a grown up left here, from either source. */
export function withdraw(inbox: Inbox, what: 'mission' | 'note'): Inbox {
  return what === 'mission' ? { ...inbox, assignment: null } : { ...inbox, note: null };
}

/** Identity for the two card shapes, so an unchanged sync costs no render. */
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * The child tapped one of the four replies.
 *
 * The note leaves the screen at once and the answer is parked for the next
 * sync. A reply tapped while a previous one is still unsent replaces it: there
 * is only ever one open note, so there can only ever be one answer owed.
 */
export function answer(inbox: Inbox, reply: NoteReply): Inbox {
  if (!inbox.note) return inbox;
  // A note left on this phone owes nobody an answer over the network: the
  // person who wrote it is in the room. Only a hub note becomes a debt.
  if (inbox.note.source === 'local') return { ...inbox, note: null };
  return { ...inbox, note: null, pendingReply: { id: inbox.note.id, reply } };
}

/** The child accepted the mission. Same offline handling as a reply. */
export function take(inbox: Inbox): Inbox {
  if (!inbox.assignment) return inbox;
  if (inbox.assignment.source === 'local') return { ...inbox, assignment: null };
  return { ...inbox, assignment: null, pendingTook: inbox.assignment.taskId };
}

/** Whether anything is owed to the hub. */
export function owes(inbox: Inbox): boolean {
  return Boolean(inbox.pendingTook || inbox.pendingReply);
}

/** What to put in the acknowledgement, or null when nothing is owed. */
export function ackBody(inbox: Inbox): { tookTaskId?: string; note?: { id: string; reply: NoteReply } } | null {
  if (!owes(inbox)) return null;
  return {
    ...(inbox.pendingTook ? { tookTaskId: inbox.pendingTook } : {}),
    ...(inbox.pendingReply ? { note: inbox.pendingReply } : {}),
  };
}

/**
 * The hub answered the acknowledgement, so the debt is paid.
 *
 * **Paid, not agreed.** The hub replies `took: false` when the mission it was
 * told about is not the one it is holding — the parent replaced it, or
 * withdrew it, or the phone already reported this and the retry is a duplicate.
 * None of those are reasons to keep asking. The earlier version cleared the
 * debt only on `true`, so a child who accepted a mission their parent had
 * since changed re-sent the same acknowledgement every ten minutes for ever,
 * and the hub answered `false` every time.
 *
 * Keyed on what was actually sent rather than on a flag, so a reply the child
 * tapped while the request was in the air is not swallowed by the response to
 * the one before it.
 */
export function settle(inbox: Inbox, sent: AckSent): Inbox {
  const pendingTook = sent.tookTaskId === inbox.pendingTook ? null : inbox.pendingTook;
  const pendingReply = sent.noteId === inbox.pendingReply?.id ? null : inbox.pendingReply;

  if (pendingTook === inbox.pendingTook && pendingReply === inbox.pendingReply) return inbox;
  return { ...inbox, pendingTook, pendingReply };
}
