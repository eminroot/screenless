import { memo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { MAP_W, SECTION_H, STONES, TRAIL_LENGTH, TRAIL_PATH, type Stone } from './trail';

/**
 * The scenery of the 3-5 journey map, one band per place.
 *
 * Everything is flat shapes in two tones with no outlines, in map units. Each
 * band is its own small SVG rather than one tall picture: a single drawing
 * three thousand units high would be a very large surface for an old phone to
 * keep, and bands leave room to skip the ones off screen later.
 *
 * Rows count from the top: row 0 is space, row 6 is camp.
 */

const SHADOW = 'rgba(42,33,24,0.13)';

export const ROW_GROUND = [
  '#302C74', // space
  '#FFD6EA', // castle
  '#FFDC92', // desert
  '#FFE9B1', // beach
  '#BFE6A8', // mountain
  '#8ED06F', // forest
  '#A8E08B', // camp
];

/* ------------------------------------------------------------ primitives */

type At = { x: number; y: number; s?: number };

function RoundTree({ x, y, s = 1, dark = '#4FA63C', mid = '#6CC24A', light = '#8FD66E' }: At & { dark?: string; mid?: string; light?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={17 * s} ry={5.5 * s} fill={SHADOW} />
      <Rect x={x - 3.5 * s} y={y - 16 * s} width={7 * s} height={18 * s} rx={3 * s} fill="#9A6433" />
      <Circle cx={x} cy={y - 30 * s} r={17 * s} fill={mid} />
      <Circle cx={x + 7 * s} cy={y - 24 * s} r={11 * s} fill={dark} />
      <Circle cx={x - 7 * s} cy={y - 33 * s} r={9 * s} fill={light} />
      <Circle cx={x - 8 * s} cy={y - 37 * s} r={3 * s} fill="#FFFFFF" opacity={0.28} />
    </G>
  );
}

function Pine({ x, y, s = 1, dark = '#2F8A4B', light = '#43A95E' }: At & { dark?: string; light?: string }) {
  const tier = (top: number, half: number, height: number) =>
    `M${x},${y - top * s} L${x + half * s},${y - (top - height) * s} L${x - half * s},${y - (top - height) * s} Z`;
  const shade = (top: number, half: number, height: number) =>
    `M${x},${y - top * s} L${x + half * s},${y - (top - height) * s} L${x},${y - (top - height) * s} Z`;
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={15 * s} ry={5 * s} fill={SHADOW} />
      <Rect x={x - 3 * s} y={y - 10 * s} width={6 * s} height={12 * s} rx={2 * s} fill="#8F5A2C" />
      <Path d={tier(34, 17, 26)} fill={light} />
      <Path d={shade(34, 17, 26)} fill={dark} />
      <Path d={tier(50, 13, 22)} fill={light} />
      <Path d={shade(50, 13, 22)} fill={dark} />
      <Path d={tier(62, 9, 16)} fill={light} />
      <Path d={shade(62, 9, 16)} fill={dark} />
    </G>
  );
}

function Bush({ x, y, s = 1, color = '#6CC24A', shade = '#58B33B' }: At & { color?: string; shade?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 1 * s} rx={16 * s} ry={4.5 * s} fill={SHADOW} />
      <Circle cx={x - 8 * s} cy={y - 6 * s} r={8 * s} fill={color} />
      <Circle cx={x + 8 * s} cy={y - 6 * s} r={8 * s} fill={shade} />
      <Circle cx={x} cy={y - 11 * s} r={10 * s} fill={color} />
    </G>
  );
}

function Flower({ x, y, s = 1, color = '#FF8FC7' }: At & { color?: string }) {
  const r = 3.4 * s;
  return (
    <G>
      <Circle cx={x} cy={y - r} r={r} fill={color} />
      <Circle cx={x + r} cy={y} r={r} fill={color} />
      <Circle cx={x} cy={y + r} r={r} fill={color} />
      <Circle cx={x - r} cy={y} r={r} fill={color} />
      <Circle cx={x} cy={y} r={2.6 * s} fill="#FFD34D" />
    </G>
  );
}

