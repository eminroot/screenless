import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

import { Buddy } from '../../components/buddy/Buddy';
import { objectEmoji } from '../../data/room-objects';
import { currentContext } from '../../engine/context';
import { learnFromMissions } from '../../engine/learning';
import { pickTask } from '../../engine/task-engine';
import { useI18n } from '../../i18n';
import { useRepCounter } from '../../lib/motion';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import type { MotionSpec, SkipReason } from '../../state/types';
import { Bubble } from '../components/Bubble';
import { ClayButton, ClayCard, ClayIconButton, StatPill } from '../components/Clay';
import { LText } from '../components/LText';
import { Meter } from '../components/Meter';
import { Sky } from '../components/Sky';
import { CheckIcon, CloseIcon, FaceIcon, PlayIcon, StarIcon } from '../icons';
import { useLiveMotion, useOscillator, usePress } from '../motion';
import { ink, lip, MAX_COLUMN, motionLittle, round, space, tones } from '../theme';

/**
 * Doing a mission, for ages 3 to 5.
 *
 * Laid out like a lesson rather than like a document: a way out in the top
 * left, a bar across the top that fills as the child ticks things off, and the
 * buddy telling them what to do in a bubble they can have read aloud. The
 * finish button is the only green thing on the screen and it stays dim until
 * the mission really is done, so pressing it always means something.
 *
 * The timer is a ring the buddy sits inside. While it runs the screen says to
 * put the phone down, which is the entire point of the app: the reward comes
 * back through the screen, the doing does not happen on it.
 */
