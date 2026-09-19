import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, type } from '../../theme/tokens';

type Variant = keyof typeof type;

export type TxtProps = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

export function Txt({
  variant = 'body',
  color = colors.text,
  center,
  style,
  ...rest
}: TxtProps) {
  const base = type[variant] as TextStyle;
  return (
    <RNText
      {...rest}
      style={[base, { color }, center && { textAlign: 'center' }, style]}
      // Keeps layout predictable when a child has huge system font sizes on.
      maxFontSizeMultiplier={1.3}
    />
  );
}
