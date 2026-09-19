import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useStickerPress } from '../motion';
import { accents, border, drop, hit, ink, palette, radius, space, type AccentName } from '../theme';
import { JText } from './JText';
import { Shadow } from './Surface';

type Kind = 'solid' | 'cream' | 'ghost';
type Size = 'lg' | 'md' | 'sm';

const HEIGHT: Record<Size, number> = { lg: hit.buttonLarge, md: hit.button, sm: 46 };
const LABEL: Record<Size, 'title' | 'heading' | 'bodyStrong'> = {
  lg: 'title',
  md: 'heading',
  sm: 'bodyStrong',
};

/**
 * A button: a vivid block of colour, cut out in ink, standing on a hard
 * shadow. Pressing it pushes it flat onto that shadow.
 *
 * The label is dark ink on the colour rather than white. White on a saturated
 * fill is the house style of every SaaS product ever shipped; dark ink on it
 * is what a comic panel does, and it clears 7:1 besides.
 *
 * One solid button per screen, so the thing the screen is for is never in
 * doubt. Everything else is cream.
 */
export function Button({
  label,
  onPress,
  icon,
  accent = 'green',
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
  const tone = accents[accent];
  const depth = kind === 'ghost' ? 0 : drop.md;
  const press = useStickerPress(depth);
  const off = disabled || busy;

  const fill = kind === 'solid' ? tone.solid : kind === 'cream' ? palette.surface : 'transparent';
  const text = kind === 'solid' ? tone.on : kind === 'cream' ? ink.strong : ink.onGround;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[full ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}
    >
      <View style={{ paddingRight: depth, paddingBottom: depth, opacity: off ? 0.55 : 1 }}>
        {depth > 0 ? <Shadow depth={depth} radius={radius.button} /> : null}
        <Animated.View
          style={[
            {
              minHeight: HEIGHT[size],
              borderRadius: radius.button,
              borderWidth: kind === 'ghost' ? 0 : border.ink,
              borderColor: palette.ink,
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
          <JText variant={LABEL[size]} color={text} center numberOfLines={2} style={{ flexShrink: 1 }}>
            {label}
          </JText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** A round control carrying one object: read aloud, a tip, close, send. */
export function IconButton({
  icon,
  onPress,
  accent = 'blue',
  kind = 'solid',
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
  const tone = accents[accent];
  const depth = drop.sm;
  const press = useStickerPress(depth);
  const fill = kind === 'solid' ? tone.solid : palette.surface;

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
      // The slop is what carries a 52px control past the 75px target this age
      // needs, without a nursery sized circle on every screen.
      hitSlop={hit.iconSlop}
      style={style}
    >
      <View style={{ paddingRight: depth, paddingBottom: depth, opacity: disabled ? 0.55 : 1 }}>
        <Shadow depth={depth} radius={size / 2} />
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: border.ink,
              borderColor: palette.ink,
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
 * A choice: an answer, a filter, how long you have got. Cream when it is not
 * chosen, full colour with a heavier edge when it is — so which one is picked
 * is obvious from across a room.
 */
export function Chip({
  label,
  onPress,
  selected = false,
  accent = 'green',
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
  const tone = accents[accent];
  const depth = drop.sm;
  const press = useStickerPress(depth);

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
      <View style={{ paddingRight: depth, paddingBottom: depth }}>
        <Shadow depth={depth} radius={radius.chip} />
        <Animated.View
          style={[
            {
              minHeight: 54,
              borderRadius: radius.chip,
              borderWidth: selected ? border.strong : border.ink,
              borderColor: palette.ink,
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
          <JText
            variant="bodyStrong"
            color={selected ? tone.on : ink.strong}
            numberOfLines={2}
            center
            style={{ flexShrink: 1 }}
          >
            {label}
          </JText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** A read-only count: an object and a number, on a coloured tag. */
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
  const depth = drop.sm;
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={{ paddingRight: depth, paddingBottom: depth }}
    >
      <Shadow depth={depth} radius={radius.pill} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          height: 42,
          paddingLeft: space.sm,
          paddingRight: space.md,
          borderRadius: radius.pill,
          borderWidth: border.ink,
          borderColor: palette.ink,
          backgroundColor: accents[accent].solid,
        }}
      >
        {icon}
        <JText variant="heading" color={accents[accent].on}>
          {value}
        </JText>
      </View>
    </View>
  );
}
