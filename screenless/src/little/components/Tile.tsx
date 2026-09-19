import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useLiveMotion, useOscillator } from '../motion';
import { ink, round, tones, type ToneName } from '../theme';
import { LText } from './LText';

/**
 * A toy block: a white face on a coloured frame, tipped a few degrees off
 * square so a row of them looks stacked by hand rather than laid out by a
 * machine. Letters, numbers and little pictures all ride on these.
 *
 * They are the signature of this interface. A child who cannot read yet still
 * knows a block is a thing that was put there on purpose.
 */
export function Tile({
  children,
  label,
  tone = 'sun',
  size = 56,
  tilt = -6,
  float = false,
  delay = 0,
  style,
}: {
  children?: ReactNode;
  /** A single letter or number, when the block carries one. */
  label?: string;
  tone?: ToneName;
  size?: number;
  /** Degrees off square. Alternate the sign along a row. */
  tilt?: number;
  /** Bobs on the spot. For blocks scattered around a mascot, not for rows. */
  float?: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = tones[tone];
  const live = useLiveMotion();
  const bob = useOscillator(2600 + delay, live && float, delay);

  const motion = useAnimatedStyle(() =>
    float
      ? { transform: [{ translateY: -4 + bob.value * 8 }, { rotate: `${tilt + (bob.value - 0.5) * 5}deg` }] }
      : { transform: [{ rotate: `${tilt}deg` }] },
  );

  const frame = Math.max(4, Math.round(size * 0.11));

  return (
    <Animated.View style={[motion, style]}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          backgroundColor: palette.face,
          padding: frame,
          paddingBottom: frame * 1.7,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: Math.round(size * 0.2),
            backgroundColor: tones.white.face,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {label ? (
            <LText
              variant="title"
              color={ink.text}
              style={{ fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.56) }}
            >
              {label}
            </LText>
          ) : (
            children
          )}
        </View>
      </View>
    </Animated.View>
  );
}

/**
 * The app name spelled out in blocks, alternating colour and tilt. Used on the
 * welcome screen and nowhere a child has to read quickly.
 */
export function TileWord({ word, size = 52 }: { word: string; size?: number }) {
  const order: ToneName[] = ['coral', 'sun', 'sky', 'mint', 'grape', 'bubble', 'aqua'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Math.round(size * 0.14) }}>
      {[...word].map((letter, index) => (
        <Tile
          key={`${letter}-${index}`}
          label={letter}
          size={size}
          tone={order[index % order.length]}
          tilt={index % 2 === 0 ? -7 : 6}
          float
          delay={index * 160}
          style={{ marginTop: index % 2 === 0 ? 0 : Math.round(size * 0.12) }}
        />
      ))}
    </View>
  );
}

/** The floor shadow that makes a block or a buddy sit on the ground. */
export function GroundShadow({ width, opacity = 0.16 }: { width: number; opacity?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        width,
        height: Math.max(6, width * 0.16),
        borderRadius: width,
        backgroundColor: `rgba(32,52,20,${opacity})`,
      }}
    />
  );
}
