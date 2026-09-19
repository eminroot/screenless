import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Accelerometer } from 'expo-sensors';

import { createStepDetector, SAMPLE_MS } from './step-detector';

/** Live step counting for the walk screen. The algorithm lives next door. */

export type StepCounter = {
  /** Steps counted since the hook was mounted or last reset. */
  steps: number;
  cadence: number;
  walking: boolean;
  intensity: number;
  /** False when the device has no usable accelerometer, so the UI can say so. */
  supported: boolean;
  /** Walks the detector threw out as a shaken phone. */
  shakes: number;
  reset: () => void;
};

/**
 * Live step counting while the walk screen is open.
 *
 * Counting stops when the app goes to the background, because the sensor
 * subscription does too. That is a real limit and the screen says so rather
 * than quietly losing steps: the alternative is a foreground service and a
 * permanent notification, which is not a trade worth making in a children's
 * app.
 */
export function useStepCounter(running: boolean): StepCounter {
  const [steps, setSteps] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [walking, setWalking] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const [supported, setSupported] = useState(true);
  const [shakes, setShakes] = useState(0);

  // The sensor fires 50 times a second and almost none of it should render.
  const detector = useRef(createStepDetector());
  const total = useRef(0);
  const lastPaintAt = useRef(0);
  /** Shakes from before a background reset, which clears the detector's own count. */
  const shakesCarried = useRef(0);

  const reset = useCallback(() => {
    detector.current.reset();
    total.current = 0;
    shakesCarried.current = 0;
    setSteps(0);
    setCadence(0);
    setWalking(false);
    setIntensity(0);
    setShakes(0);
  }, []);

  useEffect(() => {
    if (!running) return;

    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    const start = async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setSupported(false);
        return;
      }

      Accelerometer.setUpdateInterval(SAMPLE_MS);
      subscription = Accelerometer.addListener((sample) => {
        const now = Date.now();
        const added = detector.current.push(sample, now);

        if (added > 0) {
          total.current += added;
          setSteps(total.current);
        }

        // Everything else is cosmetic, so it repaints a few times a second.
        if (now - lastPaintAt.current >= 250) {
          lastPaintAt.current = now;
          setCadence(detector.current.cadence());
          setWalking(detector.current.walking());
          setIntensity(detector.current.intensity());
          setShakes(shakesCarried.current + detector.current.shakes());
        }
      });
    };

    // A sensor that is reported but refuses a subscription is no sensor.
    start().catch(() => setSupported(false));

    // Backgrounding suspends delivery, and the gap would otherwise look like
    // one enormous stride. Clearing the detector makes it warm up again.
    const appState = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        shakesCarried.current += detector.current.shakes();
        detector.current.reset();
        setWalking(false);
        setIntensity(0);
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
      appState.remove();
      setIntensity(0);
    };
  }, [running]);

  return { steps, cadence, walking, intensity, supported, shakes, reset };
}
