import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * The native side of Screen Guard, or a stub when it is not there.
 *
 * Read with `requireOptionalNativeModule` rather than `requireNativeModule`,
 * so the app keeps working in Expo Go, on the web, and in a build where the
 * guard was compiled out. Everything in this file returns a safe answer when
 * the module is missing, and `getCapability().available` is false — which is
 * what the UI keys off to show "not available on this device" instead of
 * breaking.
 *
 * The two platforms answer the same questions very differently:
 *
 * - **Android** can report real seconds per app, and blocks with an overlay
 *   drawn by a foreground service.
 * - **iOS** never reports seconds at all — Apple does not expose them to an
 *   app — and blocks with the system shield applied by an extension. What
 *   comes back instead is which thresholds have fired.
 *
 * Anything that reads `usedSec` has to cope with `null`.
 */

export type NativeCapability = {
  available: boolean;
  canReadUsage: boolean;
  canEnforce: boolean;
  missing: string[];
};

export type NativeApp = { id: string; label: string; system: boolean };

export type NativeUsage = { id: string; seconds: number };

/** The flattened instruction the native watcher runs on. */
export type NativePlan = {
  enabled: boolean;
  tier: string;
  packages: string[];
  limitSec: number;
  curfewStartMin: number;
  curfewEndMin: number;
  day: string;
  blockTitle: string;
  blockBody: string;
  graceLabel: string;
  graceAvailable: boolean;
  notificationTitle: string;
  notificationBody: string;
  /**
   * Seconds of use between reminders, and the reminders themselves.
   *
   * Written out in advance by `guard/useGuard.ts` because the watcher has to
   * post them while the app is closed, when nothing in `guard/nudge.ts` can
   * run. Entry `k` belongs to the `(k + 1)`th checkpoint; which tier of copy,
   * which language and which suggestion were all decided before the list was
   * handed down.
   */
  nudgeEverySec: number;
  nudgeTitles: string[];
  nudgeBodies: string[];
  nudgeChannelName: string;
};

export type NativeState = {
  day: string;
  /** Android reports real seconds. iOS always returns null. */
  usedSec: number | null;
  /** Whole-phone seconds today. Android only; zero everywhere else. */
  deviceSec?: number;
  /** Reminders the watcher posted while the app was closed. Android only. */
  nudgesSent?: number;
  /** iOS only: whether each threshold has fired today. */
  warningFired?: boolean;
  limitFired?: boolean;
  /** The day a child pressed the extend button, if they did. */
  graceRequestedFor: string | null;
};

type ScreenGuardNative = {
  getCapability(): NativeCapability;
  openUsageAccessSettings?(): boolean;
  openOverlaySettings?(): boolean;
  requestAuthorization?(): Promise<boolean>;
  presentPicker?(): Promise<boolean>;
  selectionCount?(): number;
  listApps?(): NativeApp[];
  getUsage?(packages: string[]): NativeUsage[];
  getDeviceUsage?(): number;
  apply(plan: NativePlan): boolean;
  stop(): boolean;
  lift?(): boolean;
  drainState(): NativeState;
  clear(): boolean;
};

const native = requireOptionalNativeModule<ScreenGuardNative>('ScreenGuard');

const UNAVAILABLE: NativeCapability = {
  available: false,
  canReadUsage: false,
  canEnforce: false,
  missing: [],
};

export const isGuardNativeAvailable = native !== null;

export function getCapability(): NativeCapability {
  try {
    return native?.getCapability() ?? UNAVAILABLE;
  } catch {
    return UNAVAILABLE;
  }
}

/** Android: hands the parent to Settings. There is no callback; re-check after. */
export function openUsageAccessSettings(): boolean {
  try {
    return native?.openUsageAccessSettings?.() ?? false;
  } catch {
    return false;
  }
}

export function openOverlaySettings(): boolean {
  try {
    return native?.openOverlaySettings?.() ?? false;
  } catch {
    return false;
  }
}

/** iOS: Apple's Screen Time prompt. On a child account it asks for a parent password. */
export async function requestAuthorization(): Promise<boolean> {
  try {
    return (await native?.requestAuthorization?.()) ?? false;
  } catch {
    return false;
  }
}

/** iOS: Apple's own app picker. We never learn what was chosen. */
export async function presentPicker(): Promise<boolean> {
  try {
    return (await native?.presentPicker?.()) ?? false;
  } catch {
    return false;
  }
}

/** iOS: how many apps the parent picked. The only fact Apple shares. */
export function selectionCount(): number {
  try {
    return native?.selectionCount?.() ?? 0;
  } catch {
    return 0;
  }
}

/** Android: the list a parent picks from. Empty everywhere else. */
export function listApps(): NativeApp[] {
  if (Platform.OS !== 'android') return [];
  try {
    return native?.listApps?.() ?? [];
  } catch {
    return [];
  }
}

/** Android: foreground seconds today per package. Empty on iOS by design. */
export function getUsage(packages: string[]): NativeUsage[] {
  if (packages.length === 0) return [];
  try {
    return native?.getUsage?.(packages) ?? [];
  } catch {
    return [];
  }
}

/**
 * Android: foreground seconds today across the whole phone.
 *
 * What a parent means by "screen time", as opposed to the watched-app total
 * the limit bites on. Zero on iOS, where Apple hands an app no figures at all,
 * and zero on Android until usage access has been granted.
 */
export function getDeviceUsage(): number {
  if (Platform.OS !== 'android') return 0;
  try {
    const seconds = native?.getDeviceUsage?.();
    return typeof seconds === 'number' && Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  } catch {
    return 0;
  }
}

export function applyPlan(plan: NativePlan): boolean {
  try {
    return native?.apply(plan) ?? false;
  } catch {
    return false;
  }
}

export function stopGuard(): boolean {
  try {
    return native?.stop() ?? false;
  } catch {
    return false;
  }
}

/** A parent lifting the block for the rest of today. */
export function liftGuard(): boolean {
  try {
    return native?.lift?.() ?? false;
  } catch {
    return false;
  }
}

/** What the watcher recorded while the app was closed. */
export function drainState(): NativeState | null {
  try {
    return native?.drainState() ?? null;
  } catch {
    return null;
  }
}

export function clearGuard(): boolean {
  try {
    return native?.clear() ?? false;
  } catch {
    return false;
  }
}
