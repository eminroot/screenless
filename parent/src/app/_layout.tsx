import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '../i18n';
import { SessionProvider, useSession } from '../state/session';
import { colors } from '../theme/tokens';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/**
 * The shell.
 *
 * Two gates before anything renders: the fonts, and the stored session. Both
 * return null rather than a spinner, because the splash screen is still up and
 * a spinner behind a splash is a flash of nothing on the way in.
 *
 * The language lives on the session rather than in its own store, so a parent
 * who changes it keeps that choice across sign-outs on the same phone.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaProvider>
        <SessionProvider>
          <Shell />
        </SessionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Shell() {
  const { ready, language } = useSession();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <I18nProvider language={language}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'fade',
        }}
      />
    </I18nProvider>
  );
}
