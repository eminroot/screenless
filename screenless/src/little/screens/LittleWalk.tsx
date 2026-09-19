import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { dayKey } from '../../engine/progress';
import { goalFor, milestoneProgress, nextMilestone, recentDays, todayWalk } from '../../engine/walk';
import { useI18n } from '../../i18n';
import { useStepCounter } from '../../lib/pedometer';
import { useApp } from '../../state/app-state';
import { Bubble } from '../components/Bubble';
import { ClayButton, ClayCard } from '../components/Clay';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { Mascot } from '../components/Mascot';
import { Meter } from '../components/Meter';
import { StatStrip } from '../components/StatStrip';
import { CheckIcon, CoinIcon, FootprintIcon, PlayIcon } from '../icons';
import { useLiveMotion, useOscillator } from '../motion';
import { ink, round, space, tones, world } from '../theme';

/**
 * The walking game, for ages 3 to 5.
 *
 * Counting only ever happens while this screen is open and the child has
 * pressed start, which is deliberate. Counting in the background would mean a
 * foreground service and a permanent notification on Android, and a children's
 * app should not be quietly measuring a child who did not ask it to.
 *
 * Steps make coins, never stars. Stars are what a parent promised an ice cream
 * against, and ten thousand steps at one a star would settle every promise in
 * the app in an afternoon.
 */
