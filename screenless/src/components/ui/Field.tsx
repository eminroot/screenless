import { TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, fonts, radii, spacing } from '../../theme/tokens';
import { Txt } from './Txt';

export type FieldProps = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
};

export function Field({ label, hint, error, style, ...rest }: FieldProps) {
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? <Txt variant="subheading">{label}</Txt> : null}
      <View style={{ position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 4,
            right: -4,
            top: 4,
            bottom: -4,
            backgroundColor: colors.border,
            borderRadius: radii.md,
            zIndex: 0,
          }}
        />
        <TextInput
          {...rest}
          placeholderTextColor={colors.textFaint}
          style={[
            {
              // Without an explicit stacking order the absolute shadow paints
              // over the input on web, where positioned siblings win.
              zIndex: 1,
              backgroundColor: colors.surface,
              borderRadius: radii.md,
              borderWidth: borderWidth.thick,
              borderColor: error ? colors.primaryDeep : colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              fontFamily: fonts.bold,
              fontSize: 17,
              color: colors.text,
              minHeight: 52,
            },
            style,
          ]}
        />
      </View>
      {error ? (
        <Txt variant="small" color={colors.primaryDeep}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="small" color={colors.textSoft}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}