function Tuft({ x, y, s = 1, color = '#6CC24A' }: At & { color?: string }) {
  return (
    <Path
      d={`M${x - 7 * s},${y} Q${x - 6 * s},${y - 8 * s} ${x - 3 * s},${y - 11 * s} Q${x - 2 * s},${y - 5 * s} ${x},${y - 3 * s} Q${x + 2 * s},${y - 9 * s} ${x + 5 * s},${y - 12 * s} Q${x + 5 * s},${y - 5 * s} ${x + 7 * s},${y} Z`}
      fill={color}
    />
  );
}

function Rock({ x, y, s = 1, color = '#C9C1B4', shade = '#AFA597' }: At & { color?: string; shade?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 1 * s} rx={15 * s} ry={4 * s} fill={SHADOW} />
      <Path d={`M${x - 14 * s},${y} Q${x - 14 * s},${y - 15 * s} ${x - 2 * s},${y - 16 * s} Q${x + 13 * s},${y - 15 * s} ${x + 14 * s},${y} Z`} fill={color} />
      <Path d={`M${x + 1 * s},${y - 16 * s} Q${x + 13 * s},${y - 15 * s} ${x + 14 * s},${y} L${x + 2 * s},${y} Z`} fill={shade} />
    </G>
  );
}

function Tent({ x, y, s = 1, color = '#EC5B3F', shade = '#C4432B' }: At & { color?: string; shade?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={26 * s} ry={6 * s} fill={SHADOW} />
      <Path d={`M${x},${y - 34 * s} L${x + 24 * s},${y} L${x - 24 * s},${y} Z`} fill={color} />
      <Path d={`M${x},${y - 34 * s} L${x + 24 * s},${y} L${x},${y} Z`} fill={shade} />
      <Path d={`M${x},${y - 18 * s} L${x + 8 * s},${y} L${x - 8 * s},${y} Z`} fill="#5A2418" />
      <Path d={`M${x},${y - 34 * s} L${x},${y - 43 * s} L${x + 9 * s},${y - 40 * s} L${x},${y - 37 * s}`} fill="#FFFFFF" />
    </G>
  );
}

function Campfire({ x, y, s = 1 }: At) {
  return (
    <G>
      <Circle cx={x} cy={y} r={18 * s} fill="#FFE89A" opacity={0.55} />
      <Circle cx={x - 12 * s} cy={y + 3 * s} r={4 * s} fill="#AFA597" />
      <Circle cx={x + 12 * s} cy={y + 3 * s} r={4 * s} fill="#AFA597" />
      <Circle cx={x} cy={y + 8 * s} r={4 * s} fill="#C9C1B4" />
      <Rect x={x - 11 * s} y={y - 1 * s} width={22 * s} height={5 * s} rx={2.5 * s} fill="#8F5A2C" transform={`rotate(-18 ${x} ${y})`} />
      <Rect x={x - 11 * s} y={y - 1 * s} width={22 * s} height={5 * s} rx={2.5 * s} fill="#B7773F" transform={`rotate(18 ${x} ${y})`} />
      <Path d={`M${x},${y - 20 * s} C${x + 9 * s},${y - 10 * s} ${x + 9 * s},${y} ${x},${y} C${x - 9 * s},${y} ${x - 9 * s},${y - 10 * s} ${x},${y - 20 * s} Z`} fill="#FF7A3D" />
      <Path d={`M${x},${y - 11 * s} C${x + 4.5 * s},${y - 6 * s} ${x + 4.5 * s},${y - 1 * s} ${x},${y - 1 * s} C${x - 4.5 * s},${y - 1 * s} ${x - 4.5 * s},${y - 6 * s} ${x},${y - 11 * s} Z`} fill="#FFD34D" />
    </G>
  );
}

function Pond({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 3} rx={rx} ry={ry} fill="#4DB4E6" />
      <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#72CDF5" />
      <Ellipse cx={x - rx * 0.35} cy={y - ry * 0.35} rx={rx * 0.3} ry={ry * 0.18} fill="#FFFFFF" opacity={0.45} />
      <Path d={`M${x + rx * 0.2},${y + ry * 0.25} a7 5 0 1 0 12 0 l-6 -2 Z`} fill="#6CC24A" />
    </G>
  );
}

