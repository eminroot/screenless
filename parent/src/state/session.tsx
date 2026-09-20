import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import * as api from '../api/client';
import type { Parent } from '../api/types';
import { resolveLanguage, type Language } from '../i18n';

/**
 * Who is signed in, and what language they read.
 *
 * The token is the only thing worth protecting here and it is kept in
 * AsyncStorage, which is the same place the child app keeps its own. That is a
 * deliberate ceiling on the claim being made: it is private to the app on a
 * phone that has not been rooted, and it is not a secure enclave. What the
 * token can do is read one family's counters and set one family's limits, and
 * the storage matches that rather than pretending to more.
 *
 * Nothing else is cached. Every screen fetches, because a dashboard showing a
 * stale figure with no way to tell is worse than one that takes a second.
 */

const KEY = 'screenless.parent.session.v1';

type Stored = { token: string; parent: Parent; language?: Language };

type SessionValue = {
  /** False until the stored session has been read. Screens wait for it. */
  ready: boolean;
  token: string | null;
  parent: Parent | null;
  language: Language;
  setLanguage: (language: Language) => void;
  signIn: (session: api.Session) => void;
  /** Drops the session here, and tells the server if it can reach it. */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

const deviceLanguage = (() => {
  try {
    return resolveLanguage(getLocales().map((locale) => locale.languageTag));
  } catch {
    return 'tr' as Language;
  }
})();

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [parent, setParent] = useState<Parent | null>(null);
  const [language, setLanguageState] = useState<Language>(deviceLanguage);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const stored = JSON.parse(raw) as Stored;
        if (typeof stored?.token !== 'string' || !stored.parent) return;
        setToken(stored.token);
        setParent(stored.parent);
        if (stored.language) setLanguageState(stored.language);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: Stored | null) => {
    if (next) void AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
    else void AsyncStorage.removeItem(KEY).catch(() => undefined);
  }, []);

  const signIn = useCallback(
    (session: api.Session) => {
      setToken(session.token);
      setParent(session.parent);
      persist({ token: session.token, parent: session.parent, language });
    },
    [language, persist],
  );

  const signOut = useCallback(async () => {
    const current = token;
    // Cleared here first. A parent who taps sign out on a train with no signal
    // has signed out, whatever the server thinks.
    setToken(null);
    setParent(null);
    persist(null);
    if (current) await api.signOut(current).catch(() => undefined);
  }, [persist, token]);

  const setLanguage = useCallback(
    (next: Language) => {
      setLanguageState(next);
      if (token && parent) persist({ token, parent, language: next });
    },
    [parent, persist, token],
  );

  const value = useMemo<SessionValue>(
    () => ({ ready, token, parent, language, setLanguage, signIn, signOut }),
    [ready, token, parent, language, setLanguage, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession outside SessionProvider');
  return value;
}
