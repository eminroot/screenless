import { View, type StyleProp, type ViewStyle } from 'react-native';

import { nextReward, readyRewards, rewardProgress, starsLeft } from '../../engine/rewards';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { GiftIcon, StarIcon } from '../icons';
import { ink, round, space, tones } from '../theme';
import { ClayCard } from './Clay';
import { LText } from './LText';
import { Meter } from './Meter';

/**
 * What a grown up promised, for ages 3 to 5.
 *
 * The picture the parent chose is the card. The stars still to go are shown as
 * a number next to a star rather than as a sentence, because the child reading
 * this cannot read. Nothing here is tappable: a reached promise is an
 * instruction to go and find a person, and the app has nothing more to add.
 *
 * Renders nothing until a parent has written a promise down.
 */
export function RewardCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  const { data } = useApp();

  const stars = data.progress.stars;
  const ready = readyRewards(data.realRewards, stars);
  const reward = ready[0] ?? nextReward(data.realRewards, stars);
  if (!reward) return null;

  const isReady = ready.length > 0;
  const left = starsLeft(reward, stars);

  return (
    <ClayCard
      tone={isReady ? 'mint' : 'white'}
      wrapperStyle={style}
      style={{ padding: space.lg, gap: space.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: round.md,
            backgroundColor: isReady ? 'rgba(255,255,255,0.25)' : tones.bubble.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LText variant="title">{reward.emoji}</LText>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <LText variant="heading" numberOfLines={2} color={isReady ? tones.mint.ink : ink.text}>
            {reward.label}
          </LText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isReady ? <GiftIcon size={22} /> : <StarIcon size={20} />}
            <LText variant="small" color={isReady ? tones.mint.ink : ink.soft}>
              {isReady ? t('prize.childReady') : t('little.starsToGo', { count: left })}
            </LText>
          </View>
        </View>
      </View>

      {isReady ? null : (
        <Meter
          value={rewardProgress(reward, stars)}
          tone="bubble"
          accessibilityLabel={t('little.starsToGo', { count: left })}
        />
      )}
    </ClayCard>
  );
}
