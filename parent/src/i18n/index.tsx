import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { az } from './az';
import { en, type Copy } from './en';
import { tr } from './tr';

/**
 * Three languages, one tree, checked by the compiler.
 *
 * `tr.ts` and `az.ts` are annotated `: Copy`, so a key added to English and
 * forgotten elsewhere fails the build rather than rendering an empty label in
 * front of someone.
 *
 * Smaller than the child app's i18n on purpose: there are no plurals to
 * negotiate and no read-aloud voice, so a dotted key and `{{token}}`
 * substitution is the whole machinery.
 */

export const LANGUAGES = ['tr', 'en', 'az'] as const;
export type Language = (typeof LANGUAGES)[number];

const BUNDLES: Record<Language, Copy> = { en, tr, az };

export const languageMeta: Record<Language, { label: string; english: string }> = {
  tr: { label: 'Türkçe', english: 'Turkish' },
  en: { label: 'English', english: 'English' },
  az: { label: 'Azərbaycanca', english: 'Azerbaijani' },
};

type Section = keyof Copy;

/** Dotted keys such as `dash.screenTime`, checked at compile time. */
export type TKey = {
  [S in Section]: `${S & string}.${keyof Copy[S] & string}`;
}[Section];

export type TVars = Record<string, string | number>;

function lookup(bundle: Copy, key: string): string | null {
  const [section, leaf] = key.split('.') as [Section, string];
  const group = bundle[section] as Record<string, string> | undefined;
  const value = group?.[leaf];
  return typeof value === 'string' ? value : null;
}

function fill(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (whole, name: string) => {
    const value = vars[name];
    return value === undefined ? whole : String(value);
  });
}

export function translate(language: Language, key: TKey, vars?: TVars): string {
  // English is the fallback rather than the key itself: a missing Azerbaijani
  // string should read as English, not as `dash.screenTime`.
  const value = lookup(BUNDLES[language], key) ?? lookup(en, key);
  return value === null ? key : fill(value, vars);
}

type I18nValue = {
  language: Language;
  t: (key: TKey, vars?: TVars) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  language,
  children,
}: {
  language: Language;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({ language, t: (key, vars) => translate(language, key, vars) }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n outside I18nProvider');
  return value;
}

/** The device language, if it is one we speak. Turkish otherwise. */
export function resolveLanguage(tags: string[]): Language {
  for (const tag of tags) {
    const base = tag.toLowerCase().split('-')[0];
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Language;
  }
  return 'tr';
}