export function LittleMission() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, claimMission, skipMission, assignMission, startMission } = useApp();

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

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
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

  const leave = useCallback(() => {
    narrator.stop();
    router.replace('/(tabs)');
  }, [narrator, router]);

  if (!activeMission || !profile || !task) return null;

  const remaining = Math.max(0, total - elapsed);
  const finished = startedAt !== null && remaining === 0;
  const running = startedAt !== null && !finished;

  // Counted from the steps rather than from `ticked`, which is empty on the
  // first render: counting the unticked entries of an empty list says nothing
  // is left to do, which flashed a full bar and an enabled finish button for
  // one frame on every mission.
  const stepsLeft = steps.length - ticked.filter(Boolean).length;
  const motionLeft =
    task.proof === 'motion' && task.motion && !motionBlocked ? motionReps < task.motion.count : false;
  // The closing question is one tap and no answer is wrong, so requiring it
  // costs a child nothing and is the only thing standing between "I did it"
  // and a button pressed from the sofa.
  const askLeft = task.check ? answer === null : false;
  const canFinish = stepsLeft === 0 && !motionLeft && !askLeft;

  // The top bar fills with whatever the child is actually being asked to do:
  // the steps when there are steps, the clock when the mission is just time.
  const barValue =
    steps.length > 0
      ? (steps.length - stepsLeft) / steps.length
      : startedAt === null
        ? 0
        : 1 - remaining / total;

  const swap = (reason: SkipReason) => {
    narrator.stop();
    skipMission(activeMission.id, reason);
    assignMission(
      pickTask(profile, data.missions, {
        favourVariety: true,
        exclude: [task.id],
        context: currentContext(),
        learned: learnFromMissions(data.missions, data.ideaVotes),
        allowDuo: data.settings.duoEnabled,
      }),
    );
    setSwapOpen(false);
  };

  const spoken = `${pick(task.title)}. ${pick(task.body)}`;

  /* ------------------------------------------------------- parent hand off */
  if (showBrief) {
    return (
      <Frame insets={insets.top} onClose={leave} bar={null}>
        <ClayCard tone="sky" style={{ padding: space.lg, gap: space.xs }}>
          <LText variant="tiny" color={tones.sky.ink}>
            {t('duo.forParent')}
          </LText>
          <LText variant="heading" color={tones.sky.ink}>
            {t('duo.handOver', { name: profile.nickname })}
          </LText>
        </ClayCard>

        <View style={{ alignItems: 'center', marginTop: space.lg }}>
          <Buddy id={profile.buddyId} size={140} mood="happy" />
        </View>

        <Bubble text={t('duo.buddyLine')} tail="none" style={{ marginTop: space.md }} />

        <ClayCard style={{ padding: space.lg, gap: space.sm, marginTop: space.lg }}>
          <LText variant="heading">{pick(task.title)}</LText>
          <LText variant="body">{pick(task.body)}</LText>
          {task.parentBrief ? (
            <View style={{ backgroundColor: tones.white.soft, borderRadius: round.md, padding: space.md }}>
              <LText variant="tiny" color={ink.soft}>
                {t('duo.whatToDo')}
              </LText>
              <LText variant="small">{pick(task.parentBrief)}</LText>
            </View>
          ) : null}
        </ClayCard>

        <View style={{ gap: space.md, marginTop: space.xl }}>
          <ClayButton label={t('duo.ready')} tone="mint" size="xl" onPress={() => setBriefRead(true)} />
          <ClayButton label={t('duo.notNow')} tone="white" size="md" onPress={() => setSwapOpen(true)} />
        </View>

        <SwapSheet open={swapOpen} buddy={profile.buddyName} onClose={() => setSwapOpen(false)} onPick={swap} />
      </Frame>
    );
  }

  /* --------------------------------------------------------------- mission */
  return (
    <Frame
      insets={insets.top}
      onClose={leave}
      bar={
        <>
          <Meter value={barValue} tone="sun" height={22} style={{ flex: 1 }} />
          <StatPill
            icon={<StarIcon size={24} />}
            value={task.stars}
            tone="sun"
            accessibilityLabel={t('common.starsCount', { count: task.stars })}
          />
        </>
      }
    >
      {/* ----------------------------------------------- what the buddy says */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
        <ClayCard
          tone="white"
          radius={round.md}
          depth={lip.md}
          style={{ padding: space.sm, alignItems: 'center' }}
        >
          <Buddy
            id={profile.buddyId}
            size={86}
            mood={narrator.speaking ? 'talking' : canFinish ? 'cheer' : running ? 'sleepy' : 'idle'}
            wearing={data.wardrobe.worn}
          />
        </ClayCard>
        <Bubble
          text={pick(task.body)}
          tail="left"
          style={{ flex: 1 }}
          onSpeak={data.settings.voiceEnabled ? () => say(spoken) : undefined}
        />
      </View>

      {/* --------------------------------------------------------- the title */}
      <ClayCard tone="white" style={{ padding: space.lg, marginTop: space.lg, gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: round.md,
              backgroundColor: tones.sun.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LText variant="title">{task.emoji}</LText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <LText variant="heading" numberOfLines={3}>
              {pick(task.title)}
            </LText>
            <LText variant="small" color={ink.soft}>
              {t('task.howLong', { count: task.minutes })}
            </LText>
          </View>
        </View>

        {task.objects && task.objects.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: space.xs }}>
            {task.objects.map((object) => (
              <LText key={object} variant="heading">
                {objectEmoji(object)}
              </LText>
            ))}
          </View>
        ) : null}
      </ClayCard>

      {/* ---------------------------------------------------------- the steps */}
      {steps.length > 0 ? (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <LText variant="label" color={ink.soft}>
            {stepsLeft > 0 ? t('task.stepsLeft', { count: stepsLeft }) : t('task.allSteps')}
          </LText>
          {steps.map((step, index) => (
            <StepChip
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
        <View style={{ marginTop: space.lg }}>
          {/* Keyed so a swapped mission starts its count from zero. */}
          <RepCounter
            key={activeMission.id}
            spec={task.motion}
            running={running}
            onComplete={setMotionReps}
            onUnsupported={() => setMotionBlocked(true)}
          />
        </View>
      ) : null}

      {/* ---------------------------------------------------------- the clock */}
      <View style={{ alignItems: 'center', marginTop: space.xl, gap: space.md }}>
        <TimerRing remaining={remaining} fraction={startedAt === null ? 0 : 1 - remaining / total} idle={startedAt === null} />

        {running ? (
          <ClayCard tone="sky" radius={round.pill} style={{ paddingVertical: space.md, paddingHorizontal: space.xl }}>
            <LText variant="label" color={tones.sky.ink} center>
              {t('task.putDown')}
            </LText>
          </ClayCard>
        ) : finished ? (
          <LText variant="heading" color={tones.mint.face}>
            {t('task.timerDone')}
          </LText>
        ) : null}
      </View>

      {/* ------------------------------------------------- the closing question */}
      {task.check ? (
        <AskCard
          // Keyed so a swapped mission never shows the previous answer.
          key={activeMission.id}
          question={pick(task.check.question)}
          options={task.check.options.map((option) => pick(option))}
          picked={answer}
          onPick={(index) => {
            void Haptics.selectionAsync();
            setAnswer(index);
          }}
          onSpeak={data.settings.voiceEnabled ? (text) => say(text) : undefined}
        />
      ) : null}

      {/* --------------------------------------------------------- finishing */}
      <View style={{ marginTop: space.xl, gap: space.md }}>
        {startedAt === null ? (
          <ClayButton
            label={t('task.startTimer')}
            tone="sky"
            size="lg"
            icon={<PlayIcon size={26} color={tones.sky.ink} />}
            onPress={() => {
              setStartedAt(Date.now());
              startMission(activeMission.id);
            }}
          />
        ) : null}

        <ClayButton
          label={task.proof === 'photo' ? t('task.takeProof') : t('task.iDidIt')}
          tone="mint"
          size="xl"
          icon={<CheckIcon size={28} color={tones.mint.ink} />}
          disabled={!canFinish}
          onPress={finish}
        />

        {!canFinish ? (
          <LText variant="small" center color={ink.soft}>
            {motionLeft
              ? t('task.finishMotion')
              : stepsLeft > 0
                ? t('task.tickSteps')
                : t('task.answerFirst')}
          </LText>
        ) : null}

        <ClayButton label={t('task.notNow')} tone="white" size="md" onPress={() => setSwapOpen(true)} />
      </View>

      <SwapSheet open={swapOpen} buddy={profile.buddyName} onClose={() => setSwapOpen(false)} onPick={swap} />
    </Frame>
  );
}

/* -------------------------------------------------------------- components */

/**
 * The lesson frame: a way out on the left, the bar across the top, and the
 * page under it. The top row never scrolls away, so the exit is always in the
 * same place no matter how long the mission is.
 */
function Frame({
  children,
  insets,
  onClose,
  bar,
}: {
  children: React.ReactNode;
  insets: number;
  onClose: () => void;
  bar: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1 }}>
      <Sky />

      <View
        style={{
          paddingTop: insets + space.sm,
          paddingHorizontal: space.lg,
          paddingBottom: space.sm,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: MAX_COLUMN,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
          }}
        >
          <ClayIconButton icon={<CloseIcon size={24} />} size={46} accessibilityLabel={t('common.close')} onPress={onClose} />
          {bar}
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: space.lg,
          paddingTop: space.sm,
          paddingBottom: space.xxl * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}>{children}</View>
      </Animated.ScrollView>
    </View>
  );
}

