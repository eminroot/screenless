/**
 * The look of ScreenLess for ages 10 to 13.
 *
 * This is the age where being seen with the app matters more than the app. A
 * twelve year old will not open something on the bus that looks like it was
 * made for their little brother, and nothing kills a habit tool faster than
 * embarrassment. So the whole brief for this tier is: it has to survive a
 * friend glancing at the screen.
 *
 * That means near-black, tight, and data-first — the register of the apps they
 * already respect. But the mistake to avoid is the one this codebase already
 * made once at ages 6-8, where "mature" was read as "drained of colour" and
 * the result looked like an invoicing dashboard. The fix is not less colour,
 * it is *less colour, used harder*: one acid accent doing almost all the work
 * against a very dark ground, with sharp editorial type and real numbers.
 *
 * How it differs from the two tiers below:
 * - **Ages 3-5 (`src/little`)**: a pastel world, a huge mascot, clay buttons.
 * - **Ages 6-9 (`src/junior`)**: vivid comic blocks, ink outlines, hard
 *   sticker shadows, an expedition frame.
 * - **Ages 10-13 (here)**: near-black ground, hairline rules, one acid accent,
 *   big tight numerals, no mascot on the main surfaces.
 *
 * The other shift is authorship. The younger tiers hand the child a mission
 * from a buddy; here the framing is a log the child keeps about themselves,
 * because at this age being told what to do by a cartoon animal is the fastest
 * way to lose them. The buddy still exists, but it is a small avatar with an
 * opinion rather than the voice of the app.
 */

/**
 * Colours live in `skin.ts`, because this tier has two of them. Everything
 * left in this file is the same in light and dark: the type scale, the
 * spacing, the very small radii, the one pixel rules. Those are what make the
 * tier look its age, and none of them depend on which way the contrast runs.
 */
export type { Accent, AccentName, Skin } from './skin';

/**
 * The colour a secondary control draws itself in when nobody passes one.
 *
 * Deliberately a single mid grey rather than a skin token: it is only used by
 * chevrons, close buttons and the like, it clears 4:1 on both the near-black
 * ground and the white one, and keeping it static means the whole icon set
 * stays free of hooks.
 */
export const ICON_DEFAULT = '#7C8794';

export const fontsTeen = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/**
 * Type. Tighter and smaller than the tiers below — this age reads fluently, so
 * the 18px floor that governs the younger groups does not apply and the extra
 * room goes into fitting real information on a screen.
 *
 * The signature is the pairing: very large tight numerals against very small
 * wide-tracked upper case labels. That contrast is what makes a layout read as
 * instrumentation rather than as a form.
 */
export const typeTeen = {
  /** A screen title. */
  display: { fontFamily: fontsTeen.black, fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  title: { fontFamily: fontsTeen.heavy, fontSize: 21, lineHeight: 27, letterSpacing: -0.3 },
  heading: { fontFamily: fontsTeen.bold, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fontsTeen.medium, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontsTeen.bold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fontsTeen.medium, fontSize: 14, lineHeight: 20 },
  /** The wide-tracked upper case micro label. Used everywhere, never sentence case. */
  label: { fontFamily: fontsTeen.heavy, fontSize: 11, lineHeight: 15, letterSpacing: 1.6 },
  caption: { fontFamily: fontsTeen.medium, fontSize: 13, lineHeight: 18 },
  /** A figure in a row of figures. */
  stat: { fontFamily: fontsTeen.black, fontSize: 26, lineHeight: 30, letterSpacing: -0.8 },
  /** The one number a screen is about. */
  statBig: { fontFamily: fontsTeen.black, fontSize: 52, lineHeight: 56, letterSpacing: -2 },
} as const;

export type TeenVariant = keyof typeof typeTeen;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Corners are restrained. A big radius is the single most childish signal. */
export const radius = {
  chip: 10,
  button: 12,
  card: 14,
  panel: 18,
  pill: 999,
} as const;

export const border = {
  hair: 1,
  strong: 1.5,
} as const;

/**
 * Hit sizes. No 75px floor here — that guidance is for under-eights, and a
 * twelve year old has adult motor control. These are the ordinary platform
 * minimums with a little room.
 */
export const hit = {
  button: 52,
  buttonLarge: 56,
  icon: 44,
  iconSlop: 10,
} as const;

/** Motion: fast, small, and mostly opacity. Nothing bounces. */
export const motionTeen = {
  press: 70,
  spring: { damping: 22, stiffness: 320, mass: 0.7 },
  soft: { damping: 24, stiffness: 160, mass: 1 },
} as const;

/** The widest a column gets. */
export const MAX_COLUMN = 620;
