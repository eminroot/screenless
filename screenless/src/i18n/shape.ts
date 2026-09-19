import type { TranslationTree } from './locales/en';

/** Every locale must fill the same tree, all leaves plain strings. */
export type Translation = {
  [Section in keyof TranslationTree]: {
    [Key in keyof TranslationTree[Section]]: string;
  };
};

export type Section = keyof TranslationTree;

/** Dotted keys such as `home.missionTitle`, checked at compile time. */
export type TKey = {
  [S in Section]: `${S & string}.${keyof TranslationTree[S] & string}`;
}[Section];

export type TVars = Record<string, string | number>;
