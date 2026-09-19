import { Pressable, View } from 'react-native';

import { useI18n } from '../../i18n';
import type { Rating } from '../../state/types';
import { lip, round, space, tones } from '../theme';
import { LText } from './LText';

/**
 * Did you like it, for ages 3 to 5.
 *
 * Two faces, no words on the buttons. A three year old cannot read "more like
 * this" and does not have the concept of rating something, but every one of
 * them can point at the happy face or the unimpressed one, and that is the
 * same signal.
 *
 * The chosen face grows and the other one fades, so the answer is visible
 * from across a room, and pressing the chosen one again clears it: at this
 * age a mis-tap is the normal case, not the exception.
 */
export function Thumbs({ rating, onRate }: { rating?: Rating; onRate: (rating: Rating) => void }) {
  const { t } = useI18n();

  return (
    <View style={{ alignItems: 'center', gap: space.md }}>
      <LText variant="label" center>
        {t('rate.askShort')}
      </LText>

      <View style={{ flexDirection: 'row', gap: space.xl }}>
        <Face emoji="😍" tone="mint" chosen={rating === 1} dimmed={rating === -1} label={t('rate.up')} onPress={() => onRate(1)} />
        <Face emoji="😐" tone="sky" chosen={rating === -1} dimmed={rating === 1} label={t('rate.down')} onPress={() => onRate(-1)} />
      </View>
    </View>
  );
}

function Face({
  emoji,
  tone,
  chosen,
  dimmed,
  label,
  onPress,
}: {
  emoji: string;
  tone: 'mint' | 'sky';
  chosen: boolean;
  dimmed: boolean;
  label: string;
  onPress: () => void;
}) {
  const palette = tones[tone];
  const size = chosen ? 94 : 80;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: chosen }}
      onPress={onPress}
      style={{ opacity: dimmed ? 0.4 : 1, paddingBottom: lip.md }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: lip.md,
          bottom: 0,
          borderRadius: round.pill,
          backgroundColor: chosen ? palette.lip : tones.white.lip,
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: round.pill,
          backgroundColor: chosen ? palette.face : tones.white.face,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LText variant="hero">{emoji}</LText>
      </View>
    </Pressable>
  );
}
