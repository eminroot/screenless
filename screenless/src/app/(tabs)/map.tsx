import { useState } from 'react';
import { View } from 'react-native';

import { AdventureMap } from '../../components/AdventureMap';
import { useExperience } from '../../experience';
import { LittleMap } from '../../little/screens/LittleMap';
import { JuniorMap } from '../../junior/screens/JuniorMap';
import { TeenMap } from '../../teen/screens/TeenMap';
import { Buddy } from '../../components/buddy/Buddy';
import { ProgressBar, Screen, Sticker, Txt } from '../../components/ui';
import { currentZone, starsToNextZone, zones, type ZoneId } from '../../data/zones';
import { rewardState, sortRewards, starsLeft } from '../../engine/rewards';
import {
  LEVEL_REWARDS,
  LEVEL_TITLE_KEYS,
  levelFraction,
  MAX_LEVEL,
  starsToNextLevel,
} from '../../engine/progress';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { REWARD_IDS, type RealReward, type RewardId } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

const rewardEmoji: Record<RewardId, string> = {
  hat: '🎉',
  balloon: '🎈',
  scarf: '🧣',
  glasses: '🕶️',
  ball: '⚽',
  cape: '🦸',
  crown: '👑',
  medal: '🏅',
};

/** Level a reward is handed out at, used for the locked labels. */
const rewardLevel = new Map<RewardId, number>(
  Object.entries(LEVEL_REWARDS).flatMap(([level, ids]) =>
    ids.map((id) => [id, Number(level)] as const),
  ),
);

export default function JourneyRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleMap />;
  if (experience === 'junior') return <JuniorMap />;
  if (experience === 'teen') return <TeenMap />;
  return <Journey />;
}

function Journey() {
  const { t } = useI18n();
  const { profile, data } = useApp();
  const [picked, setPicked] = useState<ZoneId | null>(null);

  if (!profile) return null;
  const { progress } = data;

  const here = currentZone(progress.level);
  const zone = zones.find((z) => z.id === picked) ?? here;
  const zoneOpen = progress.level >= zone.level;
  const toNextZone = starsToNextZone(progress.stars, progress.level);
  const remaining = starsToNextLevel(progress.stars);

  return (
    <Screen>
      <Txt variant="title">{t('map.title')}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('map.subtitle', { buddy: profile.buddyName })}
      </Txt>

      <View style={{ marginTop: spacing.lg }}>
        <AdventureMap level={progress.level} selected={zone.id} onSelect={(z) => setPicked(z.id)} />
      </View>

      <Sticker
        background={zoneOpen ? colors.surface : colors.surfaceAlt}
        style={{ padding: spacing.lg, gap: spacing.sm, marginTop: spacing.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: radii.pill,
              backgroundColor: zoneOpen ? zone.color : '#D8D2C4',
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="heading">{zoneOpen ? zone.emoji : '🔒'}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{zoneOpen ? t(zone.nameKey) : t('map.lockedZone')}</Txt>
            <Txt variant="small" color={colors.textSoft}>
              {zoneOpen ? t(zone.blurbKey) : t('map.unlockAt', { level: zone.level })}
            </Txt>
          </View>
        </View>
        {zone.id === here.id && toNextZone !== null ? (
          <Txt variant="small" color={colors.textSoft}>
            {t('map.toNextZone', { count: toNextZone })}
          </Txt>
        ) : null}
      </Sticker>

      <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
        <Buddy
          id={profile.buddyId}
          size={180}
          mood="happy"
          wearing={data.wardrobe.worn}
          label={profile.buddyName}
        />
      </View>

      <Sticker background={colors.accent} style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: colors.surface,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="heading">{progress.level}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{t(LEVEL_TITLE_KEYS[progress.level - 1] as TKey)}</Txt>
            <Txt variant="small">{t('map.levelCard', { level: progress.level })}</Txt>
          </View>
        </View>

        <ProgressBar value={levelFraction(progress.stars)} tone={colors.successDeep} />
        <Txt variant="small">
          {progress.level >= MAX_LEVEL
            ? t('common.starsCount', { count: progress.stars })
            : t('map.toNextLevel', { count: remaining })}
        </Txt>
      </Sticker>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Stat value={progress.totalMissions} label={t('map.totalMissions')} tone={colors.info} />
        <Stat value={progress.totalMinutes} label={t('map.totalMinutes')} tone={colors.success} />
        <Stat value={progress.bestStreak} label={t('map.bestStreak')} tone={colors.magic} />
      </View>

      <RealRewardList rewards={data.realRewards} stars={progress.stars} />

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('map.collection')}
      </Txt>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginTop: spacing.md,
        }}
      >
        {REWARD_IDS.map((reward) => {
          const owned = progress.unlocked.includes(reward);
          return (
            <View key={reward} style={{ width: '22%' }}>
              <Sticker
                background={owned ? colors.surface : colors.surfaceAlt}
                offset={4}
                style={{ alignItems: 'center', paddingVertical: spacing.md, gap: 2 }}
              >
                <Txt variant="heading" style={{ opacity: owned ? 1 : 0.3 }}>
                  {owned ? rewardEmoji[reward] : '🔒'}
                </Txt>
                <Txt variant="tiny" center numberOfLines={1} color={colors.textSoft}>
                  {owned
                    ? t(`rewards.${reward}` as TKey)
                    : t('map.unlockAt', { level: rewardLevel.get(reward) ?? MAX_LEVEL })}
                </Txt>
              </Sticker>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

/**
 * The promises a grown up made, in the child's own progress screen. Read only:
 * a child can see how close they are, and nothing more.
 */
function RealRewardList({ rewards, stars }: { rewards: RealReward[]; stars: number }) {
  const { t } = useI18n();
  if (rewards.length === 0) return null;

  return (
    <View>
      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('prize.childSection')}
      </Txt>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {sortRewards(rewards).map((reward) => {
          const state = rewardState(reward, stars);
          const done = state === 'given';
          return (
            <Sticker
              key={reward.id}
              background={state === 'ready' ? colors.success : colors.surface}
              offset={4}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
              }}
            >
              <Txt variant="heading" style={{ opacity: done ? 0.4 : 1 }}>
                {reward.emoji}
              </Txt>
              <Txt
                variant="bodyStrong"
                numberOfLines={1}
                color={state === 'ready' ? colors.surface : colors.text}
                style={{ flex: 1, opacity: done ? 0.5 : 1 }}
              >
                {reward.label}
              </Txt>
              <Txt variant="tiny" color={state === 'ready' ? colors.surface : colors.textSoft}>
                {done
                  ? t('prize.childGiven')
                  : state === 'ready'
                    ? t('prize.childReady')
                    : t('prize.stateLocked', { count: starsLeft(reward, stars) })}
              </Txt>
            </Sticker>
          );
        })}
      </View>
    </View>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Sticker background={colors.surface} offset={4} style={{ padding: spacing.md, gap: 2 }}>
        <View
          style={{
            alignSelf: 'flex-start',
            width: 10,
            height: 10,
            borderRadius: radii.pill,
            backgroundColor: tone,
          }}
        />
        <Txt variant="title">{value}</Txt>
        <Txt variant="tiny" color={colors.textSoft} numberOfLines={2}>
          {label}
        </Txt>
      </Sticker>
    </View>
  );
}
