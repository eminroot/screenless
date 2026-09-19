import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { MissionCard } from '../../components/MissionCard';
import { ParentGate } from '../../components/ParentGate';
import { Button, Screen, Sticker, Txt } from '../../components/ui';
import { facetName } from '../../data/facet-names';
import { interestMeta } from '../../data/interests';
import { learnFromMissions, MIN_SAMPLE, type Learned } from '../../engine/learning';
import { dayKey } from '../../engine/progress';
import { readyRewards } from '../../engine/rewards';
import { likedFacets } from '../../engine/taste';
import { reviewPolicy } from '../../engine/verify';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

export default function ParentTab() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile, data, pendingMissions } = useApp();
  const [unlocked, setUnlocked] = useState(false);

  // Relock whenever the parent leaves the tab.
  useFocusEffect(
    useCallback(() => {
      return () => setUnlocked(false);
    }, []),
  );

  const week = useMemo(() => buildWeek(data.missions), [data.missions]);
  const learned = useMemo(
    () => learnFromMissions(data.missions, data.ideaVotes),
    [data.missions, data.ideaVotes],
  );
  // The thumbs, counted. A parent asking why their child keeps being offered
  // the same sort of thing should be able to see that their child asked.
  const thumbs = useMemo(() => {
    let up = 0;
    let down = 0;
    for (const mission of data.missions) {
      if (mission.rating === 1) up += 1;
      else if (mission.rating === -1) down += 1;
    }
    for (const vote of data.ideaVotes) {
      if (vote.value === 1) up += 1;
      else down += 1;
    }
    return { up, down };
  }, [data.missions, data.ideaVotes]);
  const readyPrizes = useMemo(
    () => readyRewards(data.realRewards, data.progress.stars),
    [data.realRewards, data.progress.stars],
  );

  const policy = reviewPolicy(profile?.ageBand);
  const selfChecked = policy !== 'parent';
  const approvedByPhone = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000;
    return data.missions.filter(
      (m) =>
        m.status === 'done' &&
        (m.review?.by === 'app' || m.review?.by === 'self') &&
        Date.parse(m.confirmedAt ?? '') >= since,
    ).length;
  }, [data.missions]);

  if (!profile) return null;

  if (!unlocked) {
    return (
      <Screen>
        <ParentGate onUnlock={() => setUnlocked(true)} />
      </Screen>
    );
  }

  const { progress } = data;

  return (
    <Screen>
      <Txt variant="title">{t('parent.title')}</Txt>

      {readyPrizes.length > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/parent/rewards')}>
          <Sticker background={colors.accent} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
            <Txt variant="bodyStrong">
              {readyPrizes.map((r) => r.emoji).join(' ')}{' '}
              {t('prize.readyBanner', { count: readyPrizes.length })}
            </Txt>
          </Sticker>
        </Pressable>
      ) : null}

      {pendingMissions.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Txt variant="heading">
            {t('parent.pending')} · {t('parent.pendingCount', { count: pendingMissions.length })}
          </Txt>
          {pendingMissions.map((mission) => (
            <View key={mission.id} style={{ gap: spacing.sm }}>
              <MissionCard task={mission.task} compact />
              <Button
                label={t('confirm.approve')}
                tone="success"
                size="md"
                onPress={() =>
                  router.push({ pathname: '/confirm', params: { id: mission.id } })
                }
              />
            </View>
          ))}
        </View>
      ) : (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('parent.pendingEmpty')}
          </Txt>
        </Sticker>
      )}

      {/* Ages 6-9: what the phone approved on its own, one tap from the list
          of every decision and the button to take one back. */}
      {selfChecked && approvedByPhone > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/parent/checked')}>
          <Sticker background={colors.surface} offset={4} style={{ padding: spacing.lg, marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {t('review.weekCount', { count: approvedByPhone })}
              </Txt>
              <Txt variant="subheading" color={colors.textFaint}>
                ›
              </Txt>
            </View>
          </Sticker>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl }}>
        <Stat value={progress.totalMissions} label={t('parent.statMissions')} />
        <Stat value={progress.totalMinutes} label={t('parent.statMinutes')} />
        <Stat value={progress.streak} label={t('parent.statStreak')} />
        <Stat value={progress.level} label={t('parent.statLevel')} />
      </View>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.weekTitle')}
      </Txt>
      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md }}>
        {week.total === 0 ? (
          <Txt variant="body" color={colors.textSoft}>
            {t('parent.weekEmpty')}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 120 }}>
            {week.days.map((day) => (
              <View key={day.key} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
                <Txt variant="tiny" color={colors.textSoft}>
                  {day.count || ''}
                </Txt>
                <View
                  style={{
                    width: '100%',
                    height: Math.max(6, (day.count / week.max) * 80),
                    backgroundColor: day.count ? colors.success : colors.surfaceAlt,
                    borderRadius: radii.sm,
                    borderWidth: borderWidth.hair,
                    borderColor: colors.border,
                  }}
                />
                <Txt variant="tiny" color={colors.textFaint}>
                  {day.label}
                </Txt>
              </View>
            ))}
          </View>
        )}
      </Sticker>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.learnedTitle')}
      </Txt>
      <LearnedCard learned={learned} thumbs={thumbs} />

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        {selfChecked ? (
          <Row
            emoji="✅"
            label={policy === 'self' ? t('review.logTitle') : t('review.title')}
            onPress={() => router.push('/parent/checked')}
          />
        ) : null}
        {/* Treasure badges are a 6-9 tool; the other ages have no use for them. */}
        {policy === 'sample' ? (
          <Row emoji="🏅" label={t('badges.title')} onPress={() => router.push('/parent/badges')} />
        ) : null}
        <Row emoji="✨" label={t('parent.madeRow')} onPress={() => router.push('/parent/made')} />
        <Row emoji="🎁" label={t('prize.title')} onPress={() => router.push('/parent/rewards')} />
        <Row emoji="⏳" label={t('guard.title')} onPress={() => router.push('/parent/screen-time')} />
        <Row emoji="📊" label={t('hub.title')} onPress={() => router.push('/parent/link')} />
        <Row emoji="🏆" label={t('social.parentTitle')} onPress={() => router.push('/parent/friends')} />
        <Row emoji="💬" label={t('parent.coachTitle')} onPress={() => router.push('/parent/coach')} />
        <Row emoji="📜" label={t('parent.historyTitle')} onPress={() => router.push('/parent/history')} />
        <Row emoji="🛟" label={t('parent.helpTitle')} onPress={() => router.push('/parent/help')} />
        <Row emoji="⚙️" label={t('parent.settingsTitle')} onPress={() => router.push('/parent/settings')} />
        {/* A way to open any mission by hand, for testing and demos. Stripped
            from release builds along with the screen it opens. */}
        {__DEV__ ? (
          <Row emoji="🧪" label="Mission library (dev)" onPress={() => router.push('/parent/library')} />
        ) : null}
      </View>
    </Screen>
  );
}

