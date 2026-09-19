import { Platform } from 'react-native';

/**
 * The look of the parent app.
 *
 * Deliberately nothing like the child app, and that is the point rather than a
 * shortcut. ScreenLess itself is thick borders, hard shadows, saturated
 * colour and a mascot the height of the screen, because it is for a five year
 * old. This is for the person paying the phone bill, read standing up in a
 * kitchen, and it is built the opposite way: warm paper, hairline rules, one
 * accent used sparingly, and numbers set large enough to take in at a glance.
 *
 * Two rules the whole thing rests on:
 *
 * 1. **Colour carries meaning, never decoration.** Coral means "look here",
 *    green means the number moved the right way, amber means it did not. A
 *    chart that is colourful for its own sake makes those three unreadable.
 *
 * 2. **Figures are tabular.** Screen time is read by comparing one row to the
 *    next, and proportional digits make a column of numbers jitter.
 */

export const colors = {
  /** The page. Warm rather than grey, so it does not read as a spreadsheet. */
  paper: '#F6F4F0',
  card: '#FFFFFF',
  /** Panels inside a card: a summary strip, a chart backdrop. */
  well: '#FAF8F5',

  ink: '#16140F',
  inkSoft: '#55514A',
  inkFaint: '#8C867C',

  /** Hairlines. Everything is separated by one of these rather than a border. */
  rule: '#E4DFD7',
  ruleSoft: '#EFEBE4',

  /** The one accent. Deeper than the child app's coral so it holds on paper. */
  accent: '#E8543F',
  accentSoft: '#FDEDE9',
  accentInk: '#8F2D1E',

  /** The number moved the way a family wants. */
  good: '#2F7D5B',
  goodSoft: '#E8F3EE',
  /** It did not. Amber rather than red: this is information, not an alarm. */
  warn: '#A8761E',
  warnSoft: '#FBF2E0',
  bad: '#C2453A',

  /** Chart series. Screen time first, then the things that offset it. */
  screen: '#4B4A7A',
  screenSoft: '#E7E6F1',
  active: '#2F7D5B',
  missions: '#E8543F',

  /** A day the phone never reported. Drawn, but as an absence. */
  gap: '#EDE9E2',

  onAccent: '#FFFFFF',
  onInk: '#F6F4F0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
  /** The side gutter. Everything lines up on it. */
  gutter: 20,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/**
 * Tabular figures, so a column of minutes lines up.
 *
 * `fontVariant` is the right answer on native and is ignored by react-native-web,
 * which wants the CSS property instead. Both are set; each platform takes the
 * one it understands.
 */
export const tabular = Platform.select({
  web: { fontVariantNumeric: 'tabular-nums' } as object,
  default: { fontVariant: ['tabular-nums'] as const },
});

export const type = {
  /** One number, the size of a headline. Used once per screen at most. */
  display: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  /** Section headers and axis labels. Upper case, tracked out. */
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
  },
  tiny: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
} as const;

/**
 * The only shadow in the app, and it is barely there.
 *
 * A card lifts off the paper by about a millimetre. Anything heavier turns a
 * calm page into a stack of floating slabs, and this screen is read by someone
 * who is already worried about something.
 */
export const shadow = Platform.select({
  ios: {
    shadowColor: '#2A2317',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  android: { elevation: 1 },
  default: { boxShadow: '0 2px 10px rgba(42, 35, 23, 0.06)' } as object,
});
