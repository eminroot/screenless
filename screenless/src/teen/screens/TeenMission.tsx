import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { objectEmoji } from '../../data/room-objects';
import { currentContext } from '../../engine/context';
import { learnFromMissions } from '../../engine/learning';
import { pickTask } from '../../engine/task-engine';
import { findCheck, hasCheck, photoWanted } from '../../engine/verify';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useRepCounter } from '../../lib/motion';
import { jumpsLookOdd, stepsLookOdd } from '../../lib/motion-analysis';
import { useStepCounter } from '../../lib/pedometer';
import { useMovingTime, usePutDown } from '../../lib/verify-sensors';
import { useNarrator } from '../../lib/voice';
import { useApp, type MissionEvidence } from '../../state/app-state';
import type { Mission, MotionSpec, SkipReason, TaskContent } from '../../state/types';
import { BuddyNote } from '../components/BuddyNote';
import { Button, CountPill, IconButton } from '../components/Button';
import { Bar } from '../components/Stat';
import { Label, Panel, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import {
  BackIcon,
  CheckIcon,
  ChevronIcon,
  CloseIcon,
  StarIcon,
} from '../icons';
import { border, MAX_COLUMN, radius, space } from '../theme';
import { useSkin } from '../skin';
import { ChoiceCard, CountCard, GrownupCard, PickCard } from '../verify/Answers';
import { FocusCard, FocusOverlay } from '../verify/Focus';
import { MoveCard, MoveOverlay } from '../verify/Move';
import { NoteCard } from '../verify/Note';

const CATEGORY_KEYS: Record<TaskContent['category'], TKey> = {
  move: 'task.categoryMove',
  outdoor: 'task.categoryOutdoor',
  create: 'task.categoryCreate',
  social: 'task.categorySocial',
  calm: 'task.categoryCalm',
};

/**
 * Doing a challenge, for ages 10 to 13.
 *
 * Laid out as a list of things to tick with the clock and the count as
 * sections under it, the way any workout app lays out a session. The word
 * "mission" is gone from this tier — a twelve year old is not on a mission,
 * they are doing a thing they agreed to do.
 *
 * The finish button stays dim until the checklist is actually clear, and it is
 * the only filled control on the screen.
 *
 * Nothing here waits for a parent. What the phone could measure it measures,
 * and what it could not it records as standing on the child's word; the log is
 * what a parent reads afterwards. Constant approval at this age is the fastest
 * way to make an app feel like surveillance, and a teenager who feels watched
 * stops telling you anything true.
 */
export function TeenMission() {
  const { activeMission } = useApp();
  // Keyed by challenge, so a swap resets every counter and sensor. The last id
  // is kept when the active one clears, or finishing remounts mid-navigation.
  const lastId = useRef<string | null>(null);
  if (activeMission) lastId.current = activeMission.id;
  return <ChallengeRunner key={lastId.current ?? 'none'} />;
}

/** A clock from an earlier visit is only resumed if it is this recent. */
const RESUME_WINDOW_MS = 3 * 60 * 60 * 1000;

function resumedStart(mission: Mission | null): number | null {
  const at = mission?.startedAt ? Date.parse(mission.startedAt) : NaN;
  return Number.isFinite(at) && Date.now() - at < RESUME_WINDOW_MS ? at : null;
}

function ChallengeRunner() {
  const { palette, ink, accents } = useSkin();
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const {
    profile,
    data,
    activeMission,
    skipMission,
    assignMission,
    startMission,
    saveEvidence,
    submitMission,
    setWeekGoal,
  } = useApp();

  const [startedAt, setStartedAt] = useState<number | null>(() => resumedStart(activeMission));
  const [elapsed, setElapsed] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>(() =>
    (activeMission?.task.steps ?? []).map(() => false),
  );
  const [motionReps, setMotionReps] = useState(0);

  // What they answer, wrote and found, restored from the record so leaving the
  // screen and coming back does not throw it away.
  const [answer, setAnswer] = useState<number | undefined>(activeMission?.checkAnswer);
  const [countValue, setCountValue] = useState<number | undefined>(
    typeof activeMission?.answerValue === 'number' ? activeMission.answerValue : undefined,
  );
  const [picked, setPicked] = useState<number[]>(activeMission?.picked ?? []);
  const [note, setNote] = useState(activeMission?.note ?? '');
  const [grownupAt, setGrownupAt] = useState(activeMission?.grownupAt);
  const [counting, setCounting] = useState(false);
  /** Set when the phone cannot count movement, so the challenge is still finishable. */
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

  const checks = useMemo(() => {
    if (!task) return null;
    return {
      clock: findCheck(task, 'clock'),
      away: findCheck(task, 'away'),
      steps: findCheck(task, 'steps'),
      active: findCheck(task, 'active'),
      photo: hasCheck(task, 'photo'),
      grownup: hasCheck(task, 'grownup'),
      note: hasCheck(task, 'note'),
    };
  }, [task]);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
  const { say } = narrator;

  const putDown = usePutDown(
    Boolean(checks?.away) && startedAt !== null && !counting,
    activeMission?.awaySec ?? 0,
  );
  const stepCount = useStepCounter(counting && Boolean(checks?.steps));
  const moving = useMovingTime(counting && Boolean(checks?.active));
  const jumpTimes = useRef<number[]>([]);
  const missionId = activeMission?.id;

  // Face-down time is written down each time the phone is picked up, so a trip
  // out of the challenge and back keeps it.
  const wasParked = useRef(false);
  useEffect(() => {
    if (wasParked.current && !putDown.parked && missionId) {
      saveEvidence(missionId, { awaySec: putDown.seconds, awaySensor: true });
    }
    wasParked.current = putDown.parked;
  }, [putDown.parked, putDown.seconds, missionId, saveEvidence]);

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

  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeMission && settled && !leaving.current) router.replace('/(tabs)');
  }, [activeMission, settled, router]);

  const duo = task?.mode === 'duo';
  const showBrief = duo && !briefRead;

  // Nothing is read out unprompted at this age. The speaker button is there for
  // anyone who wants it, but an app that starts talking on the bus is an app
  // that gets deleted.
  const spoken = task ? `${pick(task.title)}. ${pick(task.body)}` : '';

  const finish = useCallback(() => {
    if (!activeMission || !task || !checks) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    narrator.stop();
    leaving.current = true;

    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    const motionOdd =
      (checks.steps ? stepsLookOdd(stepCount.shakes) : false) ||
      (checks.active ? moving.looksOdd() : false) ||
      (task.proof === 'motion' && task.motion?.kind === 'jump' ? jumpsLookOdd(jumpTimes.current) : false);

    const evidence: MissionEvidence = {
      durationSec: seconds,
      motionReps: task.proof === 'motion' ? motionReps : undefined,
      motionOdd,
      checkAnswer: answer,
      answerValue: task.answer?.kind === 'count' ? countValue : undefined,
      picked: task.pick ? picked : undefined,
      note: task.note ? note.trim() : undefined,
      awaySec: checks.away ? putDown.seconds : undefined,
      awaySensor: checks.away ? putDown.supported !== false : undefined,
      steps: checks.steps ? stepCount.steps : undefined,
      activeSec: checks.active ? moving.seconds : undefined,
      grownupAt,
    };

    // A target they set for themselves is theirs to keep, not the challenge's.
    if (task.tool === 'weekGoal' && typeof countValue === 'number') setWeekGoal(countValue);

    if (photoWanted(task, { ...activeMission, ...evidence })) {
      saveEvidence(activeMission.id, evidence);
      router.replace({
        pathname: '/proof',
        params: { id: activeMission.id, seconds: seconds ? String(seconds) : '' },
      });
      return;
    }

    const result = submitMission(activeMission.id, evidence);
    if (result.approved) {
      const { completion } = result;
      router.replace({
        pathname: '/celebrate',
        params: {
          id: activeMission.id,
          stars: String(task.stars),
          coins: completion.coins ? String(completion.coins) : '',
          level: completion.leveledUpTo ? String(completion.leveledUpTo) : '',
          rewards: completion.newRewards.join(','),
          prizes: completion.reachedRewards.map((r) => r.id).join(','),
          checked: result.by,
        },
      });
      return;
    }
    router.replace({ pathname: '/confirm', params: { id: activeMission.id } });
  }, [
    activeMission,
    answer,
    checks,
    countValue,
    grownupAt,
    motionReps,
    moving,
    narrator,
    note,
    picked,
    putDown.seconds,
    putDown.supported,
    router,
    saveEvidence,
    setWeekGoal,
    startedAt,
    stepCount.shakes,
    stepCount.steps,
    submitMission,
    task,
  ]);

  const leave = useCallback(() => {
    narrator.stop();
    if (activeMission && checks?.away && putDown.seconds > 0) {
      saveEvidence(activeMission.id, {
        awaySec: putDown.seconds,
        awaySensor: putDown.supported !== false,
      });
    }
    router.replace('/(tabs)');
  }, [activeMission, checks?.away, narrator, putDown.seconds, putDown.supported, router, saveEvidence]);

  /** The clock starts the first time they do something that counts. */
  const ensureStarted = useCallback(() => {
    if (!activeMission || startedAt !== null) return;
    setStartedAt(Date.now());
    startMission(activeMission.id);
  }, [activeMission, startMission, startedAt]);

  const onRepsDone = useCallback((reps: number, times: number[]) => {
    setMotionReps(reps);
    jumpTimes.current = times;
  }, []);

  if (!activeMission || !profile || !task || !checks) return null;

  const remaining = Math.max(0, total - elapsed);
  const finished = startedAt !== null && remaining === 0;
  const running = startedAt !== null && !finished;

  // Counted from the steps rather than from `ticked`, which is empty on the
  // first render: counting the unticked entries of an empty list says nothing
  // is left to do, which would flash a full bar and an enabled finish button.
  const done = ticked.filter(Boolean).length;
  const stepsLeft = steps.length - done;
  const motionLeft =
    task.proof === 'motion' && task.motion && !motionBlocked ? motionReps < task.motion.count : false;

  const countTarget = checks.steps ? checks.steps.count : checks.active ? checks.active.minutes * 60 : 0;
  const countValueNow = checks.steps ? stepCount.steps : checks.active ? moving.seconds : 0;
  const countSupported = checks.steps ? stepCount.supported : checks.active ? moving.supported : true;
  const countLeft = countTarget > 0 && countSupported !== false && countValueNow < countTarget;

  const pickLeft = Boolean(task.pick) && picked.length === 0;
  const answerLeft =
    (Boolean(task.check) && answer === undefined) ||
    (task.answer?.kind === 'count' && countValue === undefined);
  const noteLeft = Boolean(task.note) && note.trim().length < (task.note?.minChars ?? 12);

  const canFinish = stepsLeft === 0 && !motionLeft && !countLeft && !pickLeft && !answerLeft && !noteLeft;

  const hint = stepsLeft > 0
    ? t('teen.tickAll')
    : motionLeft
      ? t('task.finishMotion')
      : countLeft
        ? t('verify.countKeepGoing')
        : noteLeft
          ? t('teenVerify.finishNote')
          : pickLeft
            ? t('verify.finishPick')
            : t('verify.finishAnswer');

  const parts: number[] = [];
  if (steps.length > 0) parts.push(done / steps.length);
  if (task.proof === 'motion' && task.motion) parts.push(Math.min(1, motionReps / task.motion.count));
  if (countTarget > 0) parts.push(Math.min(1, countValueNow / countTarget));
  if (task.pick) parts.push(pickLeft ? 0 : 1);
  if (task.check || task.answer) parts.push(answerLeft ? 0 : 1);
  if (task.note) parts.push(noteLeft ? 0 : 1);

  const barValue =
    parts.length > 0
      ? parts.reduce((sum, part) => sum + part, 0) / parts.length
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
        badgesReady: Boolean(data.badges),
      }),
    );
    setSwapOpen(false);
  };

  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <IconButton
        icon={<BackIcon size={18} />}
        kind="outline"
        size={40}
        accessibilityLabel={t('common.back')}
        onPress={leave}
      />
      <Bar value={barValue} style={{ flex: 1 }} />
      <CountPill
        icon={<StarIcon size={14} color={accents.amber.bright} />}
        value={task.stars}
        accent="amber"
        accessibilityLabel={t('common.starsCount', { count: task.stars })}
      />
    </View>
  );

  /* ------------------------------------------------------- parent hand off */
  if (showBrief) {
    return (
      <TScreen header={header}>
        <Panel accent="sky">
          <TText variant="label" color={accents.sky.bright}>
            {t('duo.forParent')}
          </TText>
          <TText variant="title" style={{ marginTop: space.xs }}>
            {t('duo.handOver', { name: profile.nickname })}
          </TText>
        </Panel>

        <Panel style={{ marginTop: space.lg }}>
          <TText variant="title">{pick(task.title)}</TText>
          <TText variant="body" color={ink.body} style={{ marginTop: space.sm }}>
            {pick(task.body)}
          </TText>
          {task.parentBrief ? (
            <View
              style={{
                backgroundColor: palette.sunken,
                borderRadius: radius.chip,
                padding: space.md,
                marginTop: space.md,
                gap: 3,
              }}
            >
              <TText variant="label">{t('duo.whatToDo')}</TText>
              <TText variant="body" color={ink.body}>
                {pick(task.parentBrief)}
              </TText>
            </View>
          ) : null}
        </Panel>

        <View style={{ gap: space.md, marginTop: space.xxl }}>
          <Button label={t('duo.ready')} onPress={() => setBriefRead(true)} />
          <Button label={t('duo.notNow')} kind="outline" size="md" onPress={() => setSwapOpen(true)} />
        </View>

        <SwapSheet open={swapOpen} onClose={() => setSwapOpen(false)} onPick={swap} />
      </TScreen>
    );
  }

  /* ------------------------------------------------------------- challenge */
  return (
    <TScreen header={header}>
      <TText variant="display" numberOfLines={3}>
        {pick(task.title)}
      </TText>
      <TText variant="label" color={ink.muted} style={{ marginTop: space.sm }}>
        {`${t('task.howLong', { count: task.minutes })} · ${t(CATEGORY_KEYS[task.category])}${
          duo ? ` · ${t('duo.badge')}` : ''
        }`}
      </TText>

      <BuddyNote
        id={profile.buddyId}
        name={profile.buddyName}
        text={pick(task.body)}
        mood={narrator.speaking ? 'talking' : canFinish ? 'cheer' : 'idle'}
        wearing={data.wardrobe.worn}
        speakLabel={t('task.readAloud')}
        tipLabel={t('task.tipTitle')}
        onSpeak={data.settings.voiceEnabled ? () => say(spoken) : undefined}
        onTip={task.tip ? () => setTipOpen((open) => !open) : undefined}
        style={{ marginTop: space.lg }}
      />

      {tipOpen && task.tip ? (
        <Animated.View entering={FadeIn.duration(140)} style={{ marginTop: space.md }}>
          <Panel accent="amber">
            <TText variant="label" color={accents.amber.bright}>
              {t('task.tipTitle')}
            </TText>
            <TText variant="body" color={ink.body} style={{ marginTop: space.xs }}>
              {pick(task.tip)}
            </TText>
          </Panel>
        </Animated.View>
      ) : null}

      {task.objects && task.objects.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          {task.objects.map((object) => (
            <View
              key={object}
              style={{
                width: 38,
                height: 38,
                borderRadius: radius.chip,
                borderWidth: border.hair,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TText variant="bodyStrong">{objectEmoji(object)}</TText>
            </View>
          ))}
        </View>
      ) : null}

      {/* A `first` pick is asked before the challenge rather than after it: the
          regulation strand takes a reading going in and another coming out,
          and two mood questions stacked at the bottom would be neither. */}
      {task.pick?.first ? (
        <View style={{ marginTop: space.xxl }}>
          <PickCard
            spec={task.pick}
            value={picked}
            onChange={(next) => {
              ensureStarted();
              setPicked(next);
            }}
          />
        </View>
      ) : null}

      {/* ---------------------------------------------------------- the steps */}
      {steps.length > 0 ? (
        <View style={{ marginTop: space.xxl }}>
          <Label
            trailing={
              <TText variant="label" color={done === steps.length ? accents.acid.bright : ink.muted}>
                {`${done}/${steps.length}`}
              </TText>
            }
          >
            {t('teen.stepsLabel')}
          </Label>

          <Panel padded={false}>
            {steps.map((step, index) => (
              <View key={index}>
                {index > 0 ? <Rule /> : null}
                <StepRow
                  text={pick(step)}
                  done={ticked[index] ?? false}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setTicked((current) => {
                      const next = [...current];
                      next[index] = !next[index];
                      return next;
                    });
                  }}
                />
              </View>
            ))}
          </Panel>
        </View>
      ) : null}

      {task.proof === 'motion' && task.motion ? (
        <View style={{ marginTop: space.xxl }}>
          <Label>{t('teen.countLabel')}</Label>
          {/* Keyed so a swapped challenge starts its count from zero. */}
          <RepCounter
            key={activeMission.id}
            spec={task.motion}
            running={running}
            onComplete={onRepsDone}
            onUnsupported={() => setMotionBlocked(true)}
          />
        </View>
      ) : null}

      {countTarget > 0 ? (
        <MoveCard
          kind={checks.steps ? 'steps' : 'active'}
          value={countValueNow}
          target={countTarget}
          supported={countSupported}
          onStart={() => {
            ensureStarted();
            setCounting(true);
          }}
        />
      ) : null}

      {/* ---------------------------------------------------------- the clock */}
      <View style={{ marginTop: space.xxl }}>
        <Label>{t('teen.timerLabel')}</Label>
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <View style={{ flex: 1 }}>
              <TText variant="statBig" color={finished ? accents.acid.bright : ink.strong}>
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </TText>
              <TText variant="label" color={ink.muted}>
                {finished ? t('task.timerDone') : running ? t('teen.phoneDown') : t('teen.timerIdle')}
              </TText>
            </View>
            {startedAt === null ? (
              <Button
                label={t('task.startTimer')}
                size="sm"
                full={false}
                kind="outline"
                onPress={ensureStarted}
              />
            ) : null}
          </View>
          {startedAt !== null ? (
            <Bar value={1 - remaining / total} style={{ marginTop: space.lg }} />
          ) : null}
        </Panel>
      </View>

      {checks.away ? (
        <FocusCard
          seconds={putDown.seconds}
          targetMinutes={checks.away.minutes}
          started={startedAt !== null}
          supported={startedAt === null ? null : putDown.supported}
          label={checks.away.minutes >= 15 ? t('teenVerify.focusLabel') : t('teenVerify.awayLabel')}
        />
      ) : null}

      {/* ------------------------------------------------ what they report */}
      {task.note || (task.pick && !task.pick.first) || task.check || task.answer ? (
        <View style={{ marginTop: space.xxl, gap: space.md }}>
          {task.note ? (
            <NoteCard
              spec={task.note}
              value={note}
              onChange={(next) => {
                ensureStarted();
                setNote(next);
              }}
            />
          ) : null}
          {task.pick && !task.pick.first ? (
            <PickCard
              spec={task.pick}
              value={picked}
              onChange={(next) => {
                ensureStarted();
                setPicked(next);
              }}
            />
          ) : null}
          {task.check ? <ChoiceCard check={task.check} value={answer} onChange={setAnswer} /> : null}
          {task.answer?.kind === 'count' ? (
            <CountCard
              spec={task.answer}
              value={countValue}
              onChange={setCountValue}
              step={task.tool === 'weekGoal' ? 10 : 1}
            />
          ) : null}
        </View>
      ) : null}

      {checks.grownup ? (
        <GrownupCard
          done={Boolean(grownupAt)}
          onApproved={() => {
            const at = new Date().toISOString();
            setGrownupAt(at);
            saveEvidence(activeMission.id, { grownupAt: at });
          }}
        />
      ) : null}

      {/* --------------------------------------------------------- finishing */}
      <View style={{ marginTop: space.xxl, gap: space.md }}>
        <Button
          label={task.proof === 'photo' ? t('task.takeProof') : t('teen.markDone')}
          icon={<CheckIcon size={18} color={accents.acid.on} />}
          disabled={!canFinish}
          onPress={finish}
        />
        {!canFinish ? (
          <TText variant="caption" color={ink.muted} center>
            {hint}
          </TText>
        ) : null}
        <Button label={t('teen.swapIt')} kind="ghost" size="md" onPress={() => setSwapOpen(true)} />
      </View>

      <SwapSheet open={swapOpen} onClose={() => setSwapOpen(false)} onPick={swap} />

      <FocusOverlay
        visible={Boolean(checks.away) && putDown.parked && !counting}
        seconds={putDown.seconds}
        targetMinutes={checks.away?.minutes ?? 0}
        onWake={putDown.wake}
      />

      <MoveOverlay
        visible={counting}
        kind={checks.steps ? 'steps' : 'active'}
        value={countValueNow}
        target={countTarget}
        level={checks.steps ? stepCount.intensity : moving.level}
        onStop={() => setCounting(false)}
      />
    </TScreen>
  );
}

