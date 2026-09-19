import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { I18nProvider } from '../i18n';
import { useReviewNotificationRoute } from '../lib/review-notify';
import { ScoreSync } from '../online/ScoreSync';
import { GuardWatch } from '../guard/GuardWatch';
import { HubSync } from '../sync/HubSync';
import { AppStateProvider, useApp } from '../state/app-state';
import { colors } from '../theme/tokens';

void SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    // The display face of the 3-5 interface. One weight only, to keep startup quick.
    Baloo2_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <Localised />
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Sits inside the store so the whole tree re-renders when the language changes. */
function Localised() {
  const { language, ready } = useApp();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // A parent tapping "a mission is waiting" lands on the confirmation screen.
  useReviewNotificationRoute(ready);

  if (!ready) return null;

  return (
    <I18nProvider language={language}>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <ScoreSync />
        <GuardWatch />
        <HubSync />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="celebrate"
            options={{ animation: 'fade', presentation: 'transparentModal' }}
          />
        </Stack>
      </ErrorBoundary>
    </I18nProvider>
  );
}
