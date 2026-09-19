import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { Txt } from './Txt';

export function TopBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={back}
        hitSlop={12}
        style={{
          width: 44,
          height: 44,
          borderRadius: radii.pill,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt variant="heading" style={{ marginTop: -2 }}>
          ‹
        </Txt>
      </Pressable>
      {title ? (
        <Txt variant="heading" style={{ flex: 1 }} numberOfLines={2}>
          {title}
        </Txt>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right}
    </View>
  );
}