/**
 * What the picker has worked out, in plain words.
 *
 * It is here because a system that quietly changes what a child is offered
 * should be readable by the person responsible for that child, and because
 * everything it says is recomputed from the mission list on the next screen.
 */
function LearnedCard({
  learned,
  thumbs,
}: {
  learned: Learned;
  thumbs: { up: number; down: number };
}) {
  const { t } = useI18n();

  if (learned.sample < MIN_SAMPLE) {
    return (
      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.md }}>
        <Txt variant="body" color={colors.textSoft}>
          {t('parent.learnedEmpty', { count: MIN_SAMPLE - learned.sample })}
        </Txt>
      </Sticker>
    );
  }

  const lines: string[] = [];
  if (learned.topInterests.length > 0) {
    lines.push(
      t('parent.learnedLikes', {
        list: learned.topInterests
          .map((id) => `${interestMeta.get(id)?.emoji ?? ''} ${t(interestMeta.get(id)!.labelKey)}`)
          .join(', '),
      }),
    );
  }
  if (learned.coldInterests.length > 0) {
    lines.push(
      t('parent.learnedAvoids', {
        list: learned.coldInterests.map((id) => t(interestMeta.get(id)!.labelKey)).join(', '),
      }),
    );
  }
  if (learned.bestPartOfDay) {
    lines.push(t('parent.learnedTime', { when: t(`partsOfDay.${learned.bestPartOfDay}` as TKey) }));
  }
  if (learned.pace !== null) {
    lines.push(
      learned.pace < 0.6
        ? t('parent.learnedFast')
        : learned.pace > 1.4
          ? t('parent.learnedSlow')
          : t('parent.learnedSteady'),
    );
  }
  if (learned.duoDone > 0) {
    lines.push(t('parent.learnedDuo', { count: learned.duoDone }));
  }
  if (thumbs.up + thumbs.down > 0) {
    lines.push(t('parent.learnedRatings', { up: thumbs.up, down: thumbs.down }));
  }

  // The finer read, in the same words the child is shown on their own screen.
  const facets = likedFacets(learned.taste, ['cat', 'body', 'len', 'place', 'mode'])
    .slice(0, 3)
    .map((read) => facetName(read.facet))
    .filter((key): key is NonNullable<typeof key> => Boolean(key))
    .map((key) => t(key));
  if (facets.length > 0) {
    lines.push(t('parent.learnedFacets', { list: facets.join(', ') }));
  }

  return (
    <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.sm, marginTop: spacing.md }}>
      {lines.map((line) => (
        <Txt key={line} variant="body">
          {line}
        </Txt>
      ))}
      <Txt variant="tiny" color={colors.textFaint} style={{ marginTop: spacing.xs }}>
        {t('parent.learnedNote')}
      </Txt>
    </Sticker>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ width: '47%' }}>
      <Sticker background={colors.surface} offset={4} style={{ padding: spacing.lg, gap: 2 }}>
        <Txt variant="display">{value}</Txt>
        <Txt variant="small" color={colors.textSoft} numberOfLines={2}>
          {label}
        </Txt>
      </Sticker>
    </View>
  );
}

function Row({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Sticker background={colors.surface} offset={4}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          <Txt variant="subheading">{emoji}</Txt>
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            {label}
          </Txt>
          <Txt variant="subheading" color={colors.textFaint}>
            ›
          </Txt>
        </View>
      </Sticker>
    </Pressable>
  );
}

/** Confirmed missions per day for the last seven days, oldest first. */
function buildWeek(missions: { status: string; confirmedAt?: string }[]) {
  const counts = new Map<string, number>();
  for (const mission of missions) {
    if (mission.status !== 'done' || !mission.confirmedAt) continue;
    const key = dayKey(new Date(mission.confirmedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = dayKey(date);
    return {
      key,
      label: String(date.getDate()),
      count: counts.get(key) ?? 0,
    };
  });

  const total = days.reduce((sum, d) => sum + d.count, 0);
  return { days, total, max: Math.max(1, ...days.map((d) => d.count)) };
}
