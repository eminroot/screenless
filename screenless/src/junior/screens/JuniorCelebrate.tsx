import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Confetti } from '../../components/ui/Confetti';
import { LEVEL_TITLE_KEYS, levelForStars } from '../../engine/progress';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import type { RewardId } from '../../state/types';
import { Button } from '../components/Button';
import { BuddyLine } from '../components/BuddyLine';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { StatCard } from '../components/Stat';
import { Card, IconTile } from '../components/Surface';
import { Thumbs } from '../components/Thumbs';
import {
  BoltIcon,
  CheckIcon,
  CoinIcon,
  FlameIcon,
  GiftIcon,
  PartyIcon,
  SparkIcon,
  StarFilledIcon,
  TrophyIcon,
} from '../icons';
import { accents, ink, space } from '../theme';

/**
 * The pay-off, for ages 6 to 9.
 *
 * Reported rather than only cheered: what this mission was worth, what the
 * total is now, how many days in a row. The tier below shows one enormous
 * number because that is all a three year old can take in; here the child gets
 * the ledger, which is what makes a target like a hundred stars feel reachable
 * instead of arbitrary.
 *
 * A promise that has just been reached is the last thing on the page, because
 * reaching it means going to find a person — and that is where this screen
 * wants the child to go next.
 */
export function JuniorCelebrate() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { profile, data, rateMission } = useApp();
  const params = useLocalSearchParams<{
    /** The mission just finished, so the thumb has something to attach to. */
    id?: string;
    stars?: string;
    level?: string;
    rewards?: string;
    prizes?: string;
    coins?: string;
    /** Who approved it when it was not a parent in the parent area: `app` or `grownup`. */
    checked?: string;
  }>();
  const checked = params.checked;

  const earned = Number(params.stars ?? 0);
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

  const total = data.progress.stars;
  const nowLevel = level ?? levelForStars(total);

  return (
    <JScreen contentStyle={{ flexGrow: 1 }}>
      <Confetti count={36} />

      <View style={{ alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <IconTile accent="green" size={64} round>
          <PartyIcon size={32} color={accents.green.base} />
        </IconTile>
        <JText variant="banner" color={ink.onGround} center>
          {t('celebrate.title')}
        </JText>
        <JText variant="body" color={ink.onGroundMuted} center>
          {t('junior.missionComplete')}
        </JText>
      </View>

      {/* The ledger. Three figures, the same three every time. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl }}>
        <StatCard
          style={{ flexBasis: '45%' }}
          icon={<BoltIcon size={24} />}
          value={`+${earned}`}
          label={t('junior.earnedLabel')}
          accent="amber"
        />
        <StatCard
          style={{ flexBasis: '45%' }}
          icon={<CoinIcon size={24} />}
          value={`+${coins}`}
          label={t('wardrobe.title')}
          accent="blue"
        />
        <StatCard
          style={{ flexBasis: '45%' }}
          icon={<StarFilledIcon size={24} />}
          value={total}
          label={t('junior.totalLabel')}
          accent="green"
        />
        <StatCard
          style={{ flexBasis: '45%' }}
          icon={<FlameIcon size={24} />}
          value={data.progress.streak}
          label={t('junior.inARow')}
          accent="rose"
        />
      </View>

      <BuddyLine
        id={profile.buddyId}
        name={profile.buddyName}
        text={t('junior.buddyProud', { name: profile.nickname })}
        mood="cheer"
        wearing={data.wardrobe.worn}
        speakLabel={t('task.readAloud')}
        onSpeak={
          data.settings.voiceEnabled
            ? () => say(t('junior.buddyProud', { name: profile.nickname }))
            : undefined
        }
        style={{ marginTop: space.lg }}
      />

      <View style={{ gap: space.md, marginTop: space.lg }}>
        {/* Who said yes. Said plainly, including that a grown up may still
            look, so a child is never surprised by a spot check later. */}
        {checked === 'app' ? (
          <Banner
            accent="blue"
            icon={<CheckIcon size={24} color={accents.blue.base} />}
            title={t('verify.checkedByApp', { buddy: profile.buddyName })}
            detail={t('verify.checkedByAppBody')}
          />
        ) : checked === 'grownup' ? (
          <Banner
            accent="blue"
            icon={<CheckIcon size={24} color={accents.blue.base} />}
            title={t('verify.checkedByGrownup')}
          />
        ) : null}

        {level ? (
          <Banner
            accent="violet"
            icon={<TrophyIcon size={24} color={accents.violet.base} />}
            title={t('celebrate.levelUp', { buddy: profile.buddyName, level })}
            detail={t(LEVEL_TITLE_KEYS[Math.min(nowLevel, LEVEL_TITLE_KEYS.length) - 1] as TKey)}
          />
        ) : null}

        {rewards.map((reward) => (
          <Banner
            key={reward}
            accent="blue"
            icon={<SparkIcon size={24} color={accents.blue.base} />}
            title={t('celebrate.unlocked', { item: t(`rewards.${reward}` as TKey) })}
            detail={t('junior.wearIt')}
          />
        ))}

        {prizes.map((prize) => (
          <Banner
            key={prize.id}
            accent="rose"
            icon={<GiftIcon size={24} />}
            title={`${prize.emoji}  ${t('prize.celebrate', { label: prize.label })}`}
            detail={t('prize.childReadyBody', { count: prize.stars })}
          />
        ))}
      </View>

      {/* The one question this screen asks. It changes what turns up
          tomorrow and nothing about what was just earned, which is why it
          sits under the ledger rather than in front of it. */}
      {rated ? (
        <Card style={{ marginTop: space.xl }}>
          <Thumbs rating={rated.rating} onRate={(rating) => rateMission(rated.id, rating)} />
        </Card>
      ) : null}

      <Button
        label={t('celebrate.keepGoing')}
        style={{ marginTop: space.xxl }}
        onPress={() => router.replace('/(tabs)')}
      />
    </JScreen>
  );
}

function Banner({
  accent,
  icon,
  title,
  detail,
}: {
  accent: 'violet' | 'blue' | 'rose';
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(220)}>
      <Card accent={accent} padded={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
          <IconTile accent={accent} size={46}>
            {icon}
          </IconTile>
          <View style={{ flex: 1, gap: 2 }}>
            <JText variant="bodyStrong" numberOfLines={2}>
              {title}
            </JText>
            {detail ? (
              <JText variant="small" color={ink.body} numberOfLines={2}>
                {detail}
              </JText>
            ) : null}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
