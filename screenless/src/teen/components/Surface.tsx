import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { usePress } from '../motion';
import { border, radius, space, type AccentName } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * A panel.
 *
 * Barely lifted off the ground, separated by a one pixel rule rather than by a
 * shadow or an outline. At ages 6-9 a card is a sticker with three pixels of
 * ink around it; here the whole point is that the interface looks assembled
 * rather than assembled-out-of-shapes, and a hairline does that.
 *
 * An `accent` puts a low-alpha wash behind it and lifts the rule to the accent
 * colour — used for the one panel on a screen that is the answer to why the
 * screen exists.
 */
export function Panel({
  children,
  accent,
  style,
  padded = true,
}: {
  children: ReactNode;
  accent?: AccentName;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { palette, accents } = useSkin();
  const tone = accent ? accents[accent] : null;
  return (
    <View
      style={[
        {
          backgroundColor: tone ? tone.wash : palette.surface,
          borderRadius: radius.card,
          borderWidth: border.hair,
          borderColor: tone ? tone.solid : palette.line,
          padding: padded ? space.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** A panel that goes somewhere. Dims on press, nothing more. */
export function PanelButton({
  children,
  onPress,
  accessibilityLabel,
  accent,
  style,
  padded = true,
  disabled = false,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accent?: AccentName;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  disabled?: boolean;
}) {
  const { palette, accents } = useSkin();
  const tone = accent ? accents[accent] : null;
  const press = usePress(0.99);

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
      style={style}
    >
      {/* Dimming outside the animated view: `usePress` animates opacity and
          would otherwise overwrite a disabled opacity set alongside it. */}
      <View style={{ opacity: disabled ? 0.4 : 1 }}>
      <Animated.View
        style={[
          {
            backgroundColor: tone ? tone.wash : palette.surface,
            borderRadius: radius.card,
            borderWidth: border.hair,
            borderColor: tone ? tone.solid : palette.line,
            padding: padded ? space.lg : 0,
          },
          press.style,
        ]}
      >
        {children}
      </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * The section heading: a wide-tracked upper case label with a rule running off
 * to the right. It is the only ornament in the tier, and it is what makes a
 * long scroll read as a document with sections rather than a pile of cards.
 */
export function Label({
  children,
  accent,
  trailing,
  style,
}: {
  children: string;
  accent?: AccentName;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, ink, accents } = useSkin();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
        style,
      ]}
    >
      <TText variant="label" color={accent ? accents[accent].bright : ink.muted}>
        {children}
      </TText>
      <View style={{ flex: 1, height: border.hair, backgroundColor: palette.line }} />
      {trailing}
    </View>
  );
}

/** A small round swatch with an icon in it. Used at the head of a row. */
export function Dot({
  children,
  accent = 'acid',
  size = 36,
}: {
  children: ReactNode;
  accent?: AccentName;
  size?: number;
}) {
  const { palette, accents } = useSkin();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.chip,
        backgroundColor: accents[accent].wash,
        borderWidth: border.hair,
        borderColor: palette.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}

/** A divider between rows of one panel. */
export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  const { palette } = useSkin();
  return <View style={[{ height: border.hair, backgroundColor: palette.line }, style]} />;
}