/** One step, as a fat chip that turns green and ticks itself off. */
function StepChip({
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
  const depth = lip.md;
  const { onPressIn, onPressOut, face } = usePress(depth);
  const palette = done ? tones.mint : tones.white;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={text}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <View style={{ paddingBottom: depth }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: depth,
            bottom: 0,
            borderRadius: round.md,
            backgroundColor: palette.lip,
          }}
        />
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.md,
              borderRadius: round.md,
              backgroundColor: palette.face,
            },
            face,
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: done ? 'rgba(255,255,255,0.3)' : tones.sun.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {done ? <CheckIcon size={24} color="#FFFFFF" /> : <LText variant="label">{index}</LText>}
          </View>
          <LText variant="body" color={done ? palette.ink : ink.text} style={{ flex: 1 }}>
            {text}
          </LText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * The one question at the end.
 *
 * It exists for the missions a camera cannot photograph and a sensor cannot
 * count: which cushion was softer, who was in the story. Nothing here is
 * marked. Every answer is the same size and the same colour until it is
 * picked, because a three year old reads a highlighted option as the right
 * one and will simply choose it.
 *
 * The question is read aloud on a tap, like everything else in this tier,
 * since nobody here can read it.
 */
function AskCard({
  question,
  options,
  picked,
  onPick,
  onSpeak,
}: {
  question: string;
  options: string[];
  picked: number | null;
  onPick: (index: number) => void;
  onSpeak?: (text: string) => void;
}) {
  return (
    // Laid straight onto the sky rather than inside a card, the way the steps
    // are. An unpicked answer is white, and white on a white card is the same
    // invisible control the meter used to be.
    <View style={{ marginTop: space.xl, gap: space.md }}>
      <Pressable
        accessibilityRole={onSpeak ? 'button' : 'header'}
        accessibilityLabel={question}
        disabled={!onSpeak}
        onPress={() => onSpeak?.([question, ...options].join('. '))}
      >
        <LText variant="heading">{question}</LText>
      </Pressable>

      <View style={{ gap: space.sm }}>
        {options.map((option, index) => (
          <AnswerChip
            key={index}
            text={option}
            picked={picked === index}
            onPress={() => {
              onPick(index);
              onSpeak?.(option);
            }}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Pulls a leading emoji off an answer so it can be drawn big in the disc
 * rather than sitting small inside the sentence.
 *
 * The feelings missions are the reason: "pick the face that matches today" is
 * only a real choice for someone who cannot read if the faces are the size of
 * a thumb. Tested by code point rather than by a unicode property regex, which
 * is both safe on every engine and easily good enough — every Latin, Turkish
 * and Azerbaijani letter sits far below this line, and every emoji far above.
 */
const FIRST_PICTOGRAPH = 0x2190;

function splitIcon(text: string): { icon: string | null; label: string } {
  const first = [...text][0];
  if (!first) return { icon: null, label: text };
  if ((first.codePointAt(0) ?? 0) < FIRST_PICTOGRAPH) return { icon: null, label: text };
  return { icon: first, label: text.slice(first.length).trim() };
}

/** One answer. Flat until it is chosen, then it fills in and ticks. */
function AnswerChip({
  text,
  picked,
  onPress,
}: {
  text: string;
  picked: boolean;
  onPress: () => void;
}) {
  const depth = lip.md;
  const { onPressIn, onPressOut, face } = usePress(depth);
  const palette = picked ? tones.grape : tones.white;
  const { icon, label } = splitIcon(text);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: picked }}
      accessibilityLabel={text}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      <View style={{ paddingBottom: depth }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: depth,
            bottom: 0,
            borderRadius: round.pill,
            backgroundColor: palette.lip,
          }}
        />
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingVertical: space.md,
              paddingHorizontal: space.lg,
              borderRadius: round.pill,
              backgroundColor: palette.face,
            },
            face,
          ]}
        >
          <View
            style={{
              // A face is the answer on the feelings missions, so it gets a
              // bigger disc than a plain radio needs.
              width: icon ? 42 : 34,
              height: icon ? 42 : 34,
              borderRadius: icon ? 21 : 17,
              backgroundColor: picked ? 'rgba(255,255,255,0.3)' : tones.grape.soft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {picked ? (
              <CheckIcon size={icon ? 26 : 22} color="#FFFFFF" />
            ) : icon ? (
              <LText variant="heading">{icon}</LText>
            ) : null}
          </View>
          <LText variant="body" color={picked ? palette.ink : ink.text} style={{ flex: 1 }}>
            {label}
          </LText>
        </Animated.View>
      </View>
    </Pressable>
  );
}

