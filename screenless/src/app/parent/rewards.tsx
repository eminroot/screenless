import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Field, ProgressBar, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import {
  clampRewardStars,
  MAX_REAL_REWARDS,
  MAX_REWARD_LABEL,
  REWARD_EMOJI,
  REWARD_PRESET_STARS,
  REWARD_STAR_STEP,
  rewardProgress,
  rewardState,
  sortRewards,
  starsLeft,
} from '../../engine/rewards';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import type { RealReward } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/**
 * Where a parent writes down what they promised.
 *
 * The screen deliberately does nothing clever. It holds a number, a word and a
 * tick. The app is not allowed to decide that a child has earned an ice cream,
 * only to say that the number the parent picked has been reached.
 */
export default function RealRewards() {
  const { t } = useI18n();
  const { data, addRealReward, removeRealReward, setRewardGiven } = useApp();

  const [emoji, setEmoji] = useState<string>(REWARD_EMOJI[0]);
  const [label, setLabel] = useState('');
  const [stars, setStars] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const rewards = sortRewards(data.realRewards);
  const owned = data.progress.stars;
  const full = rewards.length >= MAX_REAL_REWARDS;

  const submit = () => {
    if (!label.trim()) {
      setError(t('prize.labelRequired'));
      return;
    }
    addRealReward({ label, emoji, stars });
    setLabel('');
    setError(null);
  };

  const confirmRemove = (reward: RealReward) => {
    Alert.alert(t('prize.removeConfirmTitle'), t('prize.removeConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('prize.removeConfirmAction'),
        style: 'destructive',
        onPress: () => removeRealReward(reward.id),
      },
    ]);
  };

  return (
    <Screen>
      <TopBar title={t('prize.title')} />

      <Txt variant="body" color={colors.textSoft}>
        {t('prize.subtitle')}
      </Txt>

      {rewards.length === 0 ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('prize.empty')}
          </Txt>
        </Sticker>
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {rewards.map((reward) => (
            <RewardRow
              key={reward.id}
              reward={reward}
              stars={owned}
              onGiven={(given) => setRewardGiven(reward.id, given)}
              onRemove={() => confirmRemove(reward)}
            />
          ))}
        </View>
      )}

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('prize.addTitle')}
      </Txt>

      {full ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.md }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('prize.full')}
          </Txt>
        </Sticker>
      ) : (
        <Sticker
          background={colors.surface}
          style={{ padding: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}
        >
          <View style={{ gap: spacing.sm }}>
            <Txt variant="subheading">{t('prize.emojiField')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {REWARD_EMOJI.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option === emoji }}
                  onPress={() => setEmoji(option)}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: radii.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: option === emoji ? colors.accent : colors.surfaceAlt,
                    borderWidth: option === emoji ? borderWidth.thick : borderWidth.hair,
                    borderColor: colors.border,
                  }}
                >
                  <Txt variant="subheading">{option}</Txt>
                </Pressable>
              ))}
            </View>
          </View>

          <Field
            label={t('prize.labelField')}
            placeholder={t('prize.labelPlaceholder')}
            value={label}
            onChangeText={(value) => {
              setLabel(value);
              setError(null);
            }}
            maxLength={MAX_REWARD_LABEL}
            error={error}
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={{ gap: spacing.sm }}>
            <Txt variant="subheading">{t('prize.starsField')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Stepper
                label="−"
                onPress={() => setStars((s) => clampRewardStars(s - REWARD_STAR_STEP))}
              />
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderRadius: radii.sm,
                  borderWidth: borderWidth.hair,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                }}
              >
                <Txt variant="subheading">{t('common.starsCount', { count: stars })}</Txt>
              </View>
              <Stepper
                label="+"
                onPress={() => setStars((s) => clampRewardStars(s + REWARD_STAR_STEP))}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {REWARD_PRESET_STARS.map((preset) => (
                <Pressable
                  key={preset}
                  accessibilityRole="button"
                  accessibilityState={{ selected: preset === stars }}
                  onPress={() => setStars(preset)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 6,
                    borderRadius: radii.pill,
                    borderWidth: borderWidth.hair,
                    borderColor: colors.border,
                    backgroundColor: preset === stars ? colors.info : colors.surface,
                  }}
                >
                  <Txt variant="tiny" color={preset === stars ? colors.surface : colors.textSoft}>
                    {preset}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </View>

          <Button label={t('prize.add')} tone="success" size="md" onPress={submit} />
        </Sticker>
      )}

      <Txt variant="tiny" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        {t('prize.note')}
      </Txt>
    </Screen>
  );
}

function RewardRow({
  reward,
  stars,
  onGiven,
  onRemove,
}: {
  reward: RealReward;
  stars: number;
  onGiven: (given: boolean) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const state = rewardState(reward, stars);
  const left = starsLeft(reward, stars);

  const tint =
    state === 'given' ? colors.surfaceAlt : state === 'ready' ? colors.success : colors.surface;

  return (
    <Sticker background={tint} offset={4} style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radii.pill,
            backgroundColor: colors.surface,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="heading">{state === 'given' ? '✓' : reward.emoji}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt
            variant="bodyStrong"
            numberOfLines={2}
            color={state === 'ready' ? colors.surface : colors.text}
          >
            {reward.label}
          </Txt>
          <Txt
            variant="small"
            color={state === 'ready' ? colors.surface : colors.textSoft}
          >
            {t('prize.starsAt', { count: reward.stars })}
            {state === 'locked' ? ` · ${t('prize.stateLocked', { count: left })}` : ''}
            {state === 'ready' ? ` · ${t('prize.stateReady')}` : ''}
            {state === 'given' ? ` · ${t('prize.stateGiven')}` : ''}
          </Txt>
        </View>
      </View>

      {state === 'locked' ? <ProgressBar value={rewardProgress(reward, stars)} /> : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {state === 'given' ? (
          <View style={{ flex: 1 }}>
            <Button
              label={t('prize.undoGiven')}
              tone="neutral"
              size="sm"
              onPress={() => onGiven(false)}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Button
              label={t('prize.markGiven')}
              tone={state === 'ready' ? 'accent' : 'neutral'}
              size="sm"
              disabled={state === 'locked'}
              onPress={() => onGiven(true)}
            />
          </View>
        )}
        <Button label={t('prize.remove')} tone="neutral" size="sm" full={false} onPress={onRemove} />
      </View>
    </Sticker>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 44,
        height: 44,
        borderRadius: radii.sm,
        borderWidth: borderWidth.thick,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="subheading">{label}</Txt>
    </Pressable>
  );
}
