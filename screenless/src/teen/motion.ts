import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { motionTeen } from './theme';

/**
 * Motion for the 10 to 14 interface.
 *
 * Almost entirely opacity. The tier below pushes surfaces onto hard shadows
 * and the one below that squashes them, because both are buying delight; here
 * motion is only confirming a tap happened. Anything springier reads as a toy,
 * and a toy is the one thing this age will not carry around.
 *
 * Loops run only while their screen is focused and never under reduced motion,
 * because tab screens stay mounted and a loop on a hidden tab costs frames on
 * the visible one.
 */

/** True while the screen is on top and the phone allows animation. */
export function useLiveMotion(): boolean {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  return focused && !reduced;
}

/** Eases 0 to 1 and back forever while `active`. For a live indicator. */
export function useOscillator(duration: number, active: boolean): SharedValue<number> {
  const value = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(value);
      value.value = withTiming(0, { duration: 180 });
      return;
    }
    value.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(value);
  }, [active, duration, value]);

  return value;
}

/** The whole press language: it dims, very slightly, and comes straight back. */
export function usePress(scale = 0.985) {
  const pressed = useSharedValue(0);

  const onPressIn = () => {
    pressed.value = withTiming(1, { duration: motionTeen.press });
  };
  const onPressOut = () => {
    pressed.value = withSpring(0, motionTeen.spring);
  };

  const style = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.28,
    transform: [{ scale: 1 - pressed.value * (1 - scale) }],
  }));

  return { pressed, onPressIn, onPressOut, style };
}