function Mountain({ x, y, w, h, snow = true }: { x: number; y: number; w: number; h: number; snow?: boolean }) {
  const peak = { x, y: y - h };
  return (
    <G>
      <Path d={`M${x - w / 2},${y} L${peak.x},${peak.y} L${x + w / 2},${y} Z`} fill="#A9A2D9" />
      <Path d={`M${peak.x},${peak.y} L${x + w / 2},${y} L${x + w * 0.08},${y} Z`} fill="#8C84C7" />
      {snow ? (
        <Path
          d={`M${peak.x},${peak.y} L${x + w * 0.16},${y - h * 0.68} L${x + w * 0.07},${y - h * 0.62} L${x},${y - h * 0.7} L${x - w * 0.08},${y - h * 0.61} L${x - w * 0.17},${y - h * 0.67} Z`}
          fill="#FFFFFF"
        />
      ) : null}
    </G>
  );
}

function Palm({ x, y, s = 1 }: At) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={16 * s} ry={5 * s} fill={SHADOW} />
      <Path d={`M${x - 3 * s},${y} Q${x - 6 * s},${y - 22 * s} ${x + 4 * s},${y - 44 * s} L${x + 9 * s},${y - 43 * s} Q${x + 1 * s},${y - 22 * s} ${x + 4 * s},${y} Z`} fill="#B7773F" />
      <Path d={`M${x + 6 * s},${y - 44 * s} Q${x - 14 * s},${y - 56 * s} ${x - 26 * s},${y - 38 * s} Q${x - 10 * s},${y - 46 * s} ${x + 6 * s},${y - 44 * s} Z`} fill="#43A95E" />
      <Path d={`M${x + 6 * s},${y - 44 * s} Q${x + 26 * s},${y - 58 * s} ${x + 36 * s},${y - 38 * s} Q${x + 20 * s},${y - 47 * s} ${x + 6 * s},${y - 44 * s} Z`} fill="#2F8A4B" />
      <Path d={`M${x + 6 * s},${y - 44 * s} Q${x + 2 * s},${y - 66 * s} ${x + 18 * s},${y - 70 * s} Q${x + 10 * s},${y - 56 * s} ${x + 6 * s},${y - 44 * s} Z`} fill="#6CC24A" />
      <Circle cx={x + 4 * s} cy={y - 41 * s} r={3.5 * s} fill="#8F5A2C" />
    </G>
  );
}

function Umbrella({ x, y, s = 1 }: At) {
  return (
    <G>
      <Ellipse cx={x + 6 * s} cy={y + 2 * s} rx={20 * s} ry={5 * s} fill={SHADOW} />
      <Rect x={x - 1.5 * s} y={y - 30 * s} width={3 * s} height={31 * s} rx={1.5 * s} fill="#FFFFFF" />
      <Path d={`M${x - 24 * s},${y - 28 * s} Q${x},${y - 52 * s} ${x + 24 * s},${y - 28 * s} Z`} fill="#EC5B3F" />
      <Path d={`M${x - 8 * s},${y - 28 * s} Q${x},${y - 52 * s} ${x + 8 * s},${y - 28 * s} Z`} fill="#FFFFFF" />
      <Rect x={x + 5 * s} y={y - 4 * s} width={18 * s} height={8 * s} rx={3 * s} fill="#FFC83D" />
    </G>
  );
}

function Boat({ x, y, s = 1 }: At) {
  return (
    <G>
      <Path d={`M${x},${y - 38 * s} V${y - 6 * s}`} stroke="#8F5A2C" strokeWidth={2.4 * s} />
      <Path d={`M${x + 2 * s},${y - 36 * s} L${x + 20 * s},${y - 10 * s} H${x + 2 * s} Z`} fill="#FFFFFF" />
      <Path d={`M${x - 2 * s},${y - 30 * s} L${x - 14 * s},${y - 10 * s} H${x - 2 * s} Z`} fill="#FFE3DB" />
      <Path d={`M${x - 22 * s},${y - 7 * s} H${x + 24 * s} L${x + 16 * s},${y + 4 * s} H${x - 15 * s} Z`} fill="#FFC83D" />
      <Path d={`M${x + 2 * s},${y - 7 * s} H${x + 24 * s} L${x + 16 * s},${y + 4 * s} H${x + 2 * s} Z`} fill="#E0A21B" />
    </G>
  );
}

