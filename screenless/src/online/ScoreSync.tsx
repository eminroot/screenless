import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useApp } from '../state/app-state';
import { sendScore } from './api';
import { scoreSnapshot } from './score';

/** Batches a mission confirmation and the celebration that follows into one send. */
const FIRST_DELAY_MS = 3_000;
/** A walk changes the step count every second. The board does not need every one. */
const MIN_GAP_MS = 30_000;
const RETRY_MS = 60_000;

/**
 * Keeps the friends board up to date with this phone.
 *
 * Renders nothing. Does nothing at all unless the child has a username: with
 * no account there is no snapshot, so no timer is ever set, and the request
 * layer would refuse anyway.
 */
export function ScoreSync() {
  const { data, markScoreSent, loseAccount } = useApp();
  const { profile, progress, missions, walk, social } = data;
  const account = social.mode === 'online' ? social.account : null;

  // Re-read when the app comes back, so a phone left open over Sunday night
  // reports against the new week.
  const [now, setNow] = useState(() => new Date());

  const snapshot = useMemo(
    () => (account ? scoreSnapshot({ profile, progress, missions, walk }, now) : null),
    [account, profile, progress, missions, walk, now],
  );
  const serialised = snapshot ? JSON.stringify(snapshot) : null;

  const latest = useRef({ account, snapshot, serialised, lastSent: social.lastSent });
  useEffect(() => {
    latest.current = { account, snapshot, serialised, lastSent: social.lastSent };
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sending = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;

    const current = latest.current;
    if (!current.account || !current.snapshot || !current.serialised) return;
    if (current.serialised === current.lastSent || sending.current) return;

    sending.current = true;
    const result = await sendScore(current.account, current.snapshot);
    sending.current = false;

    if (result.ok) {
      markScoreSent(current.serialised);
    } else if (result.error === 'unauthorized') {
      loseAccount();
    } else if (result.error !== 'offline' && result.error !== 'unconfigured') {
      timer.current = setTimeout(() => void flush(), RETRY_MS);
    }
  }, [markScoreSent, loseAccount]);

  useEffect(() => {
    if (!account || !serialised || serialised === social.lastSent || timer.current) return;
    const since = social.lastSentAt ? Date.now() - new Date(social.lastSentAt).getTime() : Infinity;
    timer.current = setTimeout(() => void flush(), Math.max(FIRST_DELAY_MS, MIN_GAP_MS - since));
  }, [account, serialised, social.lastSent, social.lastSentAt, flush]);

  // A username removed mid wait takes its pending send with it.
  useEffect(() => {
    if (account || !timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
  }, [account]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
      // The last chance before the system may suspend the app.
      else if (state === 'background') void flush();
    });
    return () => {
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  return null;
}
