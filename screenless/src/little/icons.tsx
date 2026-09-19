import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { tones, world } from './theme';

/**
 * Icons for the 3-5 interface.
 *
 * Drawn here rather than taken from an emoji font: emoji look different on
 * every phone, some Androids draw them as flat grey outlines, and a child who
 * learns that the green map means "the journey" needs it to look the same
 * everywhere. Flat, two tones per shape, no outlines, like the scenery.
 * Every icon is drawn in a 48 unit box.
 */

type IconProps = { size?: number };
type InkIconProps = IconProps & { color?: string };

const box = (size: number) => ({ width: size, height: size, viewBox: '0 0 48 48' });

export function HomeIcon({ size = 36 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M9 23 L24 10 L39 23 V39 A4 4 0 0 1 35 43 H13 A4 4 0 0 1 9 39 Z" fill="#FFE3A3" />
      <Path d="M24 10 L39 23 V39 A4 4 0 0 1 35 43 H24 Z" fill="#F7D185" />
      <Path
        d="M4.5 22.5 L22 7 A3 3 0 0 1 26 7 L43.5 22.5 A2.6 2.6 0 0 1 40 26.4 L24 12.4 L8 26.4 A2.6 2.6 0 0 1 4.5 22.5 Z"
        fill={tones.coral.face}
      />
      <Path d="M24 6.2 A3 3 0 0 1 26 7 L43.5 22.5 A2.6 2.6 0 0 1 40 26.4 L24 12.4 Z" fill={tones.coral.lip} />
      <Rect x={19} y={28} width={10} height={15} rx={4} fill={tones.sky.face} />
      <Circle cx={26} cy={36} r={1.2} fill="#FFFFFF" />
    </Svg>
  );
}

export function MapIcon({ size = 36 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M5 13 L17 9 V39 L5 43 Z" fill={world.grassDark} />
      <Path d="M17 9 L31 13 V43 L17 39 Z" fill={world.grass} />
      <Path d="M31 13 L43 9 V39 L31 43 Z" fill={world.grassDark} />
      <Path d="M9 31 C 14 26, 22 34, 27 27 S 38 24, 40 20" stroke="#FFF1C4" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeDasharray="0.1 5" />
      <Path
        d="M30 4 C 24.2 4 20 8.4 20 14 C 20 21.5 30 31 30 31 C 30 31 40 21.5 40 14 C 40 8.4 35.8 4 30 4 Z"
        fill={tones.coral.face}
      />
      <Path d="M30 4 C 35.8 4 40 8.4 40 14 C 40 21.5 30 31 30 31 Z" fill={tones.coral.lip} />
      <Circle cx={30} cy={14} r={3.8} fill="#FFFFFF" />
    </Svg>
  );
}

export function ExploreIcon({ size = 36 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M31 31 L41.5 41.5" stroke={world.woodDark} strokeWidth={8} strokeLinecap="round" />
      <Path d="M31 31 L41.5 41.5" stroke={world.wood} strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={21} cy={21} r={15} fill={tones.mint.lip} />
      <Circle cx={21} cy={21} r={11.2} fill="#E3F7EC" />
      <Path d="M13.5 27 C 12.5 18.5, 18 12.8, 27.5 13.2 C 28.2 22, 22.5 27.8, 13.5 27 Z" fill={world.grassDark} />
      <Path d="M15 25.5 L 24.5 16" stroke={world.grassDeep} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12.5 15.5 A10 10 0 0 1 17 11.5" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.8} />
    </Svg>
  );
}

