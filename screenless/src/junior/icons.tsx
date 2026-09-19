import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { accents, palette } from './theme';

/**
 * Icons for the 6-8 interface.
 *
 * Drawn as small objects, not as symbols. The first version of this tier used
 * thin line glyphs — a rounded house, a magnifier, a chevron — and they were
 * indistinguishable from the icon set of any invoicing app. A seven year old
 * has no reason to care about a generic outline, so every icon here is a thing
 * instead: a tent with its flag up, a boot with mud on it, a compass with a
 * red needle, a walkie-talkie with an aerial.
 *
 * The rules that hold them together:
 * - Flat colour blocks, two or three per icon, cut out with a thick ink
 *   outline in the same colour as the ground.
 * - A 32 unit box, so there is room for a detail that makes an object an
 *   object rather than a shape.
 * - No gradients and no emoji. Emoji render differently on every phone, and
 *   some Androids draw them as flat grey outlines.
 *
 * Objects carry their own colours. Controls — the tick, the arrow, the play
 * triangle — take a colour, because they have to sit on whatever they sit on.
 */

type IconProps = { size?: number; color?: string };

const INK = palette.ink;
const CREAM = palette.surface;

const box = (size: number) => ({ width: size, height: size, viewBox: '0 0 32 32' });

/** The outline every object shares. */
const cut = (width = 2) => ({
  stroke: INK,
  strokeWidth: width,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/* ------------------------------------------------------------------ places */

/** Base camp: a tent with the flag up. The Today tab. */
export function HomeIcon({ size = 26 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M3 26h26" {...cut(2.4)} />
      <Path d="M16 8 4.5 25.5h23Z" fill={accents.flame.solid} {...cut()} />
      <Path d="M16 8v17.5h11.5Z" fill={accents.flame.base} {...cut()} />
      <Path d="M16 14.5 20.5 25.5h-9Z" fill={palette.ground} {...cut()} />
      <Path d="M16 8V3" {...cut(2.2)} />
      <Path d="M16.6 3.2 24 5.4l-7.4 2.2Z" fill={accents.amber.solid} {...cut(1.8)} />
    </Svg>
  );
}

/** The journey: a compass, needle north. */
export function RouteIcon({ size = 26 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={16} cy={16} r={12.5} fill={accents.blue.solid} {...cut()} />
      <Circle cx={16} cy={16} r={8.6} fill={CREAM} {...cut(1.8)} />
      <Path d="M16 7.6 18.4 13.6 16 16Z" fill={accents.rose.solid} {...cut(1.6)} />
      <Path d="M16 24.4 13.6 18.4 16 16Z" fill={palette.ground} {...cut(1.6)} />
      <Path d="M16 7.6 13.6 18.4 16 16Z" fill={accents.rose.base} {...cut(1.6)} />
      <Circle cx={16} cy={16} r={1.6} fill={INK} />
    </Svg>
  );
}

/** Explore: a lens with a leaf caught under it. */
export function SearchIcon({ size = 26 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M21.5 21.5 28 28" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
      <Path d="M21.5 21.5 28 28" stroke={accents.amber.solid} strokeWidth={2.6} strokeLinecap="round" />
      <Circle cx={14} cy={14} r={10.5} fill={accents.teal.solid} {...cut()} />
      <Circle cx={14} cy={14} r={7.4} fill={CREAM} {...cut(1.6)} />
      <Path d="M18.6 9.8c0 4.8-2.4 7.2-5.6 7.2a3.3 3.3 0 0 1-3.2-3.2c0-2.8 3.4-4 8.8-4Z" fill={accents.green.solid} {...cut(1.5)} />
    </Svg>
  );
}

/**
 * Steps: the print a boot leaves, not the boot.
 *
 * A shoe drawn side-on loses every detail that makes it a shoe once it is
 * shrunk to tab size, and turns into a sock. A tread print is two blocks and
 * some lines, so it survives being small — and it says hiking rather than
 * footwear, which is the half of the meaning that matters here.
 */
export function ShoeIcon({ size = 26 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M16 2.4c4.8 0 8 3.4 8 8.4 0 4.6-2.4 7.4-8 7.4s-8-2.8-8-7.4c0-5 3.2-8.4 8-8.4Z"
        fill={accents.violet.solid}
        {...cut()}
      />
      <Path
        d="M16 20.6c3.8 0 6.4 2 6.4 4.6s-2.6 4.6-6.4 4.6-6.4-2-6.4-4.6 2.6-4.6 6.4-4.6Z"
        fill={accents.violet.base}
        {...cut()}
      />
      <Path d="M10.4 8.4h11.2M10.6 12.6h10.8" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <Path d="M13 24.4h6" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** The buddy: a walkie-talkie, because HQ calls you on it. */
export function ChatIcon({ size = 26 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M22.5 9.5V4.5" {...cut(2.2)} />
      <Rect x={7} y={9} width={16} height={19} rx={3} fill={accents.green.solid} {...cut()} />
      <Rect x={10} y={12} width={10} height={6} rx={1.6} fill={CREAM} {...cut(1.6)} />
      <Circle cx={12.4} cy={22} r={1.5} fill={INK} />
      <Circle cx={17.6} cy={22} r={1.5} fill={INK} />
      <Circle cx={12.4} cy={25.4} r={1.5} fill={INK} />
      <Circle cx={17.6} cy={25.4} r={1.5} fill={INK} />
      <Rect x={3.6} y={12} width={4} height={7} rx={1.6} fill={accents.green.base} {...cut(1.6)} />
    </Svg>
  );
}

/* ------------------------------------------------------------------ scores */

/** A star, chunky, with a shine on it. */
export function StarIcon({ size = 24 }: IconProps) {
  return <StarFilledIcon size={size} />;
}

export function StarFilledIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M16 3.4 20 11.5l9 1.3-6.5 6.3 1.5 8.9L16 23.8 8 28l1.5-8.9L3 12.8l9-1.3Z"
        fill={accents.amber.solid}
        {...cut(2.2)}
      />
      <Path d="M12.4 10.6 16 7.4" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Days in a row. */
export function FlameIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M16 2.6c3.6 5 8.2 7.6 8.2 13.2a8.2 8.2 0 1 1-16.4 0c0-3.4 2-5.6 4-7.6.3 2.9 1.2 4.1 2.4 4.4-.3-4.4.3-7.2 1.8-10Z"
        fill={accents.flame.solid}
        {...cut()}
      />
      <Path
        d="M16 15.4c2 2.4 3.6 3.9 3.6 5.9a3.6 3.6 0 1 1-7.2 0c0-1.7 1.3-2.9 2.4-4.1.3 1.2.8 1.8 1.3 1.8-.2-1.4-.2-2.4-.1-3.6Z"
        fill={accents.amber.solid}
        {...cut(1.6)}
      />
    </Svg>
  );
}

/** Steps turn into coins, which buy nothing real. */
export function CoinIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Ellipse cx={16} cy={19} rx={11.5} ry={9.5} fill={accents.amber.base} {...cut()} />
      <Ellipse cx={16} cy={15.5} rx={11.5} ry={9.5} fill={accents.amber.solid} {...cut()} />
      <Path d="M16 9.6 18 13.6l4.4.6-3.2 3 .8 4.3-4-2.1-4 2.1.8-4.3-3.2-3 4.4-.6Z" fill={CREAM} {...cut(1.5)} />
    </Svg>
  );
}

