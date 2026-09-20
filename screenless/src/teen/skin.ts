import { useApp } from '../state/app-state';

/**
 * Light and dark for the 10-13 interface.
 *
 * This tier is the only one with two skins, and that is a design decision
 * rather than a technical one. The three to five year olds get a painted world
 * and the six to nines get an expedition; neither would be improved by a
 * choice, and a four year old has no opinion about it. By ten a phone is a
 * personal object and which mode it runs in is part of how it looks to the
 * person holding it, so the choice belongs to them.
 *
 * Only these three groups change between skins. Everything structural — the
 * type scale, the spacing, the radii, the depth under a pressable — is the
 * same in both, because those are what make the tier look its age and none of
 * them depend on which way round the contrast runs.
 *
 * -------------------------------------------------------------------------
 * WHY THIS IS NOT THE PALETTE IT WAS
 *
 * The tier used to be one acid yellow-green on near-black, and on the dark
 * skin it looked the part. The light skin it grew later did not: `#CDFF47` is
 * unreadable on white, so every piece of accented *text* had to be swapped for
 * a dark olive, and what was left was white cards with grey hairlines and the
 * occasional olive word. That is a landing page, not an app — there was no
 * weight anywhere, because the one colour carrying the identity could not
 * appear on the surface the whole screen was made of.
 *
 * So the accent family changed to colours that hold up on white *and* on a
 * dark ground, and each one gained an `under`: the darker shade sitting below
 * a pressable, which is where the tier gets its body back. A button here is a
 * solid block with a visible edge under it that disappears when it is pressed,
 * which is the oldest trick in touch UI and still the one that most reliably
 * says "this is a thing you press" without a drop shadow.
 *
 * The rule the two palettes share is unchanged: one accent does almost all the
 * work, and a second colour on a screen has to mean a second thing.
 */

export type AccentName = 'acid' | 'coral' | 'sky' | 'violet' | 'amber' | 'mint';

export type Accent = {
  /** The vivid colour: fills, bars, active states. Identical in both skins. */
  solid: string;
  /**
   * The same colour, darker. It is the edge under a pressable and the fill of
   * a pressed one, so it has to read as the same colour in shadow rather than
   * as a different colour — about 15% darker, never a different hue.
   */
  under: string;
  /** The same colour as *text*, adjusted per skin so it stays readable. */
  bright: string;
  /** A wash behind a tinted panel. */
  wash: string;
  /** Text and icons that sit ON `solid`. */
  on: string;
};

export type Skin = {
  name: 'dark' | 'light';
  palette: {
    ground: string;
    surface: string;
    sunken: string;
    line: string;
    lineBright: string;
  };
  ink: {
    strong: string;
    body: string;
    muted: string;
    onAccent: string;
  };
  accents: Record<AccentName, Accent>;
};

/**
 * The dark skin.
 *
 * A blue-green charcoal rather than a neutral near-black: the accents are all
 * warm-to-mid, and a ground with a little green in it lets them sit on it
 * without the cheap "neon on black" cast that a pure #000 ground gives
 * everything.
 */
export const darkSkin: Skin = {
  name: 'dark',
  palette: {
    ground: '#131F24',
    surface: '#202F36',
    sunken: '#1A272D',
    line: '#37464F',
    lineBright: '#52656D',
  },
  ink: {
    strong: '#F1F7FB',
    body: '#C5D1D8',
    muted: '#8399A3',
    onAccent: '#FFFFFF',
  },
  accents: {
    acid: { solid: '#58CC02', under: '#46A302', bright: '#79E028', wash: 'rgba(88,204,2,0.16)', on: '#FFFFFF' },
    coral: { solid: '#FF4B4B', under: '#EA2B2B', bright: '#FF7B7B', wash: 'rgba(255,75,75,0.16)', on: '#FFFFFF' },
    sky: { solid: '#1CB0F6', under: '#1899D6', bright: '#5FC9FF', wash: 'rgba(28,176,246,0.16)', on: '#FFFFFF' },
    violet: { solid: '#CE82FF', under: '#A560CC', bright: '#DCA5FF', wash: 'rgba(206,130,255,0.18)', on: '#FFFFFF' },
    amber: { solid: '#FFC800', under: '#E5A100', bright: '#FFD84D', wash: 'rgba(255,200,0,0.16)', on: '#3C2A00' },
    mint: { solid: '#00CD9C', under: '#00A87F', bright: '#3FE7BC', wash: 'rgba(0,205,156,0.16)', on: '#FFFFFF' },
  },
};

/**
 * The light skin.
 *
 * White, not off-white. An off-white ground with white cards on it is the
 * shape the old light skin had, and at hairline weights the two are close
 * enough that the cards stop reading as objects. White on white works the
 * other way round: the card is defined by a real 2px edge and the solid rule
 * under it, so the separation comes from drawn lines rather than from a four
 * percent difference in lightness.
 *
 * `solid` and `under` are identical to the dark skin, so a green button is the
 * same green button in both modes and the tier keeps one identity. `bright` is
 * where they differ — every accent needs a darker twin for *text*, because
 * none of these fills clears 4.5:1 against white — and the washes are opaque
 * pale tints rather than low-alpha overlays, since an alpha tuned to glow on
 * charcoal turns into a smear on white.
 */
export const lightSkin: Skin = {
  name: 'light',
  palette: {
    ground: '#FFFFFF',
    surface: '#FFFFFF',
    sunken: '#F7F7F7',
    line: '#E5E5E5',
    lineBright: '#D4D4D4',
  },
  ink: {
    strong: '#3C3C3C',
    body: '#4B4B4B',
    muted: '#AFAFAF',
    onAccent: '#FFFFFF',
  },
  accents: {
    acid: { solid: '#58CC02', under: '#46A302', bright: '#58A700', wash: '#D7FFB8', on: '#FFFFFF' },
    coral: { solid: '#FF4B4B', under: '#EA2B2B', bright: '#EA2B2B', wash: '#FFDFE0', on: '#FFFFFF' },
    sky: { solid: '#1CB0F6', under: '#1899D6', bright: '#1899D6', wash: '#DDF4FF', on: '#FFFFFF' },
    violet: { solid: '#CE82FF', under: '#A560CC', bright: '#8A3FBF', wash: '#F5E7FF', on: '#FFFFFF' },
    amber: { solid: '#FFC800', under: '#E5A100', bright: '#B37A00', wash: '#FFF4D6', on: '#3C2A00' },
    mint: { solid: '#00CD9C', under: '#00A87F', bright: '#00875F', wash: '#D4FBF0', on: '#FFFFFF' },
  },
};

export const skins = { dark: darkSkin, light: lightSkin } as const;

export type SkinName = keyof typeof skins;

/**
 * The skin the child has chosen.
 *
 * Read straight off the stored settings rather than through a provider: the
 * whole app already re-renders on a settings change, so a second context for
 * this would be plumbing for its own sake.
 *
 * Components destructure `{ palette, ink, accents }` from this, which is why
 * the call sites look the same as they did when these were module constants.
 */
export function useSkin(): Skin {
  const { data } = useApp();
  return skins[data.settings.teenSkin] ?? darkSkin;
}
