import { useContext, useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import {
  CollectionIcon,
  MessageIcon,
  ProgressIcon,
  SparkIcon,
  StepsIcon,
  TodayIcon,
} from '../icons';
import { border, MAX_COLUMN, space } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * The tab bar for ages 10 to 14.
 *
 * A hairline across the bottom of the ground, six thin icons, a two pixel
 * acid rule over the one you are on. No coloured discs, no lifting, no bounce.
 *
 * The labels stay, because six abstract line icons with nothing under them is
 * a puzzle rather than a navigation bar — but they are the small wide-tracked
 * kind used everywhere else in the tier rather than a caption.
 *
 * The parent tab is not here. It lives behind the lock on the Today screen, so
 * the child never taps into a code pad by accident.
 */
const ORDER = ['index', 'for-you', 'map', 'finds', 'walk', 'chat'] as const;
type TabName = (typeof ORDER)[number];

const LABELS: Record<TabName, TKey> = {
  index: 'teen.tabToday',
  'for-you': 'teen.tabForYou',
  map: 'teen.tabProgress',
  finds: 'teen.tabFinds',
  walk: 'teen.tabSteps',
  chat: 'teen.tabTalk',
};

const BAR_HEIGHT = 58;

export function TeenTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { palette } = useSkin();
  const { t } = useI18n();
  const setHeight = useContext(BottomTabBarHeightCallbackContext);

  const bottom = Math.max(insets.bottom, space.sm);
  const focusedName = state.routes[state.index]?.name;

  useEffect(() => {
    setHeight?.(BAR_HEIGHT + bottom);
  }, [setHeight, bottom]);

  const icons: Record<TabName, (color: string) => ReactNode> = {
    index: (color) => <TodayIcon size={21} color={color} />,
    'for-you': (color) => <SparkIcon size={21} color={color} />,
    map: (color) => <ProgressIcon size={21} color={color} />,
    finds: (color) => <CollectionIcon size={21} color={color} />,
    walk: (color) => <StepsIcon size={21} color={color} />,
    chat: (color) => <MessageIcon size={21} color={color} />,
  };

  return (
    <View
      style={{
        backgroundColor: palette.ground,
        borderTopWidth: border.hair,
        borderTopColor: palette.line,
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
              renderIcon={icons[name]}
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
  renderIcon,
  focused,
  onPress,
}: {
  label: string;
  renderIcon: (color: string) => ReactNode;
  focused: boolean;
  onPress: () => void;
}) {
  const { ink, accents } = useSkin();
  const on = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [focused, on]);

  const rule = useAnimatedStyle(() => ({ opacity: on.value }));

  const colour = focused ? accents.acid.bright : ink.muted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            width: 26,
            height: 2,
            borderRadius: 1,
            backgroundColor: accents.acid.solid,
          },
          rule,
        ]}
      />
      {renderIcon(colour)}
      <TText variant="label" color={colour} numberOfLines={1} style={{ fontSize: 10 }}>
        {label}
      </TText>
    </Pressable>
  );
}
