import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { CategoryPill } from '../components/MissionCard';
import { MotionCounter } from '../components/MotionCounter';
import { Button, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { objectEmoji } from '../data/room-objects';
import { currentContext } from '../engine/context';
import { learnFromMissions } from '../engine/learning';
import { pickTask } from '../engine/task-engine';
import { useI18n } from '../i18n';
import { useNarrator } from '../lib/voice';
import { useApp } from '../state/app-state';
import type { SkipReason } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { useExperience } from '../experience';
import { LittleMission } from '../little/screens/LittleMission';
import { JuniorMission } from '../junior/screens/JuniorMission';
import { TeenMission } from '../teen/screens/TeenMission';

export default function MissionScreenRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleMission />;
  if (experience === 'junior') return <JuniorMission />;
  if (experience === 'teen') return <TeenMission />;
  return <MissionScreen />;
}

function MissionScreen() {
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, claimMission, skipMission, assignMission, startMission } =
    useApp();

  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>([]);
  const [motionReps, setMotionReps] = useState(0);
  /** Which option the child picked for the closing question, if there is one. */
  const [answer, setAnswer] = useState<number | null>(null);
  /** Set when the phone cannot count movement, so the mission is still finishable. */
  const [motionBlocked, setMotionBlocked] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  /** False for the first frame, so an assign-then-navigate does not bounce back. */
  const [settled, setSettled] = useState(false);
  const rang = useRef(false);
  /** Set when we navigate on purpose, so the safety redirect below stands down. */
  const leaving = useRef(false);

  const task = activeMission?.task;
  const steps = task?.steps ?? [];
  const total = (task?.minutes ?? 10) * 60;

  const narrator = useNarrator(
    profile?.buddyId ?? 'fox',
    language,
    data.settings.voiceEnabled,
  );
  const { say } = narrator;

  // Reset the checklist whenever a different mission arrives, including a swap.
  useEffect(() => {
    setTicked(steps.map(() => false));
    setMotionReps(0);
    setAnswer(null);
    setMotionBlocked(false);
    setBriefRead(false);
    setStartedAt(null);
    setElapsed(0);
    rang.current = false;
  }, [activeMission?.id, steps.length]);

  // Elapsed is derived from a timestamp, so backgrounding the app is fine.
  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (startedAt !== null && elapsed >= total && !rang.current) {
      rang.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [elapsed, total, startedAt]);

  // A screen that opens straight after a mission is assigned can render one
  // frame before the store has caught up, so the guard waits a beat first.
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // Claiming a mission clears the active one, which would otherwise bounce the
  // child back to Today before the confirmation screen opens.
  useEffect(() => {
    if (!activeMission && settled && !leaving.current) router.replace('/(tabs)');
  }, [activeMission, settled, router]);

  const duo = task?.mode === 'duo';
  const showBrief = duo && !briefRead;

  // The buddy reads the mission out once, so a child who cannot read yet still
  // knows what to do. Duo missions wait until the grown up has handed it back.
  useEffect(() => {
    if (!task || showBrief) return;
    say(`${pick(task.title)}. ${pick(task.body)}`);
  }, [task?.id, showBrief, say, pick, task]);

  const finish = useCallback(() => {
    if (!activeMission) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    narrator.stop();
    leaving.current = true;

    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;

    if (activeMission.task.proof === 'photo') {
      router.replace({
        pathname: '/proof',
        params: {
          id: activeMission.id,
          seconds: seconds ? String(seconds) : '',
          answer: answer === null ? '' : String(answer),
        },
      });
      return;
    }

    claimMission(activeMission.id, {
      durationSec: seconds,
      motionReps: activeMission.task.proof === 'motion' ? motionReps : undefined,
      checkAnswer: answer ?? undefined,
    });
    router.replace({ pathname: '/confirm', params: { id: activeMission.id } });
  }, [activeMission, answer, claimMission, motionReps, narrator, router, startedAt]);

  const missionNumber = useMemo(
    () => String(data.progress.totalMissions + 1).padStart(2, '0'),
    [data.progress.totalMissions],
  );

  if (!activeMission || !profile || !task) return null;

  const remaining = Math.max(0, total - elapsed);
  const finished = startedAt !== null && remaining === 0;
  const running = startedAt !== null && !finished;

  // Counted from the steps rather than from `ticked`, which is empty on the
  // first render: counting the unticked entries of an empty list says nothing
  // is left to do, which enabled the finish button for one frame.
  const stepsLeft = steps.length - ticked.filter(Boolean).length;
  const motionLeft =
    task.proof === 'motion' && task.motion && !motionBlocked
      ? motionReps < task.motion.count
      : false;
  // One tap, and no answer is wrong, so requiring it costs the child nothing.
  const askLeft = task.check ? answer === null : false;
  const canFinish = stepsLeft === 0 && !motionLeft && !askLeft;

  const begin = () => {
    setStartedAt(Date.now());
    startMission(activeMission.id);
  };

  const swap = (reason: SkipReason) => {
    narrator.stop();
    skipMission(activeMission.id, reason);
    const next = pickTask(profile, data.missions, {
      favourVariety: true,
      exclude: [task.id],
      context: currentContext(),
      learned: learnFromMissions(data.missions, data.ideaVotes),
      allowDuo: data.settings.duoEnabled,
    });
    assignMission(next);
    setSwapOpen(false);
  };

  /* ------------------------------------------------------- parent hand off */
  if (showBrief) {
    return (
      <Screen>
        <TopBar onBack={() => router.replace('/(tabs)')} />

        <Sticker background={colors.info} style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Txt variant="tiny" color={colors.surface}>
            {t('duo.forParent')}
          </Txt>
          <Txt variant="heading" color={colors.surface}>
            {t('duo.handOver', { name: profile.nickname })}
          </Txt>
        </Sticker>

        <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
          <SpeechBubble text={t('duo.buddyLine')} tailSide="left" />
          <Buddy id={profile.buddyId} size={140} mood="happy" label={profile.buddyName} />
        </View>

        <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Txt variant="heading">{pick(task.title)}</Txt>
          <Txt variant="body">{pick(task.body)}</Txt>
          {task.parentBrief ? (
            <View
              style={{
                backgroundColor: colors.surfaceAlt,
                borderRadius: radii.sm,
                borderWidth: borderWidth.hair,
                borderColor: colors.border,
                padding: spacing.md,
                marginTop: spacing.xs,
              }}
            >
              <Txt variant="tiny" color={colors.textSoft}>
                {t('duo.whatToDo')}
              </Txt>
              <Txt variant="small">{pick(task.parentBrief)}</Txt>
            </View>
          ) : null}
        </Sticker>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <Button label={t('duo.ready')} tone="primary" onPress={() => setBriefRead(true)} />
          <Button label={t('duo.notNow')} tone="ghost" size="md" onPress={() => setSwapOpen(true)} />
        </View>

        <SwapSheet
          open={swapOpen}
          buddy={profile.buddyName}
          onClose={() => setSwapOpen(false)}
          onPick={swap}
        />
      </Screen>
    );
  }

  /* --------------------------------------------------------------- mission */
  return (
    <Screen>
      <TopBar
        onBack={() => {
          narrator.stop();
          router.replace('/(tabs)');
        }}
      />

      <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              backgroundColor: colors.border,
              borderRadius: radii.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
            }}
          >
            <Txt variant="tiny" color={colors.surface}>
              {t('task.missionNumber', { number: missionNumber })}
            </Txt>
          </View>
          <CategoryPill category={task.category} />
          {duo ? (
            <View
              style={{
                backgroundColor: colors.info,
                borderRadius: radii.pill,
                borderWidth: borderWidth.hair,
                borderColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: 3,
              }}
            >
              <Txt variant="tiny" color={colors.surface}>
                {t('duo.badge')}
              </Txt>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: radii.md,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="title">{task.emoji}</Txt>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">{pick(task.title)}</Txt>
            <Txt variant="tiny" color={colors.textSoft}>
              {t('task.howLong', { count: task.minutes })} · {t('common.starsCount', { count: task.stars })}
            </Txt>
          </View>
          {data.settings.voiceEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('task.readAloud')}
              onPress={() => say(`${pick(task.title)}. ${pick(task.body)}`)}
              style={{
                width: 44,
                height: 44,
                borderRadius: radii.pill,
                backgroundColor: colors.magic,
                borderWidth: borderWidth.thick,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt variant="subheading">🔊</Txt>
            </Pressable>
          ) : null}
        </View>

        <Txt variant="body">{pick(task.body)}</Txt>

        {task.objects && task.objects.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {task.objects.map((object) => (
              <Txt key={object} variant="subheading">
                {objectEmoji(object)}
              </Txt>
            ))}
          </View>
        ) : null}
      </Sticker>

      {steps.length > 0 ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Txt variant="subheading" color={colors.textSoft}>
            {stepsLeft > 0 ? t('task.stepsLeft', { count: stepsLeft }) : t('task.allSteps')}
          </Txt>
          {steps.map((step, index) => (
            <StepRow
              key={index}
              index={index + 1}
              text={pick(step)}
              done={ticked[index] ?? false}
              onPress={() => {
                void Haptics.selectionAsync();
                setTicked((current) => {
                  const next = [...current];
                  next[index] = !next[index];
                  if (next[index]) say(pick(step));
                  return next;
                });
              }}
            />
          ))}
        </View>
      ) : null}

      {task.proof === 'motion' && task.motion ? (
        <View style={{ marginTop: spacing.lg }}>
          {/* Keyed so a swapped mission starts its count from zero. */}
          <MotionCounter
            key={activeMission.id}
            spec={task.motion}
            running={running}
            onComplete={setMotionReps}
            onUnsupported={() => setMotionBlocked(true)}
          />
        </View>
      ) : null}

      {task.check ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <Txt variant="subheading" color={colors.textSoft}>
            {pick(task.check.question)}
          </Txt>
          {task.check.options.map((option, index) => (
            <AnswerRow
              key={index}
              text={pick(option)}
              picked={answer === index}
              onPress={() => {
                void Haptics.selectionAsync();
                setAnswer(index);
                say(pick(option));
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: spacing.lg }}>
        <TimerRing
          remaining={remaining}
          fraction={startedAt === null ? 1 : remaining / total}
          idle={startedAt === null}
        />

        {running ? (
          <Sticker background={colors.info} style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}>
            <Txt variant="subheading" color={colors.surface} center>
              {t('task.putDown')}
            </Txt>
          </Sticker>
        ) : finished ? (
          <Txt variant="heading" color={colors.successDeep}>
            {t('task.timerDone')}
          </Txt>
        ) : null}

        <Buddy
          id={profile.buddyId}
          size={140}
          mood={
            narrator.speaking
              ? 'talking'
              : canFinish
                ? 'cheer'
                : running && task.proof !== 'motion'
                  ? 'sleepy'
                  : 'idle'
          }
          wearing={data.wardrobe.worn}
          label={profile.buddyName}
        />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {startedAt === null ? (
          <Button label={t('task.startTimer')} tone="info" onPress={begin} />
        ) : null}

        <Button
          label={task.proof === 'photo' ? t('task.takeProof') : t('task.iDidIt')}
          tone="success"
          disabled={!canFinish}
          onPress={finish}
        />

        {!canFinish ? (
          <Txt variant="tiny" center color={colors.textFaint}>
            {motionLeft
              ? t('task.finishMotion')
              : stepsLeft > 0
                ? t('task.tickSteps')
                : t('task.answerFirst')}
          </Txt>
        ) : null}

        <Button label={t('task.notNow')} tone="ghost" size="md" onPress={() => setSwapOpen(true)} />
      </View>

      <SwapSheet
        open={swapOpen}
        buddy={profile.buddyName}
        onClose={() => setSwapOpen(false)}
        onPick={swap}
      />
    </Screen>
  );
}

/* -------------------------------------------------------------- components */

function StepRow({
  index,
  text,
  done,
  onPress,
}: {
  index: number;
  text: string;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={onPress}>
      <Sticker
        background={done ? colors.success : colors.surface}
        offset={done ? 3 : 4}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.pill,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            backgroundColor: done ? colors.surface : colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="tiny">{done ? '✓' : index}</Txt>
        </View>
        <Txt
          variant="bodyStrong"
          color={done ? colors.surface : colors.text}
          style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }}
        >
          {text}
        </Txt>
      </Sticker>
    </Pressable>
  );
}

