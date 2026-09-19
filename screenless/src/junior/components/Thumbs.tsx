import { View } from 'react-native';

import { useI18n } from '../../i18n';
import type { Rating } from '../../state/types';
import { ink, space } from '../theme';
import { Chip } from './Button';
import { JText } from './JText';

/**
 * Thumb up, thumb down, for ages 6 to 9.
 *
 * Two words and two pictures, because the question is not "rate this out of
 * five" — a seven year old cannot do that and would not mean it. It is "do
 * you want more of these", which they can answer instantly and honestly.
 *
 * Pressing the chosen one again clears it. That matters more than it sounds:
 * at this age a wrong tap is common, and a rating that cannot be taken back
 * teaches a child to be careful with a control that is supposed to be free.
 */
export function Thumbs({
  rating,
  onRate,
  onGround = false,
}: {
  rating?: Rating;
  onRate: (rating: Rating) => void;
  /** True when this sits straight on the dark ground rather than in a card. */
  onGround?: boolean;
}) {
  const { t } = useI18n();

  return (
    <View style={{ gap: space.sm }}>
      <JText variant="caption" color={onGround ? ink.onGroundMuted : ink.muted}>
        {t('rate.ask')}
      </JText>

      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Chip
          label={t('rate.up')}
          icon={<JText variant="body">👍</JText>}
          accent="green"
          selected={rating === 1}
          onPress={() => onRate(1)}
        />
        <Chip
          label={t('rate.down')}
          icon={<JText variant="body">👎</JText>}
          accent="flame"
          selected={rating === -1}
          onPress={() => onRate(-1)}
        />
      </View>

      {rating ? (
        <JText variant="caption" color={onGround ? ink.onGroundMuted : ink.muted}>
          {rating === 1 ? t('rate.thanksUp') : t('rate.thanksDown')}
        </JText>
      ) : null}
    </View>
  );
}
