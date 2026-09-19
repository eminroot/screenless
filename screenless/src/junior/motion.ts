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

import { motionJunior } from './theme';

/**
 * Motion for the 6-8 interface.
 *
 * Physical rather than bouncy. Everything in this tier stands on a hard
 * shadow, so a press means one thing: the surface drops onto that shadow and
 * the shadow disappears under it. It is the motion of pressing a real key, and
 * it reads as sturdier than the squash the three year olds get without being
 * any less satisfying.
 *
 * Looping animation runs only while its screen is focused and never when the
 * phone asks for reduced motion, because tab screens stay mounted and a loop
 * on a hidden tab costs frames on the visible one.
 */

/** True while the screen is on top and the phone allows animation. */
export function useLiveMotion(): boolean {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  return focused && !reduced;
}

/** Eases 0 to 1 and back forever while `active`. For a pulse or a glow. */
export function useOscillator(duration: number, active: boolean, delay = 0): SharedValue<number> {
  const value = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(value);
      value.value = withTiming(0, { duration: 200 });
      return;
    }
    value.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(value);
  }, [active, duration, delay, value]);

  return value;
}

/**
 * The press: the surface slides down and right by exactly the depth of its own
 * shadow, so it lands flush on it. Returns handlers to spread on a Pressable
 * plus the style for the surface.
 */
export function useStickerPress(depth: number) {
  const pressed = useSharedValue(0);

  const onPressIn = () => {
    pressed.value = withTiming(1, { duration: motionJunior.press });
  };
  const onPressOut = () => {
    pressed.value = withSpring(0, motionJunior.spring);
  };

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: pressed.value * depth },
      { translateY: pressed.value * depth },
    ],
  }));

  return { pressed, onPressIn, onPressOut, style };
}

/** A one-off pop for something that has just arrived: a badge, a new rank. */
export function usePop() {
  const scale = useSharedValue(1);

  const pop = () => {
    scale.value = 0.86;
    scale.value = withSpring(1, motionJunior.pop);
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return { pop, style };
}
