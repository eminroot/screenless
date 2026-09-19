import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Buddy, type BuddyMood } from '../../components/buddy/Buddy';
import type { BuddyId, ItemId } from '../../state/types';
import { BulbIcon, SpeakerIcon } from '../icons';
import { border, radius, space } from '../theme';
import { IconButton } from './Button';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * A line from the buddy, kept small on purpose.
 *
 * At three the buddy is 190px and is the app; at seven it is 74px in a framed
 * panel and is a companion; here it is a 34px avatar beside a line of text, in
 * the shape of a message from a person. That shrinking is deliberate and it is
 * the main thing separating the three tiers: a twelve year old is not going to
 * be told what to do by a cartoon bear, but they will read a note from one.
 *
 * Read-aloud is still here for anyone who wants it, but it is an outline
 * button rather than a filled one, because at this age it is an option and not
 * the point.
 */
export function BuddyNote({
  id,
  name,
  text,
  mood = 'idle',
  wearing,
  onSpeak,
  onTip,
  tipLabel,
  speakLabel,
  style,
}: {
  id: BuddyId;
  name: string;
  text: string;
  mood?: BuddyMood;
  wearing?: ItemId[];
  onSpeak?: () => void;
  onTip?: () => void;
  tipLabel?: string;
  speakLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { palette, ink, accents } = useSkin();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          backgroundColor: palette.surface,
          borderRadius: radius.card,
          borderWidth: border.hair,
          borderColor: palette.line,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: palette.sunken,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Buddy id={id} size={33} mood={mood} wearing={wearing} still />
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <TText variant="label" color={accents.acid.bright}>
          {name}
        </TText>
        <TText variant="body" color={ink.body}>
          {text}
        </TText>

        {onSpeak || onTip ? (
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
            {onSpeak ? (
              <IconButton
                icon={<SpeakerIcon size={18} color={ink.body} />}
                kind="outline"
                size={38}
                accessibilityLabel={speakLabel ?? text}
                onPress={onSpeak}
              />
            ) : null}
            {onTip ? (
              <IconButton
                icon={<BulbIcon size={18} color={accents.amber.bright} />}
                kind="outline"
                size={38}
                accessibilityLabel={tipLabel ?? ''}
                onPress={onTip}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