function Waves({ x, y, w, color = '#FFFFFF' }: { x: number; y: number; w: number; color?: string }) {
  return (
    <Path
      d={`M${x},${y} q${w / 8},-6 ${w / 4},0 t${w / 4},0 t${w / 4},0 t${w / 4},0`}
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
      opacity={0.75}
    />
  );
}

function Dune({ x, y, w, h, color = '#F7C66A', shade = '#EBB352' }: { x: number; y: number; w: number; h: number; color?: string; shade?: string }) {
  return (
    <G>
      <Path d={`M${x - w / 2},${y} Q${x - w * 0.1},${y - h} ${x + w * 0.12},${y - h * 0.92} Q${x + w * 0.3},${y - h * 0.8} ${x + w / 2},${y} Z`} fill={color} />
      <Path d={`M${x + w * 0.12},${y - h * 0.92} Q${x + w * 0.3},${y - h * 0.8} ${x + w / 2},${y} L${x + w * 0.02},${y} Q${x + w * 0.06},${y - h * 0.5} ${x + w * 0.12},${y - h * 0.92} Z`} fill={shade} />
    </G>
  );
}

function Cactus({ x, y, s = 1 }: At) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={14 * s} ry={4.5 * s} fill={SHADOW} />
      <Path d={`M${x - 6 * s},${y} V${y - 34 * s} a6 6 0 0 1 ${12 * s} 0 V${y} Z`} fill="#58B33B" />
      <Path d={`M${x},${y - 40 * s} a6 6 0 0 1 ${6 * s} ${6 * s} V${y} H${x} Z`} fill="#46992E" />
      <Path d={`M${x - 6 * s},${y - 16 * s} H${x - 12 * s} a5 5 0 0 1 ${-5 * s} ${-5 * s} V${y - 26 * s} a4 4 0 0 1 ${8 * s} 0 V${y - 22 * s} H${x - 6 * s} Z`} fill="#58B33B" />
      <Path d={`M${x + 6 * s},${y - 20 * s} H${x + 11 * s} V${y - 28 * s} a4 4 0 0 1 ${8 * s} 0 V${y - 24 * s} a6 6 0 0 1 ${-6 * s} ${6 * s} H${x + 6 * s} Z`} fill="#46992E" />
      <Circle cx={x} cy={y - 42 * s} r={3.5 * s} fill="#FF8FC7" />
    </G>
  );
}

function Castle({ x, y, s = 1 }: At) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 3 * s} rx={46 * s} ry={8 * s} fill={SHADOW} />
      <Rect x={x - 30 * s} y={y - 44 * s} width={60 * s} height={44 * s} fill="#FFF0F7" />
      {[-30, -16, -2, 12, 24].map((dx) => (
        <Rect key={dx} x={x + dx * s} y={y - 52 * s} width={8 * s} height={9 * s} fill="#FFF0F7" />
      ))}
      <Rect x={x - 44 * s} y={y - 62 * s} width={18 * s} height={62 * s} rx={3 * s} fill="#FFFFFF" />
      <Rect x={x + 26 * s} y={y - 62 * s} width={18 * s} height={62 * s} rx={3 * s} fill="#F4E6F8" />
      <Path d={`M${x - 46 * s},${y - 61 * s} L${x - 35 * s},${y - 84 * s} L${x - 24 * s},${y - 61 * s} Z`} fill="#8467F7" />
      <Path d={`M${x + 24 * s},${y - 61 * s} L${x + 35 * s},${y - 84 * s} L${x + 46 * s},${y - 61 * s} Z`} fill="#6446D9" />
      <Path d={`M${x - 35 * s},${y - 84 * s} V${y - 94 * s} L${x - 26 * s},${y - 91 * s} L${x - 35 * s},${y - 88 * s}`} fill="#FFC83D" stroke="#FFC83D" strokeWidth={1.5 * s} />
      <Path d={`M${x - 8 * s},${y} V${y - 16 * s} a8 8 0 0 1 ${16 * s} 0 V${y} Z`} fill="#B84080" />
      <Circle cx={x - 35 * s} cy={y - 40 * s} r={4 * s} fill="#8ACFF8" />
      <Circle cx={x + 35 * s} cy={y - 40 * s} r={4 * s} fill="#8ACFF8" />
    </G>
  );
}