/**
 * One answer to the closing question.
 *
 * Nothing is marked right or wrong: the question exists to show that the child
 * was in the room while the mission happened, not to grade them on it.
 */
function AnswerRow({
  text,
  picked,
  onPress,
}: {
  text: string;
  picked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: picked }} onPress={onPress}>
      <Sticker
        background={picked ? colors.accent : colors.surface}
        offset={picked ? 3 : 4}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: radii.pill,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            backgroundColor: picked ? colors.surface : colors.surfaceAlt,
          }}
        />
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {text}
        </Txt>
      </Sticker>
    </Pressable>
  );
}

function SwapSheet({
  open,
  buddy,
  onClose,
  onPick,
}: {
  open: boolean;
  buddy: string;
  onClose: () => void;
  onPick: (reason: SkipReason) => void;
}) {
  const { t } = useI18n();
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#2A211899' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: spacing.xl }}>
          <Pressable>
            <Sticker background={colors.surface} style={{ padding: spacing.xl, gap: spacing.md }}>
              <Txt variant="heading">{t('task.swapTitle')}</Txt>
              <Txt variant="body" color={colors.textSoft}>
                {t('task.swapBody', { buddy })}
              </Txt>
              <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                <Button label={t('task.swapReasonHard')} tone="neutral" size="md" onPress={() => onPick('hard')} />
                <Button label={t('task.swapReasonBoring')} tone="neutral" size="md" onPress={() => onPick('boring')} />
                <Button label={t('task.swapReasonCantNow')} tone="neutral" size="md" onPress={() => onPick('cantNow')} />
              </View>
              <Button label={t('common.cancel')} tone="ghost" size="md" onPress={onClose} />
            </Sticker>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function TimerRing({
  remaining,
  fraction,
  idle,
}: {
  remaining: number;
  fraction: number;
  idle: boolean;
}) {
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View
      style={{
        width: 168,
        height: 168,
        borderRadius: 84,
        borderWidth: 6,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${Math.round(fraction * 100)}%`,
          backgroundColor: idle ? colors.surfaceAlt : colors.info,
          opacity: 0.5,
        }}
      />
      <Txt variant="display">
        {minutes}:{String(seconds).padStart(2, '0')}
      </Txt>
    </View>
  );
}
