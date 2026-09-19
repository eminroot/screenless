import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Confetti, Screen, Sticker, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useApp } from '../state/app-state';
import type { RewardId } from '../state/types';
import { colors, spacing } from '../theme/tokens';
import { useExperience } from '../experience';
import { LittleCelebrate } from '../little/screens/LittleCelebrate';
import { JuniorCelebrate } from '../junior/screens/JuniorCelebrate';
import { TeenCelebrate } from '../teen/screens/TeenCelebrate';

export default function CelebrateRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleCelebrate />;
  if (experience === 'junior') return <JuniorCelebrate />;
  if (experience === 'teen') return <TeenCelebrate />;
  return <Celebrate />;
}

function Celebrate() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile, data, rateMission } = useApp();
  const params = useLocalSearchParams<{
    id?: string;
    stars?: string;
    level?: string;
    rewards?: string;
    prizes?: string;
  }>();
  const rated = data.missions.find((mission) => mission.id === params.id);

  const stars = Number(params.stars ?? 0);
  const level = params.level ? Number(params.level) : null;
  const rewards = (params.rewards ?? '').split(',').filter(Boolean) as RewardId[];
  // Real life promises the mission just reached, looked up by id so the card
  // always shows what the parent has written most recently.
  const prizeIds = (params.prizes ?? '').split(',').filter(Boolean);
  const prizes = data.realRewards.filter((r) => prizeIds.includes(r.id));

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!profile) return null;

  return (
    // Scrolls rather than being fixed height: a level up, a couple of unlocked
    // items and a reached promise can all land on the same mission, and on a
    // short screen that used to push the button off the bottom with no way back.
    <Screen contentStyle={{ justifyContent: 'center', gap: spacing.lg }}>
      <Confetti count={36} />

      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <Txt variant="display" center>
          {t('celebrate.title')}
        </Txt>
        <Sticker background={colors.accent} style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.xl }}>
          <Txt variant="title">{t('celebrate.xp', { count: stars })}</Txt>
        </Sticker>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Buddy
          id={profile.buddyId}
          size={230}
          mood="cheer"
          wearing={data.wardrobe.worn}
          label={profile.buddyName}
        />
      </View>

      <View style={{ gap: spacing.md }}>
        {level ? (
          <Sticker background={colors.magic} style={{ padding: spacing.lg }}>
            <Txt variant="subheading" color={colors.surface} center>
              {t('celebrate.levelUp', { buddy: profile.buddyName, level })}
            </Txt>
          </Sticker>
        ) : null}

        {rewards.map((reward) => (
          <Sticker key={reward} background={colors.success} style={{ padding: spacing.lg }}>
            <Txt variant="subheading" color={colors.surface} center>
              {t('celebrate.unlocked', { item: t(`rewards.${reward}` as TKey) })}
            </Txt>
          </Sticker>
        ))}

        {prizes.map((prize) => (
          <Sticker key={prize.id} background={colors.accent} style={{ padding: spacing.lg }}>
            <Txt variant="subheading" center>
              {prize.emoji} {t('prize.celebrate', { label: prize.label })}
            </Txt>
          </Sticker>
        ))}
      </View>

      {rated ? (
        <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.md }}>
          <Txt variant="bodyStrong" center>
            {t('rate.ask')}
          </Txt>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label={t('rate.up')}
              tone={rated.rating === 1 ? 'success' : 'neutral'}
              size="md"
              onPress={() => rateMission(rated.id, 1)}
              style={{ flex: 1 }}
            />
            <Button
              label={t('rate.down')}
              tone={rated.rating === -1 ? 'accent' : 'neutral'}
              size="md"
              onPress={() => rateMission(rated.id, -1)}
              style={{ flex: 1 }}
            />
          </View>
        </Sticker>
      ) : null}

      <Button
        label={t('celebrate.keepGoing')}
        tone="success"
        onPress={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