function Lollipop({ x, y, s = 1, color = '#FF8FC7' }: At & { color?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 2 * s} rx={10 * s} ry={3.5 * s} fill={SHADOW} />
      <Rect x={x - 2 * s} y={y - 24 * s} width={4 * s} height={25 * s} rx={2 * s} fill="#FFFFFF" />
      <Circle cx={x} cy={y - 32 * s} r={13 * s} fill={color} />
      <Path d={`M${x - 7 * s},${y - 32 * s} a7 7 0 0 1 ${14 * s} 0 a4 4 0 0 1 ${-8 * s} 0`} stroke="#FFFFFF" strokeWidth={3 * s} fill="none" strokeLinecap="round" />
    </G>
  );
}

function Rainbow({ x, y, r }: { x: number; y: number; r: number }) {
  const band = r * 0.16;
  const colors = ['#EC5B3F', '#FFC83D', '#6CC24A', '#48B2F7', '#9277FF'];
  return (
    <G>
      {colors.map((color, i) => {
        const radius = r - i * band;
        return (
          <Path
            key={color}
            d={`M${x - radius},${y} A${radius},${radius} 0 0 1 ${x + radius},${y}`}
            stroke={color}
            strokeWidth={band}
            fill="none"
          />
        );
      })}
      <Circle cx={x - r + band * 2} cy={y + 2} r={band * 1.8} fill="#FFFFFF" />
      <Circle cx={x - r + band * 4.2} cy={y + 4} r={band * 1.5} fill="#FFFFFF" />
      <Circle cx={x + r - band * 2} cy={y + 2} r={band * 1.8} fill="#FFFFFF" />
      <Circle cx={x + r - band * 4.2} cy={y + 4} r={band * 1.5} fill="#FFFFFF" />
    </G>
  );
}

function Cloud({ x, y, s = 1, color = '#FFFFFF' }: At & { color?: string }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={30 * s} ry={11 * s} fill={color} />
      <Circle cx={x - 10 * s} cy={y - 8 * s} r={12 * s} fill={color} />
      <Circle cx={x + 9 * s} cy={y - 11 * s} r={15 * s} fill={color} />
    </G>
  );
}

function Twinkle({ x, y, s = 1, color = '#FFFFFF' }: At & { color?: string }) {
  return (
    <Path
      d={`M${x},${y - 7 * s} C${x + 1 * s},${y - 1.5 * s} ${x + 1.5 * s},${y - 1 * s} ${x + 7 * s},${y} C${x + 1.5 * s},${y + 1 * s} ${x + 1 * s},${y + 1.5 * s} ${x},${y + 7 * s} C${x - 1 * s},${y + 1.5 * s} ${x - 1.5 * s},${y + 1 * s} ${x - 7 * s},${y} C${x - 1.5 * s},${y - 1 * s} ${x - 1 * s},${y - 1.5 * s} ${x},${y - 7 * s} Z`}
      fill={color}
    />
  );
}

function Planet({ x, y, r, color, shade, ring }: { x: number; y: number; r: number; color: string; shade: string; ring?: string }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={color} />
      <Path d={`M${x},${y - r} A${r},${r} 0 0 1 ${x},${y + r} A${r * 0.55},${r} 0 0 0 ${x},${y - r} Z`} fill={shade} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.3} r={r * 0.16} fill="#FFFFFF" opacity={0.35} />
      {ring ? (
        <Ellipse cx={x} cy={y} rx={r * 1.7} ry={r * 0.42} fill="none" stroke={ring} strokeWidth={r * 0.18} transform={`rotate(-18 ${x} ${y})`} />
      ) : null}
    </G>
  );
}

/* ---------------------------------------------------------------- biomes */