export function WalkIcon({ size = 36 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M5 31 C 5 25, 8 21, 12.5 20 L 18.5 19 C 20.5 18.6 21.6 17.2 22.2 15.5 L 23.4 12 C 24 10.3 25.8 9.5 27.4 10.1 L 30.2 11.2 C 31.8 11.8 32.5 13.5 31.9 15.1 L 31.3 17 C 33.5 21.2 37.5 23.4 41.5 24.8 C 43.8 25.6 44.5 27.8 44.5 31 Z"
        fill={tones.coral.face}
      />
      <Path d="M31.3 17 C 33.5 21.2 37.5 23.4 41.5 24.8 C 43.8 25.6 44.5 27.8 44.5 31 H 33 C 33 25 32.5 20.5 31.3 17 Z" fill={tones.coral.lip} />
      <Rect x={4} y={30} width={41.5} height={8.5} rx={4.25} fill="#FFFFFF" />
      <Rect x={4} y={34.5} width={41.5} height={4} rx={2} fill="#E6DAC4" />
      <Path d="M19.5 23.5 L 24.5 22 M 21 27 L 26 25.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export function StarIcon({ size = 28 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M24 5 L29.6 17.3 L43 18.8 L33 27.9 L35.8 41.2 L24 34.5 L12.2 41.2 L15 27.9 L5 18.8 L18.4 17.3 Z"
        fill="#FFC83D"
        stroke="#FFC83D"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Path
        d="M24 25 L43 18.8 L33 27.9 L35.8 41.2 L24 34.5 Z"
        fill="#F2A922"
        stroke="#F2A922"
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Ellipse cx={17.5} cy={21} rx={2.6} ry={1.8} fill="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}

export function FlameIcon({ size = 28 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M24 4 C 30 12, 38.5 18, 38.5 29 C 38.5 37.6 32 44 24 44 C 16 44 9.5 37.6 9.5 29 C 9.5 22 13.5 18 17 14 C 17.5 19 19.5 21 21.5 21.5 C 21 14 22 9 24 4 Z"
        fill="#FF7A3D"
      />
      <Path
        d="M24 22 C 27.5 26 31 29 31 33.5 C 31 37.6 27.9 41 24 41 C 20.1 41 17 37.6 17 33.5 C 17 30 19.5 27.5 21.5 25.5 C 22 27.5 23 28.5 24 28.5 C 23.5 26 23.4 24.2 24 22 Z"
        fill="#FFD34D"
      />
    </Svg>
  );
}

export function CoinIcon({ size = 28 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={24} cy={26} r={19} fill="#E0A21B" />
      <Circle cx={24} cy={23} r={19} fill="#FFC83D" />
      <Circle cx={24} cy={23} r={12.5} fill="none" stroke="#F2B01E" strokeWidth={3} />
      <Path d="M24 15.5 L26.3 20.2 L31.4 20.8 L27.6 24.3 L28.7 29.3 L24 26.8 L19.3 29.3 L20.4 24.3 L16.6 20.8 L21.7 20.2 Z" fill="#F2A922" />
    </Svg>
  );
}

export function PlayIcon({ size = 32, color = '#FFFFFF' }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M16 11.8 A3 3 0 0 1 20.5 9.2 L39.5 20.8 A3 3 0 0 1 39.5 26 L20.5 37.6 A3 3 0 0 1 16 35 Z" fill={color} />
    </Svg>
  );
}

export function CheckIcon({ size = 32, color = '#FFFFFF' }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M11.5 25.5 L20.5 34 L36.5 15" stroke={color} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function CloseIcon({ size = 28, color = tones.white.ink }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M15 15 L33 33 M33 15 L15 33" stroke={color} strokeWidth={6} strokeLinecap="round" />
    </Svg>
  );
}

