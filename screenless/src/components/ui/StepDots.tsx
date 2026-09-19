import { View } from 'react-native';

import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/** Shows how far through setup the parent is. */
export function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 28 : 12,
            height: 12,
            borderRadius: radii.pill,
            borderWidth: borderWidth.hair,
            borderColor: colors.border,
            backgroundColor: i <= step ? colors.accent : colors.surface,
          }}
        />
      ))}
    </View>
  );
}
