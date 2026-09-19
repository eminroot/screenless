import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useStickerPress } from '../motion';
import { accents, border, drop, ink, palette, radius, space, type AccentName } from '../theme';
import { JText } from './JText';

/**
 * A card, cut out and stuck down.
 *
 * Three pixels of ink around the edge and a hard shadow offset down and to the
 * right, no blur. That shadow is the whole trick: it makes a card read as a
 * thing placed on the ground rather than a rectangle drawn on it, which is
 * what stops this tier looking like a settings screen.
 *
 * Cream by default, because every long piece of text in the app lands on one
 * of these and light-on-dark is a poor way to read a paragraph. An `accent`
 * washes it; `filled` makes it the full vivid colour, for the one card on a
 * screen that is shouting.
 */
export function Card({
  children,
  accent,
  filled = false,
  style,
  wrapperStyle,
  padded = true,
  depth = drop.md,
}: {
  children: ReactNode;
  accent?: AccentName;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  depth?: number;
}) {
  const tone = accent ? accents[accent] : null;
  const fill = !tone ? palette.surface : filled ? tone.solid : tone.tint;

  return (
    <View style={[{ paddingRight: depth, paddingBottom: depth }, wrapperStyle]}>
      <Shadow depth={depth} radius={radius.card} />
      <View
        style={[
          {
            backgroundColor: fill,
            borderRadius: radius.card,
            borderWidth: border.ink,
            borderColor: palette.ink,
            padding: padded ? space.lg : 0,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/** A card that goes somewhere: it drops onto its own shadow when pressed. */
export function CardButton({
  children,
  onPress,
  accessibilityLabel,
  accent,
  filled = false,
  style,
  wrapperStyle,
  padded = true,
  depth = drop.md,
  disabled = false,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accent?: AccentName;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  depth?: number;
  disabled?: boolean;
}) {
  const tone = accent ? accents[accent] : null;
  const fill = !tone ? palette.surface : filled ? tone.solid : tone.tint;
  const press = useStickerPress(depth);

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
      style={wrapperStyle}
    >
      <View style={{ paddingRight: depth, paddingBottom: depth, opacity: disabled ? 0.8 : 1 }}>
        <Shadow depth={depth} radius={radius.card} />
        <Animated.View
          style={[
            {
              backgroundColor: fill,
              borderRadius: radius.card,
              borderWidth: border.ink,
              borderColor: palette.ink,
              padding: padded ? space.lg : 0,
              overflow: 'hidden',
            },
            style,
            press.style,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** The hard offset block every surface stands on. */
export function Shadow({ depth, radius: r }: { depth: number; radius: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: depth,
        top: depth,
        right: 0,
        bottom: 0,
        borderRadius: r,
        backgroundColor: palette.ink,
      }}
    />
  );
}

/**
 * A vivid block with an object in it. Every card in this tier starts with one,
 * and its colour is what tells the child which kind of thing the card is.
 */
export function IconTile({
  children,
  accent = 'blue',
  size = 48,
  round = false,
}: {
  children: ReactNode;
  accent?: AccentName;
  size?: number;
  round?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : radius.chip,
        borderWidth: border.hair * 2,
        borderColor: palette.ink,
        backgroundColor: accents[accent].solid,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

/**
 * A stamped heading over a group of cards, written straight onto the ground.
 * Upper case and tracked out, like something stencilled onto a crate.
 */
export function Stamp({
  children,
  accent = 'amber',
  style,
}: {
  children: string;
  accent?: AccentName;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md }, style]}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: accents[accent].solid,
          transform: [{ rotate: '45deg' }],
        }}
      />
      <JText variant="stamp" color={ink.onGround}>
        {children.toUpperCase()}
      </JText>
      <View style={{ flex: 1, height: 2, borderRadius: 2, backgroundColor: palette.groundLine }} />
    </View>
  );
}

/** A divider between rows of one card. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: border.hair, backgroundColor: palette.ink, opacity: 0.18 }, style]} />;
}
