import { View, type StyleProp, type ViewStyle } from 'react-native';

import { ProgressBar, Sticker, Txt } from './ui';
import {
  nextReward,
  readyRewards,
  rewardProgress,
  starsLeft,
} from '../engine/rewards';
import { useI18n } from '../i18n';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

/**
 * The child's view of what a grown up promised.
 *
 * One card, the nearest promise only, and nothing to tap. A reached promise is
 * an instruction to go and talk to somebody, which is the whole point of the
 * app. Renders nothing at all until a parent has set something up.
 */
export function RewardGoal({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  const { data } = useApp();

  const stars = data.progress.stars;
  const ready = readyRewards(data.realRewards, stars);
  const reward = ready[0] ?? nextReward(data.realRewards, stars);
  // Spacing lives on the wrapper so an app with no promises set has no gap
  // where this card would have been.
  if (!reward) return null;

  const isReady = ready.length > 0;

  return (
    <View style={style}>
      <Sticker
        background={isReady ? colors.success : colors.surface}
        offset={4}
        style={{ padding: spacing.lg, gap: spacing.sm }}
      >
        <Txt variant="tiny" color={isReady ? colors.surface : colors.textSoft}>
          {isReady ? t('prize.childReady') : t('prize.childNext')}
        </Txt>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radii.pill,
              backgroundColor: colors.surface,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="heading">{reward.emoji}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt
              variant="bodyStrong"
              numberOfLines={2}
              color={isReady ? colors.surface : colors.text}
            >
              {reward.label}
            </Txt>
            <Txt variant="small" color={isReady ? colors.surface : colors.textSoft}>
              {isReady
                ? t('prize.childReadyBody', { count: reward.stars })
                : t('prize.stateLocked', { count: starsLeft(reward, stars) })}
            </Txt>
          </View>
        </View>

        {isReady ? null : (
          <ProgressBar value={rewardProgress(reward, stars)} tone={colors.accent} height={14} />
        )}
      </Sticker>
    </View>
  );
}
