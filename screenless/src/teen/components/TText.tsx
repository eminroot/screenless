import { Platform, Text, type TextProps, type TextStyle } from 'react-native';

import { typeTeen, type TeenVariant } from '../theme';
import { useSkin } from '../skin';

export type TTextProps = TextProps & {
  variant?: TeenVariant;
  color?: string;
  center?: boolean;
};

/**
 * Text for the 10-13 interface.
 *
 * The `label` variant is upper cased here rather than at every call site,
 * because it is only ever used one way: small, wide tracked, and shouting
 * quietly above something else.
 */
export function TText({ variant = 'body', color, center, style, children, ...rest }: TTextProps) {
  const { ink } = useSkin();
  const resolved = color ?? (variant === 'label' || variant === 'caption' ? ink.muted : ink.strong);
  const content = variant === 'label' && typeof children === 'string' ? children.toUpperCase() : children;

  return (
    <Text
      {...rest}
      style={[
        typeTeen[variant] as TextStyle,
        { color: resolved },
        Platform.OS === 'android' ? { includeFontPadding: false } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      maxFontSizeMultiplier={1.5}
    >
      {content}
    </Text>
  );
}
