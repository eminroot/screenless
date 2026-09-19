import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { ink, typeJunior, type JuniorVariant } from '../theme';

export type JTextProps = TextProps & {
  variant?: JuniorVariant;
  color?: string;
  center?: boolean;
};

/**
 * Text for the 6-8 interface.
 *
 * The default is `body` rather than a reading size: most strings here are
 * labels. Anything the child is meant to actually read — a mission, a step, a
 * fact — asks for `read`, which is the 18px the research puts the floor at.
 */
export function JText({ variant = 'body', color = ink.strong, center, style, ...rest }: JTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typeJunior[variant] as TextStyle,
        { color },
        Platform.OS === 'android' ? { includeFontPadding: false } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      // Large system text still has to leave a button pressable.
      maxFontSizeMultiplier={1.4}
    />
  );
}
