import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useDepthPress } from '../motion';
import { border, depth, radius, space, type AccentName } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * A panel.
 *
 * A drawn box: two pixels of outline all round and four along the bottom, so
 * it reads as a card standing on a surface rather than as a region of the
 * page. The hairline it used to have was invisible on the light skin, where
 * the card and the ground are both white — the separation has to come from a
 * line somebody drew, not from a difference in lightness that is not there.
 *
 * At ages 6-9 a card is a sticker with three pixels of ink around it and a
 * hard offset shadow. This is the same idea with the volume down: same drawn
 * edge, no offset, no colour in the outline unless the panel is accented.
 *
 * An `accent` lifts the outline and the base to the accent colour — used for
 * the one panel on a screen that is the answer to why the screen exists. It
 * does not fill: a panel washed edge to edge in pale accent becomes the
 * largest coloured area on the screen, which puts it in competition with the
 * button inside it that is the thing actually worth pressing.
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
          backgroundColor: palette.surface,
          borderRadius: radius.card,
          borderWidth: border.strong,
          // The bottom is heavier than the other three. It is the whole of the
          // depth a static panel gets, and it costs nothing to draw.
          borderBottomWidth: border.strong + 2,
          borderColor: tone ? tone.solid : palette.line,
          borderBottomColor: tone ? tone.under : palette.lineBright,
          padding: padded ? space.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * A panel that goes somewhere.
 *
 * Built like the button rather than like the panel: it stands on a solid edge
 * and travels down onto it when pressed. A card that only dims is
 * indistinguishable from a card that is not pressable until you have already
 * pressed it.
 */
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
  const press = useDepthPress(depth.press);

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
      {/* Dimming on its own view: the animated style below drives transform,
          and a static opacity mixed into an animated array stops applying. */}
      <View style={{ opacity: disabled ? 0.45 : 1 }}>
        <View
          style={{
            borderRadius: radius.card,
            backgroundColor: tone ? tone.under : palette.lineBright,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={[
              {
                backgroundColor: palette.surface,
                borderRadius: radius.card,
                borderWidth: border.strong,
                borderColor: tone ? tone.solid : palette.line,
                padding: padded ? space.lg : 0,
              },
              press.face,
            ]}
          >
            {children}
          </Animated.View>
          <Animated.View style={press.gap} />
        </View>
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
        borderWidth: border.strong,
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
