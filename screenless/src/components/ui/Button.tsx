import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { borderWidth, colors, radii, spacing, stickerOffset, type } from '../../theme/tokens';
import { Txt } from './Txt';

type Tone = 'primary' | 'accent' | 'success' | 'info' | 'magic' | 'neutral' | 'ghost';

const tones: Record<Tone, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: colors.surface },
  accent: { bg: colors.accent, fg: colors.text },
  success: { bg: colors.success, fg: colors.surface },
  info: { bg: colors.info, fg: colors.surface },
  magic: { bg: colors.magic, fg: colors.surface },
  neutral: { bg: colors.surface, fg: colors.text },
  ghost: { bg: 'transparent', fg: colors.text },
};

export type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: Tone;
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  busy?: boolean;
  full?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function Button({
  label,
  onPress,
  tone = 'primary',
  size = 'lg',
  disabled,
  busy,
  full = true,
  icon,
  style,
  haptic = true,
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const palette = tones[tone];
  const ghost = tone === 'ghost';
  const inactive = disabled || busy;
  const offset = ghost ? 0 : stickerOffset;
  const shift = pressed && !inactive ? offset : 0;

  const padding =
    size === 'lg'
      ? { paddingVertical: 16, paddingHorizontal: spacing.xl }
      : size === 'md'
        ? { paddingVertical: 12, paddingHorizontal: spacing.lg }
        : { paddingVertical: 8, paddingHorizontal: spacing.md };

  const fontSize = size === 'lg' ? type.button.fontSize : size === 'md' ? 15 : 13;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(inactive) }}
      disabled={inactive}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        if (haptic && !ghost) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[full && styles.full, { opacity: inactive ? 0.55 : 1 }, style]}
    >
      <View style={styles.wrap}>
        {!ghost && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.border,
                borderRadius: radii.pill,
                transform: [{ translateX: offset }, { translateY: offset }],
              },
            ]}
          />
        )}
        <View
          style={[
            styles.face,
            padding,
            {
              backgroundColor: palette.bg,
              borderWidth: ghost ? 0 : borderWidth.thick,
              borderColor: colors.border,
              transform: [{ translateX: shift }, { translateY: shift }],
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={palette.fg} />
          ) : (
            <>
              {icon}
              <Txt
                variant="button"
                color={palette.fg}
                style={{ fontSize, textDecorationLine: ghost ? 'underline' : 'none' }}
                numberOfLines={1}
              >
                {label}
              </Txt>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { alignSelf: 'stretch' },
  wrap: { position: 'relative' },
  face: {
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
});
