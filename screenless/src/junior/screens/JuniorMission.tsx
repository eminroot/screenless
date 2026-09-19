import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { objectEmoji } from '../../data/room-objects';
import { currentContext } from '../../engine/context';
import { learnFromMissions } from '../../engine/learning';
import { pickTask } from '../../engine/task-engine';
import { findCheck, hasCheck, MAX_SECRET_MISSES, photoWanted, tallyProgress } from '../../engine/verify';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useRepCounter } from '../../lib/motion';
import { jumpsLookOdd, stepsLookOdd } from '../../lib/motion-analysis';
import { useStepCounter } from '../../lib/pedometer';
import { useMovingTime, usePutDown } from '../../lib/verify-sensors';
import { useNarrator } from '../../lib/voice';
import { useApp, type MissionEvidence } from '../../state/app-state';
import type { Mission, MotionSpec, SkipReason, TaskContent } from '../../state/types';
import { BuddyLine } from '../components/BuddyLine';
import { Button, CountPill, IconButton } from '../components/Button';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { LessonBar } from '../components/LessonBar';
import { Bar } from '../components/Stat';
import { Card, Divider, IconTile, Stamp } from '../components/Surface';
import {
  BoltIcon,
  CheckIcon,
  ChevronIcon,
  ClockIcon,
  CloseIcon,
  PartyIcon,
  PlayIcon,
  StarFilledIcon,
} from '../icons';
import { accents, border, ink, MAX_COLUMN, palette, radius, space } from '../theme';
import { ChoiceCard, CountCard, PickCard, SumsCard } from '../verify/Answers';
import { BadgeHuntCard } from '../verify/BadgeHunt';
import { BeforePhotoCard, GrownupCard } from '../verify/Grownup';
import { CountingOverlay, MoveCountCard, WeekGoalCard } from '../verify/MoveCount';
import { ParkedOverlay, PutDownCard } from '../verify/PutDown';
import { SecretCard } from '../verify/SecretObject';

const CATEGORY_KEYS: Record<TaskContent['category'], TKey> = {
  move: 'task.categoryMove',
  outdoor: 'task.categoryOutdoor',
  create: 'task.categoryCreate',
  social: 'task.categorySocial',
  calm: 'task.categoryCalm',
};

/** A clock from an earlier visit is only resumed if it is this recent. */
const RESUME_WINDOW_MS = 3 * 60 * 60 * 1000;

function resumedStart(mission: Mission | null): number | null {
  const at = mission?.startedAt ? Date.parse(mission.startedAt) : NaN;
  return Number.isFinite(at) && Date.now() - at < RESUME_WINDOW_MS ? at : null;
}

/**
 * Doing a mission, for ages 6 to 9.
 *
 * Laid out like an exercise: a way out top left, a bar that fills as the work
 * gets done, and the reward on the right so the child knows what this one is
 * worth before they start. The steps are the screen — tappable rows that turn
 * green, the same shape as the answer options in every quiz app this age has
 * already met.
 *
 * At this age the phone checks the mission itself (`engine/verify.ts`), so the
 * screen carries whatever the mission is checked by: a phone-down timer, a
 * step or movement count, treasure badges to scan, a secret object to find,
 * the question at the end. What it measures is handed to `submitMission`,
 * which either approves it on the spot or sends it to a parent.
 */
export function JuniorMission() {
  const { activeMission } = useApp();
  // Keyed by mission, so a swap starts every counter and sensor from zero.
  // The last id is kept when the mission is finished and the active one
  // clears, so finishing does not remount the screen mid-navigation.
  const lastId = useRef<string | null>(null);
  if (activeMission) lastId.current = activeMission.id;
  return <MissionRunner key={lastId.current ?? 'none'} />;
}

