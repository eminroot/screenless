import { Alert, Platform } from 'react-native';

/**
 * Asks before doing something that cannot be undone.
 *
 * `Alert.alert` does nothing at all on web, which silently swallowed every
 * confirmation in the browser preview. The web build falls back to the
 * browser's own dialog so those flows can be tried there too.
 */
export function confirmAction(options: {
  title: string;
  body: string;
  action: string;
  cancel: string;
}): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ask = (globalThis as { confirm?: (message: string) => boolean }).confirm;
    return Promise.resolve(ask ? ask(`${options.title}\n\n${options.body}`) : false);
  }

  return new Promise((resolve) => {
    Alert.alert(
      options.title,
      options.body,
      [
        { text: options.cancel, style: 'cancel', onPress: () => resolve(false) },
        { text: options.action, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
