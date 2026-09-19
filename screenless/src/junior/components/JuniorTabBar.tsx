import { useContext, useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { ChatIcon, HomeIcon, RouteIcon, SearchIcon, ShoeIcon, SparkIcon } from '../icons';
import {
  accents,
  border,
  ink,
  MAX_COLUMN,
  motionJunior,
  palette,
  radius,
  space,
  type AccentName,
} from '../theme';
import { JText } from './JText';

/**
 * The tab bar for ages 6 to 9.
 *
 * Six objects along the bottom of the ground: a tent, a spark, a compass, a
 * lens, a boot, a walkie-talkie. Every icon has a word under it, because a
 * child this age reads and the word is the reliable part; the object is the
 * shortcut they will actually use after the first day.
 *
 * The chosen tab lifts its object into a coloured disc. Each tab keeps one
 * colour everywhere in the app, so the disc teaches the object.
 *
 * The parent tab is not here. A seven year old who taps it only meets a code
 * pad, so the way in for a grown up is the lock on the Today screen instead.
 */
const ORDER = ['index', 'for-you', 'map', 'finds', 'walk', 'chat'] as const;
type TabName = (typeof ORDER)[number];

const LABELS: Record<TabName, TKey> = {
  index: 'junior.tabCamp',
  'for-you': 'junior.tabForYou',
  map: 'junior.tabTrail',
  finds: 'junior.tabKit',
  walk: 'junior.tabSteps',
  chat: 'junior.tabRadio',
};

const TONES: Record<TabName, AccentName> = {
  index: 'flame',
  'for-you': 'amber',
  map: 'blue',
  finds: 'teal',
  walk: 'violet',
  chat: 'green',
};

const BAR_HEIGHT = 68;

export function JuniorTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useI18n();
  const setHeight = useContext(BottomTabBarHeightCallbackContext);

  const bottom = Math.max(insets.bottom, space.sm);
  const focusedName = state.routes[state.index]?.name;

  useEffect(() => {
    setHeight?.(BAR_HEIGHT + bottom);
  }, [setHeight, bottom]);

  const icons: Record<TabName, ReactNode> = {
    index: <HomeIcon size={28} />,
    'for-you': <SparkIcon size={28} />,
    map: <RouteIcon size={28} />,
    finds: <SearchIcon size={28} />,
    walk: <ShoeIcon size={28} />,
    chat: <ChatIcon size={28} />,
  };

  return (
    <View
      style={{
        backgroundColor: palette.groundRaised,
        borderTopWidth: border.ink,
        borderTopColor: palette.ink,
        paddingBottom: bottom,
      }}
    >
      <View
        style={{
          height: BAR_HEIGHT,
          width: '100%',
          maxWidth: MAX_COLUMN,
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'stretch',
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
              tone={TONES[name]}
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
  tone: AccentName;
  focused: boolean;
  onPress: () => void;
}) {
  const on = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    on.value = withSpring(focused ? 1 : 0, motionJunior.spring);
  }, [focused, on]);

  const disc = useAnimatedStyle(() => ({
    opacity: on.value,
    transform: [{ scale: 0.7 + on.value * 0.3 }],
  }));

  const art = useAnimatedStyle(() => ({
    transform: [{ translateY: -on.value * 3 }],
    opacity: 0.72 + on.value * 0.28,
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 4 }}
    >
      <View style={{ height: 34, justifyContent: 'center' }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              alignSelf: 'center',
              width: 46,
              height: 34,
              borderRadius: radius.chip,
              borderWidth: border.hair * 2,
              borderColor: palette.ink,
              backgroundColor: accents[tone].solid,
            },
            disc,
          ]}
        />
        <Animated.View style={art}>{icon}</Animated.View>
      </View>
      <JText
        variant="caption"
        color={focused ? ink.onGround : ink.onGroundMuted}
        numberOfLines={1}
        style={{ fontSize: 12 }}
      >
        {label}
      </JText>
    </Pressable>
  );
}
