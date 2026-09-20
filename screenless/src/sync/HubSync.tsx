import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';

import { ackBody } from '../inbox/inbox';
import { useApp } from '../state/app-state';
import { fetchConfig, sendAck, sendReport } from './api';
import { isHubConfigured } from './config';
import { applyLimits, limitsDiffer } from './limits';
import { buildReport, hasSomethingToSend, signatureOf } from './report';
import { isDue } from './schedule';

/**
 * Keeps the parent's dashboard up to date with this phone.
 *
 * Renders nothing. Does nothing at all unless a grown up has linked the phone:
 * with no `data.hub` there is no token, no timer is ever set and no request is
 * made. That is the default and it stays a fully working app.
 *
 * Runs on the way back to the foreground and on the way out, which between
 * them cover every moment worth sending: a child finishing a mission opens the
 * app, and a child putting the phone down leaves it.
 *
 * ## What it does in each direction
 *
 * **Down**: the limits a parent set, plus anything they sent from their own
 * phone — a mission picked out of the library, a reward promised, a line
 * typed. Limits are compared field by field before anything is applied,
 * because applying a plan restarts the native watcher and a parent pressing
 * save without changing anything should cost nothing.
 *
 * **Up**: the day's counters, and every finished day still in the queue. It is
 * skipped entirely when nothing has moved since the last send, so a phone
 * sitting on a shelf never wakes the radio. Plus the acknowledgement, which is
 * two ids and an enum and goes whenever one is owed.
 *
 * ## The delay
 *
 * Everything the parent sends arrives on the next pass of this loop, which is
 * a foreground event or a ten minute timer — not a push. The hub has no way to
 * wake a phone. A note written at nine is read when the child next opens the
 * app, and that is worth knowing when reading the parent app's copy.
 */
export function HubSync() {
  const { data, patchHub, unlinkHub, setGuardConfig, receiveFromHub, clearAcked } = useApp();
  const hub = data.hub;

  // Read inside the callback so the effect below can stay subscribed once.
  const latest = useRef({ data, hub, patchHub, unlinkHub, setGuardConfig, receiveFromHub, clearAcked });
  useEffect(() => {
    latest.current = { data, hub, patchHub, unlinkHub, setGuardConfig, receiveFromHub, clearAcked };
  });

  /** Guards against the foreground event and the timer overlapping. */
  const running = useRef(false);
  const lastAttempt = useRef<number | null>(null);
  const lastSignature = useRef<string | null>(null);

  const appVersion =
    typeof Constants.expoConfig?.version === 'string' ? Constants.expoConfig.version : null;

  const run = useCallback(
    async (force = false) => {
      const current = latest.current;
      const link = current.hub;
      if (!link || !isHubConfigured || running.current) return;
      if (!force && !isDue(lastAttempt.current, link.failures, Date.now())) return;

      running.current = true;
      lastAttempt.current = Date.now();

      try {
        /* ------------------------------------------------ what the parent set */

        const config = await fetchConfig(link.token);
        if (config.ok) {
          const limits = config.value.limits;
          if (limitsDiffer(current.data.guard, limits)) {
            current.setGuardConfig(applyLimits(current.data.guard, limits));
          }
          if (limits.revision !== link.revision) {
            current.patchHub({ revision: limits.revision });
          }

          // The rest of what a parent sent. Idempotent on the state side, so
          // the same payload arriving on every pass costs a render and
          // nothing else.
          current.receiveFromHub({
            assignment: config.value.assignment
              ? {
                  taskId: config.value.assignment.taskId,
                  assignedAt: new Date(config.value.assignment.assignedAt).toISOString(),
                }
              : null,
            note: config.value.note
              ? {
                  id: config.value.note.id,
                  text: config.value.note.text,
                  at: new Date(config.value.note.createdAt).toISOString(),
                }
              : null,
            rewards: (config.value.rewards ?? []).map((reward) => ({
              id: reward.id,
              stars: reward.stars,
              label: reward.label,
              emoji: reward.emoji,
              createdAt: new Date(reward.createdAt).toISOString(),
              givenAt: reward.givenAt ? new Date(reward.givenAt).toISOString() : undefined,
              origin: 'hub' as const,
            })),
          });
        } else if (config.error === 'unlinked') {
          // The parent removed this phone from their account. Forget the token
          // rather than retrying forever with a credential that is gone.
          current.unlinkHub();
          return;
        }

        /* --------------------------------------- what this phone owes back */

        // Sent before the counters, because it is two ids and an enum and a
        // child who has just tapped an answer should not wait on a report.
        const body = ackBody(latest.current.data.inbox);
        if (body) {
          const acked = await sendAck(link.token, body);
          // A refusal counts as heard. The hub answers `false` when the note
          // was already answered or the mission already replaced, and holding
          // the debt open for either would re-send the same two ids every ten
          // minutes for the life of the install. What is cleared is what was
          // sent, so an answer the child tapped while this was in the air
          // survives to go out on the next pass.
          if (acked.ok) current.clearAcked({ tookTaskId: body.tookTaskId, noteId: body.note?.id });
          else if (acked.error === 'unlinked') {
            current.unlinkHub();
            return;
          }
        }

        /* ------------------------------------------------------- the numbers */

        const report = buildReport(current.data, appVersion);
        const today = report.days.at(-1) ?? null;
        if (!force && !hasSomethingToSend(report, link.lastSentDay, lastSignature.current)) {
          current.patchHub({ failures: 0 });
          return;
        }

        const sent = await sendReport(link.token, report);
        if (sent.ok) {
          if (today) lastSignature.current = signatureOf(today);
          current.patchHub({
            lastSentDay: today?.date ?? link.lastSentDay,
            lastSentAt: new Date().toISOString(),
            failures: 0,
          });
        } else if (sent.error === 'unlinked') {
          current.unlinkHub();
        } else {
          // Nothing is lost by a failure: every day stays in the queue and the
          // next attempt sends the lot. The count only exists to slow the
          // retries down.
          current.patchHub({ failures: Math.min(20, link.failures + 1) });
        }
      } finally {
        running.current = false;
      }
    },
    [appVersion],
  );

  useEffect(() => {
    if (!hub || !isHubConfigured) return;

    void run();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
      // The last chance before the system may suspend the app. Forced, because
      // the app time banked on the way out has just changed the day and the
      // ordinary "is anything due" check would refuse.
      else if (state === 'background') void run(true);
    });

    return () => sub.remove();
    // Deliberately keyed on whether a link exists rather than on its contents:
    // every send patches the link, and depending on the object would
    // resubscribe on every successful sync.
  }, [Boolean(hub), run]);

  return null;
}
