import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ink, lip, round, space, tones } from '../theme';
import { ClayIconButton } from './Clay';
import { LText } from './LText';
import { SpeakerIcon } from '../icons';

/**
 * What the buddy is saying, in a white cloud with a tail pointing at it.
 *
 * The speaker button is part of the bubble rather than somewhere else on the
 * screen, because for a child who cannot read, the button IS the message: the
 * words are there for the grown up reading over a shoulder.
 */
export function Bubble({
  text,
  onSpeak,
  tail = 'bottom',
  style,
}: {
  text: string;
  /** Shown only when the family has voice switched on. */
  onSpeak?: () => void;
  tail?: 'bottom' | 'left' | 'none';
  style?: StyleProp<ViewStyle>;
}) {
  // No entering animation. The bubble is on screen the whole time the buddy is,
  // so fading it in only ever showed a half-painted bubble on the first frame.
  return (
    <View style={[{ alignSelf: 'stretch' }, style]}>
      <View style={{ paddingBottom: lip.md }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lip.md,
            bottom: 0,
            borderRadius: round.lg,
            backgroundColor: tones.white.lip,
          }}
        />
        <View
          style={{
            backgroundColor: tones.white.face,
            borderRadius: round.lg,
            paddingVertical: space.md,
            paddingHorizontal: space.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
          }}
        >
          <LText variant="body" color={ink.text} style={{ flex: 1 }}>
            {text}
          </LText>
          {onSpeak ? (
            <ClayIconButton
              icon={<SpeakerIcon size={24} color={tones.grape.ink} />}
              tone="grape"
              size={44}
              accessibilityLabel={text}
              onPress={onSpeak}
            />
          ) : null}
        </View>
      </View>

      {tail === 'none' ? null : (
        <View
          pointerEvents="none"
          style={
            tail === 'bottom'
              ? { position: 'absolute', bottom: -10, left: 36 }
              : { position: 'absolute', left: -12, top: 26, transform: [{ rotate: '90deg' }] }
          }
        >
          <Svg width={26} height={18} viewBox="0 0 26 18">
            <Path d="M2 0 H24 L13 17 Z" fill={tones.white.lip} />
            <Path d="M3 0 H21 L12 13 Z" fill={tones.white.face} />
          </Svg>
        </View>
      )}
    </View>
  );
}
