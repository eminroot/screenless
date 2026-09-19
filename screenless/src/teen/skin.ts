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
 * type scale, the spacing, the tiny radii, the one pixel rules — is the same
 * in both, because those are what make the tier look its age and none of them
 * depend on which way round the contrast runs.
 *
 * The rule the two palettes share: one accent does almost all the work, and a
 * second colour on a screen has to mean a second thing.
 */

export type AccentName = 'acid' | 'coral' | 'sky' | 'violet' | 'amber' | 'mint';

export type Accent = {
  /** The vivid colour: fills, bars, active states. Identical in both skins. */
  solid: string;
  /** The same colour as *text*, adjusted per skin so it stays readable. */
  bright: string;
  /** A wash behind a tinted panel. */
  wash: string;
  /** Text that sits ON `solid`. Near-black in both, because `solid` is light. */
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

/** The default. Near-black with a cool cast, so the acid reads as light. */
export const darkSkin: Skin = {
  name: 'dark',
  palette: {
    ground: '#0B0F14',
    surface: '#141A21',
    sunken: '#1B222B',
    line: '#232C36',
    lineBright: '#36424F',
  },
  ink: {
    strong: '#F2F6F8',
    body: '#B7C2CC',
    muted: '#7A8794',
    onAccent: '#0B0F14',
  },
  accents: {
    acid: { solid: '#CDFF47', bright: '#CDFF47', wash: 'rgba(205,255,71,0.12)', on: '#0B0F14' },
    coral: { solid: '#FF6B4A', bright: '#FF8A70', wash: 'rgba(255,107,74,0.14)', on: '#1A0600' },
    sky: { solid: '#4FC3FF', bright: '#7FD6FF', wash: 'rgba(79,195,255,0.14)', on: '#001721' },
    violet: { solid: '#9D7BFF', bright: '#B49BFF', wash: 'rgba(157,123,255,0.16)', on: '#0C0424' },
    amber: { solid: '#FFC24D', bright: '#FFD37A', wash: 'rgba(255,194,77,0.14)', on: '#1E1200' },
    mint: { solid: '#3FE0A8', bright: '#6FEBC0', wash: 'rgba(63,224,168,0.14)', on: '#00241A' },
  },
};

/**
 * The light skin.
 *
 * Not a straight inversion. The `solid` fills stay exactly as they are, so a
 * button is the same acid block in both modes and the app keeps one identity
 * — but every accent needs a much darker twin for *text*, because `#CDFF47` on
 * white is unreadable. So `bright` is where the two skins actually differ, and
 * each of those values is the accent taken down far enough to clear 4.5:1 on
 * the surface it sits on.
 *
 * The washes become opaque pale tints rather than low-alpha overlays: an alpha
 * tuned to glow against near-black turns into a smear on white.
 */
export const lightSkin: Skin = {
  name: 'light',
  palette: {
    ground: '#F6F8FA',
    surface: '#FFFFFF',
    sunken: '#EDF1F5',
    line: '#E1E7EE',
    lineBright: '#C5CFDB',
  },
  ink: {
    strong: '#0B1219',
    body: '#44515F',
    muted: '#6B7886',
    onAccent: '#0B0F14',
  },
  accents: {
    acid: { solid: '#CDFF47', bright: '#4A7A00', wash: '#F1FFD5', on: '#0B0F14' },
    coral: { solid: '#FF6B4A', bright: '#C1341A', wash: '#FFE9E3', on: '#1A0600' },
    sky: { solid: '#4FC3FF', bright: '#00688F', wash: '#E1F4FF', on: '#001721' },
    violet: { solid: '#9D7BFF', bright: '#5B32C9', wash: '#EEE8FF', on: '#0C0424' },
    amber: { solid: '#FFC24D', bright: '#8A5B00', wash: '#FFF3DA', on: '#1E1200' },
    mint: { solid: '#3FE0A8', bright: '#00795A', wash: '#DBFAEF', on: '#00241A' },
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
