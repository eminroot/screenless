import { useCallback, useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

import type { MotionKind } from '../state/types';

/**
 * Counting real movement instead of trusting a button.
 *
 * A child who taps "I did it" without moving is the failure mode this whole
 * app exists to avoid, so jumps, shakes and spins are read off the phone's own
 * sensors. Everything is deliberately forgiving: the goal is to make faking it
 * harder than doing it, not to grade anyone's technique.
 */

type Tuning = {
  /** Acceleration in g that opens a rep. */
  high: number;
  /** The reading has to fall back under this before the next rep counts. */
  low: number;
  /** Milliseconds of quiet enforced after each rep. */
  refractory: number;
};

const tuning: Record<'jump' | 'shake', Tuning> = {
  // A jump is a hard push off, a moment of near weightlessness, then a landing.
  jump: { high: 1.85, low: 0.72, refractory: 260 },
  // Shaking is smaller and much faster, so both gates come in.
  shake: { high: 1.6, low: 0.88, refractory: 150 },
};

const SAMPLE_MS = 40;
/** One full turn, the unit a spin is counted in. */
const FULL_TURN = 2 * Math.PI;

export type RepCounter = {
  reps: number;
  /** 0 to 1, how hard the phone is moving right now. Drives the live ring. */
  intensity: number;
  /** False when the device has no usable sensor, so the UI can fall back. */
  supported: boolean;
  /**
   * When each rep was counted, in ms. The 6-9 self check reads the rhythm off
   * it: legs cannot jump as fast or as evenly as a fist shakes a phone.
   */
  repTimes: () => number[];
  reset: () => void;
};

export function useRepCounter(kind: MotionKind, target: number, running: boolean): RepCounter {
  const [reps, setReps] = useState(0);
  const [intensity, setIntensity] = useState(0);
  const [supported, setSupported] = useState(true);

  // Kept in refs because the sensor fires 25 times a second and none of this
  // should cause a render on its own.
  const armed = useRef(true);
  const lastRepAt = useRef(0);
  const spinAngle = useRef(0);
  const lastIntensityAt = useRef(0);
  const counted = useRef(0);
  const times = useRef<number[]>([]);

  const reset = useCallback(() => {
    counted.current = 0;
    times.current = [];
    spinAngle.current = 0;
    armed.current = true;
    lastRepAt.current = 0;
    setReps(0);
    setIntensity(0);
  }, []);

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    const bump = () => {
      counted.current += 1;
      times.current.push(Date.now());
      setReps(counted.current);
    };

    // Throttled so a fast sensor cannot flood React with renders.
    const showIntensity = (value: number) => {
      const now = Date.now();
      if (now - lastIntensityAt.current < 90) return;
      lastIntensityAt.current = now;
      setIntensity(Math.max(0, Math.min(1, value)));
    };

    const startAccelerometer = async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setSupported(false);
        return;
      }

      const config = tuning[kind === 'shake' ? 'shake' : 'jump'];
      Accelerometer.setUpdateInterval(SAMPLE_MS);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        showIntensity(Math.abs(magnitude - 1) / 1.2);

        const now = Date.now();
        if (armed.current && magnitude > config.high && now - lastRepAt.current > config.refractory) {
          armed.current = false;
          lastRepAt.current = now;
          bump();
        } else if (!armed.current && magnitude < config.low) {
          armed.current = true;
        }
      });
    };

    const startGyroscope = async () => {
      const available = await Gyroscope.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setSupported(false);
        return;
      }

      Gyroscope.setUpdateInterval(SAMPLE_MS);
      subscription = Gyroscope.addListener(({ z }) => {
        showIntensity(Math.abs(z) / 6);
        // Slow drift should not add up into a turn the child never made.
        if (Math.abs(z) < 0.6) return;
        spinAngle.current += Math.abs(z) * (SAMPLE_MS / 1000);
        while (spinAngle.current >= FULL_TURN) {
          spinAngle.current -= FULL_TURN;
          bump();
        }
      });
    };

    // A sensor that is reported but refuses a subscription is no sensor.
    (kind === 'spin' ? startGyroscope() : startAccelerometer()).catch(() => setSupported(false));

    return () => {
      cancelled = true;
      subscription?.remove();
      setIntensity(0);
    };
  }, [kind, running]);

  // Stop listening the moment the target is reached rather than counting on.
  useEffect(() => {
    if (reps >= target) setIntensity(0);
  }, [reps, target]);

  const repTimes = useCallback(() => [...times.current], []);

  return { reps: Math.min(reps, target), intensity, supported, repTimes, reset };
}
