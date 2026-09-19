import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { motionLittle } from './theme';

/**
 * Motion that knows when to stop.
 *
 * Every looping animation in the 3-5 interface goes through these hooks, which
 * is how the interface stays cheap on an old phone: tab screens stay mounted
 * after you leave them, so a cloud that kept drifting on a hidden tab would
 * cost frames on the visible one. Loops run only while their screen is focused
 * and never when the system asks for reduced motion. All of it runs on the UI
 * thread, so a busy JavaScript thread cannot make anything stutter.
 */

/** True while the screen is on top and the phone allows animation. */
export function useLiveMotion(): boolean {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  return focused && !reduced;
}

/** Eases 0 → 1 → 0 forever while `active`. For bobbing, breathing, glowing. */
export function useOscillator(duration: number, active: boolean, delay = 0): SharedValue<number> {
  const value = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(value);
      value.value = withTiming(0, { duration: 240 });
      return;
    }
    value.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(value);
  }, [active, duration, delay, value]);

  return value;
}

/** Runs 0 → 1 at a steady pace and starts again, while `active`. For drifting and spinning. */
export function useCycle(duration: number, active: boolean, start = 0): SharedValue<number> {
  const value = useSharedValue(start);

  useEffect(() => {
    if (!active) {
      cancelAnimation(value);
      return;
    }
    // Resume from wherever it stopped, so leaving a tab and coming back does
    // not make every cloud jump home.
    const from = value.value % 1;
    value.value = from;
    value.value = withTiming(1, { duration: duration * (1 - from), easing: Easing.linear }, (done) => {
      if (!done) return;
      value.value = 0;
      value.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    });
    return () => cancelAnimation(value);
  }, [active, duration, value]);

  return value;
}

/**
 * The squash of something pressed: the face sinks onto its lip and the whole
 * thing gives a little. Returns the handlers to spread on a Pressable.
 */
export function usePress(depth: number) {
  const pressed = useSharedValue(0);

  const onPressIn = () => {
    pressed.value = withTiming(1, { duration: motionLittle.pressIn });
  };
  const onPressOut = () => {
    pressed.value = withSpring(0, motionLittle.spring);
  };

  const face = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * depth }, { scale: 1 - pressed.value * 0.015 }],
  }));

  return { pressed, onPressIn, onPressOut, face };
}

/** A one-off pop, for rewarding a tap: grows past full size and settles back. */
export function usePop() {
  const scale = useSharedValue(1);
  const pop = () => {
    scale.value = 0.9;
    scale.value = withSpring(1, { damping: 7, stiffness: 260, mass: 0.6 });
  };
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return { pop, style };
}