function MissionRunner() {
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
  } = useApp();

  const [startedAt, setStartedAt] = useState<number | null>(() => resumedStart(activeMission));
  const [elapsed, setElapsed] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>(() => (activeMission?.task.steps ?? []).map(() => false));
  const [motionReps, setMotionReps] = useState(0);
  /** Set when the phone cannot count movement, so the mission is still finishable. */
  const [motionBlocked, setMotionBlocked] = useState(false);
  const [briefRead, setBriefRead] = useState(false);
  /** False for the first frame, so an assign-then-navigate does not bounce back. */
  const [settled, setSettled] = useState(false);

  // What the child answers and finds, restored from the mission record so a
  // trip back to Today does not throw a found badge away.
  const [answer, setAnswer] = useState<number | undefined>(activeMission?.checkAnswer);
  const [countValue, setCountValue] = useState<number | undefined>(
    typeof activeMission?.answerValue === 'number' ? activeMission.answerValue : undefined,
  );
  const [sums, setSums] = useState<(number[] | null)[]>(
    Array.isArray(activeMission?.answerValue) ? activeMission.answerValue : [],
  );
  const [picked, setPicked] = useState<number[]>(activeMission?.picked ?? []);
  const [badgeHits, setBadgeHits] = useState<number[]>(activeMission?.badgeHits ?? []);
  const [badgeMisses, setBadgeMisses] = useState(activeMission?.badgeMisses ?? 0);
  const [secretFound, setSecretFound] = useState(activeMission?.secretFound);
  const [secretMisses, setSecretMisses] = useState(activeMission?.secretMisses ?? 0);
  const [beforeUri, setBeforeUri] = useState(activeMission?.beforeUri);
  const [grownupAt, setGrownupAt] = useState(activeMission?.grownupAt);
  /** The pocket counting screen is up. */
  const [counting, setCounting] = useState(false);

  const rang = useRef(false);
  /** Set when we navigate on purpose, so the safety redirect below stands down. */
  const leaving = useRef(false);
  const jumpTimes = useRef<number[]>([]);

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
      badges: findCheck(task, 'badges'),
      secret: hasCheck(task, 'secret'),
      photo: hasCheck(task, 'photo'),
      grownup: hasCheck(task, 'grownup'),
      tally: findCheck(task, 'tally'),
    };
  }, [task]);

  // A week long goal counts missions already approved, so it is read off the
  // record rather than measured on this screen.
  const tallyDone = useMemo(
    () => (checks?.tally ? tallyProgress(checks.tally, data.missions) : 0),
    [checks?.tally, data.missions],
  );

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
  const { say } = narrator;

  const putDown = usePutDown(
    Boolean(checks?.away) && startedAt !== null && !counting,
    activeMission?.awaySec ?? 0,
  );
  const stepCount = useStepCounter(counting && Boolean(checks?.steps));
  const moving = useMovingTime(counting && Boolean(checks?.active));

  const missionId = activeMission?.id;

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

  // Face-down time is written down each time the phone is picked up again, so
  // leaving the mission and coming back keeps it.
  const wasParked = useRef(false);
  useEffect(() => {
    if (wasParked.current && !putDown.parked && missionId) {
      saveEvidence(missionId, { awaySec: putDown.seconds, awaySensor: true });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasParked.current = putDown.parked;
  }, [putDown.parked, putDown.seconds, missionId, saveEvidence]);

  const duo = task?.mode === 'duo';
  const showBrief = duo && !briefRead;

  // The buddy reads the mission out once, so a child still learning to read
  // gets it either way. Duo missions wait until the grown up has handed it back.
  useEffect(() => {
    if (!task || showBrief) return;
    say(`${pick(task.title)}. ${pick(task.body)}`);
  }, [task?.id, showBrief, say, pick, task]);

  /** The clock starts the first time the child does anything that counts. */
  const ensureStarted = useCallback(() => {
    if (!activeMission || startedAt !== null) return;
    setStartedAt(Date.now());
    startMission(activeMission.id);
  }, [activeMission, startMission, startedAt]);

  const secondsIn = useCallback(
    () => (startedAt === null ? 0 : Math.round((Date.now() - startedAt) / 1000)),
    [startedAt],
  );

  const onRepsDone = useCallback((reps: number, times: number[]) => {
    setMotionReps(reps);
    jumpTimes.current = times;
  }, []);

  const finish = useCallback(() => {
    if (!activeMission || !task || !checks) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    narrator.stop();
    leaving.current = true;

    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    const filledSums = sums.filter((way): way is number[] => Array.isArray(way));

    const motionOdd =
      (checks.steps ? stepsLookOdd(stepCount.shakes) : false) ||
      (checks.active ? moving.looksOdd() : false) ||
      (task.proof === 'motion' && task.motion?.kind === 'jump' ? jumpsLookOdd(jumpTimes.current) : false);

    const evidence: MissionEvidence = {
      durationSec: seconds,
      motionReps: task.proof === 'motion' ? motionReps : undefined,
      motionOdd,
      checkAnswer: answer,
      answerValue:
        task.answer?.kind === 'count'
          ? countValue
          : task.answer?.kind === 'sums'
            ? filledSums
            : undefined,
      picked: task.pick ? picked : undefined,
      awaySec: checks.away ? putDown.seconds : undefined,
      awaySensor: checks.away ? putDown.supported !== false : undefined,
      steps: checks.steps ? stepCount.steps : undefined,
      activeSec: checks.active ? moving.seconds : undefined,
      badgeHits: checks.badges ? badgeHits : undefined,
      badgeMisses: checks.badges ? badgeMisses : undefined,
      secretFound,
      secretMisses: checks.secret ? secretMisses : undefined,
      beforeUri,
      grownupAt,
    };

    // A photo only when it would change the outcome, or to pair with a before.
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
    badgeHits,
    badgeMisses,
    beforeUri,
    checks,
    countValue,
    grownupAt,
    motionReps,
    moving,
    narrator,
    picked,
    putDown.seconds,
    putDown.supported,
    router,
    saveEvidence,
    secretFound,
    secretMisses,
    startedAt,
    stepCount.shakes,
    stepCount.steps,
    submitMission,
    sums,
    task,
  ]);

  const leave = useCallback(() => {
    narrator.stop();
    if (activeMission && checks?.away && putDown.seconds > 0) {
      saveEvidence(activeMission.id, { awaySec: putDown.seconds, awaySensor: putDown.supported !== false });
    }
    router.replace('/(tabs)');
  }, [activeMission, checks?.away, narrator, putDown.seconds, putDown.supported, router, saveEvidence]);

  if (!activeMission || !profile || !task || !checks) return null;

  const plan = activeMission.plan;
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

  const plannedBadges = plan?.badges ?? [];
  const badgesLeft =
    Boolean(checks.badges) && Boolean(data.badges) && badgeHits.length < plannedBadges.length;
  const secretLeft =
    task.tool === 'secretObject' && !secretFound && secretMisses <= MAX_SECRET_MISSES;
  const pickLeft = Boolean(task.pick) && picked.length === 0;
  // Only reachable if a parent took a mission back after this one was handed
  // out: the goal is not offered at all until the week has earned it.
  const tallyLeft = Boolean(checks.tally) && tallyDone < (checks.tally?.count ?? 0);
  const sumsReady =
    task.answer?.kind !== 'sums' ||
    (sums.length >= task.answer.ways && sums.slice(0, task.answer.ways).every(Boolean));
  const answerLeft =
    (Boolean(task.check) && answer === undefined) ||
    (task.answer?.kind === 'count' && countValue === undefined) ||
    !sumsReady;

  const canFinish =
    stepsLeft === 0 &&
    !motionLeft &&
    !countLeft &&
    !badgesLeft &&
    !secretLeft &&
    !pickLeft &&
    !answerLeft &&
    !tallyLeft;

  const hint = stepsLeft > 0
    ? t('task.tickSteps')
    : motionLeft
      ? t('task.finishMotion')
      : countLeft
        ? t('verify.countKeepGoing')
        : badgesLeft
          ? t('verify.finishBadges')
          : secretLeft
            ? t('verify.finishSecret')
            : pickLeft
              ? t('verify.finishPick')
              : tallyLeft
                ? t('verify.finishTally')
                : t('verify.finishAnswer');

  // The bar fills with whatever this mission is gated on; a mission gated on
  // nothing fills with the clock.
  const parts: number[] = [];
  if (steps.length > 0) parts.push(done / steps.length);
  if (task.proof === 'motion' && task.motion) parts.push(Math.min(1, motionReps / task.motion.count));
  if (countTarget > 0) parts.push(Math.min(1, countValueNow / countTarget));
  if (checks.badges && plannedBadges.length > 0) parts.push(badgeHits.length / plannedBadges.length);
  if (task.tool === 'secretObject') parts.push(secretLeft ? 0 : 1);
  if (task.pick) parts.push(pickLeft ? 0 : 1);
  if (task.check || task.answer) parts.push(answerLeft ? 0 : 1);
  if (checks.tally) parts.push(Math.min(1, tallyDone / checks.tally.count));
  const barValue =
    parts.length > 0
      ? parts.reduce((sum, part) => sum + part, 0) / parts.length
      : startedAt === null
        ? 0
        : 1 - remaining / total;
  const gated = parts.length > 0;

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

  const spoken = `${pick(task.title)}. ${pick(task.body)}`;

  /* ------------------------------------------------------- parent hand off */
  if (showBrief) {
    return (
      <JScreen
        header={<LessonBar progress={0} onBack={leave} backLabel={t('common.back')} />}
      >
        <Card accent="blue">
          <JText variant="caption" color={accents.blue.base}>
            {t('duo.forParent').toUpperCase()}
          </JText>
          <JText variant="title" color={ink.strong} style={{ marginTop: space.xs }}>
            {t('duo.handOver', { name: profile.nickname })}
          </JText>
        </Card>

        <BuddyLine
          id={profile.buddyId}
          name={profile.buddyName}
          text={t('duo.buddyLine')}
          mood="happy"
          wearing={data.wardrobe.worn}
          style={{ marginTop: space.lg }}
        />

        <Card style={{ marginTop: space.lg }}>
          <JText variant="heading">{pick(task.title)}</JText>
          <JText variant="read" color={ink.body} style={{ marginTop: space.sm }}>
            {pick(task.body)}
          </JText>
          {task.parentBrief ? (
            <View
              style={{
                backgroundColor: palette.sunken,
                borderRadius: radius.chip,
                padding: space.md,
                marginTop: space.md,
                gap: 2,
              }}
            >
              <JText variant="caption" color={ink.muted}>
                {t('duo.whatToDo').toUpperCase()}
              </JText>
              <JText variant="body" color={ink.body}>
                {pick(task.parentBrief)}
              </JText>
            </View>
          ) : null}
        </Card>

        <View style={{ gap: space.md, marginTop: space.xxl }}>
          <Button label={t('duo.ready')} onPress={() => setBriefRead(true)} />
          <Button label={t('duo.notNow')} kind="cream" size="md" onPress={() => setSwapOpen(true)} />
        </View>

        <SwapSheet open={swapOpen} buddy={profile.buddyName} onClose={() => setSwapOpen(false)} onPick={swap} />
      </JScreen>
    );
  }

  const pickCard = task.pick ? (
    <PickCard
      spec={task.pick}
      value={picked}
      onChange={(next) => {
        ensureStarted();
        setPicked(next);
      }}
    />
  ) : null;

  const afterAnswers = (task.pick && !task.pick.first) || task.check || task.answer;

  /* --------------------------------------------------------------- mission */
  return (
    <JScreen
      header={
        <LessonBar
          progress={barValue}
          onBack={leave}
          backLabel={t('common.back')}
          trailing={
            <CountPill
              icon={<StarFilledIcon size={18} />}
              value={task.stars}
              accent="amber"
              accessibilityLabel={t('common.starsCount', { count: task.stars })}
            />
          }
        />
      }
    >
      {/* --------------------------------------------------------- the title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconTile accent="green" size={54}>
          <JText variant="title">{task.emoji}</JText>
        </IconTile>
        <View style={{ flex: 1, gap: 2 }}>
          <JText variant="title" color={ink.onGround} numberOfLines={3}>
            {pick(task.title)}
          </JText>
          <JText variant="small" color={ink.onGroundMuted}>
            {/* A duo mission says so instead of naming its category: for a
                social one both labels are the same word. */}
            {t('task.howLong', { count: task.minutes })} ·{' '}
            {duo ? t('duo.badge') : t(CATEGORY_KEYS[task.category])}
          </JText>
        </View>
      </View>

      {/* --------------------------------------------- what the buddy says */}
      <BuddyLine
        id={profile.buddyId}
        name={profile.buddyName}
        text={pick(task.body)}
        mood={narrator.speaking ? 'talking' : canFinish && gated ? 'cheer' : running ? 'sleepy' : 'idle'}
        wearing={data.wardrobe.worn}
        speakLabel={t('task.readAloud')}
        tipLabel={t('task.tipTitle')}
        onSpeak={data.settings.voiceEnabled ? () => say(spoken) : undefined}
        onTip={task.tip ? () => setTipOpen((open) => !open) : undefined}
        style={{ marginTop: space.lg }}
      />

      {tipOpen && task.tip ? (
        <Animated.View entering={FadeInDown.duration(160)} style={{ marginTop: space.md }}>
          <Card accent="blue">
            <JText variant="caption" color={accents.blue.base}>
              {t('task.tipTitle').toUpperCase()}
            </JText>
            <JText variant="read" color={ink.strong} style={{ marginTop: space.xs }}>
              {pick(task.tip)}
            </JText>
          </Card>
        </Animated.View>
      ) : null}

      {task.objects && task.objects.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
          {task.objects.map((object) => (
            <View
              key={object}
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.chip,
                borderWidth: border.ink,
                borderColor: palette.line,
                backgroundColor: palette.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <JText variant="heading">{objectEmoji(object)}</JText>
            </View>
          ))}
        </View>
      ) : null}

      {/* ------------------------------------------------ before it starts */}
      {task.beforePhoto ? (
        <BeforePhotoCard
          uri={beforeUri}
          onFirstUse={ensureStarted}
          onTaken={(uri) => {
            setBeforeUri(uri);
            saveEvidence(activeMission.id, { beforeUri: uri });
          }}
        />
      ) : null}

      {/* -------------------------------------------------------- the tools */}
      {checks.tally ? <WeekGoalCard done={tallyDone} target={checks.tally.count} /> : null}

      {task.tool === 'badgeHunt' || task.tool === 'badgeRoute' ? (
        <BadgeHuntCard
          mode={task.tool === 'badgeHunt' ? 'hunt' : 'route'}
          plan={plannedBadges}
          found={badgeHits.length}
          badgeKey={data.badges?.key ?? null}
          onHit={() => {
            ensureStarted();
            const next = [...badgeHits, secondsIn()];
            setBadgeHits(next);
            saveEvidence(activeMission.id, { badgeHits: next });
          }}
          onMiss={() => {
            ensureStarted();
            const next = badgeMisses + 1;
            setBadgeMisses(next);
            saveEvidence(activeMission.id, { badgeMisses: next });
          }}
        />
      ) : null}

      {task.tool === 'secretObject' && plan?.secret ? (
        <SecretCard
          missionId={activeMission.id}
          secret={plan.secret}
          found={secretFound}
          misses={secretMisses}
          onFirstUse={ensureStarted}
          onFound={(how) => {
            setSecretFound(how);
            saveEvidence(activeMission.id, { secretFound: how });
          }}
          onMiss={() => {
            const next = secretMisses + 1;
            setSecretMisses(next);
            saveEvidence(activeMission.id, { secretMisses: next });
          }}
        />
      ) : null}

      {/* A list that is part of the plan, with no steps to sit beside. */}
      {task.pick?.first && steps.length === 0 ? (
        <View style={{ marginTop: space.xxl }}>
          <Stamp accent="green">{t('junior.planStamp')}</Stamp>
          {pickCard}
        </View>
      ) : null}

      {/* ---------------------------------------------------------- the steps */}
      {steps.length > 0 ? (
        <View style={{ marginTop: space.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Stamp accent="green" style={{ flex: 1, marginBottom: 0 }}>
              {t('junior.planStamp')}
            </Stamp>
            <JText variant="caption" color={ink.onGround}>
              {t('common.of', { current: done, total: steps.length })}
            </JText>
          </View>
          <View style={{ height: space.md }} />

          {task.pick?.first ? <View style={{ marginBottom: space.md }}>{pickCard}</View> : null}

          <View style={{ gap: space.sm }}>
            {steps.map((step, index) => (
              <StepRow
                key={index}
                index={index + 1}
                text={pick(step)}
                done={ticked[index] ?? false}
                onPress={() => {
                  void Haptics.selectionAsync();
                  ensureStarted();
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
        </View>
      ) : null}

      {task.proof === 'motion' && task.motion ? (
        <View style={{ marginTop: space.xxl }}>
          <Stamp accent="amber">{t('junior.countStamp')}</Stamp>
          {/* Keyed so a swapped mission starts its count from zero. */}
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
        <MoveCountCard
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
        <Stamp accent="blue">{t('junior.clockStamp')}</Stamp>
        <Card padded={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
            <IconTile accent="blue" size={52}>
              <ClockIcon size={26} />
            </IconTile>
            <View style={{ flex: 1 }}>
              <JText variant="stat" color={finished ? accents.green.base : ink.strong}>
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </JText>
              <JText variant="small" color={ink.muted}>
                {finished
                  ? t('task.timerDone')
                  : running
                    ? checks.clock && elapsed < checks.clock.minutes * 60
                      ? t('verify.clockAtLeast', { count: checks.clock.minutes })
                      : t('task.putDown')
                    : t('junior.timerIdle')}
              </JText>
            </View>
            {startedAt === null ? (
              <Button
                label={t('task.startTimer')}
                size="sm"
                full={false}
                accent="blue"
                icon={<PlayIcon size={18} />}
                onPress={ensureStarted}
              />
            ) : null}
          </View>
          {startedAt !== null ? (
            <>
              <Divider />
              <View style={{ padding: space.lg }}>
                <Bar value={1 - remaining / total} accent={finished ? 'green' : 'blue'} />
              </View>
            </>
          ) : null}
        </Card>
      </View>

      {checks.away ? (
        <PutDownCard
          seconds={putDown.seconds}
          targetMinutes={checks.away.minutes}
          started={startedAt !== null}
          supported={startedAt === null ? null : putDown.supported}
          orPhoto={checks.photo}
        />
      ) : null}

      {/* ----------------------------------------------- when they are done */}
      {afterAnswers ? (
        <View style={{ marginTop: space.xxl, gap: space.md }}>
          <Stamp accent="rose" style={{ marginBottom: 0 }}>
            {t('verify.doneStamp')}
          </Stamp>
          {task.pick && !task.pick.first ? pickCard : null}
          {task.check ? (
            <ChoiceCard
              check={task.check}
              value={answer}
              onChange={(index) => {
                void Haptics.selectionAsync();
                setAnswer(index);
              }}
            />
          ) : null}
          {task.answer?.kind === 'count' ? (
            <CountCard spec={task.answer} value={countValue} onChange={setCountValue} />
          ) : null}
          {task.answer?.kind === 'sums' ? <SumsCard spec={task.answer} value={sums} onChange={setSums} /> : null}
        </View>
      ) : null}

      {checks.grownup ? (
        <GrownupCard
          done={Boolean(grownupAt)}
          primary={task.checks?.length === 1 && task.checks[0].kind === 'grownup'}
          onApproved={() => {
            const at = new Date().toISOString();
            setGrownupAt(at);
            saveEvidence(activeMission.id, { grownupAt: at });
          }}
        />
      ) : null}

      {/* --------------------------------------------------------- finishing */}
      {/* Only once something was actually done. A mission with nothing to gate
          on is finishable from the first frame, and congratulating a child for
          opening a screen teaches them the praise means nothing. */}
      {canFinish && gated ? (
        <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: space.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              backgroundColor: accents.green.tint,
              borderRadius: radius.card,
              borderWidth: border.ink,
              borderColor: accents.green.edge,
              padding: space.lg,
            }}
          >
            <PartyIcon size={26} color={accents.green.base} />
            <JText variant="bodyStrong" color={accents.green.base} style={{ flex: 1 }}>
              {t('junior.allDone')}
            </JText>
          </View>
        </Animated.View>
      ) : null}

      <View style={{ marginTop: space.lg, gap: space.md }}>
        <Button
          label={task.proof === 'photo' ? t('task.takeProof') : t('task.iDidIt')}
          icon={<CheckIcon size={20} />}
          disabled={!canFinish}
          onPress={finish}
        />
        {!canFinish ? (
          <JText variant="small" color={ink.onGroundMuted} center>
            {hint}
          </JText>
        ) : null}
        <Button label={t('task.notNow')} kind="cream" size="md" onPress={() => setSwapOpen(true)} />
      </View>

      <SwapSheet open={swapOpen} buddy={profile.buddyName} onClose={() => setSwapOpen(false)} onPick={swap} />

      <ParkedOverlay
        visible={Boolean(checks.away) && putDown.parked && !counting}
        seconds={putDown.seconds}
        buddyId={profile.buddyId}
        wearing={data.wardrobe.worn}
        onWake={putDown.wake}
      />

      <CountingOverlay
        visible={counting}
        kind={checks.steps ? 'steps' : 'active'}
        value={countValueNow}
        target={countTarget}
        level={checks.steps ? stepCount.intensity : moving.level}
        onStop={() => setCounting(false)}
      />
    </JScreen>
  );
}

/* -------------------------------------------------------------- components */

/**
 * One step, as a row that turns green when it is ticked — the same shape as an
 * answer option, which is the control this age already knows.
 */
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
          minHeight: 60,
          padding: space.md,
          borderRadius: radius.chip,
          borderWidth: done ? border.strong : border.ink,
          borderColor: done ? accents.green.solid : palette.line,
          backgroundColor: done ? accents.green.tint : palette.surface,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? accents.green.solid : palette.sunken,
          }}
        >
          {done ? (
            <CheckIcon size={18} />
          ) : (
            <JText variant="caption" color={ink.muted}>
              {index}
            </JText>
          )}
        </View>
        <JText
          variant="read"
          color={done ? accents.green.base : ink.strong}
          style={{ flex: 1 }}
        >
          {text}
        </JText>
      </View>
    </Pressable>
  );
}

/**
 * The phone counting the movement for itself.
 *
 * A number that only goes up when the child actually moves is the difference
 * between a mission and a button. Reported here as a figure over a target
 * rather than a filling circle, because at this age the fraction is readable
 * and more satisfying than the picture of it.
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
      <Card>
        <JText variant="body" color={ink.body}>
          {t('motion.noSensor')}
        </JText>
      </Card>
    );
  }

  return (
    <Card accent={done ? 'green' : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconTile accent={done ? 'green' : 'amber'} size={52}>
          <BoltIcon size={26} color={done ? accents.green.base : accents.amber.base} />
        </IconTile>
        <View style={{ flex: 1 }}>
          <JText variant="stat" color={done ? accents.green.base : ink.strong}>
            {reps}
            <JText variant="heading" color={ink.muted}>
              {' / '}
              {spec.count}
            </JText>
          </JText>
          <JText variant="small" color={ink.muted}>
            {done ? t('motion.done') : running ? t(labelKey) : t('motion.pressStart')}
          </JText>
        </View>
      </View>
      <Bar
        value={Math.min(1, reps / spec.count)}
        accent={done ? 'green' : 'amber'}
        style={{ marginTop: space.md }}
      />
      {/* A live pulse while the phone is actually feeling movement. */}
      <View
        style={{
          height: 4,
          marginTop: space.sm,
          borderRadius: radius.pill,
          backgroundColor: accents.amber.solid,
          opacity: running && !done ? Math.min(1, intensity) * 0.7 : 0,
        }}
      />
    </Card>
  );
}