/**
 * The phone counting the movement for itself, in the 3-5 style.
 *
 * A number that only goes up when the child actually moves is the difference
 * between a mission and a button, so while it runs it is the loudest thing on
 * the screen.
 */
function RepCounter({
  spec,
  running,
  onComplete,
  onUnsupported,
}: {
  spec: MotionSpec;
  running: boolean;
  onComplete: (reps: number) => void;
  onUnsupported: () => void;
}) {
  const { t } = useI18n();
  const { reps, intensity, supported } = useRepCounter(spec.kind, spec.count, running);
  const announced = useRef(false);
  const lastRep = useRef(0);

  useEffect(() => {
    if (!supported) onUnsupported();
  }, [supported, onUnsupported]);

  useEffect(() => {
    if (reps > lastRep.current) {
      lastRep.current = reps;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [reps]);

  useEffect(() => {
    if (reps >= spec.count && !announced.current) {
      announced.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(reps);
    }
  }, [reps, spec.count, onComplete]);

  const done = reps >= spec.count;
  const labelKey = spec.kind === 'jump' ? 'motion.jump' : spec.kind === 'shake' ? 'motion.shake' : 'motion.spin';

  if (!supported) {
    return (
      <ClayCard style={{ padding: space.lg }}>
        <LText variant="small" color={ink.soft}>
          {t('motion.noSensor')}
        </LText>
      </ClayCard>
    );
  }

  return (
    <ClayCard tone={done ? 'mint' : 'white'} style={{ padding: space.lg, gap: space.md, alignItems: 'center' }}>
      <LText variant="label" color={done ? tones.mint.ink : ink.soft}>
        {t(labelKey)}
      </LText>

      <View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: done ? 'rgba(255,255,255,0.25)' : tones.sun.soft,
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
            height: `${Math.round(Math.min(1, reps / spec.count) * 100)}%`,
            backgroundColor: tones.sun.face,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: tones.coral.glow,
            opacity: running && !done ? intensity * 0.4 : 0,
          }}
        />
        <LText variant="giant" color={done ? tones.mint.ink : ink.text}>
          {reps}
        </LText>
        <LText variant="tiny" color={done ? tones.mint.ink : ink.soft}>
          {t('motion.outOf', { count: spec.count })}
        </LText>
      </View>

      {!running && !done ? (
        <LText variant="small" color={ink.soft}>
          {t('motion.pressStart')}
        </LText>
      ) : null}
      {done ? (
        <LText variant="heading" color={tones.mint.ink}>
          {t('motion.done')}
        </LText>
      ) : null}
    </ClayCard>
  );
}

