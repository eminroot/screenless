import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { roomObjectList } from '../data/room-objects';
import { buildRoomMission } from '../engine/room-engine';
import { useI18n } from '../i18n';
import { useApp } from '../state/app-state';
import type { RoomObjectId } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { detectObjects, discard, onDeviceVisionAvailable } from '../vision/detector';

/** Frames per scan. Three angles catch far more of a room than one. */
const FRAMES = 3;
const FRAME_GAP_MS = 700;

type Phase = 'intro' | 'camera' | 'result';

export default function Scan() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { profile, data, setRoomScan, assignMission } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<RoomObjectId[]>(data.room?.objects ?? []);
  const [manual, setManual] = useState(!onDeviceVisionAvailable);

  const leave = () => router.replace('/(tabs)');

  const runScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    const seen = new Set<RoomObjectId>(found);

    try {
      for (let frame = 0; frame < FRAMES; frame += 1) {
        // One bad frame, usually a shutter fired before the camera settled,
        // should not end the whole scan.
        try {
          const shot = await camera.current?.takePictureAsync({
            quality: 0.5,
            skipProcessing: true,
            shutterSound: false,
          });
          if (shot?.uri) {
            for (const object of await detectObjects(shot.uri)) seen.add(object);
            // The frame is read and thrown away; nothing is kept, nothing is sent.
            discard(shot.uri);
            setFound([...seen]);
            void Haptics.selectionAsync();
          }
        } catch (error) {
          if (__DEV__) console.warn('[scan] frame failed', error);
        }

        if (frame < FRAMES - 1) {
          await new Promise((resolve) => setTimeout(resolve, FRAME_GAP_MS));
        }
      }
    } finally {
      setScanning(false);
      setPhase('result');
    }
  }, [found, scanning]);

  const toggle = (id: RoomObjectId) => {
    void Haptics.selectionAsync();
    setFound((current) =>
      current.includes(id) ? current.filter((o) => o !== id) : [...current, id],
    );
  };

  // Template choice has a random tie break, so the mission is decided once for
  // a given set of objects. Otherwise the title on screen would not be the
  // mission the button hands over.
  const preview = useMemo(() => {
    if (!profile || found.length === 0) return null;
    return buildRoomMission({
      scan: { objects: found, at: new Date().toISOString(), source: 'camera' },
      profile,
      missions: data.missions,
      allowDuo: data.settings.duoEnabled,
    });
  }, [profile, found, data.missions, data.settings.duoEnabled]);

  const build = () => {
    if (!preview) return;
    setRoomScan({
      objects: found,
      at: new Date().toISOString(),
      source: manual ? 'manual' : 'camera',
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    assignMission(preview);
    router.replace('/mission');
  };

  if (!profile) return null;

  /* ----------------------------------------------------------------- camera */
  if (phase === 'camera' && permission?.granted && !manual) {
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
                {scanning ? t('scan.looking') : t('scan.aim')}
              </Txt>
            </Sticker>

            <View style={{ gap: spacing.md }}>
              {found.length > 0 ? <ObjectRow objects={found} compact /> : null}
              <Button
                label={scanning ? t('scan.looking') : t('scan.shoot')}
                tone="primary"
                busy={scanning}
                onPress={() => void runScan()}
              />
              <Button label={t('common.cancel')} tone="neutral" size="md" onPress={() => setPhase('intro')} />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  /* ----------------------------------------------------------------- result */
  if (phase === 'result') {
    return (
      <Screen>
        <TopBar onBack={leave} />

        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <SpeechBubble
            text={
              found.length === 0
                ? t('scan.nothingFound')
                : t('scan.foundCount', { count: found.length })
            }
            tailSide="left"
          />
          <Buddy id={profile.buddyId} size={150} mood={found.length > 0 ? 'cheer' : 'idle'} />
        </View>

        <Txt variant="heading" style={{ marginTop: spacing.lg }}>
          {t('scan.inYourRoom')}
        </Txt>
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
          {t('scan.tapToFix')}
        </Txt>

        <ObjectPicker selected={found} onToggle={toggle} />

        {preview ? (
          <Sticker background={colors.accent} style={{ padding: spacing.lg, gap: 4, marginTop: spacing.lg }}>
            <Txt variant="tiny">{t('scan.missionReady')}</Txt>
            <Txt variant="heading">{pick(preview.title)}</Txt>
          </Sticker>
        ) : found.length > 0 ? (
          <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
            <Txt variant="body" color={colors.textSoft}>
              {t('scan.needMore')}
            </Txt>
          </Sticker>
        ) : null}

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button label={t('scan.makeMission')} tone="primary" disabled={!preview} onPress={build} />
          {!manual ? (
            <Button label={t('scan.rescan')} tone="neutral" size="md" onPress={() => setPhase('camera')} />
          ) : null}
        </View>
      </Screen>
    );
  }

  /* ------------------------------------------------------------------ intro */
  return (
    <Screen>
      <TopBar onBack={leave} />

      <Txt variant="title">{t('scan.title')}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
        {t('scan.subtitle', { buddy: profile.buddyName })}
      </Txt>

      <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
        <SpeechBubble text={t('scan.buddyLine')} tailSide="left" />
        <Buddy id={profile.buddyId} size={170} mood="talking" label={profile.buddyName} />
      </View>

      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
        <Txt variant="bodyStrong">{t('scan.privacyTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {onDeviceVisionAvailable ? t('scan.privacyBody') : t('scan.privacyManual')}
        </Txt>
      </Sticker>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        {onDeviceVisionAvailable ? (
          <Button
            label={t('scan.start')}
            tone="primary"
            onPress={() => {
              void (async () => {
                const granted = permission?.granted ? permission : await requestPermission();
                if (!granted.granted) {
                  setManual(true);
                  setPhase('result');
                  return;
                }
                setManual(false);
                setPhase('camera');
              })();
            }}
          />
        ) : null}
        <Button
          label={t('scan.pickByHand')}
          tone={onDeviceVisionAvailable ? 'neutral' : 'primary'}
          onPress={() => {
            setManual(true);
            setPhase('result');
          }}
        />
      </View>
    </Screen>
  );
}

/* -------------------------------------------------------------- components */

function ObjectRow({ objects, compact }: { objects: RoomObjectId[]; compact?: boolean }) {
  const { pick } = useI18n();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {objects.map((id) => {
        const meta = roomObjectList.find((o) => o.id === id);
        if (!meta) return null;
        return (
          <View
            key={id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.surface,
              borderRadius: radii.pill,
              borderWidth: borderWidth.hair,
              borderColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: 4,
            }}
          >
            <Txt variant="small">{meta.emoji}</Txt>
            {!compact ? <Txt variant="tiny">{pick(meta.name)}</Txt> : null}
          </View>
        );
      })}
    </View>
  );
}

function ObjectPicker({
  selected,
  onToggle,
}: {
  selected: RoomObjectId[];
  onToggle: (id: RoomObjectId) => void;
}) {
  const { pick } = useI18n();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
      {roomObjectList.map((meta) => {
        const on = selected.includes(meta.id);
        return (
          <Pressable
            key={meta.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={pick(meta.name)}
            onPress={() => onToggle(meta.id)}
            style={{ width: '30.5%' }}
          >
            <Sticker
              background={on ? colors.success : colors.surface}
              offset={on ? 4 : 2}
              border={on ? borderWidth.thick : borderWidth.hair}
              style={{ alignItems: 'center', paddingVertical: spacing.sm, gap: 2 }}
            >
              <Txt variant="heading">{meta.emoji}</Txt>
              <Txt variant="tiny" center numberOfLines={1} color={on ? colors.surface : colors.textSoft}>
                {pick(meta.name)}
              </Txt>
            </Sticker>
          </Pressable>
        );
      })}
    </View>
  );
}