/** Where the ground meets the band above: a soft wave in the colour above. */
function Shore({ color }: { color: string }) {
  return (
    <Path
      d={`M0,0 H${MAP_W} V20 C${MAP_W * 0.83},36 ${MAP_W * 0.66},8 ${MAP_W * 0.5},22 C${MAP_W * 0.34},36 ${MAP_W * 0.17},10 0,26 Z`}
      fill={color}
    />
  );
}

function SpaceScene() {
  return (
    <G>
      <Defs>
        <LinearGradient id="spaceSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1F1C55" />
          <Stop offset="1" stopColor="#4B3FA6" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill="url(#spaceSky)" />
      {[
        [30, 40, 1], [96, 22, 0.6], [150, 66, 0.8], [250, 30, 0.7], [352, 52, 1], [20, 190, 0.7],
        [372, 204, 0.8], [58, 300, 0.6], [330, 330, 0.7], [118, 400, 0.5], [290, 408, 0.6], [200, 20, 0.5],
      ].map(([x, y, s]) => (
        <Twinkle key={`${x}-${y}`} x={x} y={y} s={s} color={s > 0.75 ? '#FFE89A' : '#FFFFFF'} />
      ))}
      {[
        [72, 60], [182, 44], [300, 90], [44, 240], [356, 150], [98, 350], [240, 300], [360, 380], [150, 130],
      ].map(([x, y]) => (
        <Circle key={`d${x}`} cx={x} cy={y} r={1.8} fill="#FFFFFF" opacity={0.7} />
      ))}
      <Circle cx={332} cy={88} r={30} fill="#FFF3C4" />
      <Circle cx={320} cy={80} r={6} fill="#F2E2A8" />
      <Circle cx={342} cy={102} r={4.5} fill="#F2E2A8" />
      <Planet x={62} y={124} r={24} color="#FF8FC7" shade="#E35A9E" ring="#FFD34D" />
      <Planet x={340} y={300} r={15} color="#48B2F7" shade="#238FDD" />
      <Path d="M40,394 Q120,354 196,378 Q280,352 360,396 L390,440 H0 Z" fill="#6A5BC9" />
      <Path d="M0,420 Q90,392 196,410 Q300,390 390,418 V440 H0 Z" fill="#8A7BE0" />
    </G>
  );
}

const CLOUD_BANK =
  'M0,28 Q14,8 34,20 Q52,0 78,16 Q98,2 120,18 Q144,-2 168,16 Q190,2 212,18 Q236,0 258,16 Q280,4 300,18 Q324,0 346,16 Q366,4 390,20 ' +
  'V58 Q370,74 348,60 Q326,78 300,62 Q276,78 252,62 Q228,80 204,62 Q180,78 156,62 Q132,80 108,62 Q84,78 60,62 Q36,76 18,62 Q8,58 0,62 Z';

function CastleScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[1]} />
      <Path d="M0,300 Q70,250 150,292 Q220,330 250,440 H0 Z" fill="#F9C2DE" />
      <Path d="M390,160 Q330,190 318,250 Q312,300 390,318 Z" fill="#F9C2DE" />
      <Rainbow x={346} y={404} r={66} />
      <Castle x={70} y={130} s={0.95} />
      <Lollipop x={352} y={110} color="#FFC83D" />
      <Lollipop x={30} y={420} s={0.9} color="#9277FF" />
      <Lollipop x={215} y={430} s={0.8} color="#48B2F7" />
      <Bush x={24} y={250} s={0.9} color="#F27DB5" shade="#E35A9E" />
      <Bush x={370} y={256} s={0.8} color="#B79BFF" shade="#9277FF" />
      <Flower x={110} y={330} color="#FFFFFF" />
      <Flower x={316} y={210} color="#9277FF" />
      <Flower x={180} y={80} color="#FFFFFF" s={0.9} />
      {/* A bank of cloud where the sky ends and the land begins. */}
      <Rect x={0} y={0} width={MAP_W} height={30} fill="#8A7BE0" />
      <Path d={CLOUD_BANK} fill="#F6BFDD" transform="translate(0 7)" />
      <Path d={CLOUD_BANK} fill="#FFFFFF" />
    </G>
  );
}

function DesertScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[2]} />
      <Shore color={ROW_GROUND[1]} />
      <Dune x={340} y={180} w={120} h={46} />
      <Dune x={40} y={420} w={110} h={40} />
      <Dune x={328} y={428} w={132} h={48} />
      <Cactus x={350} y={300} />
      <Cactus x={46} y={132} s={0.85} />
      <Cactus x={214} y={424} s={0.7} />
      <Rock x={300} y={110} s={0.8} color="#E0B878" shade="#C99B57" />
      <Rock x={28} y={250} s={0.7} color="#E0B878" shade="#C99B57" />
      <G>
        <Ellipse cx={186} cy={80} rx={34} ry={13} fill="#72CDF5" />
        <Ellipse cx={180} cy={76} rx={12} ry={4} fill="#FFFFFF" opacity={0.5} />
        <Palm x={206} y={80} s={0.7} />
      </G>
    </G>
  );
}

function BeachScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[3]} />
      <Shore color={ROW_GROUND[2]} />
      {/* The sea along both edges, the trail keeps to the sand between. */}
      <Path d="M0,150 C40,160 70,210 72,270 C74,330 58,380 38,410 C26,428 12,432 0,430 Z" fill="#4DB4E6" />
      <Path d="M0,158 C34,168 60,214 62,272 C64,328 50,374 32,402 C22,418 10,422 0,420 Z" fill="#72CDF5" />
      <Path d="M390,110 C356,130 334,190 340,250 C346,318 362,372 370,404 C376,424 384,432 390,432 Z" fill="#4DB4E6" />
      <Path d="M390,118 C364,138 346,192 350,252 C355,318 370,368 377,398 C381,414 386,420 390,420 Z" fill="#72CDF5" />
      <Waves x={6} y={236} w={40} />
      <Waves x={10} y={330} w={36} />
      <Waves x={352} y={190} w={34} />
      <Waves x={356} y={300} w={30} />
      <Boat x={368} y={396} s={0.8} />
      <Palm x={40} y={112} s={0.95} />
      <Umbrella x={196} y={404} s={0.9} />
      <Rock x={120} y={60} s={0.6} />
      <Path d="M300,60 l5,10 l11,1 l-8,7 l3,11 l-10,-6 l-10,6 l3,-11 l-8,-7 l11,-1 Z" fill="#FF8A5B" />
      <Circle cx={250} cy={120} r={4} fill="#FFFFFF" />
      <Circle cx={100} cy={200} r={3} fill="#FFFFFF" />
    </G>
  );
}

function MountainScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[4]} />
      <Shore color={ROW_GROUND[3]} />
      <Mountain x={352} y={150} w={140} h={112} />
      <Mountain x={306} y={170} w={92} h={70} snow={false} />
      <Mountain x={28} y={200} w={120} h={100} />
      <Mountain x={352} y={440} w={120} h={92} />
      <Pine x={70} y={420} s={0.8} />
      <Pine x={28} y={380} s={0.7} />
      <Pine x={300} y={330} s={0.75} />
      <Rock x={220} y={420} s={0.9} />
      <Rock x={60} y={262} s={0.7} />
      <Tuft x={180} y={62} />
      <Tuft x={300} y={250} />
      <Flower x={210} y={300} color="#FFFFFF" s={0.8} />
    </G>
  );
}

function ForestScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[5]} />
      <Shore color={ROW_GROUND[4]} />
      <Pine x={40} y={120} />
      <Pine x={76} y={150} s={0.8} />
      <Pine x={24} y={338} s={0.95} />
      <Pine x={64} y={392} s={0.8} />
      <Pine x={356} y={214} s={0.9} />
      <RoundTree x={352} y={120} s={0.9} />
      <RoundTree x={362} y={420} />
      <RoundTree x={316} y={380} s={0.75} />
      <Bush x={214} y={420} s={0.8} />
      <Bush x={30} y={236} s={0.8} />
      <G>
        <Rect x={186} y={96} width={10} height={10} rx={3} fill="#FFF3E0" />
        <Path d="M178,98 a13 10 0 0 1 26 0 Z" fill="#EC5B3F" />
        <Circle cx={186} cy={93} r={2} fill="#FFFFFF" />
        <Circle cx={196} cy={91} r={2.2} fill="#FFFFFF" />
      </G>
      <Tuft x={260} y={420} color="#6CC24A" />
      <Tuft x={120} y={270} color="#6CC24A" />
    </G>
  );
}

