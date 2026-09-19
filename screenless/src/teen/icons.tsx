import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ICON_DEFAULT } from './theme';

/**
 * Icons for the 10 to 14 interface.
 *
 * Thin geometric strokes on a 24 unit grid, one colour, drawn from the same
 * small vocabulary of angles so a row of them looks like one set.
 *
 * A line icon was the wrong call for seven year olds — at that age an icon has
 * to be an object with a personality, because it is carrying meaning a child
 * cannot yet read. Here the opposite holds: the label beside the icon does the
 * explaining, the icon is a landmark, and anything cuter than this reads as
 * condescension. The character comes from the restraint and from the acid
 * colour they are drawn in, not from the drawing.
 */

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const box = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24' });

const line = (color: string, strokeWidth: number) => ({
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

const SW = 1.75;

/* ------------------------------------------------------------------- tabs */

/** Today. A square with the day marked. */
export function TodayIcon({ size = 22, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={3.2} y={4.8} width={17.6} height={16} rx={3} {...line(color, strokeWidth)} />
      <Path d="M3.2 9.6h17.6M8 3.2v3.2M16 3.2v3.2" {...line(color, strokeWidth)} />
      <Rect x={7} y={12.6} width={4} height={4} rx={1.2} fill={color} />
    </Svg>
  );
}

/** Progress. Three rising columns. */
export function ProgressIcon({ size = 22, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M3.4 20.6h17.2" {...line(color, strokeWidth)} />
      <Path d="M6.8 20.6v-5.2M12 20.6V9.4M17.2 20.6V4.6" {...line(color, strokeWidth + 0.6)} />
    </Svg>
  );
}

/** The collection. A grid with one cell filled. */
export function CollectionIcon({ size = 22, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={3.4} y={3.4} width={7.4} height={7.4} rx={2} {...line(color, strokeWidth)} />
      <Rect x={13.2} y={3.4} width={7.4} height={7.4} rx={2} fill={color} />
      <Rect x={3.4} y={13.2} width={7.4} height={7.4} rx={2} {...line(color, strokeWidth)} />
      <Rect x={13.2} y={13.2} width={7.4} height={7.4} rx={2} {...line(color, strokeWidth)} />
    </Svg>
  );
}

/** Steps. Two strides. */
export function StepsIcon({ size = 22, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M7.4 3.4c2 0 3.2 1.4 3.2 3.6 0 2.6-.8 3.8-.8 5.6H5c0-1.8-.8-3-.8-5.6 0-2.2 1.2-3.6 3.2-3.6Z" {...line(color, strokeWidth)} />
      <Path d="M5.4 15.2h4.2" {...line(color, strokeWidth)} />
      <Path d="M16.6 8.2c2 0 3.2 1.4 3.2 3.6 0 2.6-.8 3.8-.8 5.6h-4.8c0-1.8-.8-3-.8-5.6 0-2.2 1.2-3.6 3.2-3.6Z" {...line(color, strokeWidth)} />
      <Path d="M14.6 20h4.2" {...line(color, strokeWidth)} />
    </Svg>
  );
}

/** The buddy. A message, squared off. */
export function MessageIcon({ size = 22, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M3.6 6.4a2.6 2.6 0 0 1 2.6-2.6h11.6a2.6 2.6 0 0 1 2.6 2.6v8a2.6 2.6 0 0 1-2.6 2.6H9.6l-4.6 3.6a.8.8 0 0 1-1.4-.6Z" {...line(color, strokeWidth)} />
      <Path d="M8.2 10.4h7.6" {...line(color, strokeWidth)} />
    </Svg>
  );
}

/* ----------------------------------------------------------------- scores */

export function StarIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 3.2 14.7 9l6.3.8-4.6 4.4 1.2 6.2L12 17.4 6.4 20.4l1.2-6.2L3 9.8 9.3 9Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

export function StarOutlineIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 3.2 14.7 9l6.3.8-4.6 4.4 1.2 6.2L12 17.4 6.4 20.4l1.2-6.2L3 9.8 9.3 9Z" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function FlameIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 2.8c3 4 6.6 6.2 6.6 10.6a6.6 6.6 0 1 1-13.2 0c0-2.8 1.6-4.6 3.2-6.2.3 2.4 1 3.4 2 3.6-.3-3.6.2-5.8 1.4-8Z" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function CoinIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={12} cy={12} r={8.6} {...line(color, strokeWidth)} />
      <Path d="M12 7.6v8.8M9.8 9.6h3.4a1.8 1.8 0 0 1 0 3.6h-2.4a1.8 1.8 0 0 0 0 3.6h3.4" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function BoltIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M13.4 2.6 5 13.6h5.6l-.8 7.8 8.4-11.2h-5.6Z" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
}

/** Rank. A chevron stack. */
export function RankIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M5.4 11 12 4.6 18.6 11" {...line(color, strokeWidth + 0.5)} />
      <Path d="M5.4 19.4 12 13l6.6 6.4" {...line(color, strokeWidth + 0.5)} />
    </Svg>
  );
}

/* --------------------------------------------------------------- controls */

