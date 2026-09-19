/**
 * The look of ScreenLess for ages 3 to 5.
 *
 * Built for children who mostly cannot read yet: pictures carry the meaning,
 * buttons are big enough for a whole thumb, and everything answers a tap with
 * a squash and a sound.
 *
 * The style is a sunny picture book. Screens sit on a mint-to-grass gradient
 * with clouds drifting over it rather than on a flat page, cards are white and
 * very round so they read as cut-out stickers laid on the world, and anything
 * that can be pressed stands on a darker "lip" of its own colour and sinks
 * into it under a thumb — which a small child reads as a real button without
 * being told. The buddies keep their ink outlines, which lets them sit on top
 * of the flat scenery like toys on grass.
 *
 * Button colours are the candy colours taken a shade deeper so white text on
 * them stays above 3:1, the contrast floor for large bold text. The lighter
 * versions of the same colours (`glow`, `soft`) are for scenery and tinted
 * backgrounds, never for carrying text.
 */

export type ToneName = 'sun' | 'coral' | 'mint' | 'sky' | 'grape' | 'bubble' | 'aqua' | 'white';

export type Tone = {
  /** The face of a button or card. */
  face: string;
  /** The darker edge the face stands on. */
  lip: string;
  /** Text and icons on the face. */
  ink: string;
  /** A pale wash of the same colour, for backgrounds behind it. */
  soft: string;
  /** The bright candy version, for scenery and decoration. */
  glow: string;
};

export const tones: Record<ToneName, Tone> = {
  sun: { face: '#FFC42E', lip: '#E09A0C', ink: '#4A3200', soft: '#FFF2CC', glow: '#FFD966' },
  coral: { face: '#F0563A', lip: '#C63A22', ink: '#FFFFFF', soft: '#FFE0D8', glow: '#FF8267' },
  mint: { face: '#3CA82F', lip: '#2A7D20', ink: '#FFFFFF', soft: '#DDF5CE', glow: '#7ED957' },
  sky: { face: '#2189E0', lip: '#1567B1', ink: '#FFFFFF', soft: '#D8EFFF', glow: '#63BDF5' },
  grape: { face: '#8257F5', lip: '#6139D4', ink: '#FFFFFF', soft: '#EBE3FF', glow: '#B69BFF' },
  bubble: { face: '#E2519B', lip: '#B8357B', ink: '#FFFFFF', soft: '#FFE0EF', glow: '#FF8CC2' },
  aqua: { face: '#12A8A0', lip: '#08807A', ink: '#FFFFFF', soft: '#D3F5F2', glow: '#5BDDD4' },
  white: { face: '#FFFFFF', lip: '#D9E7CB', ink: '#2C2A20', soft: '#F6FBEF', glow: '#FFFFFF' },
};

/** The order the tones cycle in, for anything that colours a list. */
export const TONE_CYCLE: ToneName[] = ['sun', 'sky', 'bubble', 'mint', 'grape', 'coral', 'aqua'];

export const ink = {
  text: '#2C2A20',
  soft: '#6A6753',
  faint: '#A3A08C',
  onDark: '#FFFFFF',
} as const;

/**
 * Scenery. Bright and saturated, but never the same colour as a button, so an
 * action always stands out from the world it sits on.
 */
export const world = {
  /** Top and bottom of the sky every screen is painted on. */
  skyTop: '#DDF8CE',
  skyMid: '#A9ECA0',
  skyBottom: '#63D46B',
  /** The deeper green under the map, where the world turns into ground. */
  page: '#EAF9DC',
  cloud: '#FFFFFF',
  cloudShade: '#E8F4E6',
  sunCore: '#FFD34D',
  sunGlow: '#FFE89A',
  grass: '#8FE06A',
  grassDark: '#65C64A',
  grassDeep: '#41A336',
  leaf: '#7ED957',
  leafDeep: '#3E9A33',
  hillFar: '#BDEFA2',
  sand: '#FFE9AA',
  sandDark: '#F2CE7B',
  water: '#68CFF7',
  waterDark: '#3FB2E8',
  wood: '#B7773F',
  woodDark: '#8F5A2C',
  shadow: 'rgba(32, 52, 20, 0.16)',
} as const;

/** The mint-to-grass wash behind every screen, top to bottom. */
export const SKY_GRADIENT = [world.skyTop, world.skyMid, world.skyBottom] as const;

export const fontsLittle = {
  /** Round, bubbly, and it has every Turkish and Azerbaijani letter. */
  display: 'Baloo2_800ExtraBold',
  body: 'Nunito_700Bold',
  bodyHeavy: 'Nunito_800ExtraBold',
  bodyBlack: 'Nunito_900Black',
} as const;

/**
 * Type sizes. Big on purpose: the smallest text a child is expected to look at
 * is the tab label, and even that is there mostly for the grown up.
 */
export const typeLittle = {
  giant: { fontFamily: fontsLittle.display, fontSize: 52, lineHeight: 58 },
  hero: { fontFamily: fontsLittle.display, fontSize: 40, lineHeight: 46 },
  title: { fontFamily: fontsLittle.display, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: fontsLittle.display, fontSize: 23, lineHeight: 29 },
  label: { fontFamily: fontsLittle.display, fontSize: 19, lineHeight: 24 },
  body: { fontFamily: fontsLittle.body, fontSize: 18, lineHeight: 26 },
  small: { fontFamily: fontsLittle.body, fontSize: 15, lineHeight: 21 },
  tiny: { fontFamily: fontsLittle.bodyHeavy, fontSize: 13, lineHeight: 17 },
  number: { fontFamily: fontsLittle.display, fontSize: 22, lineHeight: 26 },
} as const;

export type LittleVariant = keyof typeof typeLittle;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Very round. A rectangle with a small radius reads as a form, not a toy. */
export const round = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  pill: 999,
} as const;

/** How far a face stands above its lip, by size. */
export const lip = {
  sm: 4,
  md: 6,
  lg: 7,
  xl: 9,
} as const;

/**
 * Motion. Springs rather than curves for anything a child touches, because a
 * spring overshoots a little and that overshoot is what makes it feel alive.
 */
export const motionLittle = {
  pressIn: 70,
  spring: { damping: 14, stiffness: 320, mass: 0.7 },
  softSpring: { damping: 18, stiffness: 180, mass: 0.9 },
  bouncy: { damping: 8, stiffness: 220, mass: 0.8 },
  stagger: 70,
} as const;

/** The widest a column of content gets, so a tablet shows a book, not a banner. */
export const MAX_COLUMN = 560;
