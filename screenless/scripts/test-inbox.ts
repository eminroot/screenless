/**
 * What a grown up sent, and what the phone owes back.
 *
 * Written after two bugs shipped in this logic, both of the same shape: they
 * only appear once a parent changes their mind. A first assignment works, a
 * first note works, and the demo looks fine. Withdraw one and the card is
 * stuck; replace one and the phone argues with the hub every ten minutes for
 * the life of the install.
 *
 * Run with: npm run test:inbox
 */
import {
  ackBody,
  answer,
  owes,
  receive,
  sendMission,
  sendNote,
  settle,
  take,
  withdraw,
  type Incoming,
} from '../src/inbox/inbox';
import { emptyInbox, type Inbox } from '../src/state/types';

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

function inbox(patch: Partial<Inbox> = {}): Inbox {
  return { ...emptyInbox, ...patch };
}

const MISSION = { taskId: 'little-colour-hunt', assignedAt: '2026-09-20T09:00:00.000Z' };
const OTHER = { taskId: 'little-shape-walk', assignedAt: '2026-09-20T11:00:00.000Z' };
const NOTE = { id: 'not_1', text: 'Pick your socks up please', at: '2026-09-20T09:00:00.000Z' };
const NOTE2 = { id: 'not_2', text: 'Grandma is coming at four', at: '2026-09-20T11:00:00.000Z' };

const NOTHING: Incoming = { assignment: null, note: null };

/* ---------------------------------------------------------------- arriving */

section('something arrives');
{
  const after = receive(inbox(), { assignment: MISSION, note: NOTE });
  ok('the mission lands', after.assignment?.taskId === MISSION.taskId);
  ok('the note lands', after.note?.id === NOTE.id);
  ok('nothing is owed yet', !owes(after));
}

section('the same sync twice changes nothing');
{
  const first = receive(inbox(), { assignment: MISSION, note: NOTE });
  const second = receive(first, { assignment: MISSION, note: NOTE });
  // Identity, not equality: this runs on every foreground and a new object
  // each time would re-render three home screens for no reason.
  ok('the same object comes back', second === first);
}

section('a parent replaces the mission');
{
  const first = receive(inbox(), { assignment: MISSION, note: null });
  const second = receive(first, { assignment: OTHER, note: null });
  ok('the new one shows', second.assignment?.taskId === OTHER.taskId);
  ok('the old one is gone', second.assignment?.taskId !== MISSION.taskId);
}

section('a parent withdraws the mission');
{
  // The bug this file was written for. The hub says it holds nothing; the
  // card has to go. It used to sit there for the life of the install, and
  // tapping it accepted something the parent had already taken back.
  const holding = receive(inbox(), { assignment: MISSION, note: NOTE });
  const after = receive(holding, NOTHING);
  ok('the mission card clears', after.assignment === null);
  ok('the note clears too', after.note === null);
}

section('a second note replaces an unanswered first');
{
  const first = receive(inbox(), { assignment: null, note: NOTE });
  const second = receive(first, { assignment: null, note: NOTE2 });
  ok('the newer note wins', second.note?.id === NOTE2.id);
}

/* ------------------------------------------------------------ the child acts */

section('the child accepts the mission');
{
  const holding = receive(inbox(), { assignment: MISSION, note: null });
  const after = take(holding);
  ok('the card leaves the screen at once', after.assignment === null);
  ok('the debt is written down', after.pendingTook === MISSION.taskId);
  ok('something is owed', owes(after));
  const empty = inbox();
  ok('taking nothing is a no-op', take(empty) === empty);
}

section('the child taps a reply');
{
  const holding = receive(inbox(), { assignment: null, note: NOTE });
  const after = answer(holding, 'later');
  ok('the note leaves the screen', after.note === null);
  ok('the reply is written down', after.pendingReply?.reply === 'later');
  ok('against the right note', after.pendingReply?.id === NOTE.id);
  const empty = inbox();
  ok('answering nothing is a no-op', answer(empty, 'ok') === empty);
}

section('the hub keeps sending until it is told');
{
  // The hub has no way to know the child tapped. It goes on offering the
  // mission on every sync, and re-showing it would undo the tap in front of
  // the child.
  const taken = take(receive(inbox(), { assignment: MISSION, note: null }));
  const after = receive(taken, { assignment: MISSION, note: null });
  ok('the accepted mission does not come back', after.assignment === null);
  ok('and the debt survives the sync', after.pendingTook === MISSION.taskId);

  const answered = answer(receive(inbox(), { assignment: null, note: NOTE }), 'ok');
  const again = receive(answered, { assignment: null, note: NOTE });
  ok('the answered note does not come back', again.note === null);
}

section('but a different one still gets through');
{
  const taken = take(receive(inbox(), { assignment: MISSION, note: null }));
  const after = receive(taken, { assignment: OTHER, note: NOTE2 });
  ok('a new mission shows even with a debt outstanding', after.assignment?.taskId === OTHER.taskId);
  ok('so does a new note', after.note?.id === NOTE2.id);
}

/* ------------------------------------------------------------- settling up */

section('what goes in the acknowledgement');
{
  ok('nothing owed, nothing sent', ackBody(inbox()) === null);

  const taken = take(receive(inbox(), { assignment: MISSION, note: null }));
  ok('a taken mission', ackBody(taken)?.tookTaskId === MISSION.taskId);

  const both = answer(receive(taken, { assignment: null, note: NOTE }), 'done');
  const body = ackBody(both);
  ok('both at once', body?.tookTaskId === MISSION.taskId && body?.note?.id === NOTE.id);
  ok('and the reply itself', body?.note?.reply === 'done');
}

