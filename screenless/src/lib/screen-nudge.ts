import { Platform } from 'react-native';

import { nudgeText, type Translate } from '../guard/nudge-copy';
import type { Nudge } from '../guard/nudge';
import type { AgeBand } from '../state/types';

/**
 * Putting a screen time reminder on the phone.
 *
 * Three files, three jobs, and the split is what makes the feature testable:
 *
 *   guard/nudge.ts       decides *whether* to say something and what kind
 *   guard/nudge-copy.ts  turns that into two lines, in the right language
 *   this file            hands them to the system
 *
 * Only this one touches `expo-notifications` or `Platform`, which is why the
 * other two can be driven under plain Node.
 *
 * Everything is local. Nothing is scheduled ahead, nothing is sent anywhere,
 * and no push token exists: the notification is posted by this phone, about
 * this phone, at the moment the watcher noticed.
 *
 * On its own channel rather than the daily mission one, so a family can turn
 * the screen time reminders off in Android settings without losing the
 * reminder that a mission is waiting. Those are different promises and a
 * parent should be able to keep one without the other.
 */

const CHANNEL_ID = 'screen-time';
const PREFIX = 'screen-nudge-';

export { nudgeText, renderNudgeList } from '../guard/nudge-copy';
export type { Translate } from '../guard/nudge-copy';

/** Web has no local notifications worth the name. */
const available = Platform.OS !== 'web';

async function load() {
  return import('expo-notifications');
}

/**
 * Posts the reminder now.
 *
 * Returns whether it actually went out, so the caller only writes the nudge
 * into the day when it did. Marking one as delivered that a denied permission
 * swallowed would silence that checkpoint for the rest of the day.
 */
export async function presentNudge(input: {
  t: Translate;
  band: AgeBand;
  buddyName: string;
  nudge: Nudge;
}): Promise<boolean> {
  if (!available) return false;
  try {
    const Notifications = await load();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return false;

    const { t } = input;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: t('nudge.channelName'),
        description: t('nudge.channelBody'),
        // DEFAULT rather than HIGH: this arrives several times a day, and a
        // heads-up banner each time is what gets the whole channel switched
        // off in the first week.
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const text = nudgeText(t, input.band, input.buddyName, input.nudge);

    await Notifications.scheduleNotificationAsync({
      // One identifier per kind and checkpoint, so a reminder still on screen
      // is replaced rather than stacked underneath a new one.
      identifier: `${PREFIX}${input.nudge.kind}-${input.nudge.atMin}`,
      content: {
        title: text.title,
        body: text.body,
        sound: false,
        // Tapping it opens the app, which is the whole point of naming a
        // suggestion: the thing being offered is one tap away.
        data: { url: '/' },
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    if (__DEV__) console.warn('[screen-nudge] present failed', error);
    return false;
  }
}

/** Asks for permission. Called from the parent's screen time setup. */
export async function allowScreenNudges(): Promise<boolean> {
  if (!available) return false;
  try {
    const Notifications = await load();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) console.warn('[screen-nudge] permission failed', error);
    return false;
  }
}

/** True for a notification this file posted, so other cancels leave it alone. */
export function isScreenNudge(identifier: string): boolean {
  return identifier.startsWith(PREFIX);
}
