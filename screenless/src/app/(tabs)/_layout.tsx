import { Redirect, Tabs } from 'expo-router';

import { CartoonTabBar } from '../../components/CartoonTabBar';
import { useExperience } from '../../experience';
import { LittleTabBar } from '../../little/components/LittleTabBar';
import { JuniorTabBar } from '../../junior/components/JuniorTabBar';
import { TeenTabBar } from '../../teen/components/TeenTabBar';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';

export default function TabsLayout() {
  const { t } = useI18n();
  const { isOnboarded } = useApp();
  const experience = useExperience();

  if (!isOnboarded) return <Redirect href="/onboarding/language" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        if (experience === 'little') return <LittleTabBar {...props} />;
        if (experience === 'junior') return <JuniorTabBar {...props} />;
        if (experience === 'teen') return <TeenTabBar {...props} />;
        return <CartoonTabBar {...props} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="for-you" options={{ title: t('tabs.forYou') }} />
      <Tabs.Screen name="finds" options={{ title: t('tabs.finds') }} />
      <Tabs.Screen name="walk" options={{ title: t('tabs.walk') }} />
      <Tabs.Screen name="map" options={{ title: t('tabs.journey') }} />
      <Tabs.Screen name="chat" options={{ title: t('tabs.buddy') }} />
      <Tabs.Screen name="parent" options={{ title: t('tabs.parent') }} />
    </Tabs>
  );
}
