import { useCallback, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { objectName } from '../data/room-objects';
import { selfChecks } from '../engine/verify';
import { useI18n } from '../i18n';
import { useApp } from '../state/app-state';
import type { RoomObjectId } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { discard, onDeviceVisionAvailable, readPhoto } from '../vision/detector';

type Shot = { uri: string; tags: RoomObjectId[]; read: boolean; screen: boolean };

/**
 * Photo proof.
 *
 * The picture is read on this phone, never uploaded, and deleted the moment a
 * parent has decided. What the labeller finds is a hint for the parent, not a
 * verdict: a wonky tower the model does not recognise still counts if the
 * parent says it does.
 */
export default function Proof() {
  const router = useRouter();
  const { id, seconds, answer } = useLocalSearchParams<{
    id?: string;
    seconds?: string;
    answer?: string;
  }>();
  const { t, pick } = useI18n();
  const { profile, data, claimMission, submitMission } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);

  const mission = data.missions.find((m) => m.id === id && m.status === 'active');

  const capture = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const picture = await camera.current?.takePictureAsync({
        quality: 0.6,
        shutterSound: false,
      });
      if (!picture?.uri) return;
      const read = await readPhoto(picture.uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShot({ uri: picture.uri, ...read });
    } finally {
      setBusy(false);
    }
  }, [busy]);

  if (!mission || !profile) {
    return (
      <Screen>
        <TopBar onBack={() => router.replace('/(tabs)')} />
        <Txt variant="body">{t('parent.pendingEmpty')}</Txt>
      </Screen>
    );
  }

  const expected = mission.task.objects ?? [];
  const matched = expected.filter((object) => shot?.tags.includes(object)) ?? [];
  const recognised = onDeviceVisionAvailable && expected.length > 0 && matched.length > 0;
  // From six the phone decides most missions itself; the photo is part of that.
  const selfChecked = selfChecks(profile.ageBand);

  const send = () => {
    if (selfChecked) {
      // Everything else the runner measured is already on the mission.
      const result = submitMission(mission.id, {
        proofUri: shot?.uri,
        proofTags: shot?.tags,
        photoRead: shot?.read,
        photoOfScreen: shot?.screen,
      });
      if (result.approved) {
        const { completion } = result;
        router.replace({
          pathname: '/celebrate',
          params: {
            id: mission.id,
            stars: String(mission.task.stars),
            coins: completion.coins ? String(completion.coins) : '',
            level: completion.leveledUpTo ? String(completion.leveledUpTo) : '',
            rewards: completion.newRewards.join(','),
            prizes: completion.reachedRewards.map((r) => r.id).join(','),
            checked: result.by,
          },
        });
      } else {
        router.replace({ pathname: '/confirm', params: { id: mission.id } });
      }
      return;
    }

    claimMission(mission.id, {
      durationSec: seconds ? Number(seconds) : undefined,
      proofUri: shot?.uri,
      proofTags: shot?.tags,
      // Answered on the mission screen, before the camera opened.
      checkAnswer: answer ? Number(answer) : undefined,
    });
    router.replace({ pathname: '/confirm', params: { id: mission.id } });
  };

  /* --------------------------------------------------------------- preview */
  if (shot) {
    return (
      <Screen>
        <TopBar
          onBack={() => {
            discard(shot.uri);
            setShot(null);
          }}
        />

        <Txt variant="title">{t('proof.checkTitle')}</Txt>

        <View
          style={{
            marginTop: spacing.lg,
            borderRadius: radii.lg,
            borderWidth: borderWidth.chunky,
            borderColor: colors.border,
            overflow: 'hidden',
            aspectRatio: 3 / 4,
          }}
        >
          <Image source={{ uri: shot.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>

        <Sticker
          background={recognised ? colors.success : colors.surfaceAlt}
          style={{ padding: spacing.lg, gap: spacing.xs, marginTop: spacing.lg }}
        >
          <Txt variant="bodyStrong" color={recognised ? colors.surface : colors.text}>
            {recognised
              ? t('proof.spotted', {
                  thing: matched.map((object) => pick(objectName(object))).join(', '),
                })
              : onDeviceVisionAvailable
                ? t('proof.notSure')
                : t('proof.parentDecides')}
          </Txt>
          <Txt variant="small" color={recognised ? colors.surface : colors.textSoft}>
            {selfChecked ? t('verify.proofSelfNote') : t('proof.parentStillDecides')}
          </Txt>
        </Sticker>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button label={selfChecked ? t('verify.proofSend') : t('proof.send')} tone="success" onPress={send} />
          <Button
            label={t('proof.retake')}
            tone="neutral"
            size="md"
            onPress={() => {
              discard(shot.uri);
              setShot(null);
            }}
          />
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- camera */
  if (permission?.granted) {
    return (
      <Screen scroll={false} padded={false} background={colors.border}>
        <View style={{ flex: 1 }}>
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" animateShutter={false} />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'space-between',
              padding: spacing.xl,
            }}
          >
            <Sticker background={colors.surface} style={{ padding: spacing.md, marginTop: spacing.xxl }}>
              <Txt variant="bodyStrong" center>
                {pick(mission.task.title)}
              </Txt>
            </Sticker>
            <View style={{ gap: spacing.md }}>
              <Button label={t('proof.take')} tone="primary" busy={busy} onPress={() => void capture()} />
              <Button
                label={t('proof.skipPhoto')}
                tone="neutral"
                size="md"
                onPress={send}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  /* ------------------------------------------------------------ permission */
  return (
    <Screen>
      <TopBar onBack={() => router.back()} />

      <View style={{ alignItems: 'center', gap: spacing.lg, marginVertical: spacing.lg }}>
        <SpeechBubble text={t('proof.askCamera', { buddy: profile.buddyName })} tailSide="left" />
        <Buddy id={profile.buddyId} size={150} mood="talking" label={profile.buddyName} />
      </View>

      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
        <Txt variant="bodyStrong">{t('proof.privacyTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {selfChecks(profile.ageBand) ? t('verify.proofSelfNote') : t('proof.privacyBody')}
        </Txt>
      </Sticker>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={t('proof.allow')}
          tone="primary"
          onPress={() => void requestPermission()}
        />
        <Button label={t('proof.skipPhoto')} tone="neutral" size="md" onPress={send} />
      </View>
    </Screen>
  );
}
