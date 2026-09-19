import Svg, { Path, Rect } from 'react-native-svg';

import { qrPath } from '../lib/qr';

/**
 * A QR code on screen. The geometry, and the printed version of it, live in
 * `lib/qr.ts` so they can be checked without a renderer.
 */
export function QrCode({ value, size = 120 }: { value: string; size?: number }) {
  const { d, size: modules } = qrPath(value);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${modules} ${modules}`}>
      <Rect x={0} y={0} width={modules} height={modules} fill="#FFFFFF" />
      <Path d={d} fill="#000000" />
    </Svg>
  );
}