/**
 * Why not this one.
 *
 * Three reasons as readable rows rather than three faces: the answer is what
 * teaches the app which missions to stop offering, and at this age the child
 * can tell you in words.
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
  const reasons: { reason: SkipReason; label: string }[] = [
    { reason: 'hard', label: t('task.swapReasonHard') },
    { reason: 'boring', label: t('task.swapReasonBoring') },
    { reason: 'cantNow', label: t('task.swapReasonCantNow') },
  ];

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable>
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: radius.panel,
                borderTopRightRadius: radius.panel,
                padding: space.xl,
                paddingBottom: space.xxxl,
                gap: space.md,
              }}
            >
              <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <JText variant="title">{t('task.swapTitle')}</JText>
                    <JText variant="body" color={ink.body} style={{ marginTop: space.xs }}>
                      {t('task.swapBody', { buddy })}
                    </JText>
                  </View>
                  <IconButton
                    icon={<CloseIcon size={22} />}
                    kind="cream"
                    size={44}
                    accessibilityLabel={t('common.close')}
                    onPress={onClose}
                  />
                </View>

                <View style={{ gap: space.sm, marginTop: space.sm }}>
                  {reasons.map((item) => (
                    <Pressable
                      key={item.reason}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      onPress={() => onPick(item.reason)}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.md,
                          minHeight: 60,
                          paddingHorizontal: space.lg,
                          borderRadius: radius.chip,
                          borderWidth: border.ink,
                          borderColor: palette.line,
                          backgroundColor: palette.surface,
                        }}
                      >
                        <JText variant="bodyStrong" style={{ flex: 1 }}>
                          {item.label}
                        </JText>
                        <ChevronIcon size={20} />
                      </View>
                    </Pressable>
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
