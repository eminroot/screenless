/**
 * The look of ScreenLess for ages 6 to 9: expedition HQ.
 *
 * The first attempt at this tier read maturity as restraint — a white page,
 * hairline grey cards, thin line icons — and ended up looking like an admin
 * dashboard. That is exactly wrong. A seven year old is still a child and
 * still wants colour; what they have grown out of is *babyishness*, which is
 * not the same thing at all.
 *
 * So: maturity here means bolder, not quieter. The ground is a deep night
 * indigo, the colours on top of it are the most saturated in the whole app,
 * every surface is cut out with a thick ink outline and dropped on a hard
 * diagonal shadow like a sticker on a locker. It reads as gear rather than as
 * toys, which is the distinction this age actually cares about.
 *
 * The frame is an expedition: base camp, missions, a rank, kit you have
 * collected. That framing does the work the pastel world does for the three
 * year olds — it gives the child a reason to be here — while sounding like
 * something you would admit to your friends.
 *
 * What separates it from the tier below (`src/little`):
 * - **Dark ground, not a pastel sky.** The accents are vivid *against* it.
 * - **Ink outlines and hard offset shadows**, not soft moulded clay lips.
 * - **Nunito Black**, not the bubbly Baloo display face.
 * - **Icons with a subject**, not abstract symbols: a tent, a muddy boot, a
 *   compass, a walkie-talkie.
 * - **The numbers are shown.** Rank, stars to the next one, minutes, streak.
 *
 * Long text always sits on a cream card, never on the dark ground, so reading
 * a mission is never reading light-on-dark.
 */

export type AccentName = 'green' | 'blue' | 'amber' | 'rose' | 'violet' | 'teal' | 'flame';

export type Accent = {
  /** The vivid fill. Surfaces, buttons, badges. */
  solid: string;
  /** Deeper version: the hard shadow under a fill, and text on cream. */
  base: string;
  /** A pale wash for a panel inside a cream card. */
  tint: string;
  /** Mid weight, for a border that is not the full ink outline. */
  edge: string;
  /** Text and icons that sit ON `solid`. Dark by design — this is comic ink. */
  on: string;
};

/**
 * One accent per meaning, used the same way everywhere: green is go, blue is
 * sound and progress, amber is stars, rose is a streak, violet is the parts
 * the AI writes, teal is anything outdoors, flame is the mission itself.
 *
 * Text on a fill is always the dark `on` colour rather than white. Dark ink on
 * a saturated block is what makes it read as a comic panel instead of a
 * button in a form, and it clears 7:1 everywhere.
 */
export const accents: Record<AccentName, Accent> = {
  green: { solid: '#7BE83B', base: '#3E8C12', tint: '#E7FBD6', edge: '#A8F075', on: '#16330A' },
  blue: { solid: '#3BD2F5', base: '#0B7C99', tint: '#D8F6FE', edge: '#7FE2FA', on: '#04303A' },
  amber: { solid: '#FFC221', base: '#96650A', tint: '#FFF2CF', edge: '#FFD667', on: '#3A2600' },
  rose: { solid: '#FF5AA8', base: '#B3155F', tint: '#FFE1EE', edge: '#FF9AC9', on: '#3A0021' },
  violet: { solid: '#A277FF', base: '#5E2FD1', tint: '#EDE5FF', edge: '#C4A9FF', on: '#1F0A4A' },
  teal: { solid: '#34E3C0', base: '#0A8672', tint: '#D6FBF3', edge: '#7CEEDA', on: '#04332B' },
  flame: { solid: '#FF8A34', base: '#B44605', tint: '#FFE8D4', edge: '#FFB27A', on: '#331400' },
};

