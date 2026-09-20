import { useCallback, useMemo } from 'react';

import { taskById } from '../data/tasks';
import { useApp } from '../state/app-state';
import type { NoteReply, TaskContent } from '../state/types';

/**
 * What a grown up sent from the parent app, ready for a screen to draw.
 *
 * All three child tiers show this, and they look nothing like one another, so
 * the logic is here and only the drawing is repeated. A tier renders whatever
 * of `note` and `mission` is not null, in its own language of cards and
 * buttons, and calls `answer` or `take`.
 *
 * ## The mission is looked up, not received
 *
 * The hub sends a library key. This resolves it against the library already on
 * the phone, which is what keeps the mission text off the server and in the
 * child's own language. A key this build does not know — an older app, a
 * mission pulled from a later release — resolves to null and the card simply
 * does not appear, which is the right failure: better nothing than a card
 * saying "unknown mission".
 *
 * ## Why `take` assigns rather than starts
 *
 * Accepting puts the mission where the child's own missions go and leaves them
 * to start it. A parent picking something should not be able to take over the
 * screen a child is looking at, and a mission that launched itself would be
 * exactly that.
 */
export type GrownUpInbox = {
  /** The line a parent typed, or null when there is nothing to read. */
  note: { id: string; text: string; at: string } | null;
  /** The mission a parent picked, resolved against this phone's library. */
  mission: TaskContent | null;
  /** True while a link exists at all; screens can skip the whole block on false. */
  linked: boolean;
  /** Tap one of the four replies. The note leaves the screen at once. */
  answer: (reply: NoteReply) => void;
  /** Accept the mission. It joins the child's own list; it does not start. */
  take: () => void;
};

export function useInbox(): GrownUpInbox {
  const { data, answerNote, takeAssignment, assignMission } = useApp();
  const { inbox, hub } = data;

  const mission = useMemo(() => {
    if (!inbox.assignment) return null;
    return taskById.get(inbox.assignment.taskId) ?? null;
  }, [inbox.assignment]);

  const take = useCallback(() => {
    // Ordered so a failed lookup cannot silently swallow the assignment: the
    // card stays until there is a real mission to show for it.
    if (!mission) return;
    assignMission(mission);
    takeAssignment();
  }, [mission, assignMission, takeAssignment]);

  return {
    note: inbox.note,
    mission,
    linked: Boolean(hub),
    answer: answerNote,
    take,
  };
}
