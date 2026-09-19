import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { LEVEL_TITLE_KEYS, levelForStars } from '../../engine/progress';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import type { RewardId } from '../../state/types';
import { Button } from '../components/Button';
import { Stat, StatRow } from '../components/Stat';
import { Dot, Label, Panel, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { Thumbs } from '../components/Thumbs';
import { TText } from '../components/TText';
import { BoltIcon, FlameIcon, GiftIcon, RankIcon, SparkIcon, StarIcon } from '../icons';
import { space } from '../theme';
import { useSkin } from '../skin';

/**
 * The result, for ages 10 to 14.
 *
 * Reported, not celebrated. No confetti — the two tiers below both throw it,
 * and at this age it is the single clearest tell that an app thinks you are
 * eight. What replaces it is the thing this age actually wants after finishing
 * something: the numbers, immediately, without having to go and look for them.
 *
 * A promise that has just been reached is last on the page, because reaching
 * it means going to talk to somebody.
 */
export function TeenCelebrate() {
  const { ink, accents } = useSkin();
  const router = useRouter();
  const { t } = useI18n();
  const { profile, data, rateMission } = useApp();
  const params = useLocalSearchParams<{
    /** The challenge just finished, so the thumb has something to attach to. */
    id?: string;
    stars?: string;
    level?: string;
    rewards?: string;
    prizes?: string;
    coins?: string;
    /** Who stood behind it: `app`, `self` or `grownup`. */
    checked?: string;
  }>();
  const checked = params.checked;

  const earned = Number(params.stars ?? 0);
  const coins = Number(params.coins ?? 0);
  const level = params.level ? Number(params.level) : null;
  const rewards = (params.rewards ?? '').split(',').filter(Boolean) as RewardId[];
  // Promises the challenge just reached, looked up by id so the card always
  // shows what the parent has written most recently.
  const prizeIds = (params.prizes ?? '').split(',').filter(Boolean);
  const prizes = data.realRewards.filter((r) => prizeIds.includes(r.id));
  const rated = data.missions.find((mission) => mission.id === params.id);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!profile) return null;

  const total = data.progress.stars;
  const nowLevel = level ?? levelForStars(total);

  return (
    <TScreen contentStyle={{ flexGrow: 1 }}>
      <View style={{ marginTop: space.xxl }}>
        <TText variant="label" color={accents.acid.bright}>
          {t('teen.loggedLabel')}
        </TText>
        <TText variant="display" style={{ marginTop: space.xs }}>
          {t('teen.doneTitle')}
        </TText>
        {/* What the record will say about this one. Said plainly, because a
            log that quietly grades you is worse than one that tells you. */}
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {checked === 'app'
            ? `${t('teenVerify.byApp')}. ${t('teenVerify.byAppBody')}`
            : checked === 'grownup'
              ? t('teenVerify.byGrownup')
              : `${t('teenVerify.bySelf')}. ${t('teenVerify.bySelfBody')}`}
        </TText>
      </View>

      <Panel accent="acid" style={{ marginTop: space.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
          <BoltIcon size={26} color={accents.acid.bright} />
          <TText variant="statBig" color={accents.acid.bright}>
            +{earned}
          </TText>
          <TText variant="label" color={ink.muted} style={{ paddingBottom: 10 }}>
            {t('teen.starsLabel')}
          </TText>
          {coins > 0 ? (
            <TText variant="label" color={accents.amber.bright} style={{ paddingBottom: 10 }}>
              {t('wardrobe.earned', { count: coins })}
            </TText>
          ) : null}
        </View>
        <Rule style={{ marginVertical: space.lg }} />
        <StatRow>
          <Stat
            value={total}
            label={t('teen.totalLabel')}
            icon={<StarIcon size={15} color={accents.amber.bright} />}
          />
          <Stat
            value={data.progress.streak}
            label={t('teen.streakLabel')}
            accent="coral"
            icon={<FlameIcon size={15} color={accents.coral.bright} />}
          />
          <Stat value={data.progress.totalMissions} label={t('teen.doneLabel')} />
        </StatRow>
      </Panel>

      {level || rewards.length > 0 || prizes.length > 0 ? (
        <>
          <Label style={{ marginTop: space.xxl }}>{t('teen.unlockedLabel')}</Label>
          <Panel padded={false}>
            {level ? (
              <Line
                icon={<RankIcon size={17} color={accents.violet.bright} />}
                accent="violet"
                title={t('celebrate.levelUp', { buddy: profile.buddyName, level })}
                detail={t(LEVEL_TITLE_KEYS[Math.min(nowLevel, LEVEL_TITLE_KEYS.length) - 1] as TKey)}
              />
            ) : null}

            {rewards.map((reward, index) => (
              <View key={reward}>
                {index > 0 || level ? <Rule /> : null}
                <Line
                  icon={<SparkIcon size={17} color={accents.sky.bright} />}
                  accent="sky"
                  title={t('celebrate.unlocked', { item: t(`rewards.${reward}` as TKey) })}
                  detail={t('teen.wearIt')}
                />
              </View>
            ))}

            {prizes.map((prize, index) => (
              <View key={prize.id}>
                {index > 0 || level || rewards.length > 0 ? <Rule /> : null}
                <Line
                  icon={<GiftIcon size={17} color={accents.coral.bright} />}
                  accent="coral"
                  title={`${prize.emoji}  ${t('prize.celebrate', { label: prize.label })}`}
                  detail={t('prize.childReadyBody', { count: prize.stars })}
                />
              </View>
            ))}
          </Panel>
        </>
      ) : null}

      {/* The control over what turns up next. Phrased as a control, not
          as a satisfaction question, because that is what it is. */}
      {rated ? (
        <Panel style={{ marginTop: space.xl }}>
          <Thumbs rating={rated.rating} onRate={(rating) => rateMission(rated.id, rating)} />
        </Panel>
      ) : null}

      <View style={{ flex: 1 }} />

      <Button
        label={t('teen.keepGoing')}
        style={{ marginTop: space.xxl }}
        onPress={() => router.replace('/(tabs)')}
      />
    </TScreen>
  );
}

function Line({
  icon,
  accent,
  title,
  detail,
}: {
  icon: React.ReactNode;
  accent: 'violet' | 'sky' | 'coral';
  title: string;
  detail: string;
}) {
  const { ink } = useSkin();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
      <Dot accent={accent}>{icon}</Dot>
      <View style={{ flex: 1, gap: 1 }}>
        <TText variant="bodyStrong" numberOfLines={2}>
          {title}
        </TText>
        <TText variant="caption" color={ink.muted} numberOfLines={2}>
          {detail}
        </TText>
      </View>
    </View>
  );
}