/** What a mission is worth, on the results screen. */
export function BoltIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M18.4 2.6 6.6 17.4h7.4l-1.4 12L25.4 14h-7.6Z" fill={accents.amber.solid} {...cut(2.2)} />
      <Path d="M14 8.6 10.6 13" stroke={CREAM} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** Rank: a medal on a ribbon. */
export function TrophyIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M10.6 3.4 15 13l-5 1.6Z" fill={accents.blue.solid} {...cut(1.8)} />
      <Path d="M21.4 3.4 17 13l5 1.6Z" fill={accents.rose.solid} {...cut(1.8)} />
      <Circle cx={16} cy={21} r={9} fill={accents.amber.solid} {...cut()} />
      <Circle cx={16} cy={21} r={5.6} fill={accents.amber.base} {...cut(1.6)} />
      <Path d="M16 17.4 17.2 20l2.8.3-2.1 1.9.6 2.8L16 23.6 13.5 25l.6-2.8-2.1-1.9 2.8-.3Z" fill={CREAM} {...cut(1.2)} />
    </Svg>
  );
}

/* ---------------------------------------------------------------- the kit */

/** The way in for a grown up. */
export function LockIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M10 14V10a6 6 0 0 1 12 0v4" {...cut(2.6)} fill="none" />
      <Rect x={5.6} y={13.4} width={20.8} height={15} rx={4} fill={accents.amber.solid} {...cut()} />
      <Circle cx={16} cy={19.6} r={2.6} fill={INK} />
      <Path d="M16 21.4v3.4" {...cut(2.4)} />
    </Svg>
  );
}

