import { View } from 'react-native';

import { useI18n } from '../../i18n';
import type { Rating } from '../../state/types';
import { space } from '../theme';
import { useSkin } from '../skin';
import { Chip } from './Button';
import { TText } from './TText';

/**
 * Thumb up, thumb down, for ages 10 to 14.
 *
 * Framed as a control over the app rather than a question about feelings:
 * this is the switch that decides what turns up next week, and it says so.
 * A teenager who believes it does something will use it; one who suspects
 * it is a satisfaction survey will not.
 */
export function Thumbs({
  rating,
  onRate,
  compact = false,
}: {
  rating?: Rating;
  onRate: (rating: Rating) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { ink } = useSkin();

  return (
    <View style={{ gap: space.sm }}>
      <TText variant="label" color={ink.muted}>
        {compact ? t('rate.askShort') : t('rate.ask')}
      </TText>

      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Chip
          label={t('rate.up')}
          accent="acid"
          selected={rating === 1}
          onPress={() => onRate(1)}
        />
        <Chip
          label={t('rate.down')}
          accent="coral"
          selected={rating === -1}
          onPress={() => onRate(-1)}
        />
      </View>

      {rating ? (
        <TText variant="caption" color={ink.muted}>
          {rating === 1 ? t('rate.thanksUp') : t('rate.thanksDown')} {t('rate.changed')}
        </TText>
      ) : null}
    </View>
  );
}
