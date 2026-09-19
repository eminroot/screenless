import { View } from 'react-native';

import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { Txt } from './Txt';

/**
 * Comic speech bubble with a hand drawn looking tail, used whenever the buddy
 * says something. The tail is two stacked triangles so the ink outline reads
 * continuously with the bubble border.
 */
export function SpeechBubble({
  text,
  tailSide = 'left',
  background = colors.surface,
}: {
  text: string;
  tailSide?: 'left' | 'right' | 'none';
  background?: string;
}) {
  const tailOffset = 28;
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          position: 'absolute',
          left: 5,
          right: -5,
          top: 5,
          bottom: -5,
          backgroundColor: colors.border,
          borderRadius: radii.lg,
        }}
      />
      <View
        style={{
          backgroundColor: background,
          borderRadius: radii.lg,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Txt variant="bodyStrong">{text}</Txt>
      </View>

      {tailSide !== 'none' && (
        <>
          <View
            style={{
              position: 'absolute',
              bottom: -17,
              [tailSide]: tailOffset,
              width: 0,
              height: 0,
              borderLeftWidth: 13,
              borderRightWidth: 13,
              borderTopWidth: 18,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: colors.border,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -10,
              [tailSide]: tailOffset + 4,
              width: 0,
              height: 0,
              borderLeftWidth: 9,
              borderRightWidth: 9,
              borderTopWidth: 13,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: background,
            }}
          />
        </>
      )}
    </View>
  );
}
