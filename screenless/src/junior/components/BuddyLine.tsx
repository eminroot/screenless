import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Buddy, type BuddyMood } from '../../components/buddy/Buddy';
import type { BuddyId, ItemId } from '../../state/types';
import { BulbIcon, SpeakerIcon } from '../icons';
import { accents, border, drop, ink, palette, radius, space } from '../theme';
import { IconButton } from './Button';
import { JText } from './JText';
import { Shadow } from './Surface';

/**
 * What the buddy is saying, coming out of a portrait of it.
 *
 * The buddy stands in a coloured frame on the left with a speech panel beside
 * it, tail and all. At 74px it is a companion rather than the whole screen —
 * on the tier below the same buddy is 190px and is the app. That difference in
 * size is the clearest single measure of the gap between the two designs.
 *
 * Read-aloud stays, because "can read" at six means "can read slowly". It is
 * support now rather than the only channel, so it is a button rather than the
 * default.
 */
export function BuddyLine({
  id,
  name,
  text,
  mood = 'idle',
  wearing,
  onSpeak,
  onTip,
  tipLabel,
  speakLabel,
  accent = 'blue',
  style,
}: {
  id: BuddyId;
  name: string;
  text: string;
  mood?: BuddyMood;
  wearing?: ItemId[];
  /** Omitted when the family has voice switched off. */
  onSpeak?: () => void;
  /** Shown only for a mission that carries a tip. */
  onTip?: () => void;
  tipLabel?: string;
  speakLabel?: string;
  accent?: 'blue' | 'green' | 'amber' | 'violet' | 'teal' | 'rose' | 'flame';
  style?: StyleProp<ViewStyle>;
}) {
  const tone = accents[accent];
  const depth = drop.md;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: space.sm }, style]}>
      {/* The portrait, in its own frame. */}
      <View style={{ paddingRight: drop.sm, paddingBottom: drop.sm }}>
        <Shadow depth={drop.sm} radius={radius.card} />
        <View
          style={{
            width: 74,
            height: 74,
            borderRadius: radius.card,
            borderWidth: border.ink,
            borderColor: palette.ink,
            backgroundColor: tone.solid,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Buddy id={id} size={70} mood={mood} wearing={wearing} />
        </View>
      </View>

      {/* The speech panel. */}
      <View style={{ flex: 1, paddingRight: depth, paddingBottom: depth }}>
        <Shadow depth={depth} radius={radius.card} />
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: radius.card,
            borderWidth: border.ink,
            borderColor: palette.ink,
            padding: space.lg,
            gap: space.md,
          }}
        >
          <View style={{ gap: 2 }}>
            <JText variant="caption" color={tone.base}>
              {name}
            </JText>
            <JText variant="read" color={ink.strong}>
              {text}
            </JText>
          </View>

          {onSpeak || onTip ? (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {onSpeak ? (
                <IconButton
                  icon={<SpeakerIcon size={22} color={accents.blue.on} />}
                  accent="blue"
                  kind="solid"
                  size={46}
                  accessibilityLabel={speakLabel ?? text}
                  onPress={onSpeak}
                />
              ) : null}
              {onTip ? (
                <IconButton
                  icon={<BulbIcon size={24} />}
                  accent="amber"
                  kind="cream"
                  size={46}
                  accessibilityLabel={tipLabel ?? ''}
                  onPress={onTip}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* The tail, pointing back at whoever is talking. */}
        <View pointerEvents="none" style={{ position: 'absolute', left: -9, top: 22 }}>
          <Svg width={12} height={20} viewBox="0 0 12 20">
            <Path d="M11 2 1 10l10 8Z" fill={palette.ink} />
            <Path d="M11.5 4.6 4.2 10l7.3 5.4Z" fill={palette.surface} />
          </Svg>
        </View>
      </View>
    </View>
  );
}