function CampScene() {
  return (
    <G>
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={ROW_GROUND[6]} />
      <Shore color={ROW_GROUND[5]} />
      <Ellipse cx={200} cy={398} rx={150} ry={26} fill="#9AD77C" />
      <Tent x={336} y={262} color="#48B2F7" shade="#238FDD" />
      <Tent x={52} y={180} s={0.85} />
      <Campfire x={222} y={350} />
      <Pond x={330} y={392} rx={46} ry={22} />
      <RoundTree x={40} y={80} />
      <RoundTree x={350} y={110} s={0.85} />
      <Bush x={40} y={404} />
      <Bush x={116} y={420} s={0.7} />
      <Flower x={290} y={180} />
      <Flower x={30} y={290} color="#FFFFFF" />
      <Flower x={186} y={420} color="#FFC83D" />
      <Flower x={372} y={330} color="#FFFFFF" s={0.8} />
      <Tuft x={250} y={60} />
      <Tuft x={96} y={250} />
    </G>
  );
}

const SCENES = [SpaceScene, CastleScene, DesertScene, BeachScene, MountainScene, ForestScene, CampScene];

/** The colour along the bottom edge of each band, which the band below picks up. */
const GROUND_EDGE = ['#8A7BE0', ROW_GROUND[1], ROW_GROUND[2], ROW_GROUND[3], ROW_GROUND[4], ROW_GROUND[5], ROW_GROUND[6]];

/* ------------------------------------------------------------ the trail */

function StoneShape({ stone, lit }: { stone: Stone; lit: boolean }) {
  const { x, y } = stone;
  return (
    <G>
      <Ellipse cx={x} cy={y + 5} rx={15} ry={12} fill={lit ? '#E0A21B' : '#E2D3AD'} />
      <Ellipse cx={x} cy={y} rx={15} ry={12} fill={lit ? '#FFC83D' : '#FFFBEF'} />
      <Path
        d={`M${x},${y - 7} L${x + 2.2},${y - 2.3} L${x + 7.2},${y - 1.8} L${x + 3.4},${y + 1.6} L${x + 4.5},${y + 6.6} L${x},${y + 4} L${x - 4.5},${y + 6.6} L${x - 3.4},${y + 1.6} L${x - 7.2},${y - 1.8} L${x - 2.2},${y - 2.3} Z`}
        fill={lit ? '#FFFFFF' : '#EEDFC0'}
      />
    </G>
  );
}

export type SectionProps = {
  row: number;
  width: number;
  /** Whole device pixels, so two bands never meet on a blended half pixel. */
  height: number;
  walked: number;
  litStones: ReadonlySet<Stone>;
};

/** One band of the map: its scenery, then the trail and stones passing through it. */
export const MapSection = memo(function MapSection({ row, width, height, walked, litStones }: SectionProps) {
  const Scene = SCENES[row];
  const top = row * SECTION_H;
  const stones = STONES.filter((stone) => stone.y > top - 24 && stone.y < top + SECTION_H + 24);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MAP_W} ${SECTION_H}`} preserveAspectRatio="none">
      <Rect x={0} y={0} width={MAP_W} height={SECTION_H} fill={GROUND_EDGE[row]} />
      <Scene />
      <G transform={`translate(0 ${-top})`}>
        <Path d={TRAIL_PATH} stroke={SHADOW} strokeWidth={36} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 6)" />
        <Path d={TRAIL_PATH} stroke="#FFF1CC" strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path
          d={TRAIL_PATH}
          stroke="#FFD76A"
          strokeWidth={34}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[Math.max(0.1, walked), TRAIL_LENGTH + 50]}
        />
        <Path d={TRAIL_PATH} stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={[1, 15]} opacity={0.8} />
        {stones.map((stone) => (
          <StoneShape key={`${stone.leg}-${stone.index}`} stone={stone} lit={litStones.has(stone)} />
        ))}
      </G>
    </Svg>
  );
});
