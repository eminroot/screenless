import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderWidth, colors, radii, stickerOffset } from '../../theme/tokens';

export type StickerProps = {
  children: ReactNode;
  /** Fill colour of the card face. */
  background?: string;
  /** Colour of the hard shadow sitting behind the card. */
  shadow?: string;
  radius?: number;
  offset?: number;
  border?: number;
  style?: StyleProp<ViewStyle>;
  /** Set while the card is being pressed so it sinks onto its shadow. */
  pressed?: boolean;
};

const MARGIN_KEYS = new Set([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
]);

/**
 * Margins belong to the wrapper, not the face. On the face they stretched the
 * wrapper, and the shadow, which fills the wrapper, painted a thick ink band
 * into the gap above every card given a `marginTop`.
 */
function splitMargins(style: StyleProp<ViewStyle>) {
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(StyleSheet.flatten(style) ?? {})) {
    (MARGIN_KEYS.has(key) ? outer : inner)[key] = value;
  }
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}

/**
 * A card with a solid offset shadow instead of a blur. Reads like a sticker
 * and renders identically on both platforms, which elevation does not.
 */
export function Sticker({
  children,
  background = colors.surface,
  shadow = colors.border,
  radius = radii.lg,
  offset = stickerOffset,
  border = borderWidth.thick,
  style,
  pressed = false,
}: StickerProps) {
  const shift = pressed ? offset : 0;
  const { outer, inner } = splitMargins(style);
  return (
    <View style={[styles.wrap, outer]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: shadow,
            borderRadius: radius,
            transform: [{ translateX: offset }, { translateY: offset }],
          },
        ]}
      />
      <View
        style={[
          {
            backgroundColor: background,
            borderRadius: radius,
            borderWidth: border,
            borderColor: colors.border,
            transform: [{ translateX: shift }, { translateY: shift }],
          },
          inner,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
});