/* -------------------------------------------------------------- components */

/** One step. A square box that fills with acid, and the text goes dim. */
function StepRow({ text, done, onPress }: { text: string; done: boolean; onPress: () => void }) {
  const { palette, ink, accents } = useSkin();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={text}
      onPress={onPress}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          minHeight: 56,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: border.strong,
            borderColor: done ? accents.acid.solid : palette.lineBright,
            backgroundColor: done ? accents.acid.solid : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {done ? <CheckIcon size={14} color={accents.acid.on} strokeWidth={2.6} /> : null}
        </View>
        <TText
          variant="body"
          color={done ? ink.muted : ink.strong}
          style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }}
        >
          {text}
        </TText>
      </View>
    </Pressable>
  );
}

/**
 * The phone counting the movement for itself.
 *
 * A number that only goes up when the child actually moves is the difference
 * between a challenge and a button.
 */
function RepCounter({
  spec,
  running,
  onComplete,
  onUnsupported,
}: {
  spec: MotionSpec;
  running: boolean;
  onComplete: (reps: number, times: number[]) => void;
  onUnsupported: () => void;
}) {
  const { ink, accents } = useSkin();
  const { t } = useI18n();
  const { reps, intensity, supported, repTimes } = useRepCounter(spec.kind, spec.count, running);
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
      onComplete(reps, repTimes());
    }
  }, [reps, spec.count, onComplete, repTimes]);

  const done = reps >= spec.count;
  const labelKey: TKey =
    spec.kind === 'jump' ? 'motion.jump' : spec.kind === 'shake' ? 'motion.shake' : 'motion.spin';

  if (!supported) {
    return (
      <Panel>
        <TText variant="body" color={ink.body}>
          {t('motion.noSensor')}
        </TText>
      </Panel>
    );
  }

  return (
    <Panel accent={done ? 'acid' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
        <TText variant="statBig" color={done ? accents.acid.bright : ink.strong}>
          {reps}
        </TText>
        <TText variant="title" color={ink.muted} style={{ paddingBottom: 8 }}>
          {`/ ${spec.count}`}
        </TText>
      </View>
      <TText variant="label" color={ink.muted}>
        {done ? t('motion.done') : running ? t(labelKey) : t('motion.pressStart')}
      </TText>
      <Bar value={Math.min(1, reps / spec.count)} style={{ marginTop: space.md }} />
      {/* A live trace of what the accelerometer is actually feeling. */}
      <View
        style={{
          height: 2,
          marginTop: space.sm,
          borderRadius: 1,
          backgroundColor: accents.acid.solid,
          opacity: running && !done ? Math.min(1, intensity) * 0.8 : 0,
        }}
      />
    </Panel>
  );
}