export function BackIcon({ size = 28, color = tones.white.ink }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M29.5 11 L16.5 24 L29.5 37" stroke={color} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function SpeakerIcon({ size = 30, color = tones.white.ink }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path
        d="M7 20 A3 3 0 0 1 10 17 H16 L25 9.5 A1.8 1.8 0 0 1 28 10.9 V37.1 A1.8 1.8 0 0 1 25 38.5 L16 31 H10 A3 3 0 0 1 7 28 Z"
        fill={color}
      />
      <Path d="M33.5 17.5 A9 9 0 0 1 33.5 30.5" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />
      <Path d="M38.5 12.5 A16 16 0 0 1 38.5 35.5" stroke={color} strokeWidth={3.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function LockIcon({ size = 28 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M15.5 22 V16.5 A8.5 8.5 0 0 1 32.5 16.5 V22" stroke="#A8977F" strokeWidth={5} fill="none" />
      <Rect x={9} y={20} width={30} height={23} rx={7} fill="#FFC83D" />
      <Rect x={9} y={33} width={30} height={10} rx={5} fill="#F2B01E" />
      <Circle cx={24} cy={29.5} r={3.4} fill="#6B5A48" />
      <Rect x={22.4} y={30} width={3.2} height={7} rx={1.6} fill="#6B5A48" />
    </Svg>
  );
}

export function CameraIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={15} y={8} width={18} height={9} rx={3.5} fill={tones.grape.lip} />
      <Rect x={5} y={13} width={38} height={28} rx={8} fill={tones.grape.face} />
      <Rect x={5} y={30} width={38} height={11} rx={5.5} fill={tones.grape.lip} opacity={0.35} />
      <Circle cx={24} cy={27} r={10} fill="#ECE6FF" />
      <Circle cx={24} cy={27} r={5.8} fill={tones.grape.lip} />
      <Circle cx={21.6} cy={24.6} r={2} fill="#FFFFFF" />
      <Rect x={34} y={17} width={5} height={3.5} rx={1.75} fill="#FFD34D" />
    </Svg>
  );
}

export function BookIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M4 13 C 11 10.5, 18.5 11.5, 23 14.5 V 41 C 18.5 38, 11 37.5, 4 39.5 Z" fill="#56B7F2" />
      <Path d="M44 13 C 37 10.5, 29.5 11.5, 25 14.5 V 41 C 29.5 38, 37 37.5, 44 39.5 Z" fill="#8ACFF8" />
      <Rect x={22.5} y={13.5} width={3} height={28.5} rx={1.5} fill={tones.sky.lip} />
      <Path d="M29.5 20 C 33 19, 36.5 19, 39.5 19.8 M 29.5 26 C 33 25, 36.5 25, 39.5 25.8" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function GiftIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M24 16 C 17 3.5, 7 10, 15.5 16 Z" fill="#FFC83D" />
      <Path d="M24 16 C 31 3.5, 41 10, 32.5 16 Z" fill="#F2A922" />
      <Rect x={8} y={22} width={32} height={21} rx={5} fill={tones.bubble.face} />
      <Rect x={24} y={22} width={16} height={21} rx={5} fill={tones.bubble.lip} opacity={0.45} />
      <Rect x={5} y={15} width={38} height={10} rx={4.5} fill="#F27DB5" />
      <Rect x={21} y={15} width={6} height={28} rx={2} fill="#FFC83D" />
    </Svg>
  );
}

export function PodiumIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={17} y={20} width={14} height={23} rx={3} fill="#FFC83D" />
      <Rect x={4.5} y={28} width={13.5} height={15} rx={3} fill="#F2B01E" />
      <Rect x={30} y={32} width={13.5} height={11} rx={3} fill="#F2B01E" />
      <Path d="M24 5 L26.6 10.3 L32.4 11 L28.1 14.9 L29.3 20.6 L24 17.7 L18.7 20.6 L19.9 14.9 L15.6 11 L21.4 10.3 Z" fill={tones.coral.face} />
      <Path d="M22.5 29 L 25.5 26 V 37" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ClockIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={24} cy={26} r={18} fill={tones.sky.lip} />
      <Circle cx={24} cy={24} r={18} fill={tones.sky.face} />
      <Circle cx={24} cy={24} r={13.5} fill="#FFFFFF" />
      <Path d="M24 15.5 V 24 L 30 27.5" stroke={tones.white.ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={24} cy={24} r={2.2} fill={tones.coral.face} />
    </Svg>
  );
}

export function FootprintIcon({ size = 28, color = tones.coral.face }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M22 17.5 C 28 17.5 31 23.5 30 31.5 C 29 38.5 26 43 21.5 43 C 17 43 15 38.5 15.5 32 C 16 23.5 17 17.5 22 17.5 Z" fill={color} />
      <Ellipse cx={17} cy={11.5} rx={2.6} ry={3.2} fill={color} />
      <Ellipse cx={22.5} cy={8.5} rx={3} ry={3.6} fill={color} />
      <Ellipse cx={28.5} cy={10} rx={2.6} ry={3.2} fill={color} />
      <Ellipse cx={32.5} cy={14.5} rx={2.2} ry={2.7} fill={color} />
    </Svg>
  );
}

