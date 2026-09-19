import { View, type StyleProp, type ViewStyle } from 'react-native';

import { nextReward, readyRewards, rewardProgress, starsLeft } from '../../engine/rewards';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { GiftIcon } from '../icons';
import { space } from '../theme';
import { Bar } from './Stat';
import { Dot, Panel } from './Surface';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * What a grown up promised.
 *
 * Stated as a figure and a bar rather than as a prize being dangled. At this
 * age the honest framing is the motivating one: here is the deal, here is
 * where you are against it. Nothing here is tappable, because a reached
 * promise is an instruction to go and talk to somebody.
 *
 * Renders nothing until a parent has written a promise down.
 */
export function RewardGoalPanel({ style }: { style?: StyleProp<ViewStyle> }) {
  const { ink, accents } = useSkin();
  const { t } = useI18n();
  const { data } = useApp();

  const stars = data.progress.stars;
  const ready = readyRewards(data.realRewards, stars);
  const reward = ready[0] ?? nextReward(data.realRewards, stars);
  if (!reward) return null;

  const isReady = ready.length > 0;
  const left = starsLeft(reward, stars);

  return (
    <Panel accent={isReady ? 'acid' : undefined} style={style}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Dot accent={isReady ? 'acid' : 'coral'} size={38}>
          <TText variant="bodyStrong">{reward.emoji}</TText>
        </Dot>
        <View style={{ flex: 1, gap: 2 }}>
          <TText variant="label" color={isReady ? accents.acid.bright : ink.muted}>
            {isReady ? t('prize.childReady') : t('prize.childNext')}
          </TText>
          <TText variant="bodyStrong" numberOfLines={2}>
            {reward.label}
          </TText>
        </View>
        {isReady ? <GiftIcon size={20} color={accents.acid.bright} /> : null}
      </View>

      {isReady ? (
        <TText variant="caption" color={ink.body} style={{ marginTop: space.md }}>
          {t('prize.childReadyBody', { count: reward.stars })}
        </TText>
      ) : (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          <Bar
            value={rewardProgress(reward, stars)}
            accent="coral"
            accessibilityLabel={t('teen.starsToGo', { count: left })}
          />
          <TText variant="caption" color={ink.muted}>
            {t('teen.starsToGo', { count: left })}
          </TText>
        </View>
      )}
    </Panel>
  );
}
