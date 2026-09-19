import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Confetti, Field, Screen, SpeechBubble, Sticker, StepDots, TopBar, Txt } from '../components/ui';
import { findKind, findKinds, type FindFact } from '../data/finds';
import { factsKnown, nextFact, variantFor } from '../engine/find-engine';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useNarrator } from '../lib/voice';
import { useApp } from '../state/app-state';
import { FIND_PLACES, type FindKindId, type FindPlaceId } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { onDeviceVisionAvailable } from '../vision/detector';
import { guessFind, keepPhoto, remove, type FindGuess } from '../vision/finder';

/**
 * The explorer's walkthrough.
 *
 * A child photographs something, and then classifies it themselves by
 * answering questions about what is actually in front of them. The phone only
 * picks which set of questions to ask, so it is allowed to be wrong and the
 * child is always the one who decides. Looking harder is what unlocks the
 * better facts, which makes the reward for going outside something the screen
 * genuinely cannot hand over on its own.
 */

type Phase = 'intro' | 'camera' | 'reaction' | 'pick' | 'questions' | 'fact' | 'details' | 'done';

export default function Collect() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { profile, data, addFind } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [guess, setGuess] = useState<FindGuess | null>(null);
  const [kindId, setKindId] = useState<FindKindId | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [fact, setFact] = useState<FindFact | null>(null);
  const [nickname, setNickname] = useState('');
  const [place, setPlace] = useState<FindPlaceId | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  // Frozen at save time. Reading it off the collection afterwards would always
  // say no, because the find being celebrated is by then already in there.
  const [wasNew, setWasNew] = useState(false);

  const narrator = useNarrator(
    profile?.buddyId ?? 'fox',
    data.settings.language,
    data.settings.voiceEnabled,
  );

  const kind = kindId ? findKind(kindId) : null;
  const known = useMemo(() => factsKnown(data.collection), [data.collection]);
  const firstOfKind = useMemo(
    () => (kindId ? !data.collection.some((find) => find.kind === kindId) : false),
    [data.collection, kindId],
  );

  const leave = useCallback(() => {
    narrator.stop();
    // A frame the child walked away from is not theirs to keep.
    if (phase !== 'done') remove(photo);
    router.replace('/(tabs)/finds');
  }, [narrator, phase, photo, router]);

  /* ------------------------------------------------------------- capture */

  const shoot = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const shot = await camera.current?.takePictureAsync({
        quality: 0.6,
        shutterSound: false,
      });
      if (!shot?.uri) return;

      setPhoto(shot.uri);
      const found = await guessFind(shot.uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (found) {
        setGuess(found);
        setKindId(found.kind);
        setPhase('reaction');
        narrator.say(pick(findKind(found.kind).reaction));
      } else {
        setGuess(null);
        setPhase('pick');
      }
    } catch (error) {
      if (__DEV__) console.warn('[collect] capture failed', error);
    } finally {
      setBusy(false);
    }
  }, [busy, narrator, pick]);

  const retake = useCallback(() => {
    remove(photo);
    setPhoto(null);
    setGuess(null);
    setKindId(null);
    setPhase('camera');
  }, [photo]);

  /* ----------------------------------------------------------- questions */

  const beginQuestions = useCallback(
    (id: FindKindId) => {
      setKindId(id);
      setAnswers([]);
      setStep(0);
      setPhase('questions');
      narrator.say(pick(findKind(id).questions[0].prompt));
    },
    [narrator, pick],
  );

  const answer = useCallback(
    (tag: string) => {
      if (!kind) return;
      void Haptics.selectionAsync();
      const next = [...answers.slice(0, step), tag];
      setAnswers(next);

      if (step + 1 < kind.questions.length) {
        setStep(step + 1);
        narrator.say(pick(kind.questions[step + 1].prompt));
        return;
      }

      const unlocked = nextFact(kind.id, next.length, known);
      setFact(unlocked);
      setPhase('fact');
      narrator.say(unlocked ? pick(unlocked.text) : t('collect.allKnown'));
    },
    [answers, kind, known, narrator, pick, step, t],
  );

  /* --------------------------------------------------------------- save */

  const save = useCallback(() => {
    if (!kindId) return;
    // The camera cache is swept by the system, so a kept photo is copied into
    // the app's own folder first and the original thrown away.
    const kept = photo ? keepPhoto(photo) : undefined;
    if (photo && kept !== photo) remove(photo);

    const find = addFind({
      kind: kindId,
      answers,
      factIds: fact ? [fact.id] : [],
      photoUri: kept,
      place: place ?? undefined,
      nickname: nickname.trim() || undefined,
      label: guess?.label,
    });

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setWasNew(firstOfKind);
    setSaved(data.collection.length + 1);
    setPhoto(kept ?? null);
    setPhase('done');
    return find;
  }, [addFind, answers, data.collection.length, fact, firstOfKind, guess, kindId, nickname, photo, place]);

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
                {busy ? t('collect.looking') : t('collect.aim')}
              </Txt>
            </Sticker>
            <View style={{ gap: spacing.md }}>
              <Button
                label={busy ? t('collect.looking') : t('collect.shoot')}
                tone="primary"
                busy={busy}
                onPress={() => void shoot()}
              />
              <Button
                label={t('common.cancel')}
                tone="neutral"
                size="md"
                onPress={() => setPhase('intro')}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  /* ------------------------------------------------------------ reaction */

  if (phase === 'reaction' && kind) {
    return (
      <Screen>
        <TopBar onBack={leave} />

        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <SpeechBubble text={pick(kind.reaction)} tailSide="left" />
          <Buddy id={profile.buddyId} size={150} mood="cheer" />
        </View>

        {photo ? <Snapshot uri={photo} /> : null}

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button label={t('common.yes')} tone="success" onPress={() => beginQuestions(kind.id)} />
          <Button
            label={t('collect.whatIsIt')}
            tone="neutral"
            size="md"
            onPress={() => setPhase('pick')}
          />
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- pick */

  if (phase === 'pick') {
    return (
      <Screen>
        <TopBar onBack={leave} />

        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <SpeechBubble text={t('collect.notSure')} tailSide="left" />
          <Buddy id={profile.buddyId} size={130} mood="talking" />
        </View>

        <Txt variant="heading" style={{ marginTop: spacing.lg }}>
          {t('collect.whatIsIt')}
        </Txt>

        <View style={grid}>
          {findKinds.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={pick(option.name)}
              onPress={() => beginQuestions(option.id)}
              style={{ width: '30.5%' }}
            >
              <Sticker
                background={colors.surface}
                offset={3}
                style={{ alignItems: 'center', paddingVertical: spacing.md, gap: 2 }}
              >
                <Txt variant="title">{option.emoji}</Txt>
                <Txt variant="tiny" center numberOfLines={1} color={colors.textSoft}>
                  {pick(option.name)}
                </Txt>
              </Sticker>
            </Pressable>
          ))}
        </View>

        {photo ? (
          <Button
            label={t('collect.retake')}
            tone="ghost"
            size="md"
            style={{ marginTop: spacing.lg }}
            onPress={retake}
          />
        ) : null}
      </Screen>
    );
  }

  /* ----------------------------------------------------------- questions */

  if (phase === 'questions' && kind) {
    const question = kind.questions[step];
    return (
      <Screen>
        <TopBar onBack={() => (step === 0 ? setPhase('pick') : setStep(step - 1))} />

        <StepDots step={step} total={kind.questions.length} />

        {kind.caution && step === 0 ? (
          <Sticker
            background={colors.primary}
            style={{ padding: spacing.lg, gap: 2, marginBottom: spacing.lg }}
          >
            <Txt variant="tiny" color={colors.surface}>
              {t('collect.careful')}
            </Txt>
            <Txt variant="bodyStrong" color={colors.surface}>
              {pick(kind.caution)}
            </Txt>
          </Sticker>
        ) : null}

        <Txt variant="tiny" color={colors.textFaint}>
          {t('collect.step', { n: step + 1, total: kind.questions.length })}
        </Txt>
        <Txt variant="title" style={{ marginTop: spacing.xs }}>
          {pick(question.prompt)}
        </Txt>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {question.options.map((option) => (
            <Pressable
              key={option.tag}
              accessibilityRole="button"
              accessibilityLabel={pick(option.label)}
              onPress={() => answer(option.tag)}
            >
              <Sticker
                background={colors.surface}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.lg,
                }}
              >
                <Txt variant="title">{option.emoji}</Txt>
                <Txt variant="bodyStrong" style={{ flex: 1 }}>
                  {pick(option.label)}
                </Txt>
              </Sticker>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- fact */

  if (phase === 'fact' && kind) {
    return (
      <Screen>
        <TopBar onBack={() => setPhase('questions')} />

        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Buddy id={profile.buddyId} size={140} mood="cheer" />
        </View>

        <Sticker
          background={colors.accent}
          style={{ padding: spacing.xl, gap: spacing.sm, marginTop: spacing.lg }}
        >
          <Txt variant="tiny">{fact ? t('collect.factTitle') : ''}</Txt>
          <Txt variant="heading">{fact ? pick(fact.text) : t('collect.allKnown')}</Txt>
        </Sticker>

        <Button
          label={t('common.next')}
          tone="primary"
          style={{ marginTop: spacing.xl }}
          onPress={() => setPhase('details')}
        />
      </Screen>
    );
  }

  /* ------------------------------------------------------------- details */

  if (phase === 'details' && kind) {
    const variant = variantFor(kind.id, answers);
    return (
      <Screen avoidKeyboard>
        <TopBar onBack={() => setPhase('fact')} />

        <Sticker background={kind.color} style={{ padding: spacing.lg, gap: 2 }}>
          <Txt variant="title">{variant?.emoji ?? kind.emoji}</Txt>
          <Txt variant="heading">{pick(variant?.name ?? kind.name)}</Txt>
        </Sticker>

        <View style={{ marginTop: spacing.xl }}>
          <Field
            label={t('collect.nameIt')}
            placeholder={t('collect.namePlaceholder')}
            value={nickname}
            onChangeText={setNickname}
            maxLength={24}
            returnKeyType="done"
          />
        </View>

        <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
          {t('collect.wherePrompt')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          {FIND_PLACES.map((id) => {
            const on = place === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`findPlaces.${id}` as TKey)}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setPlace(on ? null : id);
                }}
              >
                <Sticker
                  background={on ? colors.success : colors.surface}
                  offset={3}
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                >
                  <Txt variant="small" color={on ? colors.surface : colors.text}>
                    {t(`findPlaces.${id}` as TKey)}
                  </Txt>
                </Sticker>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={t('collect.keep')}
          tone="success"
          style={{ marginTop: spacing.xxl }}
          onPress={save}
        />
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- done */

  if (phase === 'done' && kind) {
    return (
      <Screen>
        <Confetti />
        <TopBar onBack={leave} />

        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <SpeechBubble
            text={
              wasNew
                ? t('collect.newKind', { thing: pick(kind.name) })
                : t('collect.kept', { count: saved ?? data.collection.length })
            }
            tailSide="left"
          />
          <Buddy id={profile.buddyId} size={160} mood="cheer" wearing={data.wardrobe.worn} />
        </View>

        {photo ? <Snapshot uri={photo} /> : null}

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button
            label={t('collect.another')}
            tone="primary"
            onPress={() => {
              setPhoto(null);
              setGuess(null);
              setKindId(null);
              setAnswers([]);
              setFact(null);
              setNickname('');
              setPlace(null);
              setStep(0);
              setWasNew(false);
              setPhase('intro');
            }}
          />
          <Button label={t('common.done')} tone="neutral" size="md" onPress={leave} />
        </View>
      </Screen>
    );
  }

  /* --------------------------------------------------------------- intro */

  return (
    <Screen>
      <TopBar onBack={leave} />

      <Txt variant="title">{t('collect.title')}</Txt>

      <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
        <SpeechBubble text={t('collect.buddyIntro')} tailSide="left" />
        <Buddy id={profile.buddyId} size={170} mood="talking" label={profile.buddyName} />
      </View>

      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
        <Txt variant="bodyStrong">{t('collect.privacyTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {onDeviceVisionAvailable ? t('collect.privacyBody') : t('collect.privacyManual')}
        </Txt>
      </Sticker>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={t('collect.start')}
          tone="primary"
          onPress={() => {
            void (async () => {
              const granted = permission?.granted ? permission : await requestPermission();
              // No camera is not the end of the walkthrough, only of the photo.
              setPhase(granted.granted ? 'camera' : 'pick');
            })();
          }}
        />
        <Button label={t('collect.pickByHand')} tone="neutral" size="md" onPress={() => setPhase('pick')} />
      </View>
    </Screen>
  );
}

/* -------------------------------------------------------------- pieces */

function Snapshot({ uri }: { uri: string }) {
  return (
    <View
      style={{
        marginTop: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: borderWidth.chunky,
        borderColor: colors.border,
        overflow: 'hidden',
        aspectRatio: 4 / 3,
      }}
    >
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
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

const grid = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  marginTop: spacing.md,
} as const;