/** The tip a mission carries. */
export function BulbIcon({ size = 24, color }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M16 3.4a8 8 0 0 0-4.8 14.4c.8.6 1.2 1.4 1.2 2.3v.9h7.2v-.9c0-.9.4-1.7 1.2-2.3A8 8 0 0 0 16 3.4Z" fill={color ?? accents.amber.solid} {...cut()} />
      <Path d="M12.6 24h6.8M13.8 27.6h4.4" {...cut(2.2)} />
      <Path d="M16 8.4a4.6 4.6 0 0 0-3 2.6" stroke={CREAM} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function CameraIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={11} y={4.6} width={10} height={5} rx={2} fill={accents.violet.base} {...cut(1.8)} />
      <Rect x={3} y={8.6} width={26} height={19} rx={4} fill={accents.violet.solid} {...cut()} />
      <Circle cx={16} cy={18} r={7} fill={CREAM} {...cut(1.8)} />
      <Circle cx={16} cy={18} r={3.4} fill={accents.violet.base} {...cut(1.5)} />
      <Circle cx={24.6} cy={12.8} r={1.5} fill={accents.amber.solid} />
    </Svg>
  );
}

export function BookIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M16 8.6C13.2 6 9 5.2 3.6 6v18.6c5.4-.8 9.6 0 12.4 2.6Z" fill={accents.blue.solid} {...cut()} />
      <Path d="M16 8.6c2.8-2.6 7-3.4 12.4-2.6v18.6c-5.4-.8-9.6 0-12.4 2.6Z" fill={accents.blue.edge} {...cut()} />
      <Path d="M19.4 12.6c2-.5 4-.7 5.8-.6M19.4 17c2-.5 4-.7 5.8-.6" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

/** What a grown up promised. */
export function GiftIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M16 11C13.8 5.6 11.4 3.4 9 4.4 6.8 5.4 8 9.6 16 11Z" fill={accents.rose.edge} {...cut(1.6)} />
      <Path d="M16 11c2.2-5.4 4.6-7.6 7-6.6 2.2 1 1 5.2-7 6.6Z" fill={accents.rose.edge} {...cut(1.6)} />
      <Rect x={4} y={10.4} width={24} height={5.6} rx={2} fill={accents.rose.solid} {...cut()} />
      <Path d="M6 16v10.4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V16" fill={accents.rose.base} {...cut()} />
      <Rect x={13.6} y={10.4} width={4.8} height={18} fill={accents.amber.solid} {...cut(1.8)} />
    </Svg>
  );
}

export function TreeIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={13.6} y={20} width={4.8} height={8.6} rx={1.6} fill={accents.flame.base} {...cut(1.8)} />
      <Path d="M16 3.4 8 14h4.4L6.6 21.6h18.8L19.6 14H24Z" fill={accents.green.solid} {...cut()} />
      <Path d="M16 3.4 8 14h4.4l3.6-4.8Z" fill={accents.green.edge} {...cut(1.4)} />
    </Svg>
  );
}

