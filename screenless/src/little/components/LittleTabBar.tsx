import { useContext, useEffect, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { Buddy } from '../../components/buddy/Buddy';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { ExploreIcon, HomeIcon, MapIcon, SparkleIcon, WalkIcon } from '../icons';
import { ink, lip, MAX_COLUMN, motionLittle, round, space, tones, type ToneName } from '../theme';
import { LText } from './LText';

/**
 * The tab bar for ages 3 to 5: five big pictures on a floating card.
 *
 * The parent tab is not here. A three year old who taps it only meets a code
 * pad, so the way in for a grown up is the lock on the Home screen instead.
 * Labels show under the chosen tab only; they are for the grown up reading
 * over a shoulder, the child goes by the picture.
 */
const ORDER = ['index', 'for-you', 'map', 'finds', 'walk', 'chat'] as const;
type TabName = (typeof ORDER)[number];

const LABELS: Record<TabName, TKey> = {
  index: 'little.tabHome',
  'for-you': 'little.tabForYou',
  map: 'little.tabMap',
  finds: 'little.tabExplore',
  walk: 'little.tabWalk',
  chat: 'little.tabBuddy',
};

/** Each tab keeps one colour everywhere, so the bubble teaches the icon. */
const TAB_TONES: Record<TabName, ToneName> = {
  index: 'coral',
  'for-you': 'sun',
  map: 'mint',
  finds: 'aqua',
  walk: 'sky',
  chat: 'grape',
};

const BAR_HEIGHT = 80;
const BAR_MARGIN = 12;

export function LittleTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useI18n();
  const { profile } = useApp();
  const { width } = useWindowDimensions();
  const setHeight = useContext(BottomTabBarHeightCallbackContext);

  const bottom = Math.max(insets.bottom, BAR_MARGIN);
  const focusedName = state.routes[state.index]?.name;

  // The bar floats over the screens, so they need to know how much of the
  // bottom it covers to keep their last row clear of it.
  useEffect(() => {
    setHeight?.(BAR_HEIGHT + lip.md + bottom + BAR_MARGIN);
  }, [setHeight, bottom]);

  const icons: Record<TabName, ReactNode> = {
    index: <HomeIcon size={38} />,
    'for-you': <SparkleIcon size={34} color={tones.sun.lip} />,
    map: <MapIcon size={38} />,
    finds: <ExploreIcon size={38} />,
    walk: <WalkIcon size={38} />,
    chat: profile ? <Buddy id={profile.buddyId} size={40} still /> : null,
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }}
    >
      <View
        style={{
          width: Math.min(width - BAR_MARGIN * 2, MAX_COLUMN),
          marginBottom: bottom,
          paddingBottom: lip.md,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lip.md,
            bottom: 0,
            borderRadius: round.xl,
            backgroundColor: tones.white.lip,
          }}
        />
        <View
          style={{
            height: BAR_HEIGHT,
            borderRadius: round.xl,
            backgroundColor: tones.white.face,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.xs,
          }}
        >
          {ORDER.map((name) => {
            const route = state.routes.find((r) => r.name === name);
            if (!route) return null;
            const focused = focusedName === name;
            return (
              <TabItem
                key={route.key}
                label={t(LABELS[name])}
                icon={icons[name]}
                tone={TAB_TONES[name]}
                focused={focused}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (focused || event.defaultPrevented) return;
                  void Haptics.selectionAsync();
                  navigation.navigate(route.name);
                }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon,
  tone,
  focused,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  tone: ToneName;
  focused: boolean;
  onPress: () => void;
}) {
  const on = useSharedValue(focused ? 1 : 0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    on.value = withSpring(focused ? 1 : 0, motionLittle.spring);
  }, [focused, on]);

  const bubble = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ scale: 0.6 + on.value * 0.4 }],
  }));

  const art = useAnimatedStyle(() => ({
    transform: [
      { translateY: -on.value * 9 },
      { scale: (0.92 + on.value * 0.14) * (1 - pressed.value * 0.12) },
    ],
  }));

  const caption = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ translateY: (1 - on.value) * 6 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, motionLittle.spring);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, motionLittle.spring);
      }}
      style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 6,
            width: 60,
            height: 52,
            borderRadius: round.md,
            backgroundColor: tones[tone].soft,
          },
          bubble,
        ]}
      />
      <Animated.View style={[{ height: 44, justifyContent: 'center' }, art]}>{icon}</Animated.View>
      <Animated.View style={[{ position: 'absolute', bottom: 4, left: 0, right: 0 }, caption]}>
        <LText variant="tiny" color={ink.text} center numberOfLines={1}>
          {label}
        </LText>
      </Animated.View>
    </Pressable>
  );
}
