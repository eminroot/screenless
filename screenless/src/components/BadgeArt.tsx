import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/**
 * The picture on each treasure badge.
 *
 * A number is easy to read out and a picture is easy to spot across a room,
 * so every badge has both: "badge 4, the anchor". Drawn rather than emoji, so
 * the printed sheet and the phone screen show exactly the same thing on every
 * device and every printer.
 *
 * The same shapes are written out as SVG markup by `badgeSvgMarkup` for the
 * printed page, which is HTML and cannot render a React component.
 */

export type BadgeLook = { ring: string; fill: string; ink: string };

export const BADGE_LOOKS: Record<number, BadgeLook> = {
  1: { ring: '#FFC221', fill: '#FFF2CF', ink: '#3A2600' },
  2: { ring: '#3BD2F5', fill: '#D8F6FE', ink: '#04303A' },
  3: { ring: '#7BE83B', fill: '#E7FBD6', ink: '#16330A' },
  4: { ring: '#A277FF', fill: '#EDE5FF', ink: '#1F0A4A' },
  5: { ring: '#FF5AA8', fill: '#FFE1EE', ink: '#3A0021' },
  6: { ring: '#FF8A34', fill: '#FFE8D4', ink: '#331400' },
};

/** Symbol paths in a 64 unit box, centred on 32,32. */
const SYMBOLS: Record<number, string> = {
  // A star
  1: 'M32 13l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L32 41.7l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8Z',
  // A crescent moon
  2: 'M38.5 14.5A18 18 0 1 0 49.5 44 14.5 14.5 0 0 1 38.5 14.5Z',
  // A key
  3: 'M24 20a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM31.5 30h19v5h-3.5v5h-4.5v-5h-2.5v4h-4.5v-4h-4Z',
  // An anchor
  4: 'M32 13a5 5 0 0 1 2.5 9.3V26h6v4.5h-6v14.3c4.8-.7 8.6-4 9.8-8.3l-3.3.5 5.5-8 3.5 9-3.2-.8C45.3 44.6 39.4 50 32 50s-13.3-5.4-14.8-12.8l-3.2.8 3.5-9 5.5 8-3.3-.5c1.2 4.3 5 7.6 9.8 8.3V30.5h-6V26h6v-3.7A5 5 0 0 1 32 13Zm0 3.8a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z',
  // A crown
  5: 'M14 24l9 7.5L32 17l9 14.5 9-7.5-3.5 21h-25Zm8 23.5h20V51H22Z',
  // A treasure chest
  6: 'M15 27c0-6 4.5-10 10-10h14c5.5 0 10 4 10 10v2H15Zm0 5h34v17H15Zm14.5 2.5v6h5v-6Z',
};

export function BadgeArt({ number, size = 56 }: { number: number; size?: number }) {
  const look = BADGE_LOOKS[number] ?? BADGE_LOOKS[1];
  const symbol = SYMBOLS[number] ?? SYMBOLS[1];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Circle cx={32} cy={32} r={30} fill={look.ring} stroke="#111739" strokeWidth={3} />
      <Circle cx={32} cy={32} r={22.5} fill={look.fill} stroke="#111739" strokeWidth={2} />
      <G>
        <Path d={symbol} fill={look.ring} stroke="#111739" strokeWidth={2} strokeLinejoin="round" fillRule="evenodd" />
      </G>
      {number === 6 ? <Rect x={15} y={29} width={34} height={3} fill="#111739" /> : null}
    </Svg>
  );
}

/** The same badge as an SVG string, for the printed sheet. */
export function badgeSvgMarkup(number: number, size: number): string {
  const look = BADGE_LOOKS[number] ?? BADGE_LOOKS[1];
  const symbol = SYMBOLS[number] ?? SYMBOLS[1];
  const lid = number === 6 ? '<rect x="15" y="29" width="34" height="3" fill="#111739"/>' : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">` +
    `<circle cx="32" cy="32" r="30" fill="${look.ring}" stroke="#111739" stroke-width="3"/>` +
    `<circle cx="32" cy="32" r="22.5" fill="${look.fill}" stroke="#111739" stroke-width="2"/>` +
    `<path d="${symbol}" fill="${look.ring}" stroke="#111739" stroke-width="2" stroke-linejoin="round" fill-rule="evenodd"/>` +
    lid +
    `</svg>`
  );
}