export function LeafIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M27 4.6c0 12.4-5.8 18.2-13.2 18.2A8 8 0 0 1 5.8 14.8C5.8 8 14.6 4.6 27 4.6Z" fill={accents.teal.solid} {...cut()} />
      <Path d="M6.4 27.4C9.6 19.4 14.8 14.4 22.2 11.4" {...cut(2.2)} fill="none" />
    </Svg>
  );
}

/** The AI parts. */
export function SparkIcon({ size = 24, color }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M13 3.4c1 6.2 2.8 8 9 9-6.2 1-8 2.8-9 9-1-6.2-2.8-8-9-9 6.2-1 8-2.8 9-9Z" fill={color ?? accents.violet.solid} {...cut(1.8)} />
      <Path d="M24.6 18.4c.5 3 1.1 3.6 4.1 4.1-3 .5-3.6 1.1-4.1 4.1-.5-3-1.1-3.6-4.1-4.1 3-.5 3.6-1.1 4.1-4.1Z" fill={color ?? accents.violet.edge} {...cut(1.5)} />
    </Svg>
  );
}

export function ClockIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={16} cy={17} r={12} fill={accents.blue.solid} {...cut()} />
      <Circle cx={16} cy={17} r={8.6} fill={CREAM} {...cut(1.8)} />
      <Path d="M16 11.4V17l4 2.4" {...cut(2.2)} fill="none" />
      <Path d="M11 4.6 8 7.4M21 4.6l3 2.8" {...cut(2.2)} />
    </Svg>
  );
}

export function TargetIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={16} cy={16} r={12} fill={accents.rose.solid} {...cut()} />
      <Circle cx={16} cy={16} r={7.6} fill={CREAM} {...cut(1.8)} />
      <Circle cx={16} cy={16} r={3.4} fill={accents.rose.solid} {...cut(1.6)} />
    </Svg>
  );
}

/** Something worth shouting about. */
export function PartyIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M3.6 28.4 10 11.4l10.6 10.6Z" fill={accents.amber.solid} {...cut()} />
      <Path d="M3.6 28.4 10 11.4l5.4 5.4Z" fill={accents.flame.solid} {...cut(1.6)} />
      <Path d="M19 4.4v3M25.4 6.6l-2.2 2.2M28 13h-3M23.6 17.6l2.2 2.2" {...cut(2.2)} />
      <Circle cx={20.4} cy={12.4} r={2} fill={accents.rose.solid} {...cut(1.6)} />
    </Svg>
  );
}

/* --------------------------------------------------------------- controls */

export function PlayIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M9 5.6 26 16 9 26.4Z" fill={color} stroke={color} strokeWidth={3.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M5.6 16.6 12.6 23.4 26.4 8.6" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function CloseIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M8 8 24 24M24 8 8 24" stroke={color} strokeWidth={3.6} strokeLinecap="round" />
    </Svg>
  );
}

export function BackIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M19.4 6 9.4 16l10 10" stroke={color} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ChevronIcon({ size = 20, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12.6 7 21.4 16l-8.8 9" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function SpeakerIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M5 12.6h4.4L16 6.6v18.8l-6.6-6H5a1.4 1.4 0 0 1-1.4-1.4v-3.4A1.4 1.4 0 0 1 5 12.6Z" fill={color} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M20.4 12a5.6 5.6 0 0 1 0 8M24.4 8a11 11 0 0 1 0 16" stroke={color} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function SendIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M27.4 4.6 4.6 13.4l9.2 3.6 3.6 9.2Z" fill={color} stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M13.8 17 27.4 4.6" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M27 16a11 11 0 1 1-3.4-8" stroke={color} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Path d="M27.4 4.6v7.2h-7.2" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** A pennant, for a rank on the trail. */
export function FlagIcon({ size = 24, color }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M8.6 28V4" {...cut(2.6)} />
      <Path d="M9.6 5.4 25 10 9.6 14.6Z" fill={color ?? accents.green.solid} {...cut()} />
    </Svg>
  );
}