export function PlayIcon({ size = 20, color = ICON_DEFAULT }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M8 5.2 19 12 8 18.8Z" fill={color} stroke={color} strokeWidth={2.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M4.8 12.6 9.6 17.4 19.4 6.8" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function BackIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M15 5 8 12l7 7" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color = ICON_DEFAULT, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M9.4 5.4 16 12l-6.6 6.6" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function SpeakerIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M4 9.4h3.4L12 5.4v13.2l-4.6-4H4a1 1 0 0 1-1-1v-3.2a1 1 0 0 1 1-1Z" {...line(color, strokeWidth)} />
      <Path d="M15.6 9.4a4 4 0 0 1 0 5.2M18.4 6.8a8 8 0 0 1 0 10.4" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function BulbIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 3a6 6 0 0 0-3.4 11c.6.4.8 1 .8 1.6v.6h5.2v-.6c0-.6.2-1.2.8-1.6A6 6 0 0 0 12 3Z" {...line(color, strokeWidth)} />
      <Path d="M9.8 19.2h4.4M10.6 21.6h2.8" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function CameraIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M3.4 8.6a2 2 0 0 1 2-2h1.8l1.2-2.2h7.2l1.2 2.2h1.8a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2Z" {...line(color, strokeWidth)} />
      <Circle cx={12} cy={13} r={3.6} {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function BookIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 6.4C10 4.8 7.2 4.2 3.8 4.6v13.6c3.4-.4 6.2.2 8.2 1.8 2-1.6 4.8-2.2 8.2-1.8V4.6c-3.4-.4-6.2.2-8.2 1.8Z" {...line(color, strokeWidth)} />
      <Path d="M12 6.4V20" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function GiftIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={3.4} y={8.6} width={17.2} height={4} rx={1.4} {...line(color, strokeWidth)} />
      <Path d="M5 12.6v6.6a1.4 1.4 0 0 0 1.4 1.4h11.2a1.4 1.4 0 0 0 1.4-1.4v-6.6M12 8.6v12" {...line(color, strokeWidth)} />
      <Path d="M12 8.6C10.6 5.2 9 3.4 7.4 4.1 5.9 4.7 6.4 7.8 12 8.6ZM12 8.6c1.4-3.4 3-5.2 4.6-4.5 1.5.6 1 3.7-4.6 4.5Z" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function TreeIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 3.4 6.8 11h3L5.8 17h12.4L14.2 11h3Z" {...line(color, strokeWidth)} />
      <Path d="M12 17v3.6" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function LeafIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M20 4c0 9.4-4.4 13.8-10 13.8A6 6 0 0 1 4 11.8C4 6.6 10.6 4 20 4Z" {...line(color, strokeWidth)} />
      <Path d="M4.6 20.4C7 14.4 11 10.6 16.6 8.4" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function SparkIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 3.2c.8 5 2.4 6.6 7.4 7.4-5 .8-6.6 2.4-7.4 7.4-.8-5-2.4-6.6-7.4-7.4 5-.8 6.6-2.4 7.4-7.4Z" {...line(color, strokeWidth)} />
      <Path d="M18.6 17.4c.3 1.8.8 2.3 2.6 2.6-1.8.3-2.3.8-2.6 2.6-.3-1.8-.8-2.3-2.6-2.6 1.8-.3 2.3-.8 2.6-2.6Z" {...line(color, strokeWidth * 0.8)} />
    </Svg>
  );
}

export function ClockIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={12} cy={12} r={8.8} {...line(color, strokeWidth)} />
      <Path d="M12 6.8V12l3.4 2.2" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function TargetIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={12} cy={12} r={8.8} {...line(color, strokeWidth)} />
      <Circle cx={12} cy={12} r={4.4} {...line(color, strokeWidth)} />
      <Circle cx={12} cy={12} r={1.3} fill={color} />
    </Svg>
  );
}

export function SearchIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={10.8} cy={10.8} r={6.8} {...line(color, strokeWidth)} />
      <Path d="M15.8 15.8 20.6 20.6" {...line(color, strokeWidth + 0.3)} />
    </Svg>
  );
}

export function SendIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M20.6 3.4 3.4 10.2l7.2 2.8 2.8 7.2Z" {...line(color, strokeWidth + 0.4)} />
      <Path d="M10.6 13 20.6 3.4" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function RefreshIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M20 12a8 8 0 1 1-2.4-5.6" {...line(color, strokeWidth)} />
      <Path d="M20.4 3.6v5.2h-5.2" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function LockIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={4.6} y={10.4} width={14.8} height={10} rx={2.6} {...line(color, strokeWidth)} />
      <Path d="M8 10.4V7.6a4 4 0 0 1 8 0v2.8" {...line(color, strokeWidth)} />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M12 5v14M5 12h14" {...line(color, strokeWidth)} />
    </Svg>
  );
}

/** The skin switch, in its two states. */
export function SunIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={12} cy={12} r={4.6} {...line(color, strokeWidth)} />
      <Path
        d="M12 2.6v2.4M12 19v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.6 12h2.4M19 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
        {...line(color, strokeWidth)}
      />
    </Svg>
  );
}

export function MoonIcon({ size = 20, color = ICON_DEFAULT, strokeWidth = SW }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M20.4 14.6A8.8 8.8 0 0 1 9.4 3.6a8.8 8.8 0 1 0 11 11Z" {...line(color, strokeWidth)} />
    </Svg>
  );
}
