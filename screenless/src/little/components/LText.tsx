import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { ink, typeLittle, type LittleVariant } from '../theme';

export type LTextProps = TextProps & {
  variant?: LittleVariant;
  color?: string;
  center?: boolean;
};

/**
 * Text for the 3-5 interface.
 *
 * Baloo sits high in its box on Android unless the extra font padding is
 * removed, which would push every button label off centre.
 */
export function LText({ variant = 'body', color = ink.text, center, style, ...rest }: LTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typeLittle[variant] as TextStyle,
        { color },
        Platform.OS === 'android' ? { includeFontPadding: false } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      // Large system text still has to fit inside a button a thumb can press.
      maxFontSizeMultiplier={1.25}
    />
  );
}
