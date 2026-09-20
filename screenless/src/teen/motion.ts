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

import { depth, motionTeen } from './theme';

/**
 * Motion for the 10 to 13 interface.
 *
 * Opacity and one axis of travel. The tier below pushes surfaces onto hard
 * shadows and the one below that squashes them, because both are buying
 * delight; here motion is only confirming a tap happened. Anything springier
 * reads as a toy, and a toy is the one thing this age will not carry around.
 *
 * The exception is `useDepthPress`, which moves a control down onto its own
 * edge. That is not delight, it is the affordance: the edge is the only thing
 * telling a child the block is pressable at all, so it has to go away when
 * they press it or the block is just a coloured rectangle.
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

/**
 * A pressable with a solid edge under it, travelling down onto that edge.
 *
 * Two styles rather than one, because they go on different views: `face` is
 * the block that moves, `gap` is the space under it that has to shrink by the
 * same amount, or the button grows a hole at the bottom as it travels.
 *
 * No opacity change at all here. Dimming *and* travelling reads as two
 * separate acknowledgements of one tap.
 */
export function useDepthPress(distance: number = depth.button) {
  const pressed = useSharedValue(0);

  const onPressIn = () => {
    pressed.value = withTiming(1, { duration: motionTeen.press });
  };
  const onPressOut = () => {
    pressed.value = withSpring(0, motionTeen.spring);
  };

  const face = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * distance }],
  }));

  const gap = useAnimatedStyle(() => ({
    height: distance * (1 - pressed.value),
  }));

  return { pressed, onPressIn, onPressOut, face, gap };
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
