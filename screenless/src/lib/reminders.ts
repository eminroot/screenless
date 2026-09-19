import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Language } from '../i18n/types';
import { isReviewNudge } from './review-notify';
import { isScreenNudge } from './screen-nudge';

const CHANNEL_ID = 'daily-mission';

const copy: Record<Language, { title: string; body: string }> = {
  tr: { title: 'Görev zamanı', body: 'Arkadaşın yeni bir görevle bekliyor.' },
  en: { title: 'Mission time', body: 'Your buddy is waiting with a new mission.' },
  az: { title: 'Tapşırıq vaxtı', body: 'Dostun yeni tapşırıqla gözləyir.' },
};

/** Expo Go cannot schedule reliably on Android, so we degrade quietly. */
export const remindersSupported = Constants.appOwnership !== 'expo' || Platform.OS === 'ios';

/**
 * Loaded on demand. Importing expo-notifications at module scope registers a
 * push token listener as a side effect, which costs startup time on device and
 * breaks web pre-rendering, and almost no session ever touches reminders.
 */
async function loadNotifications() {
  return import('expo-notifications');
}

export async function scheduleDailyReminder(
  language: Language,
  hour: number,
  minute: number,
): Promise<boolean> {
  try {
    const Notifications = await loadNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Daily mission',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await cancelDaily(Notifications);
    await Notifications.scheduleNotificationAsync({
      content: { ...copy[language], sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    return true;
  } catch (error) {
    if (__DEV__) console.warn('[reminders] schedule failed', error);
    return false;
  }
}

export async function cancelReminders(): Promise<void> {
  try {
    const Notifications = await loadNotifications();
    await cancelDaily(Notifications);
  } catch (error) {
    if (__DEV__) console.warn('[reminders] cancel failed', error);
  }
}

/**
 * Cancels the daily reminder and nothing else.
 *
 * Two other things live in the same queue and both have to survive a reminder
 * being switched off or moved: the nudge about a mission waiting for a parent,
 * and the screen time reminders. A parent turning off "remind me at five"
 * has not asked for either of those to stop.
 */
async function cancelDaily(Notifications: Awaited<ReturnType<typeof loadNotifications>>): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of scheduled) {
    if (isReviewNudge(request.identifier) || isScreenNudge(request.identifier)) continue;
    await Notifications.cancelScheduledNotificationAsync(request.identifier);
  }
}