export const palette = {
  /** The ground. Night indigo — the accents are chosen to sing against it. */
  ground: '#161C44',
  /** A raised block on the ground, for the header band and the tab bar. */
  groundRaised: '#1F2757',
  /** A hairline on the dark ground. */
  groundLine: '#2E3873',
  /** The reading surface. Warm, so a screenful of text is never clinical. */
  surface: '#FFF7EA',
  /** A sunken row inside a cream card. */
  sunken: '#F2E6D2',
  /** Every outline in the tier. Thick, and the same colour as the ground. */
  ink: '#111739',
  /** A hairline inside a cream card, where a full ink rule would shout. */
  line: '#E7DAC3',
} as const;

export const ink = {
  /** Headings on cream. */
  strong: '#111739',
  /** Body copy on cream. */
  body: '#43507F',
  /** Captions and units on cream. */
  muted: '#6D79AC',
  /** Anything written straight onto the dark ground. */
  onGround: '#FFF7EA',
  /** A caption on the dark ground. */
  onGroundMuted: '#9AA6DC',
} as const;

export const fontsJunior = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

/**
 * Type. Headings are Nunito Black — heavy enough to read as a poster, without
 * the bubbly roundness of the display face used for the three year olds.
 *
 * The research floor for this age is 18px of body text with generous leading,
 * so `read` — the size a mission is actually written in — sits there.
 */
export const typeJunior = {
  banner: { fontFamily: fontsJunior.black, fontSize: 31, lineHeight: 37, letterSpacing: -0.4 },
  title: { fontFamily: fontsJunior.black, fontSize: 24, lineHeight: 30, letterSpacing: -0.2 },
  heading: { fontFamily: fontsJunior.heavy, fontSize: 19, lineHeight: 25 },
  /** Prose the child is meant to read: mission bodies, steps, facts. */
  read: { fontFamily: fontsJunior.medium, fontSize: 18, lineHeight: 27 },
  body: { fontFamily: fontsJunior.medium, fontSize: 17, lineHeight: 25 },
  bodyStrong: { fontFamily: fontsJunior.bold, fontSize: 17, lineHeight: 25 },
  small: { fontFamily: fontsJunior.medium, fontSize: 15, lineHeight: 21 },
  /** The stamped label over a section. Always upper case, always tracked out. */
  stamp: { fontFamily: fontsJunior.black, fontSize: 13, lineHeight: 18, letterSpacing: 1.4 },
  caption: { fontFamily: fontsJunior.bold, fontSize: 13, lineHeight: 18 },
  stat: { fontFamily: fontsJunior.black, fontSize: 30, lineHeight: 34 },
  statBig: { fontFamily: fontsJunior.black, fontSize: 46, lineHeight: 50, letterSpacing: -1 },
} as const;

export type JuniorVariant = keyof typeof typeJunior;

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
 * Corners. Softer than a form, harder than a toy: enough radius to be friendly,
 * not so much that everything turns into a bubble.
 */
export const radius = {
  chip: 14,
  button: 16,
  card: 18,
  panel: 24,
  pill: 999,
} as const;

export const border = {
  hair: 1.5,
  /** The standard cut-out edge. Thick on purpose. */
  ink: 3,
  /** A chosen option, the current rank. */
  strong: 4,
} as const;

/**
 * The hard shadow every surface stands on: offset down and right, no blur, in
 * ink. It is what makes a card read as a sticker stuck onto the ground rather
 * than a rectangle drawn on it.
 */
export const drop = {
  sm: 3,
  md: 5,
  lg: 6,
} as const;

/**
 * Hit sizes. The guidance for under-eights is a 75px minimum target, which a
 * full width button clears on its own; an icon on its own gets there with the
 * slop around it.
 */
export const hit = {
  button: 58,
  buttonLarge: 62,
  icon: 52,
  iconSlop: 12,
} as const;

/** Motion: quick and physical. A press pushes the surface onto its shadow. */
export const motionJunior = {
  press: 80,
  spring: { damping: 17, stiffness: 280, mass: 0.8 },
  soft: { damping: 20, stiffness: 150, mass: 1 },
  pop: { damping: 10, stiffness: 240, mass: 0.7 },
} as const;

/** The widest a column gets, so a tablet shows a page and not a banner. */
export const MAX_COLUMN = 600;