/** The clock, as a ring that closes up. Counts down, so emptier means nearly done. */
const RING = 176;
const STROKE = 16;

function TimerRing({ remaining, fraction, idle }: { remaining: number; fraction: number; idle: boolean }) {
  const live = useLiveMotion();
  const pulse = useOscillator(1600, live && !idle);
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const swept = Math.max(0, Math.min(1, fraction));

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const halo = useAnimatedStyle(() => ({ opacity: idle ? 0 : 0.18 + pulse.value * 0.18 }));

  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: RING + 18,
            height: RING + 18,
            borderRadius: (RING + 18) / 2,
            backgroundColor: tones.sky.glow,
          },
          halo,
        ]}
      />
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke="#FFFFFF" strokeWidth={STROKE} fill="rgba(255,255,255,0.72)" />
        {/* Drawn only once there is something to draw: a round cap on a zero
            length arc leaves a dot sitting at twelve o'clock. */}
        {swept > 0 ? (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={radius}
            stroke={tones.sky.face}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * swept} ${circumference}`}
            // Starts the sweep at the top rather than at three o'clock.
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        ) : null}
      </Svg>
      <LText variant="hero">
        {minutes}:{String(seconds).padStart(2, '0')}
      </LText>
    </View>
  );
}

/**
 * Why not this one. Three faces rather than three sentences, because the
 * answer is what teaches the app which missions to stop offering and a child
 * who cannot read can still point at a face.
 */
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
  const reasons: { reason: SkipReason; mood: 'hard' | 'bored' | 'later'; label: string }[] = [
    { reason: 'hard', mood: 'hard', label: t('task.swapReasonHard') },
    { reason: 'boring', mood: 'bored', label: t('task.swapReasonBoring') },
    { reason: 'cantNow', mood: 'later', label: t('task.swapReasonCantNow') },
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(24,40,16,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: space.lg }}>
          <Pressable>
            <Animated.View entering={FadeInUp.springify().damping(16)}>
              <ClayCard
                wrapperStyle={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}
                style={{ padding: space.xl, gap: space.md }}
              >
                <LText variant="title" center>
                  {t('task.swapTitle')}
                </LText>
                <LText variant="body" color={ink.soft} center>
                  {t('task.swapBody', { buddy })}
                </LText>

                <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
                  {reasons.map((item) => (
                    <ReasonFace key={item.reason} mood={item.mood} label={item.label} onPress={() => onPick(item.reason)} />
                  ))}
                </View>

                <ClayButton label={t('common.cancel')} tone="white" size="md" onPress={onClose} />
              </ClayCard>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function ReasonFace({
  mood,
  label,
  onPress,
}: {
  mood: 'hard' | 'bored' | 'later';
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: motionLittle.pressIn });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motionLittle.spring);
      }}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[{ alignItems: 'center', gap: space.xs }, style]}>
        <FaceIcon size={72} mood={mood} />
        <LText variant="tiny" center numberOfLines={2}>
          {label}
        </LText>
      </Animated.View>
    </Pressable>
  );
}
