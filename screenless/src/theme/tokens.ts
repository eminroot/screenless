/**
 * ScreenLess design tokens.
 *
 * The look is "paper storybook": a warm cream page, thick ink outlines and
 * hard offset shadows so every card reads like a sticker a child could peel off.
 * The parent side reuses the same palette at lower saturation.
 */

export const palette = {
  // paper
  cream: '#FFF4E3',
  paper: '#FFFBF2',
  sand: '#F6E7CE',

  // ink
  ink: '#2A2118',
  inkSoft: '#5A4B3B',
  inkFaint: '#9C8B78',

  // characters & accents
  sun: '#FFC53D',
  sunDeep: '#F0A81B',
  coral: '#FF6B57',
  coralDeep: '#E24A35',
  mint: '#2FBF8F',
  mintDeep: '#1E9A70',
  sky: '#3FA9F5',
  skyDeep: '#2181CC',
  grape: '#8C6BFF',
  grapeDeep: '#6B49E0',
  bubble: '#FF8FC7',
  bubbleDeep: '#E2649F',

  // states
  white: '#FFFFFF',
  night: '#1B1710',
  leaf: '#7FD16A',
  clay: '#C97B3F',
} as const;

export const colors = {
  bg: palette.cream,
  surface: palette.paper,
  surfaceAlt: palette.sand,
  border: palette.ink,
  text: palette.ink,
  textSoft: palette.inkSoft,
  textFaint: palette.inkFaint,
  primary: palette.coral,
  primaryDeep: palette.coralDeep,
  accent: palette.sun,
  accentDeep: palette.sunDeep,
  success: palette.mint,
  successDeep: palette.mintDeep,
  info: palette.sky,
  infoDeep: palette.skyDeep,
  magic: palette.grape,
  magicDeep: palette.grapeDeep,
} as const;

/** Category colours used by tasks, the map and progress rings. */
export const categoryColors = {
  move: palette.coral,
  outdoor: palette.mint,
  create: palette.grape,
  social: palette.sun,
  calm: palette.sky,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const borderWidth = {
  hair: 2,
  thick: 3,
  chunky: 4,
} as const;

export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const type = {
  display: { fontFamily: fonts.black, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.heavy, fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: fonts.heavy, fontSize: 20, lineHeight: 26 },
  subheading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  tiny: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22 },
} as const;

/** Offset of the solid ink shadow that gives cards their sticker feel. */
export const stickerOffset = 5;

export const durations = {
  quick: 140,
  base: 240,
  slow: 420,
} as const;
