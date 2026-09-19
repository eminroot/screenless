import { useCallback, useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import {
  activityLooksOdd,
  createActivityMeter,
  createStillnessMeter,
} from './motion-analysis';

/**
 * The accelerometer, fed into the pure meters in `motion-analysis.ts`, for the
 * 6-9 mission runner.
 *
 * Both hooks keep the screen awake while they run. That is not a nicety: a
 * phone whose screen turns itself off stops delivering sensor readings to an
 * app, so without it every face-down minute and every pocketed ball game would
 * quietly stop counting after thirty seconds. The screen they keep on is
 * black, and on most phones a black screen costs next to nothing.
 */

/**
 * Holds the screen on while `active`.
 *
 * Released only once it was actually granted: on web the lock is asynchronous
 * and releasing one that has not arrived yet throws, and a screen that leaves
 * quickly (a swapped mission) does exactly that.
 */
function useKeepAwakeWhile(active: boolean, tag: string): void {
  useEffect(() => {
    if (!active) return;
    let held = false;
    let gone = false;

    const release = () => {
      try {
        void Promise.resolve(deactivateKeepAwake(tag)).catch(() => undefined);
      } catch {
        // Nothing was held.
      }
    };

    activateKeepAwakeAsync(tag)
      .then(() => {
        if (gone) release();
        else held = true;
      })
      .catch(() => undefined);

    return () => {
      gone = true;
      if (held) release();
    };
  }, [active, tag]);
}

/* -------------------------------------------------------------- put down */

export type PutDown = {
  /** The phone is lying flat and untouched right now. */
  parked: boolean;
  /** Seconds counted as put down, including any carried in. */
  seconds: number;
  /** Null while it is still finding out, false when this phone cannot tell. */
  supported: boolean | null;
  /** A touch on the screen: stop counting until it settles again. */
  wake: () => void;
};

/**
 * Screen free time, measured.
 *
 * `carried` is what an earlier visit to the mission already counted, so
 * leaving the screen and coming back does not throw it away.
 */
export function usePutDown(active: boolean, carried = 0): PutDown {
  const [parked, setParked] = useState(false);
  const [seconds, setSeconds] = useState(carried);
  const [supported, setSupported] = useState<boolean | null>(null);

  const meter = useRef(createStillnessMeter());
  const base = useRef(carried);
  const lastPaint = useRef(0);

  useKeepAwakeWhile(active && supported !== false, 'mission-put-down');

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    // Whatever this session counts is added on top of what was carried in.
    base.current = seconds;
    meter.current.reset();

    const start = async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      setSupported(available);
      if (!available) return;

      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener((sample) => {
        const now = Date.now();
        const isParked = meter.current.push(sample, now);
        setParked((was) => (was === isParked ? was : isParked));
        if (now - lastPaint.current >= 1000) {
          lastPaint.current = now;
          setSeconds(base.current + Math.floor(meter.current.parkedMs() / 1000));
        }
      });
    };

    // Some platforms report a sensor and then refuse the subscription (the web
    // build does). That is the same as having no sensor.
    start().catch(() => setSupported(false));
    return () => {
      cancelled = true;
      subscription?.remove();
      setSeconds(base.current + Math.floor(meter.current.parkedMs() / 1000));
      setParked(false);
    };
    // `seconds` is read once at start as the new base, on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const wake = useCallback(() => {
    meter.current.wake(Date.now());
    setParked(false);
  }, []);

  return { parked, seconds, supported, wake };
}

/* ---------------------------------------------------------------- moving */

export type MovingTime = {
  /** Whole seconds that felt like real movement. */
  seconds: number;
  /** 0 to 1, how hard the phone moved in the last second. */
  level: number;
  supported: boolean | null;
  /** True when the movement is too even to be a child. Read at the end. */
  looksOdd: () => boolean;
  reset: () => void;
};

export function useMovingTime(running: boolean): MovingTime {
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [supported, setSupported] = useState<boolean | null>(null);
  const meter = useRef(createActivityMeter());
  const lastPaint = useRef(0);

  useKeepAwakeWhile(running && supported !== false, 'mission-moving');

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    const start = async () => {
      const available = await Accelerometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      setSupported(available);
      if (!available) return;

      Accelerometer.setUpdateInterval(50);
      subscription = Accelerometer.addListener((sample) => {
        const now = Date.now();
        meter.current.push(sample, now);
        if (now - lastPaint.current >= 500) {
          lastPaint.current = now;
          setSeconds(meter.current.activeSec());
          setLevel(meter.current.level());
        }
      });
    };

    // Some platforms report a sensor and then refuse the subscription (the web
    // build does). That is the same as having no sensor.
    start().catch(() => setSupported(false));
    return () => {
      cancelled = true;
      subscription?.remove();
      setSeconds(meter.current.activeSec());
      setLevel(0);
    };
  }, [running]);

  const looksOdd = useCallback(() => activityLooksOdd(meter.current.energies()), []);
  const reset = useCallback(() => {
    meter.current.reset();
    setSeconds(0);
    setLevel(0);
  }, []);

  return { seconds, level, supported, looksOdd, reset };
}
