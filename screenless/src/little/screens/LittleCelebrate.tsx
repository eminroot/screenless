import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Confetti } from '../../components/ui/Confetti';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import type { RewardId } from '../../state/types';
import { ClayButton, ClayCard } from '../components/Clay';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { Mascot } from '../components/Mascot';
import { Thumbs } from '../components/Thumbs';
import { GiftIcon, PodiumIcon, SparkleIcon, StarIcon } from '../icons';
import { round, space, tones } from '../theme';

/**
 * The pay-off, for ages 3 to 5.
 *
 * Loud on purpose and over in one screen. The stars land in a block the size
 * of a hand, the buddy cheers, and a promise that has just been reached is the
 * last thing on the page — because reaching it means going to find a person,
 * and that is where this screen wants the child to go next.
 */
export function LittleCelebrate() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { profile, data, rateMission } = useApp();
  const params = useLocalSearchParams<{
    /** The mission just finished, so the faces have something to attach to. */
    id?: string;
    stars?: string;
    level?: string;
    rewards?: string;
    prizes?: string;
    coins?: string;
  }>();

  const stars = Number(params.stars ?? 0);
  const coins = Number(params.coins ?? 0);
  const level = params.level ? Number(params.level) : null;
  const rewards = (params.rewards ?? '').split(',').filter(Boolean) as RewardId[];
  // Real life promises the mission just reached, looked up by id so the card
  // always shows what the parent has written most recently.
  const prizeIds = (params.prizes ?? '').split(',').filter(Boolean);
  const prizes = data.realRewards.filter((r) => prizeIds.includes(r.id));
  const rated = data.missions.find((mission) => mission.id === params.id);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
  const { say } = narrator;

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    say(t('celebrate.title'));
  }, [say, t]);

  if (!profile) return null;

  return (
    // Not centred vertically: a level up, an unlocked item and a reached
    // promise can all land on the same mission, and centring content taller
    // than the screen pushes the title off the top with no way to scroll to it.
    <LittleScreen contentStyle={{ flexGrow: 1 }}>
      <Confetti count={40} />

      <LText variant="hero" center>
        {t('celebrate.title')}
      </LText>

      {/* The stars, as one number nobody can miss. */}
      <Animated.View entering={ZoomIn.springify().damping(11)} style={{ alignItems: 'center', marginTop: space.md }}>
        <ClayCard tone="sun" radius={round.xl} style={{ paddingVertical: space.lg, paddingHorizontal: space.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <StarIcon size={44} />
            <LText variant="giant" color={tones.sun.ink}>
              +{stars}
            </LText>
          </View>
        </ClayCard>
      </Animated.View>

      <View style={{ alignItems: 'center', marginTop: space.md }}>
        <Mascot
          id={profile.buddyId}
          name={profile.buddyName}
          size={210}
          mood="cheer"
          wearing={data.wardrobe.worn}
          halo="sun"
          props={[
            { label: '★', tone: 'coral' },
            { label: '★', tone: 'sky' },
          ]}
          onTap={() => say(t('celebrate.title'))}
        />
      </View>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {level ? (
          <Banner
            tone="grape"
            icon={<PodiumIcon size={38} />}
            text={t('celebrate.levelUp', { buddy: profile.buddyName, level })}
          />
        ) : null}

        {rewards.map((reward) => (
          <Banner
            key={reward}
            tone="sky"
            icon={<SparkleIcon size={30} color={tones.sky.ink} />}
            text={t('celebrate.unlocked', { item: t(`rewards.${reward}` as TKey) })}
          />
        ))}

        {prizes.map((prize) => (
          <Banner
            key={prize.id}
            tone="bubble"
            icon={<GiftIcon size={38} />}
            text={`${prize.emoji}  ${t('prize.celebrate', { label: prize.label })}`}
          />
        ))}
      </View>

      {/* Asked after the stars have landed, never before: the question is
          what to send next time, and it must not read as a condition on
          what was just earned. */}
      {rated ? (
        <ClayCard style={{ padding: space.lg, marginTop: space.lg }}>
          <Thumbs rating={rated.rating} onRate={(rating) => rateMission(rated.id, rating)} />
        </ClayCard>
      ) : null}

      <ClayButton
        label={t('celebrate.keepGoing')}
        tone="mint"
        size="xl"
        style={{ marginTop: space.xl }}
        onPress={() => router.replace('/(tabs)')}
      />
    </LittleScreen>
  );
}

function Banner({
  tone,
  icon,
  text,
}: {
  tone: 'grape' | 'sky' | 'bubble';
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(15)}>
      <ClayCard
        tone={tone}
        style={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        {icon}
        <LText variant="label" color={tones[tone].ink} style={{ flex: 1 }}>
          {text}
        </LText>
      </ClayCard>
    </Animated.View>
  );
}
