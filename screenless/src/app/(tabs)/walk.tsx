import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { Button, Screen, SpeechBubble, Sticker, Txt } from '../../components/ui';
import { dayKey } from '../../engine/progress';
import {
  goalFor,
  milestoneProgress,
  nextMilestone,
  recentDays,
  todayWalk,
} from '../../engine/walk';
import { useI18n } from '../../i18n';
import { useStepCounter } from '../../lib/pedometer';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { useExperience } from '../../experience';
import { LittleWalk } from '../../little/screens/LittleWalk';
import { JuniorWalk } from '../../junior/screens/JuniorWalk';
import { TeenWalk } from '../../teen/screens/TeenWalk';

/**
 * The walking game.
 *
 * Counting only ever happens while this screen is open and the child has
 * pressed start, which is deliberate. Counting in the background would mean a
 * foreground service and a permanent notification on Android, and a children's
 * app should not be quietly measuring a child who did not ask it to.
 */
export default function WalkRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleWalk />;
  if (experience === 'junior') return <JuniorWalk />;
  if (experience === 'teen') return <TeenWalk />;
  return <Walk />;
}

function Walk() {
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

  const line = celebrating || reached
    ? t('walk.buddyDone')
    : counter.walking
      ? t('walk.buddyWalking')
      : running
        ? t('walk.waiting')
        : t('walk.buddyIdle');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Txt variant="title" style={{ flex: 1 }}>
          {t('walk.title')}
        </Txt>
        <Sticker
          background={colors.accent}
          offset={3}
          style={{ paddingHorizontal: spacing.md, paddingVertical: 4 }}
        >
          <Txt variant="tiny">🪙 {data.walk.coins}</Txt>
        </Sticker>
      </View>

      {/* The ring is the whole screen in one glance: how far round today is. */}
      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Ring progress={goal > 0 ? today.steps / goal : 0} live={counter.walking}>
          <Buddy
            id={profile.buddyId}
            size={120}
            mood={counter.walking ? 'cheer' : reached ? 'happy' : 'idle'}
          />
        </Ring>

        <Txt variant="display" style={{ marginTop: spacing.md }}>
          {today.steps.toLocaleString()}
        </Txt>
        <Txt variant="small" color={colors.textSoft}>
          {reached ? t('walk.goalDone', { count: today.steps }) : t('walk.goalLeft', { count: remaining })}
        </Txt>
        {counter.walking && counter.cadence > 0 ? (
          <Txt variant="tiny" color={colors.successDeep} style={{ marginTop: 2 }}>
            {t('walk.cadence', { count: counter.cadence })}
          </Txt>
        ) : null}
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <SpeechBubble text={line} tailSide="none" />
      </View>

      <Button
        label={running ? t('walk.stop') : t('walk.start')}
        tone={running ? 'neutral' : 'primary'}
        style={{ marginTop: spacing.lg }}
        onPress={toggle}
      />

      {running ? (
        <Txt variant="tiny" color={colors.textFaint} center style={{ marginTop: spacing.sm }}>
          {t('walk.keepOpen')}
        </Txt>
      ) : null}

      {!counter.supported ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="small" color={colors.textSoft}>
            {t('walk.unsupported')}
          </Txt>
        </Sticker>
      ) : null}

      {/* The week, as seven bars. Enough to see a habit, too little to nag. */}
      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('walk.week')}
      </Txt>
      <Week days={week} goal={goal} />

      <Sticker
        background={colors.surfaceAlt}
        style={{ padding: spacing.lg, gap: spacing.xs, marginTop: spacing.lg }}
      >
        <Txt variant="bodyStrong">{t('walk.lifetime', { count: data.walk.lifetimeSteps })}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {upcoming === null
            ? t('walk.allMilestones')
            : t('walk.nextMilestone', { count: upcoming - data.walk.lifetimeSteps })}
        </Txt>
        <Bar value={milestoneProgress(data.walk.lifetimeSteps)} />
        {data.walk.goalStreak > 0 ? (
          <Txt variant="tiny" color={colors.successDeep}>
            🔥 {t('walk.streak', { count: data.walk.goalStreak })}
          </Txt>
        ) : null}
      </Sticker>

      {/* Says plainly what is and is not measured, in the child's own screen. */}
      <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.xs, marginTop: spacing.lg }}>
        <Txt variant="bodyStrong">{t('walk.privacyTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {t('walk.privacyBody')}
        </Txt>
      </Sticker>

      <Txt variant="tiny" color={colors.textFaint} style={{ marginTop: spacing.md }}>
        {t('walk.coinNote')}
      </Txt>
    </Screen>
  );
}

/* -------------------------------------------------------------- components */

const RING = 180;
const STROKE = 14;

function Ring({
  progress,
  live,
  children,
}: {
  progress: number;
  live: boolean;
  children: React.ReactNode;
}) {
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, progress));

  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          stroke={live ? colors.success : colors.primary}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference * filled} ${circumference}`}
          // Starts the sweep at the top rather than at three o'clock.
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

function Week({ days, goal }: { days: { date: string; steps: number }[]; goal: number }) {
  const peak = Math.max(goal, ...days.map((day) => day.steps), 1);
  const today = dayKey();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.sm,
        height: 110,
        marginTop: spacing.md,
      }}
    >
      {days.map((day) => {
        const isToday = day.date === today;
        const hit = goal > 0 && day.steps >= goal;
        return (
          <View key={day.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: '100%',
                // Always a sliver, so an empty day still reads as a day.
                height: Math.max(4, (day.steps / peak) * 80),
                borderRadius: radii.sm,
                borderWidth: borderWidth.hair,
                borderColor: colors.border,
                backgroundColor: hit ? colors.success : isToday ? colors.accent : colors.surface,
              }}
            />
            <Txt variant="tiny" color={isToday ? colors.text : colors.textFaint}>
              {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <View
      style={{
        height: 12,
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        marginTop: spacing.xs,
      }}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: '100%',
          backgroundColor: colors.magic,
        }}
      />
    </View>
  );
}
