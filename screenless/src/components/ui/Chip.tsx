import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { Txt } from './Txt';

export type ChipProps = {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: string;
  size?: 'lg' | 'sm';
};

export function Chip({ label, emoji, selected, onPress, tone = colors.accent, size = 'lg' }: ChipProps) {
  const [pressed, setPressed] = useState(false);
  const offset = 4;
  const shift = pressed ? offset : 0;

  return (
    <Pressable
      accessibilityRole={onPress ? 'checkbox' : 'text'}
      accessibilityState={{ checked: Boolean(selected) }}
      accessibilityLabel={label}
      disabled={!onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <View style={styles.wrap}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.border,
              borderRadius: radii.md,
              transform: [{ translateX: offset }, { translateY: offset }],
            },
          ]}
        />
        <View
          style={[
            styles.face,
            size === 'sm' && styles.faceSm,
            {
              backgroundColor: selected ? tone : colors.surface,
              transform: [{ translateX: shift }, { translateY: shift }],
            },
          ]}
        >
          {emoji ? <Txt variant={size === 'sm' ? 'body' : 'title'}>{emoji}</Txt> : null}
          <Txt
            variant={size === 'sm' ? 'tiny' : 'small'}
            center
            numberOfLines={2}
            style={size === 'lg' ? { marginTop: 2 } : undefined}
          >
            {label}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  face: {
    borderRadius: radii.md,
    borderWidth: borderWidth.thick,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 84,
  },
  faceSm: {
    minHeight: 0,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