section('the hub confirms');
{
  const taken = take(receive(inbox(), { assignment: MISSION, note: null }));
  const after = settle(taken, { tookTaskId: MISSION.taskId });
  ok('the debt is cleared', after.pendingTook === null);
  ok('and nothing is owed', !owes(after));
}

section('the hub refuses, and that still counts as heard');
{
  // The second bug. The hub answers "no" when the mission it was told about
  // is not the one it holds: the parent replaced it, or withdrew it, or this
  // is a duplicate of an acknowledgement that already landed. None of those
  // is a reason to ask again, and the old code kept the debt open on a
  // refusal — so the phone re-sent the same thing every ten minutes for ever.
  const stale = inbox({ pendingTook: MISSION.taskId });
  const after = settle(stale, { tookTaskId: MISSION.taskId });
  ok('the debt is dropped anyway', after.pendingTook === null);
  ok('so the phone stops asking', !owes(after));
}

section('a reply tapped while the request was in the air is kept');
{
  // The phone sent an answer to note 1. Before the response came back the
  // child answered note 2. Settling the first must not swallow the second.
  const inFlight = inbox({ pendingReply: { id: NOTE.id, reply: 'ok' } });
  const raced = answer(receive(inFlight, { assignment: null, note: NOTE2 }), 'later');
  const after = settle(raced, { noteId: NOTE.id });
  ok('the newer reply survives', after.pendingReply?.id === NOTE2.id);
  ok('and keeps its own answer', after.pendingReply?.reply === 'later');
}

section('settling something that was never owed');
{
  const clean = inbox();
  ok('changes nothing', settle(clean, { tookTaskId: 'whatever' }) === clean);
  const other = inbox({ pendingTook: OTHER.taskId });
  ok('and leaves an unrelated debt alone', settle(other, { tookTaskId: MISSION.taskId }).pendingTook === OTHER.taskId);
}

/* ------------------------------------------------------ the whole round trip */

section('a full exchange, start to finish');
{
  let state = inbox();

  // The parent writes a note and picks a mission.
  state = receive(state, { assignment: MISSION, note: NOTE });
  ok('both cards are up', Boolean(state.assignment && state.note));

  // The child answers and accepts, on a train with no signal.
  state = answer(state, 'ok');
  state = take(state);
  ok('the screen is clear', !state.assignment && !state.note);
  ok('both debts are held', state.pendingTook !== null && state.pendingReply !== null);

  // A sync happens before the acknowledgement goes out. The hub, which knows
  // nothing yet, offers both again.
  state = receive(state, { assignment: MISSION, note: NOTE });
  ok('neither comes back', !state.assignment && !state.note);

  // The acknowledgement lands.
  const body = ackBody(state)!;
  state = settle(state, { tookTaskId: body.tookTaskId, noteId: body.note?.id });
  ok('the phone owes nothing', !owes(state));

  // The hub now holds nothing, and says so.
  state = receive(state, NOTHING);
  ok('and the inbox is empty', JSON.stringify(state) === JSON.stringify(emptyInbox));
}


/* ------------------------------------------------ one phone, no second app */

section('a grown up picks something on this phone');
{
  // The common case rather than the fallback: most families share a device.
  const after = sendMission(inbox(), MISSION.taskId, MISSION.assignedAt);
  ok('the card is up', after.assignment?.taskId === MISSION.taskId);
  ok('and it is marked local', after.assignment?.source === 'local');
  ok('nothing is owed to anybody', !owes(after));
}

section('a local mission is accepted');
{
  const after = take(sendMission(inbox(), MISSION.taskId, MISSION.assignedAt));
  ok('the card leaves', after.assignment === null);
  // Nothing to tell: the person who set it is in the room.
  ok('and no debt is created', after.pendingTook === null);
  ok('so no acknowledgement is sent', ackBody(after) === null);
}

section('a local note is answered');
{
  const after = answer(sendNote(inbox(), 'loc_1', 'Tidy your room', NOTE.at), 'ok');
  ok('the note leaves', after.note === null);
  ok('and owes nothing', after.pendingReply === null);
}

section('a hub sync cannot delete what a grown up left here');
{
  // The trap this source flag exists for. The hub holds nothing, says so, and
  // without the flag it would wipe a note written on this phone a second ago.
  const local = sendNote(sendMission(inbox(), MISSION.taskId, MISSION.assignedAt), 'loc_1', 'Back by six', NOTE.at);
  const after = receive(local, NOTHING);
  ok('the local mission survives', after.assignment?.taskId === MISSION.taskId);
  ok('the local note survives', after.note?.id === 'loc_1');

  const pushed = receive(local, { assignment: OTHER, note: NOTE2 });
  ok('and the hub does not overwrite it either', pushed.assignment?.taskId === MISSION.taskId);
  ok('nor the note', pushed.note?.id === 'loc_1');
}

section('the person holding the phone wins');
{
  const fromHub = receive(inbox(), { assignment: MISSION, note: NOTE });
  const over = sendMission(fromHub, OTHER.taskId, OTHER.assignedAt);
  ok('a local pick replaces the hub one', over.assignment?.taskId === OTHER.taskId);
  ok('and takes over the slot', over.assignment?.source === 'local');
}

section('taking something back');
{
  const both = sendNote(sendMission(inbox(), MISSION.taskId, MISSION.assignedAt), 'loc_1', 'x', NOTE.at);
  ok('the mission goes', withdraw(both, 'mission').assignment === null);
  ok('the note stays', withdraw(both, 'mission').note?.id === 'loc_1');
  ok('and the other way round', withdraw(both, 'note').assignment?.taskId === MISSION.taskId);
}

console.log(
  failures === 0
    ? `\n  the inbox holds (${checks} checks)\n`
    : `\n  ${failures} of ${checks} checks FAILED\n`,
);
process.exit(failures === 0 ? 0 : 1);
