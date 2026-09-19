import { useState } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MissionCard } from '../components/MissionCard';
import { minutesOf, readIntegrity, type IntegrityFlag } from '../engine/integrity';
import { ParentGate } from '../components/ParentGate';
import { ReviewDetails, waitingLineKey } from '../components/ReviewDetails';
import { Button, Screen, Sticker, TopBar, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

const FLAG_COPY: Record<IntegrityFlag, TKey> = {
  tooFast: 'confirm.checkTooFast',
  repeated: 'confirm.checkRepeated',
  burst: 'confirm.checkBurst',
};

/** Under a minute is the interesting case, so it is not rounded up to one. */
const SUB_MINUTE = 60;

export default function Confirm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, pick } = useI18n();
  const { profile, data, confirmMission, rejectMission } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [approved, setApproved] = useState(false);

  const found =
    data.missions.find((m) => m.id === id) ?? data.missions.find((m) => m.status === 'pending');
  // A notification tapped after someone already decided lands on nothing to do,
  // rather than on approve buttons for a mission that is already paid. The
  // outcome shown right after a decision is kept by the screen's own state.
  const mission = found && (found.status === 'pending' || rejected || approved) ? found : null;

  const leave = () => router.replace('/(tabs)');

  if (!mission || !profile) {
    return (
      <Screen>
        <TopBar onBack={leave} />
        <Txt variant="body">{t('parent.pendingEmpty')}</Txt>
      </Screen>
    );
  }

  const integrity = readIntegrity(mission, data.missions);

  return (
    <Screen>
      <TopBar onBack={leave} />

      {!unlocked ? (
        <View style={{ gap: spacing.xl }}>
          {/* Ages 6-9: why this one is waiting, in words for the child holding
              the phone, and a way to go and play while it waits. */}
          {mission.review && mission.review.by === 'parent' ? (
            <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Txt variant="heading">{t(waitingLineKey(mission.review.reasons))}</Txt>
              <Txt variant="body" color={colors.textSoft}>
                {t('verify.waitingHandOver')}
              </Txt>
              <Button label={t('verify.waitingLater')} tone="neutral" size="md" onPress={leave} />
            </Sticker>
          ) : null}
          <ParentGate onUnlock={() => setUnlocked(true)} />
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <Txt variant="title">{t('confirm.title', { name: profile.nickname })}</Txt>
          <Txt variant="body" color={colors.textSoft}>
            {mission.review ? t('review.confirmSubtitle') : t('confirm.subtitle')}
          </Txt>

          <Txt variant="small" color={colors.textFaint}>
            {t('confirm.mission')}
          </Txt>
          <MissionCard task={mission.task} />

          <ReviewDetails mission={mission} />

          {mission.proofUri && !mission.beforeUri ? (
            <View style={{ gap: spacing.sm }}>
              <Txt variant="small" color={colors.textFaint}>
                {t('confirm.proofTitle')}
              </Txt>
              <View
                style={{
                  borderRadius: radii.lg,
                  borderWidth: borderWidth.thick,
                  borderColor: colors.border,
                  overflow: 'hidden',
                  aspectRatio: 4 / 3,
                }}
              >
                <Image
                  source={{ uri: mission.proofUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <Txt variant="tiny" color={colors.textFaint}>
                {t('confirm.proofNote')}
              </Txt>
            </View>
          ) : null}

          {mission.task.check && mission.checkAnswer !== undefined ? (
            <View style={{ gap: spacing.sm }}>
              <Txt variant="small" color={colors.textFaint}>
                {pick(mission.task.check.question)}
              </Txt>
              <Sticker background={colors.surfaceAlt} style={{ padding: spacing.md, gap: spacing.xs }}>
                <Txt variant="bodyStrong">
                  {pick(mission.task.check.options[mission.checkAnswer])}
                </Txt>
                <Txt variant="tiny" color={colors.textFaint}>
                  {t('confirm.answerNote')}
                </Txt>
              </Sticker>
            </View>
          ) : null}

          {/* What the record says about this claim. A note, never a block:
              the parent is the only thing here that can award a star. */}
          {integrity.flags.length > 0 && !mission.review ? (
            <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.sm }}>
              <Txt variant="bodyStrong">{t('confirm.checkTitle')}</Txt>
              {integrity.flags.map((flag) => (
                <Txt key={flag} variant="small" color={colors.textSoft}>
                  {'• '}
                  {t(
                    flag === 'tooFast' && (integrity.spentSec ?? 0) < SUB_MINUTE
                      ? 'confirm.checkTooFastSeconds'
                      : FLAG_COPY[flag],
                    {
                      spent:
                        (integrity.spentSec ?? 0) < SUB_MINUTE
                          ? Math.max(0, Math.round(integrity.spentSec ?? 0))
                          : minutesOf(integrity.spentSec ?? 0),
                      asked: minutesOf(integrity.expectedSec),
                      count: flag === 'repeated' ? integrity.repeatsToday : integrity.recentConfirms,
                    },
                  )}
                </Txt>
              ))}
              <Txt variant="tiny" color={colors.textFaint}>
                {t('confirm.checkNote')}
              </Txt>
            </Sticker>
          ) : null}

          {mission.motionReps ? (
            <Sticker background={colors.surfaceAlt} style={{ padding: spacing.md }}>
              <Txt variant="small">
                {t('confirm.motionCounted', { count: mission.motionReps })}
              </Txt>
            </Sticker>
          ) : null}

          {rejected ? (
            <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
              <Txt variant="body">{t('confirm.rejected')}</Txt>
            </Sticker>
          ) : (
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              <Button
                label={t('confirm.approve')}
                tone="success"
                onPress={() => {
                  setApproved(true);
                  const delta = confirmMission(mission.id);
                  router.replace({
                    pathname: '/celebrate',
                    params: {
                      id: mission.id,
                      stars: String(mission.task.stars),
                      coins: delta?.coins ? String(delta.coins) : '',
                      level: delta?.leveledUpTo ? String(delta.leveledUpTo) : '',
                      rewards: (delta?.newRewards ?? []).join(','),
                      prizes: (delta?.reachedRewards ?? []).map((r) => r.id).join(','),
                    },
                  });
                }}
              />
              <Button
                label={t('confirm.reject')}
                tone="neutral"
                onPress={() => {
                  rejectMission(mission.id);
                  setRejected(true);
                }}
              />
            </View>
          )}

          {rejected ? <Button label={t('common.done')} tone="primary" onPress={leave} /> : null}
        </View>
      )}
    </Screen>
  );
}
