import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Confetti, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { COMPARE_QUESTIONS, compareVerdict, type CompareAnswer } from '../engine/find-engine';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useNarrator } from '../lib/voice';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { remove } from '../vision/finder';

/**
 * Bring me two, and tell me whether they match.
 *
 * Telling two things apart is much easier than naming either of them, for the
 * child and for the phone, and it is what a scientist actually does first. No
 * recognition runs here at all: the child holds two leaves side by side and
 * answers three questions, and if two of the three differ they have sorted
 * them into different kinds without needing a single name.
 */

type Slot = 'a' | 'b';
type Phase = 'intro' | 'camera' | 'questions' | 'verdict';

export default function Compare() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile, data } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [slot, setSlot] = useState<Slot>('a');
  const [busy, setBusy] = useState(false);
  const [shots, setShots] = useState<{ a: string | null; b: string | null }>({ a: null, b: null });
  const [answers, setAnswers] = useState<(CompareAnswer | null)[]>([null, null, null]);

  const narrator = useNarrator(
    profile?.buddyId ?? 'fox',
    data.settings.language,
    data.settings.voiceEnabled,
  );

  const verdict = useMemo(() => compareVerdict(answers), [answers]);

  const leave = useCallback(() => {
    narrator.stop();
    // Comparison photos are working material, not keepsakes, so they go.
    remove(shots.a);
    remove(shots.b);
    router.replace('/(tabs)/finds');
  }, [narrator, router, shots]);

  const shoot = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const shot = await camera.current?.takePictureAsync({ quality: 0.6, shutterSound: false });
      if (!shot?.uri) return;
      void Haptics.selectionAsync();

      setShots((current) => {
        remove(current[slot]);
        return { ...current, [slot]: shot.uri };
      });

      if (slot === 'a') setSlot('b');
      else setPhase('questions');
    } catch (error) {
      if (__DEV__) console.warn('[compare] capture failed', error);
    } finally {
      setBusy(false);
    }
  }, [busy, slot]);

  const answer = useCallback(
    (index: number, value: CompareAnswer) => {
      void Haptics.selectionAsync();
      const next = [...answers];
      next[index] = value;
      setAnswers(next);

      if (next.every((entry) => entry !== null)) {
        const result = compareVerdict(next);
        setPhase('verdict');
        narrator.say(t(result.different ? 'compare.verdictDifferent' : 'compare.verdictSame'));
      }
    },
    [answers, narrator, t],
  );

  const restart = useCallback(() => {
    remove(shots.a);
    remove(shots.b);
    setShots({ a: null, b: null });
    setAnswers([null, null, null]);
    setSlot('a');
    setPhase('intro');
  }, [shots]);

  if (!profile) return null;

  /* -------------------------------------------------------------- camera */

  if (phase === 'camera' && permission?.granted) {
    return (
      <Screen scroll={false} padded={false} background={colors.border}>
        <View style={{ flex: 1 }}>
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" animateShutter={false} />
          <View style={overlay}>
            <Sticker background={colors.surface} style={{ padding: spacing.md, marginTop: spacing.xxl }}>
              <Txt variant="bodyStrong" center>
                {t(slot === 'a' ? 'compare.first' : 'compare.second')}
              </Txt>
            </Sticker>
            <View style={{ gap: spacing.md }}>
              <Button label={t('compare.take')} tone="primary" busy={busy} onPress={() => void shoot()} />
              <Button label={t('common.cancel')} tone="neutral" size="md" onPress={() => setPhase('intro')} />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  /* ----------------------------------------------------------- questions */

  if (phase === 'questions') {
    return (
      <Screen>
        <TopBar onBack={restart} />

        <Txt variant="title">{t('compare.title')}</Txt>

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          <Thumb uri={shots.a} label={t('compare.first')} />
          <Thumb uri={shots.b} label={t('compare.second')} />
        </View>

        <View style={{ gap: spacing.xl, marginTop: spacing.xl }}>
          {COMPARE_QUESTIONS.map((question, index) => (
            <View key={question} style={{ gap: spacing.sm }}>
              <Txt variant="subheading">{t(`compare.${question}Q` as TKey)}</Txt>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['a', 'b', 'same'] as const).map((option) => {
                  const on = answers[index] === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={t(`compare.option${cap(option)}` as TKey)}
                      style={{ flex: 1 }}
                      onPress={() => answer(index, option)}
                    >
                      <Sticker
                        background={on ? colors.success : colors.surface}
                        offset={3}
                        style={{ alignItems: 'center', paddingVertical: spacing.md }}
                      >
                        <Txt
                          variant="tiny"
                          center
                          numberOfLines={2}
                          color={on ? colors.surface : colors.text}
                        >
                          {t(`compare.option${cap(option)}` as TKey)}
                        </Txt>
                      </Sticker>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </Screen>
    );
  }

  /* -------------------------------------------------------------- verdict */

  if (phase === 'verdict') {
    return (
      <Screen>
        {verdict.different ? <Confetti /> : null}
        <TopBar onBack={leave} />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Thumb uri={shots.a} label={t('compare.first')} />
          <Thumb uri={shots.b} label={t('compare.second')} />
        </View>

        <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
          <SpeechBubble
            text={t(verdict.different ? 'compare.verdictDifferent' : 'compare.verdictSame')}
            tailSide="left"
          />
          <Buddy id={profile.buddyId} size={140} mood="cheer" />
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button label={t('compare.again')} tone="primary" onPress={restart} />
          <Button label={t('common.done')} tone="neutral" size="md" onPress={leave} />
        </View>
      </Screen>
    );
  }

  /* --------------------------------------------------------------- intro */

  return (
    <Screen>
      <TopBar onBack={leave} />

      <Txt variant="title">{t('compare.title')}</Txt>

      <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
        <SpeechBubble text={t('compare.buddyLine')} tailSide="left" />
        <Buddy id={profile.buddyId} size={165} mood="talking" label={profile.buddyName} />
      </View>

      <Button
        label={t('compare.take')}
        tone="primary"
        onPress={() => {
          void (async () => {
            const granted = permission?.granted ? permission : await requestPermission();
            if (!granted.granted) return;
            setSlot(shots.a ? 'b' : 'a');
            setPhase('camera');
          })();
        }}
      />
    </Screen>
  );
}

function Thumb({ uri, label }: { uri: string | null; label: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.xs }}>
      <View
        style={{
          aspectRatio: 1,
          borderRadius: radii.md,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <Txt variant="display" style={{ opacity: 0.2 }}>
            ❔
          </Txt>
        )}
      </View>
      <Txt variant="tiny" center color={colors.textSoft}>
        {label}
      </Txt>
    </View>
  );
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const overlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'space-between',
  padding: spacing.xl,
} as const;
