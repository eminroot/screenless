import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePress } from '../motion';
import { ink, lip as lipDepth, round, space, tones, type ToneName } from '../theme';
import { LText } from './LText';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const HEIGHTS: Record<Size, number> = { sm: 46, md: 56, lg: 66, xl: 78 };
const LABEL: Record<Size, 'small' | 'label' | 'heading' | 'title'> = {
  sm: 'small',
  md: 'label',
  lg: 'heading',
  xl: 'title',
};

/**
 * The shine along the top of every clay face. Two stacked translucent bands
 * rather than a gradient: it costs nothing to draw and reads as a soft bulge.
 */
function Shine({ radius }: { radius: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          bottom: '52%',
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          backgroundColor: 'rgba(255,255,255,0.18)',
        },
      ]}
    />
  );
}

export type ClayButtonProps = {
  label?: string;
  icon?: ReactNode;
  onPress: () => void;
  tone?: ToneName;
  size?: Size;
  /** Stretch to the width of the parent. */
  full?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A button that looks like a toy button: a coloured face on a darker lip,
 * sinking into it under a thumb. Big by default, because the people pressing
 * it are three.
 */
export function ClayButton({
  label,
  icon,
  onPress,
  tone = 'sun',
  size = 'lg',
  full = true,
  disabled = false,
  accessibilityLabel,
  style,
}: ClayButtonProps) {
  const palette = tones[tone];
  const depth = lipDepth[size];
  const height = HEIGHTS[size];
  // Fully round rather than merely rounded: a pill is the shape a small child
  // reads as a thing to press, and it is what every button in the world they
  // already know looks like.
  const radius = size === 'sm' ? round.sm : round.pill;
  const { onPressIn, onPressOut, face } = usePress(depth);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[full ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, { opacity: disabled ? 0.45 : 1 }, style]}
      hitSlop={size === 'sm' ? 6 : 0}
    >
      <View style={{ paddingBottom: depth }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { top: depth, backgroundColor: palette.lip, borderRadius: radius },
          ]}
        />
        <Animated.View
          style={[
            {
              minHeight: height,
              borderRadius: radius,
              backgroundColor: palette.face,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: space.sm,
              paddingHorizontal: size === 'sm' ? space.lg : space.xl,
              paddingVertical: space.xs,
              overflow: 'hidden',
            },
            face,
          ]}
        >
          <Shine radius={radius} />
          {icon}
          {label ? (
            // Shrinkable, so a label that wraps onto a second line pushes the
            // icon along instead of growing out under it.
            <LText
              variant={LABEL[size]}
              color={palette.ink}
              numberOfLines={2}
              center
              style={{ flexShrink: 1 }}
            >
              {label}
            </LText>
          ) : null}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** A round button with only an icon, for back, close, speak and the like. */
export function ClayIconButton({
  icon,
  onPress,
  tone = 'white',
  size = 52,
  accessibilityLabel,
  style,
}: {
  icon: ReactNode;
  onPress: () => void;
  tone?: ToneName;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = tones[tone];
  const depth = size >= 60 ? lipDepth.md : lipDepth.sm;
  const { onPressIn, onPressOut, face } = usePress(depth);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={8}
      style={style}
    >
      <View style={{ width: size, height: size + depth }}>
        <View
          style={{
            position: 'absolute',
            top: depth,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.lip,
          }}
        />
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: palette.face,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            face,
          ]}
        >
          <Shine radius={size / 2} />
          {icon}
        </Animated.View>
      </View>
    </Pressable>
  );
}

export type ClayCardProps = {
  children: ReactNode;
  tone?: ToneName;
  /** Overrides the tone's face, for tinted cards. */
  face?: string;
  lip?: string;
  depth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** Styles for the outer wrapper: margins and flex belong here. */
  wrapperStyle?: StyleProp<ViewStyle>;
};

/** A still card with the same lip as the buttons. */
export function ClayCard({
  children,
  tone = 'white',
  face,
  lip,
  depth = lipDepth.lg,
  radius = round.lg,
  style,
  wrapperStyle,
}: ClayCardProps) {
  const palette = tones[tone];
  return (
    <View style={[{ paddingBottom: depth }, wrapperStyle]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { top: depth, backgroundColor: lip ?? palette.lip, borderRadius: radius },
        ]}
      />
      <View style={[{ backgroundColor: face ?? palette.face, borderRadius: radius }, style]}>{children}</View>
    </View>
  );
}

/**
 * A pressable card: anything bigger than a button that still goes somewhere,
 * like an activity tile or a mission.
 */
export function ClayTile({
  children,
  onPress,
  tone = 'white',
  face,
  lip,
  depth = lipDepth.lg,
  radius = round.lg,
  accessibilityLabel,
  style,
  wrapperStyle,
}: ClayCardProps & { onPress: () => void; accessibilityLabel: string }) {
  const palette = tones[tone];
  const { onPressIn, onPressOut, face: faceMotion } = usePress(depth);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={wrapperStyle}
    >
      <View style={{ paddingBottom: depth, flexGrow: 1 }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { top: depth, backgroundColor: lip ?? palette.lip, borderRadius: radius },
          ]}
        />
        <Animated.View
          style={[
            { backgroundColor: face ?? palette.face, borderRadius: radius, overflow: 'hidden', flexGrow: 1 },
            style,
            faceMotion,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * A count on a white pill with its picture in a coloured disc at the left:
 * stars, coins, a streak. Three of them in a row along the top of a screen is
 * how a child reads their own score without a word of text on the screen.
 */
export function StatPill({
  icon,
  value,
  accessibilityLabel,
  tone = 'sun',
}: {
  icon: ReactNode;
  value: string | number;
  accessibilityLabel: string;
  tone?: ToneName;
}) {
  const palette = tones[tone];
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={{ paddingBottom: lipDepth.sm }}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { top: lipDepth.sm, backgroundColor: tones.white.lip, borderRadius: round.pill },
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: tones.white.face,
          borderRadius: round.pill,
          paddingLeft: 5,
          paddingRight: 14,
          height: 42,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: palette.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
        <LText variant="number" color={ink.text}>
          {value}
        </LText>
      </View>
    </View>
  );
}
