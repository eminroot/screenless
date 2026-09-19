import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { CoinIcon, FlameIcon, StarIcon } from '../icons';
import { space } from '../theme';
import { StatPill } from './Clay';

/**
 * The score, along the top of a child screen: stars, coins, days in a row.
 *
 * Stars come only from missions a parent confirmed and coins only from steps
 * actually walked, so these three numbers are the whole economy of the app on
 * one line. Nothing a child can do inside the app moves any of them.
 */
export function StatStrip({ trailing }: { trailing?: ReactNode }) {
  const { t } = useI18n();
  const { data } = useApp();

  const stars = data.progress.stars;
  const coins = data.walk.coins;
  const streak = data.progress.streak;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <StatPill
        icon={<StarIcon size={24} />}
        value={stars}
        tone="sun"
        accessibilityLabel={t('little.starsA11y', { count: stars })}
      />
      <StatPill
        icon={<CoinIcon size={24} />}
        value={coins}
        tone="sun"
        accessibilityLabel={t('little.coinsA11y', { count: coins })}
      />
      {streak > 0 ? (
        <StatPill
          icon={<FlameIcon size={24} />}
          value={streak}
          tone="coral"
          accessibilityLabel={t('home.streak', { count: streak })}
        />
      ) : null}

      <View style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}
