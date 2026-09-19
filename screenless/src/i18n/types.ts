export const LANGUAGES = ['tr', 'en', 'az'] as const;

export type Language = (typeof LANGUAGES)[number];

/** A string that exists in every supported language. */
export type Localized = Record<Language, string>;

export const languageMeta: Record<
  Language,
  { label: string; english: string; flag: string; locale: string }
> = {
  tr: { label: 'Türkçe', english: 'Turkish', flag: '🇹🇷', locale: 'tr-TR' },
  en: { label: 'English', english: 'English', flag: '🌍', locale: 'en-US' },
  az: { label: 'Azərbaycanca', english: 'Azerbaijani', flag: '🇦🇿', locale: 'az-AZ' },
};

/** Full language names as Gemini should read them, to lock reply language. */
export const languageInstructionName: Record<Language, string> = {
  tr: 'Turkish (Türkçe)',
  en: 'English',
  az: 'Azerbaijani (Azərbaycan dili)',
};
