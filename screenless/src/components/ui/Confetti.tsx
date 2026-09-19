import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '../../theme/tokens';

const CONFETTI_COLORS = [
  palette.sun,
  palette.coral,
  palette.mint,
  palette.sky,
  palette.grape,
  palette.bubble,
];

type Piece = {
  key: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  drift: number;
  spin: number;
  round: boolean;
};

function Confetto({ piece, height }: { piece: Piece; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }),
    );
  }, [piece.delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: t.value > 0.85 ? (1 - t.value) / 0.15 : 1,
    transform: [
      { translateY: -40 + t.value * (height + 80) },
      { translateX: Math.sin(t.value * Math.PI * 2) * piece.drift },
      { rotate: `${t.value * piece.spin}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: piece.left,
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.5,
          borderRadius: piece.round ? piece.size / 2 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/** Fires once when mounted. Remount with a new `seed` to replay. */
export function Confetti({ count = 28, seed = 0 }: { count?: number; seed?: number }) {
  const { width, height } = Dimensions.get('window');

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: seed * 1000 + i,
        left: Math.random() * (width - 16),
        size: 9 + Math.random() * 12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 600,
        drift: 12 + Math.random() * 34,
        spin: 180 + Math.random() * 540,
        round: Math.random() > 0.5,
      })),
    [count, seed, width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece) => (
        <Confetto key={piece.key} piece={piece} height={height} />
      ))}
    </View>
  );
}