export function SparkleIcon({ size = 24, color = '#FFFFFF' }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M24 3 C 25.6 16 32 22.4 45 24 C 32 25.6 25.6 32 24 45 C 22.4 32 16 25.6 3 24 C 16 22.4 22.4 16 24 3 Z" fill={color} />
    </Svg>
  );
}

export function TreeIcon({ size = 40 }: IconProps) {
  return (
    <Svg {...box(size)}>
      <Rect x={20.5} y={28} width={7} height={16} rx={3} fill={world.wood} />
      <Circle cx={24} cy={19} r={15} fill={world.grassDark} />
      <Circle cx={17} cy={24} r={9} fill={world.grass} />
      <Circle cx={31} cy={23} r={9.5} fill={world.grassDeep} />
      <Circle cx={21} cy={13} r={3} fill="#FFFFFF" opacity={0.35} />
    </Svg>
  );
}

export function TalkIcon({ size = 36, color = tones.white.ink }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Path d="M8 10 H40 A5 5 0 0 1 45 15 V30 A5 5 0 0 1 40 35 H22 L13 42 V35 H8 A5 5 0 0 1 3 30 V15 A5 5 0 0 1 8 10 Z" fill={color} />
      <Circle cx={15} cy={22.5} r={2.8} fill="#FFFFFF" />
      <Circle cx={24} cy={22.5} r={2.8} fill="#FFFFFF" />
      <Circle cx={33} cy={22.5} r={2.8} fill="#FFFFFF" />
    </Svg>
  );
}

export function TargetIcon({ size = 28, color = tones.white.ink }: InkIconProps) {
  return (
    <Svg {...box(size)}>
      <Circle cx={24} cy={24} r={13} stroke={color} strokeWidth={4.5} fill="none" />
      <Circle cx={24} cy={24} r={5} fill={color} />
      <Path d="M24 4 V11 M24 37 V44 M4 24 H11 M37 24 H44" stroke={color} strokeWidth={4.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Faces for "why not this one": too hard, not fun, not now. */
export function FaceIcon({ size = 56, mood }: IconProps & { mood: 'hard' | 'bored' | 'later' }) {
  const fill = mood === 'hard' ? '#FF9F6E' : mood === 'bored' ? '#FFD34D' : '#9ED8FA';
  const cheek = mood === 'hard' ? '#F2705A' : '#FFB0A0';
  return (
    <Svg {...box(size)}>
      <Circle cx={24} cy={26} r={20} fill="rgba(42,33,24,0.12)" />
      <Circle cx={24} cy={24} r={20} fill={fill} />
      <Ellipse cx={14} cy={29} rx={3.6} ry={2.4} fill={cheek} opacity={0.7} />
      <Ellipse cx={34} cy={29} rx={3.6} ry={2.4} fill={cheek} opacity={0.7} />
      {mood === 'hard' ? (
        <G stroke={tones.white.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M13 16 L19 19.5 L13 23" />
          <Path d="M35 16 L29 19.5 L35 23" />
          <Path d="M16 34 Q 20 31 24 34 T 32 34" />
        </G>
      ) : mood === 'bored' ? (
        <G stroke={tones.white.ink} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M13 21 H20" />
          <Path d="M28 21 H35" />
          <Path d="M18 33 H30" />
        </G>
      ) : (
        <G stroke={tones.white.ink} strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M13 21 Q 16.5 24 20 21" />
          <Path d="M28 21 Q 31.5 24 35 21" />
          <Circle cx={24} cy={33} r={3} />
          <Path d="M36 6 H42 L36 12 H42" strokeWidth={2.4} strokeLinejoin="round" />
        </G>
      )}
    </Svg>
  );
}
