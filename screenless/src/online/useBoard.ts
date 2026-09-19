import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useApp } from '../state/app-state';
import { fetchBoard, type Board } from './api';
import type { ApiError } from './network';
import { isoWeekKey } from './score';

/** A board younger than this is shown as it is rather than fetched again. */
const FRESH_MS = 30_000;

type Cached = { playerId: string; week: string; board: Board; fetchedAt: number };

/**
 * Shared between the Today card, the board and the parent area so moving
 * between them does not fetch the same board three times. Held in memory
 * only: other children's usernames are never written to this phone's storage.
 */
let cached: Cached | null = null;

export function forgetBoard(): void {
  cached = null;
}

export type BoardState = {
  board: Board | null;
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
};

/** The current week's board for this child. Loads when the screen gains focus. */
export function useBoard(): BoardState {
  const { data, loseAccount, updateAccount } = useApp();
  const account = data.social.mode === 'online' ? data.social.account : null;
  const week = isoWeekKey();

  const [board, setBoard] = useState<Board | null>(() =>
    account && cached?.playerId === account.playerId && cached.week === week ? cached.board : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      if (!account) return;
      const mine = cached?.playerId === account.playerId && cached.week === week ? cached : null;
      if (!force && mine && Date.now() - mine.fetchedAt < FRESH_MS) {
        setBoard(mine.board);
        return;
      }

      setLoading(true);
      const result = await fetchBoard(account, week);
      setLoading(false);

      if (!result.ok) {
        if (result.error === 'unauthorized') loseAccount();
        setError(result.error);
        return;
      }

      cached = { playerId: account.playerId, week, board: result.value, fetchedAt: Date.now() };
      setBoard(result.value);
      setError(null);

      // The server is the record of the username and the code. If a rename or a
      // new code went through but the reply never arrived, this catches it up.
      const { username, inviteCode } = result.value;
      if (username !== account.username || inviteCode !== account.inviteCode) {
        updateAccount({ username, inviteCode });
      }
    },
    [account, week, loseAccount, updateAccount],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    if (account) return;
    forgetBoard();
    setBoard(null);
  }, [account]);

  const refresh = useCallback(() => load(true), [load]);

  return { board: account ? board : null, loading, error, refresh };
}
