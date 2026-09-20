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
import { border, fontsTeen, MAX_COLUMN, radius, space } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * The tab bar for ages 10 to 13.
 *
 * Six icons, and the one you are on sits in a filled block of accent. The
 * two pixel rule it used to have instead was the correct amount of signal for
 * a bar nobody looks at, which is not what a tab bar is: this is the control a
 * child uses more than any other, and it should be obvious without reading.
 *
 * The labels stay, because six abstract line icons with nothing under them is
 * a puzzle rather than a navigation bar. They are the one place in the tier
 * that drops the wide tracking — six tracked upper case words do not fit
 * across a phone, and the old bar shipped "PROGRE…" and "FIN…" as a
 * result.
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

const BAR_HEIGHT = 62;

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
        borderTopWidth: border.strong,
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

  const block = useAnimatedStyle(() => ({ opacity: on.value }));

  const colour = focused ? accents.acid.bright : ink.muted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
    >
      <View style={{ height: 32, justifyContent: 'center', alignItems: 'center' }}>
        {/* The block sits behind the icon rather than around the whole item:
            it has to clear the label, or a six-tab bar becomes six buttons. */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 46,
              height: 32,
              borderRadius: radius.chip,
              backgroundColor: accents.acid.wash,
              borderWidth: border.strong,
              borderColor: accents.acid.solid,
            },
            block,
          ]}
        />
        {renderIcon(colour)}
      </View>
      {/* `caption` rather than `label`: the label variant upper cases its own
          text, and six tracked capitals do not fit across a phone. */}
      <TText
        variant="caption"
        color={colour}
        numberOfLines={1}
        style={{ fontFamily: fontsTeen.heavy, fontSize: 11, lineHeight: 14 }}
      >
        {label}
      </TText>
    </Pressable>
  );
}
