import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { borderWidth, colors, radii } from '../../theme/tokens';

export function ProgressBar({
  value,
  tone = colors.success,
  height = 18,
}: {
  /** 0 to 1. */
  value: number;
  tone?: string;
  height?: number;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(1, Math.max(0, value)), { duration: 600 });
  }, [value, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(value * 100), min: 0, max: 100 }}
      style={{
        height,
        backgroundColor: colors.surfaceAlt,
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <Animated.View style={[{ height: '100%', backgroundColor: tone }, fill]} />
    </View>
  );
}
