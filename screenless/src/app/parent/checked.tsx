import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { MissionCard } from '../../components/MissionCard';
import { ReviewDetails } from '../../components/ReviewDetails';
import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { canTakeBack, reviewPolicy, TAKE_BACK_DAYS } from '../../engine/verify';
import { useI18n } from '../../i18n';
import { confirmAction } from '../../lib/confirm';
import { useApp } from '../../state/app-state';
import type { Mission } from '../../state/types';
import { colors, spacing } from '../../theme/tokens';

const DAY_MS = 86_400_000;

/**
 * Missions the phone approved without a parent, for the last week.
 *
 * This is the other half of letting a phone approve missions at all: nothing
 * it decides is final. Every approval is listed with exactly what the phone
 * measured, and any one of them can be taken back, which returns the stars and
 * the coins. A parent who never opens this screen still has the random spot
 * checks; a parent who does can audit every decision.
 */
export default function Checked() {
  const { t, language } = useI18n();
  const { data, takeBackMission } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  // Ages 10-13 have no queue at all, so this screen is the whole of what a
  // parent sees. It says so rather than calling itself a list of approvals.
  const selfReported = reviewPolicy(data.profile?.ageBand) === 'self';

  const missions = useMemo(() => {
    const since = Date.now() - TAKE_BACK_DAYS * DAY_MS;
    return data.missions
      .filter((m) => m.review && m.review.by !== 'parent')
      .filter((m) => Date.parse(m.confirmedAt ?? m.review!.at) >= since)
      .slice()
      .reverse();
  }, [data.missions]);

  const takeBack = async (mission: Mission) => {
    const ok = await confirmAction({
      title: t('review.takeBackTitle'),
      body: t('review.takeBackBody', { stars: mission.task.stars }),
      action: t('review.takeBack'),
      cancel: t('common.cancel'),
    });
    if (ok) takeBackMission(mission.id);
  };

  return (
    <Screen>
      <TopBar title={selfReported ? t('review.logTitle') : t('review.title')} />

      <Txt variant="body" color={colors.textSoft}>
        {selfReported ? t('review.selfBody') : t('review.subtitle')}
      </Txt>
      {selfReported ? (
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
          {t('review.selfPrivate')}
        </Txt>
      ) : null}

      {missions.length === 0 ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('review.empty')}
          </Txt>
        </Sticker>
      ) : (
        <View style={{ gap: spacing.xl, marginTop: spacing.lg }}>
          {missions.map((mission) => {
            const when = new Date(mission.confirmedAt ?? mission.review!.at);
            const expanded = open === mission.id;
            return (
              <View key={mission.id} style={{ gap: spacing.sm }}>
                <Txt variant="tiny" color={colors.textFaint}>
                  {when.toLocaleDateString(language, { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {when.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {mission.takenBackAt
                    ? t('review.takenBack')
                    : mission.review!.by === 'grownup'
                      ? t('review.byGrownup')
                      : mission.review!.by === 'self'
                        ? t('review.bySelf')
                        : t('review.byApp')}
                </Txt>
                <MissionCard task={mission.task} compact faded={Boolean(mission.takenBackAt)} />

                {expanded ? <ReviewDetails mission={mission} showReasons={false} /> : null}

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label={expanded ? t('common.close') : t('review.checksTitle')}
                    tone="neutral"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => setOpen(expanded ? null : mission.id)}
                  />
                  {canTakeBack(mission) ? (
                    <Button
                      label={t('review.takeBack')}
                      tone="ghost"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => void takeBack(mission)}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
