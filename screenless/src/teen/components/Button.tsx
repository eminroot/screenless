import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePress } from '../motion';
import { border, hit, radius, space, type AccentName } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

type Kind = 'solid' | 'outline' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

const HEIGHT: Record<Size, number> = { lg: hit.buttonLarge, md: hit.button, sm: 40 };
const LABEL: Record<Size, 'title' | 'bodyStrong' | 'small'> = {
  lg: 'title',
  md: 'bodyStrong',
  sm: 'small',
};

/**
 * A button.
 *
 * The solid one is a block of acid with near-black text on it — the single
 * loudest thing in the tier, and there is never more than one per screen.
 * Everything else is an outline: a hairline rectangle with the label in it.
 *
 * Small radius on purpose. A pill button is the shape the six to nine year
 * olds get, and it is instantly readable as an app for a younger kid.
 */
export function Button({
  label,
  onPress,
  icon,
  accent = 'acid',
  kind = 'solid',
  size = 'lg',
  full = true,
  disabled = false,
  busy = false,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  accent?: AccentName;
  kind?: Kind;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, ink, accents } = useSkin();
  const tone = accents[accent];
  const press = usePress(0.985);
  const off = disabled || busy;

  const fill = kind === 'solid' ? tone.solid : 'transparent';
  const edge = kind === 'solid' ? tone.solid : kind === 'outline' ? palette.lineBright : 'transparent';
  const text = kind === 'solid' ? tone.on : kind === 'outline' ? ink.strong : tone.bright;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[full ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}
    >
      {/* The dimming sits outside the animated view on purpose: `usePress`
          animates opacity, and an animated style beats a static one in the
          same array, so a disabled opacity set in there is ignored. */}
      <View style={{ opacity: off ? 0.38 : 1 }}>
      <Animated.View
        style={[
          {
            minHeight: HEIGHT[size],
            borderRadius: radius.button,
            borderWidth: kind === 'ghost' ? 0 : border.strong,
            borderColor: edge,
            backgroundColor: fill,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
            paddingHorizontal: space.xl,
            paddingVertical: space.sm,
          },
          press.style,
        ]}
      >
        {busy ? <ActivityIndicator color={text} /> : icon}
        <TText variant={LABEL[size]} color={text} center numberOfLines={2} style={{ flexShrink: 1 }}>
          {label}
        </TText>
      </Animated.View>
      </View>
    </Pressable>
  );
}

/** A square control carrying one icon. */
export function IconButton({
  icon,
  onPress,
  accent = 'acid',
  kind = 'outline',
  size = hit.icon,
  accessibilityLabel,
  disabled = false,
  style,
}: {
  icon: ReactNode;
  onPress: () => void;
  accent?: AccentName;
  kind?: Kind;
  size?: number;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, accents } = useSkin();
  const tone = accents[accent];
  const press = usePress(0.94);

  const fill = kind === 'solid' ? tone.solid : palette.surface;
  const edge = kind === 'solid' ? tone.solid : palette.line;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={hit.iconSlop}
      style={style}
    >
      <View style={{ opacity: disabled ? 0.38 : 1 }}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius.button,
            borderWidth: border.hair,
            borderColor: edge,
            backgroundColor: fill,
            alignItems: 'center',
            justifyContent: 'center',
          },
          press.style,
        ]}
      >
        {icon}
      </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * A choice. Selected is a filled accent block; unselected is a hairline. The
 * jump between those two states is deliberately large, because these are often
 * tapped without looking.
 */
export function Chip({
  label,
  onPress,
  selected = false,
  accent = 'acid',
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  accent?: AccentName;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, ink, accents } = useSkin();
  const tone = accents[accent];
  const press = usePress(0.97);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={style}
    >
      <Animated.View
        style={[
          {
            minHeight: 42,
            borderRadius: radius.chip,
            borderWidth: border.hair,
            borderColor: selected ? tone.solid : palette.line,
            backgroundColor: selected ? tone.solid : palette.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
          },
          press.style,
        ]}
      >
        {icon}
        <TText
          variant="bodyStrong"
          color={selected ? tone.on : ink.body}
          numberOfLines={1}
          center
          style={{ flexShrink: 1 }}
        >
          {label}
        </TText>
      </Animated.View>
    </Pressable>
  );
}

/** A read-only count: an icon and a figure, on a hairline tag. */
export function CountPill({
  icon,
  value,
  accent = 'amber',
  accessibilityLabel,
}: {
  icon: ReactNode;
  value: string | number;
  accent?: AccentName;
  accessibilityLabel: string;
}) {
  const { palette, accents } = useSkin();
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: border.hair,
        borderColor: palette.line,
        backgroundColor: palette.surface,
      }}
    >
      {icon}
      <TText variant="bodyStrong" color={accents[accent].bright}>
        {value}
      </TText>
    </View>
  );
}
