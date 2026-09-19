import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { Txt } from './ui';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

const meta: Record<string, { emoji: string; tone: string }> = {
  index: { emoji: '🏠', tone: colors.accent },
  finds: { emoji: '🔎', tone: colors.primary },
  walk: { emoji: '👟', tone: colors.accent },
  map: { emoji: '🗺️', tone: colors.success },
  chat: { emoji: '💬', tone: colors.magic },
  parent: { emoji: '🔒', tone: colors.info },
};

/** A thick sticker bar rather than the flat system tab bar. */
export function CartoonTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderTopWidth: borderWidth.chunky,
        borderColor: colors.border,
        paddingTop: spacing.sm,
        paddingBottom: Math.max(insets.bottom, spacing.sm),
        paddingHorizontal: spacing.xs,
      }}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const item = meta[route.name] ?? { emoji: '•', tone: colors.accent };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center' }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (focused || event.defaultPrevented) return;
              void Haptics.selectionAsync();
              navigation.navigate(route.name);
            }}
          >
            <View
              style={{
                // Six tabs, so the pill keeps only enough width for the icon.
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.sm,
                borderRadius: radii.pill,
                backgroundColor: focused ? item.tone : 'transparent',
                borderWidth: focused ? borderWidth.hair : 0,
                borderColor: colors.border,
                alignItems: 'center',
                minWidth: 40,
              }}
            >
              <Txt variant="subheading" style={{ opacity: focused ? 1 : 0.5 }}>
                {item.emoji}
              </Txt>
            </View>
            <Txt
              variant="tiny"
              numberOfLines={1}
              color={focused ? colors.text : colors.textFaint}
              style={{ marginTop: 2 }}
            >
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
