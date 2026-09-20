/**
 * The look of ScreenLess for ages 10 to 13.
 *
 * This is the age where being seen with the app matters more than the app. A
 * twelve year old will not open something on the bus that looks like it was
 * made for their little brother, and nothing kills a habit tool faster than
 * embarrassment. So the whole brief for this tier is: it has to survive a
 * friend glancing at the screen.
 *
 * That means tight, data-first type and real numbers — the register of the
 * apps they already respect. But the mistake to avoid is the one this codebase
 * has now made twice: at ages 6-8 "mature" was read as "drained of colour" and
 * the result looked like an invoicing dashboard, and this tier's light skin
 * repeated it with hairline rules on white. Both times the fix was the same:
 * not less colour, but *one colour used harder*, and enough drawn weight — two
 * pixel outlines, a solid edge under everything pressable — that a surface
 * reads as an object rather than as a region of a page.
 *
 * How it differs from the two tiers below:
 * - **Ages 3-5 (`src/little`)**: a pastel world, a huge mascot, clay buttons.
 * - **Ages 6-9 (`src/junior`)**: vivid comic blocks, ink outlines, hard
 *   offset sticker shadows, an expedition frame.
 * - **Ages 10-13 (here)**: drawn outlines with no offset, one green accent,
 *   blocks that travel down onto their own edge when pressed, big tight
 *   numerals, no mascot on the main surfaces.
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
 * spacing, the radii, the drawn weights, the depth under a pressable. Those
 * are what make the tier look its age, and none of them depend on which way
 * the contrast runs.
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
export const ICON_DEFAULT = '#8E9AA3';

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
  title: { fontFamily: fontsTeen.black, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: fontsTeen.heavy, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: fontsTeen.medium, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fontsTeen.heavy, fontSize: 16, lineHeight: 24 },
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

/**
 * Corners.
 *
 * Bigger than they were. The old scale topped out at 14 on the theory that a
 * big radius is the most childish signal there is, and that is true of a
 * *pill* — a fully round-ended button is the shape the six to nines get. It is
 * not true of 16, which is what every app this age group actually respects
 * uses, and the previous 10-12 read as cautious rather than as grown up.
 *
 * `pill` is still here and still rare: progress tracks and read-only counts,
 * never a button.
 */
export const radius = {
  chip: 12,
  button: 16,
  card: 16,
  panel: 20,
  pill: 999,
} as const;

export const border = {
  /** A divider between rows inside one panel. */
  hair: 1,
  /** The outline of a panel or a control. Drawn, not implied. */
  strong: 2,
} as const;

/**
 * How far a pressable stands off its own shadow.
 *
 * The tier's one piece of depth, and the thing that stops a screen of white
 * cards on a white ground reading as a web page. A button is a solid block
 * with `accent.under` showing as a hard edge beneath it; pressing it moves the
 * face down by exactly this much and the edge goes away, so the control
 * travels rather than dimming. No blur, no drop shadow, no gradient — one
 * rectangle behind another.
 *
 * `press` is the smaller version, for cards and rows, which move less.
 */
export const depth = {
  button: 4,
  press: 3,
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