/**
 * Why not this one. The answer teaches the app which challenges to stop
 * offering, so it is worth asking even though it costs a tap.
 */
function SwapSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (reason: SkipReason) => void;
}) {
  const { palette, ink } = useSkin();
  const { t } = useI18n();
  const reasons: { reason: SkipReason; label: string }[] = [
    { reason: 'hard', label: t('task.swapReasonHard') },
    { reason: 'boring', label: t('task.swapReasonBoring') },
    { reason: 'cantNow', label: t('task.swapReasonCantNow') },
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(3,5,8,0.7)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable>
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: radius.panel,
                borderTopRightRadius: radius.panel,
                borderTopWidth: border.hair,
                borderColor: palette.line,
                paddingTop: space.xl,
                paddingHorizontal: space.lg,
                paddingBottom: space.xxxl,
              }}
            >
              <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <TText variant="title">{t('teen.swapTitle')}</TText>
                    <TText variant="body" color={ink.body} style={{ marginTop: space.xs }}>
                      {t('teen.swapBody')}
                    </TText>
                  </View>
                  <IconButton
                    icon={<CloseIcon size={18} />}
                    kind="outline"
                    size={40}
                    accessibilityLabel={t('common.close')}
                    onPress={onClose}
                  />
                </View>

                <View style={{ marginTop: space.lg }}>
                  {reasons.map((item, index) => (
                    <View key={item.reason}>
                      {index > 0 ? <Rule /> : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        onPress={() => onPick(item.reason)}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: space.md,
                            minHeight: 56,
                          }}
                        >
                          <TText variant="bodyStrong" style={{ flex: 1 }}>
                            {item.label}
                          </TText>
                          <ChevronIcon size={16} />
                        </View>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
