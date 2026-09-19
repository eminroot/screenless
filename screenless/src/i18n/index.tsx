import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { en } from './locales/en';
import { tr } from './locales/tr';
import { az } from './locales/az';
import type { TKey, Translation, TVars } from './shape';
import { LANGUAGES, type Language, type Localized } from './types';

const bundles: Record<Language, Translation> = { en, tr, az };

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

function lookup(language: Language, key: TKey): string {
  const [section, leaf] = key.split('.') as [keyof Translation, string];
  const bundle = bundles[language][section] as Record<string, string> | undefined;
  const value = bundle?.[leaf];
  if (typeof value === 'string') return value;

  // Missing string in a translated bundle should never break the screen.
  const fallback = (en[section] as Record<string, string> | undefined)?.[leaf];
  if (__DEV__ && !fallback) console.warn(`[i18n] missing key: ${key}`);
  return fallback ?? key;
}

type I18nValue = {
  language: Language;
  t: (key: TKey, vars?: TVars) => string;
  /** Reads the right side of a `Localized` object, falling back to English. */
  pick: (value: Localized) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const t = useCallback(
    (key: TKey, vars?: TVars) => interpolate(lookup(language, key), vars),
    [language],
  );

  const pick = useCallback(
    (value: Localized) => value[language] ?? value.en,
    [language],
  );

  const value = useMemo<I18nValue>(() => ({ language, t, pick }), [language, t, pick]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}

/** Normalises a device locale such as `az-Latn-AZ` to one of our languages. */
export function resolveDeviceLanguage(locales: readonly string[]): Language {
  for (const tag of locales) {
    const base = tag.toLowerCase().split('-')[0];
    const match = LANGUAGES.find((lang) => lang === base);
    if (match) return match;
  }
  return 'tr';
}

export { LANGUAGES, languageMeta, type Language, type Localized } from './types';
