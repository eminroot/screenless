import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

import type { Language } from '../i18n/types';

/**
 * A nudge to the parent when a finished mission is waiting for them.
 *
 * Scheduled a minute out rather than sent at once, and cancelled the moment
 * anyone decides. Most of the time a child hands the phone straight over and
 * the parent says yes on the spot; a notification then would only be noise.
 * It is for the other case: the mission sat there and nobody came.
 *
 * Everything is local. The notification is scheduled on this phone by this
 * phone, nothing is sent anywhere, and tapping it opens the confirmation
 * screen, which is behind the parent code like it always was.
 */

const CHANNEL_ID = 'mission-review';
const DELAY_SECONDS = 60;
const PREFIX = 'review-';

const copy: Record<Language, { channel: string; title: string; body: string }> = {
  en: {
    channel: 'Missions waiting for you',
    title: '{{name}} finished a mission',
    body: '{{mission}}. Have a quick look when you can.',
  },
  tr: {
    channel: 'Sizi bekleyen görevler',
    title: '{{name}} bir görevi bitirdi',
    body: '{{mission}}. Fırsat bulunca kısaca bakın.',
  },
  az: {
    channel: 'Sizi gözləyən tapşırıqlar',
    title: '{{name}} bir tapşırığı bitirdi',
    body: '{{mission}}. İmkan olanda qısaca baxın.',
  },
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

/** Web has no local notifications worth the name, and Expo Go on Android none at all. */
const available = Platform.OS !== 'web';

/** Loaded on demand, for the same startup reasons as `reminders.ts`. */
async function load() {
  return import('expo-notifications');
}

/** Asks for permission. True when notifications can be shown. */
export async function allowReviewNotifications(): Promise<boolean> {
  if (!available) return false;
  try {
    const Notifications = await load();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) console.warn('[review-notify] permission failed', error);
    return false;
  }
}

export async function scheduleReviewNudge(input: {
  missionId: string;
  language: Language;
  childName: string;
  missionTitle: string;
}): Promise<void> {
  if (!available) return;
  try {
    const Notifications = await load();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const text = copy[input.language];
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: text.channel,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${input.missionId}`,
      content: {
        title: fill(text.title, { name: input.childName }),
        body: fill(text.body, { mission: input.missionTitle }),
        sound: false,
        data: { url: `/confirm?id=${encodeURIComponent(input.missionId)}` },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: DELAY_SECONDS,
        channelId: CHANNEL_ID,
      },
    });
  } catch (error) {
    if (__DEV__) console.warn('[review-notify] schedule failed', error);
  }
}

export async function cancelReviewNudge(missionId: string): Promise<void> {
  if (!available) return;
  try {
    const Notifications = await load();
    await Notifications.cancelScheduledNotificationAsync(`${PREFIX}${missionId}`);
    await Notifications.dismissNotificationAsync(`${PREFIX}${missionId}`);
  } catch {
    // Already fired and dismissed, or never scheduled.
  }
}

/** True for a notification this file scheduled, so reminders leave it alone. */
export function isReviewNudge(identifier: string): boolean {
  return identifier.startsWith(PREFIX);
}

/**
 * Opens the confirmation screen when the parent taps a nudge, including one
 * tapped while the app was closed.
 */
export function useReviewNotificationRoute(enabled: boolean): void {
  const router = useRouter();

  useEffect(() => {
    if (!available || !enabled) return;
    let cancelled = false;
    let subscription: { remove: () => void } | null = null;

    const open = (data: unknown) => {
      const url = (data as { url?: unknown } | null)?.url;
      if (typeof url === 'string' && url.startsWith('/confirm')) router.push(url as never);
    };

    void load()
      .then(async (Notifications) => {
        if (cancelled) return;
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          open(response.notification.request.content.data);
        });
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!cancelled && last && isReviewNudge(last.notification.request.identifier)) {
          open(last.notification.request.content.data);
          await Notifications.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, router]);
}
