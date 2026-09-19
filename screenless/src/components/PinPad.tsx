import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Txt } from './ui';
import { borderWidth, colors, radii, spacing, stickerOffset } from '../theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinDots({ filled, length = 4 }: { filled: number; length?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'center' }}>
      {Array.from({ length }, (_, i) => (
        <View
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            backgroundColor: i < filled ? colors.text : colors.surface,
          }}
        />
      ))}
    </View>
  );
}

/** Chunky numeric pad. The parent gate never uses the system keyboard. */
export function PinPad({
  value,
  onChange,
  length = 4,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const press = (key: string) => {
    void Haptics.selectionAsync();
    if (key === '⌫') onChange(value.slice(0, -1));
    else if (value.length < length) onChange(value + key);
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {KEYS.map((key, index) =>
        key === '' ? (
          <View key={index} style={{ width: '30%' }} />
        ) : (
          <Key key={index} label={key} onPress={() => press(key)} />
        ),
      )}
    </View>
  );
}

function Key({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: '30%',
        transform: [
          { translateX: pressed ? stickerOffset : 0 },
          { translateY: pressed ? stickerOffset : 0 },
        ],
      })}
    >
      <View
        style={{
          paddingVertical: spacing.lg,
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
        }}
      >
        <Txt variant="heading">{label}</Txt>
      </View>
    </Pressable>
  );
}