export function LittleWalk() {
  const { t } = useI18n();
  const { profile, data, recordSteps } = useApp();
  const [running, setRunning] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const counter = useStepCounter(running);

  // The hook reports a running total for this session; the store wants the
  // change since last time. Tracked in a ref so it never triggers a render.
  const banked = useRef(0);

  useEffect(() => {
    if (!running) return;
    const delta = counter.steps - banked.current;
    if (delta <= 0) return;
    banked.current = counter.steps;

    const result = recordSteps(delta);
    if (result?.reachedGoal) {
      setCelebrating(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [counter.steps, recordSteps, running]);

  const toggle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (running) {
      setRunning(false);
      return;
    }
    banked.current = 0;
    counter.reset();
    setRunning(true);
  }, [counter, running]);

  const today = useMemo(() => todayWalk(data.walk), [data.walk]);
  const week = useMemo(() => recentDays(data.walk), [data.walk]);
  const goal = profile ? goalFor(profile.ageBand) : 0;
  const remaining = Math.max(0, goal - today.steps);
  const reached = goal > 0 && today.steps >= goal;
  const upcoming = nextMilestone(data.walk.lifetimeSteps);

  if (!profile) return null;

  const line =
    celebrating || reached
      ? t('walk.buddyDone')
      : counter.walking
        ? t('walk.buddyWalking')
        : running
          ? t('walk.waiting')
          : t('walk.buddyIdle');

  return (
    <LittleScreen header={<StatStrip />}>
      <LText variant="title" center>
        {t('walk.title')}
      </LText>

      {/* The ring is the whole screen in one glance: how far round today is. */}
      <View style={{ alignItems: 'center', marginTop: space.md }}>
        <StepRing progress={goal > 0 ? today.steps / goal : 0} live={counter.walking} done={reached}>
          <Mascot
            id={profile.buddyId}
            name={profile.buddyName}
            size={128}
            mood={counter.walking ? 'cheer' : reached ? 'happy' : 'idle'}
            wearing={data.wardrobe.worn}
            halo="white"
          />
        </StepRing>
      </View>

      <View style={{ alignItems: 'center', marginTop: space.md }}>
        <LText variant="giant">{today.steps.toLocaleString()}</LText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <FootprintIcon size={22} color={reached ? tones.mint.face : tones.sky.face} />
          <LText variant="small" color={ink.soft}>
            {reached ? t('walk.goalDone', { count: today.steps }) : t('walk.goalLeft', { count: remaining })}
          </LText>
        </View>
      </View>

      <Bubble
        text={line}
        tail="none"
        style={{ marginTop: space.md }}
      />

      <ClayButton
        label={running ? t('walk.stop') : t('walk.start')}
        tone={running ? 'coral' : 'mint'}
        size="xl"
        icon={running ? <CheckIcon size={26} color={tones.coral.ink} /> : <PlayIcon size={28} color={tones.mint.ink} />}
        style={{ marginTop: space.lg }}
        onPress={toggle}
      />

      {running ? (
        <LText variant="small" color={ink.soft} center style={{ marginTop: space.sm }}>
          {t('walk.keepOpen')}
        </LText>
      ) : null}

      {!counter.supported ? (
        <ClayCard style={{ padding: space.lg, marginTop: space.lg }}>
          <LText variant="small" color={ink.soft}>
            {t('walk.unsupported')}
          </LText>
        </ClayCard>
      ) : null}

      {/* The week, as seven bars. Enough to see a habit, too little to nag. */}
      <LText variant="heading" style={{ marginTop: space.xl }}>
        {t('walk.week')}
      </LText>
      <ClayCard style={{ padding: space.lg, marginTop: space.md }}>
        <Week days={week} goal={goal} />
      </ClayCard>

      <ClayCard tone="sun" style={{ padding: space.lg, gap: space.sm, marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <CoinIcon size={30} />
          <LText variant="heading" color={tones.sun.ink} style={{ flex: 1 }}>
            {t('walk.lifetime', { count: data.walk.lifetimeSteps })}
          </LText>
        </View>
        <Meter
          value={milestoneProgress(data.walk.lifetimeSteps)}
          tone="coral"
          accessibilityLabel={t('walk.lifetime', { count: data.walk.lifetimeSteps })}
        />
        <LText variant="small" color={tones.sun.ink}>
          {upcoming === null
            ? t('walk.allMilestones')
            : t('walk.nextMilestone', { count: upcoming - data.walk.lifetimeSteps })}
        </LText>
      </ClayCard>

      {/* Says plainly what is and is not measured, in the child's own screen. */}
      <ClayCard style={{ padding: space.lg, gap: space.xs, marginTop: space.lg }}>
        <LText variant="label">{t('walk.privacyTitle')}</LText>
        <LText variant="small" color={ink.soft}>
          {t('walk.privacyBody')}
        </LText>
        <LText variant="tiny" color={ink.faint} style={{ marginTop: space.xs }}>
          {t('walk.coinNote')}
        </LText>
      </ClayCard>
    </LittleScreen>
  );
}

/* -------------------------------------------------------------- components */

const RING = 232;
const STROKE = 18;

function StepRing({
  progress,
  live,
  done,
  children,
}: {
  progress: number;
  live: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  const moving = useLiveMotion();
  const pulse = useOscillator(900, moving && live);
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, progress));

  const halo = useAnimatedStyle(() => ({
    opacity: live ? 0.2 + pulse.value * 0.25 : 0,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: RING + 20,
            height: RING + 20,
            borderRadius: (RING + 20) / 2,
            backgroundColor: tones.mint.glow,
          },
          halo,
        ]}
      />
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke="#FFFFFF" strokeWidth={STROKE} fill="rgba(255,255,255,0.55)" />
        {/* Drawn only once there is something to draw: a round cap on a zero
            length arc leaves a dot sitting at twelve o'clock. */}
        {filled > 0 ? (
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={radius}
            stroke={done ? tones.mint.face : tones.sky.face}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * filled} ${circumference}`}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

function Week({ days, goal }: { days: { date: string; steps: number }[]; goal: number }) {
  const peak = Math.max(goal, ...days.map((day) => day.steps), 1);
  const today = dayKey();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: 112 }}>
      {days.map((day) => {
        const isToday = day.date === today;
        const hit = goal > 0 && day.steps >= goal;
        return (
          <View key={day.date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <View
              style={{
                width: '100%',
                // Always a sliver, so an empty day still reads as a day.
                height: Math.max(8, (day.steps / peak) * 78),
                borderRadius: round.sm,
                backgroundColor: hit ? tones.mint.face : isToday ? tones.sun.face : world.hillFar,
              }}
            />
            <LText variant="tiny" color={isToday ? ink.text : ink.faint}>
              {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </LText>
          </View>
        );
      })}
    </View>
  );
}
