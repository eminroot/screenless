import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useDepthPress, usePress } from '../motion';
import { border, depth, hit, radius, space, type AccentName } from '../theme';
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
 * The solid one is a block of accent standing on a hard edge of the same
 * colour in shadow. Pressing it moves the block down onto that edge, which is
 * the whole press: no dimming, no scale, no shadow that fades. It is worth the
 * two extra views because it is the only depth in the tier, and without it a
 * light-skin screen is flat rectangles on a flat ground.
 *
 * `outline` gets the same construction in greys — a white face, a drawn
 * outline, and a solid rule under it — so the secondary action is visibly the
 * same kind of object as the primary one rather than a different species.
 * `ghost` is a bare label and has no edge, because it is not a block.
 *
 * There is still only ever one `solid` on a screen.
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
  const press = useDepthPress(depth.button);
  const off = disabled || busy;

  const face = kind === 'solid' ? tone.solid : kind === 'outline' ? palette.surface : 'transparent';
  const edge = kind === 'solid' ? tone.under : kind === 'outline' ? palette.lineBright : 'transparent';
  const outline = kind === 'solid' ? tone.solid : kind === 'outline' ? palette.line : 'transparent';
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
      {/* The dimming sits on its own view: the animated style below drives
          transform, and mixing a static opacity into an animated style array
          is how it silently stops applying. */}
      <View style={{ opacity: off ? 0.45 : 1 }}>
        {/* The edge. The face sits on top of it and the gap below the face is
            what lets the edge show; pressing closes the gap and moves the face
            into it, so the whole control keeps one height throughout. */}
        <View style={{ borderRadius: radius.button, backgroundColor: edge, overflow: 'hidden' }}>
          <Animated.View
            style={[
              {
                minHeight: HEIGHT[size],
                borderRadius: radius.button,
                borderWidth: kind === 'ghost' ? 0 : border.strong,
                borderColor: outline,
                backgroundColor: face,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.sm,
                paddingHorizontal: space.xl,
                paddingVertical: space.sm,
              },
              press.face,
            ]}
          >
            {busy ? <ActivityIndicator color={text} /> : icon}
            <TText variant={LABEL[size]} color={text} center numberOfLines={2} style={{ flexShrink: 1 }}>
              {label}
            </TText>
          </Animated.View>
          <Animated.View style={press.gap} />
        </View>
      </View>
    </Pressable>
  );
}

/** A square control carrying one icon, built the same way. */
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
  const press = useDepthPress(depth.press);

  const face = kind === 'solid' ? tone.solid : palette.surface;
  const edge = kind === 'solid' ? tone.under : palette.lineBright;
  const outline = kind === 'solid' ? tone.solid : palette.line;

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
      <View style={{ opacity: disabled ? 0.45 : 1 }}>
        <View style={{ borderRadius: radius.chip, backgroundColor: edge, overflow: 'hidden' }}>
          <Animated.View
            style={[
              {
                width: size,
                height: size,
                borderRadius: radius.chip,
                borderWidth: border.strong,
                borderColor: outline,
                backgroundColor: face,
                alignItems: 'center',
                justifyContent: 'center',
              },
              press.face,
            ]}
          >
            {icon}
          </Animated.View>
          <Animated.View style={press.gap} />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * A choice. Selected is a filled accent block; unselected is an outlined white
 * one. The jump between those two states is deliberately large, because these
 * are often tapped without looking.
 *
 * Chips keep the drawn outline but not the standing edge. A row of six chips
 * each casting its own edge is six pieces of depth competing with the one
 * button underneath that actually commits to something.
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
            minHeight: 44,
            borderRadius: radius.chip,
            borderWidth: border.strong,
            borderColor: selected ? tone.under : palette.line,
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

/** A read-only count: an icon and a figure, on a tag. Never pressable, so no edge. */
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
        height: 36,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: border.strong,
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