/** The collection, which is a backpack full of things you picked up. */
export function PackIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M11 8.6V7a5 5 0 0 1 10 0v1.6" {...cut(2.4)} fill="none" />
      <Rect x={4.6} y={8.4} width={22.8} height={19.6} rx={5} fill={accents.teal.solid} {...cut()} />
      <Rect x={10} y={15} width={12} height={8} rx={2.4} fill={CREAM} {...cut(1.8)} />
      <Path d="M12.6 19h6.8" {...cut(2)} />
    </Svg>
  );
}

/** Indoors: a roof over your head, as opposed to the tent. */
export function HouseIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={7} y={13} width={18} height={15} rx={2.5} fill={accents.amber.solid} {...cut()} />
      <Path d="M3.4 14.6 16 3.6l12.6 11" {...cut(2.6)} fill="none" />
      <Rect x={13} y={19} width={6} height={9} rx={1.6} fill={accents.flame.solid} {...cut(1.8)} />
    </Svg>
  );
}

/** Phone down: a moon over a phone lying flat. */
export function MoonIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={4} y={21} width={24} height={7} rx={2.4} fill={accents.violet.solid} {...cut()} />
      <Path d="M19.6 3.6a8 8 0 1 0 8.8 11.2 6.4 6.4 0 0 1-8.8-11.2Z" fill={accents.amber.solid} {...cut(1.8)} />
    </Svg>
  );
}

/** Scanning a badge: a viewfinder with a code inside. */
export function ScanIcon({ size = 24, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M4.6 11V7a2.4 2.4 0 0 1 2.4-2.4h4M21 4.6h4A2.4 2.4 0 0 1 27.4 7v4M27.4 21v4a2.4 2.4 0 0 1-2.4 2.4h-4M11 27.4H7A2.4 2.4 0 0 1 4.6 25v-4" stroke={color} strokeWidth={3} strokeLinecap="round" fill="none" />
      <Rect x={10.4} y={10.4} width={4.6} height={4.6} rx={1} fill={color} />
      <Rect x={17} y={10.4} width={4.6} height={4.6} rx={1} fill={color} />
      <Rect x={10.4} y={17} width={4.6} height={4.6} rx={1} fill={color} />
      <Rect x={17.8} y={17.8} width={3} height={3} rx={0.8} fill={color} />
    </Svg>
  );
}

export function PlusIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M16 6.6v18.8M6.6 16h18.8" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

export function MinusIcon({ size = 22, color = palette.ink }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M6.6 16h18.8" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

/** A magnifying glass over a question mark: the secret object. */
export function ClueIcon({ size = 24 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M20.4 20.4 28 28" {...cut(3.4)} />
      <Circle cx={13.6} cy={13.6} r={9.6} fill={accents.teal.solid} {...cut()} />
      <Circle cx={13.6} cy={13.6} r={6.4} fill={CREAM} {...cut(1.8)} />
      <Path d="M11.6 11.8a2.2 2.2 0 1 1 3 2c-.8.3-1 .8-1 1.5" {...cut(1.8)} fill="none" />
      <Circle cx={13.6} cy={17.6} r={0.5} fill={INK} {...cut(1.4)} />
    </Svg>
  );
}

/** Grouped so a screen can pull one by name without a long import list. */
export const Glyph = {
  Home: HomeIcon,
  Route: RouteIcon,
  Search: SearchIcon,
  Shoe: ShoeIcon,
  Chat: ChatIcon,
  Star: StarFilledIcon,
  Flame: FlameIcon,
  Coin: CoinIcon,
  Bolt: BoltIcon,
  Trophy: TrophyIcon,
  Lock: LockIcon,
  Bulb: BulbIcon,
  Camera: CameraIcon,
  Book: BookIcon,
  Gift: GiftIcon,
  Tree: TreeIcon,
  Leaf: LeafIcon,
  Spark: SparkIcon,
  Clock: ClockIcon,
  Target: TargetIcon,
  Party: PartyIcon,
  Flag: FlagIcon,
  Pack: PackIcon,
  House: HouseIcon,
} as const;
