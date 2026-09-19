import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { motionLittle, round, tones, type ToneName } from '../theme';

/**
 * How far along something is, as a fat candy-striped bar.
 *
 * The stripes are the point. A flat bar that has not moved since yesterday
 * looks like a broken bar; a striped one reads as a thing that is filling up
 * even when it is standing still, which buys the patience a three year old
 * does not otherwise have for a goal that takes a week.
 */
export function Meter({
  value,
  tone = 'sun',
  height = 22,
  style,
  accessibilityLabel,
}: {
  /** 0 to 1. */
  value: number;
  tone?: ToneName;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  // The empty track is the pale sage every card already stands on, rather than
  // white: a white track on a white card is an empty bar nobody can see, and an
  // empty bar that looks like nothing reads as a bug.
  const palette = tones[tone];
  const filled = Math.max(0, Math.min(1, value));
  const width = useSharedValue(filled);

  useEffect(() => {
    width.value = withSpring(filled, motionLittle.softSpring);
  }, [filled, width]);

  const fill = useAnimatedStyle(() => ({ width: `${Math.max(width.value * 100, filled > 0 ? 9 : 0)}%` }));

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          height,
          borderRadius: round.pill,
          backgroundColor: tones.white.lip,
          padding: 3,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: round.pill,
            backgroundColor: palette.face,
            overflow: 'hidden',
          },
          fill,
        ]}
      >
        <Stripes height={height} />
        {/* The highlight along the top, so the fill reads as rounded. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            top: 2,
            height: Math.max(3, height * 0.2),
            borderRadius: round.pill,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
      </Animated.View>
    </View>
  );
}

/** Diagonal bands across the fill, drawn as rotated bars inside a clip. */
function Stripes({ height }: { height: number }) {
  const step = Math.round(height * 0.9);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -height,
            left: i * step * 2,
            width: step,
            height: height * 3,
            backgroundColor: 'rgba(255,255,255,0.22)',
            transform: [{ rotate: '22deg' }],
          }}
        />
      ))}
    </View>
  );
}

/**
 * The same idea broken into a fixed number of lamps, for a count a child can
 * actually hold in their head: steps of a mission, stones to the next place.
 */
export function Lamps({
  total,
  lit,
  tone = 'mint',
  size = 14,
}: {
  total: number;
  lit: number;
  tone?: ToneName;
  size?: number;
}) {
  const palette = tones[tone];
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: i < lit ? palette.face : 'rgba(255,255,255,0.75)',
          }}
        />
      ))}
    </View>
  );
}
