import { View, type StyleProp, type ViewStyle } from 'react-native';

import { nextReward, readyRewards, rewardProgress, starsLeft } from '../../engine/rewards';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { GiftIcon, StarFilledIcon } from '../icons';
import { accents, ink, space } from '../theme';
import { JText } from './JText';
import { Bar } from './Stat';
import { Card, IconTile } from './Surface';

/**
 * What a grown up promised.
 *
 * The stars still to go are written out, because at this age that number is
 * the point: it turns a promise into something a child can plan around, and
 * planning around it is the behaviour the whole app is trying to buy.
 *
 * Nothing here is tappable. A promise that has been reached is an instruction
 * to go and find a person, and the app has nothing to add to that.
 */
export function RewardGoalCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  const { data } = useApp();

  const stars = data.progress.stars;
  const ready = readyRewards(data.realRewards, stars);
  const reward = ready[0] ?? nextReward(data.realRewards, stars);
  if (!reward) return null;

  const isReady = ready.length > 0;
  const left = starsLeft(reward, stars);

  return (
    <Card accent={isReady ? 'green' : 'rose'} filled={isReady} wrapperStyle={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconTile accent={isReady ? 'amber' : 'rose'} size={50}>
          <JText variant="title">{reward.emoji}</JText>
        </IconTile>
        <View style={{ flex: 1, gap: 2 }}>
          <JText variant="caption" color={isReady ? accents.green.on : accents.rose.base}>
            {(isReady ? t('prize.childReady') : t('prize.childNext')).toUpperCase()}
          </JText>
          <JText variant="heading" numberOfLines={2} color={isReady ? accents.green.on : ink.strong}>
            {reward.label}
          </JText>
        </View>
        {isReady ? <GiftIcon size={30} /> : null}
      </View>

      {isReady ? (
        <JText variant="body" color={accents.green.on} style={{ marginTop: space.md }}>
          {t('prize.childReadyBody', { count: reward.stars })}
        </JText>
      ) : (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          <Bar
            value={rewardProgress(reward, stars)}
            accent="rose"
            accessibilityLabel={t('junior.starsToGo', { count: left })}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <StarFilledIcon size={18} />
            <JText variant="caption" color={accents.rose.base}>
              {t('junior.starsToGo', { count: left })}
            </JText>
          </View>
        </View>
      )}
    </Card>
  );
}
