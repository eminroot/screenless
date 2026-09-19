import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { dayKey } from '../../engine/progress';
import { goalFor, milestoneProgress, nextMilestone, recentDays, todayWalk } from '../../engine/walk';
import { useI18n } from '../../i18n';
import { useStepCounter } from '../../lib/pedometer';
import { useApp } from '../../state/app-state';
import { Button } from '../components/Button';
import { BuddyLine } from '../components/BuddyLine';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { Bar, StatCard } from '../components/Stat';
import { Card, Divider, IconTile, Stamp } from '../components/Surface';
import { CheckIcon, CoinIcon, FlameIcon, PlayIcon, ShoeIcon, TrophyIcon } from '../icons';
import { accents, border, ink, palette, radius, space } from '../theme';

/**
 * The walking game, for ages 6 to 9.
 *
 * The number is the screen. A big figure against a goal, a bar under it and
 * the week as seven bars beside it — a seven year old reads all three at a
 * glance and knows whether today was a good day, which the ring on the tier
 * below can only hint at.
 *
 * Counting happens only while this screen is open and the child has pressed
 * start. Counting in the background would mean a foreground service and a
 * permanent notification on Android, and a children's app should not be
 * quietly measuring a child who did not ask it to.
 *
 * Steps make coins, never stars. Stars are what a parent promised an ice cream
 * against, and ten thousand steps at a star each would settle every promise in
 * the app in one afternoon.
 */
export function JuniorWalk() {
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
    <JScreen
      header={
        <View>
          <JText variant="title" color={ink.onGround}>{t('walk.title')}</JText>
          <JText variant="small" color={ink.onGroundMuted}>
            {reached ? t('walk.goalDone', { count: today.steps }) : t('walk.goalLeft', { count: remaining })}
          </JText>
        </View>
      }
    >
      {/* ------------------------------------------------------------ today */}
      <Card accent={reached ? 'green' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile accent={reached ? 'green' : 'blue'} size={54}>
            <ShoeIcon size={26} color={reached ? accents.green.base : accents.blue.base} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <JText variant="statBig" color={reached ? accents.green.base : ink.strong}>
              {today.steps.toLocaleString()}
            </JText>
            <JText variant="small" color={ink.muted}>
              {t('junior.goalOf', { count: goal })}
            </JText>
          </View>
        </View>
        <Bar
          value={goal > 0 ? today.steps / goal : 0}
          accent={reached ? 'green' : 'blue'}
          height={12}
          style={{ marginTop: space.lg }}
        />
        {counter.walking && counter.cadence > 0 ? (
          <JText variant="small" color={accents.green.base} style={{ marginTop: space.sm }}>
            {t('walk.cadence', { count: counter.cadence })}
          </JText>
        ) : null}
      </Card>

      <BuddyLine
        id={profile.buddyId}
        name={profile.buddyName}
        text={line}
        mood={counter.walking ? 'cheer' : reached ? 'happy' : 'idle'}
        wearing={data.wardrobe.worn}
        style={{ marginTop: space.lg }}
      />

      <Button
        label={running ? t('walk.stop') : t('walk.start')}
        accent={running ? 'rose' : 'green'}
        icon={running ? <CheckIcon size={20} /> : <PlayIcon size={20} />}
        style={{ marginTop: space.lg }}
        onPress={toggle}
      />

      {running ? (
        <JText variant="small" color={ink.muted} center style={{ marginTop: space.sm }}>
          {t('walk.keepOpen')}
        </JText>
      ) : null}

      {!counter.supported ? (
        <Card style={{ marginTop: space.lg }}>
          <JText variant="body" color={ink.body}>
            {t('walk.unsupported')}
          </JText>
        </Card>
      ) : null}

      {/* ------------------------------------------------------------- week */}
      <Stamp accent="violet" style={{ marginTop: space.xxl }}>{t('junior.weekStamp')}</Stamp>
      <Card>
        <Week days={week} goal={goal} />
      </Card>

      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.md }}>
        <StatCard
          icon={<CoinIcon size={24} />}
          value={data.walk.coins}
          label={t('junior.coinsLabel')}
          accent="amber"
        />
        <StatCard
          icon={<FlameIcon size={24} />}
          value={data.walk.goalStreak}
          label={t('junior.inARow')}
          accent="rose"
        />
        <StatCard
          icon={<TrophyIcon size={24} />}
          value={data.walk.bestDay.toLocaleString()}
          label={t('junior.bestDayLabel')}
          accent="green"
        />
      </View>

      {/* --------------------------------------------------------- lifetime */}
      <Card style={{ marginTop: space.lg }} padded={false}>
        <View style={{ padding: space.lg, gap: space.sm }}>
          <JText variant="bodyStrong">{t('walk.lifetime', { count: data.walk.lifetimeSteps })}</JText>
          <Bar value={milestoneProgress(data.walk.lifetimeSteps)} accent="violet" />
          <JText variant="small" color={ink.muted}>
            {upcoming === null
              ? t('walk.allMilestones')
              : t('walk.nextMilestone', { count: upcoming - data.walk.lifetimeSteps })}
          </JText>
        </View>
        <Divider />
        {/* Says plainly what is and is not measured, on the child's own screen. */}
        <View style={{ padding: space.lg, gap: space.xs }}>
          <JText variant="caption" color={ink.muted}>
            {t('walk.privacyTitle').toUpperCase()}
          </JText>
          <JText variant="small" color={ink.body}>
            {t('walk.privacyBody')}
          </JText>
          <JText variant="small" color={ink.muted} style={{ marginTop: space.xs }}>
            {t('walk.coinNote')}
          </JText>
        </View>
      </Card>
    </JScreen>
  );
}

/** The week as seven bars. Enough to see a habit, too little to nag. */
function Week({ days, goal }: { days: { date: string; steps: number }[]; goal: number }) {
  const peak = Math.max(goal, ...days.map((day) => day.steps), 1);
  const today = dayKey();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: 132 }}>
      {days.map((day) => {
        const isToday = day.date === today;
        const hit = goal > 0 && day.steps >= goal;
        return (
          <View key={day.date} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <JText variant="caption" color={ink.muted} style={{ fontSize: 11 }} numberOfLines={1}>
              {day.steps > 0 ? Math.round(day.steps / 100) / 10 : ''}
            </JText>
            <View
              style={{
                width: '100%',
                // Always a sliver, so an empty day still reads as a day.
                height: Math.max(6, (day.steps / peak) * 82),
                borderRadius: radius.chip,
                backgroundColor: hit
                  ? accents.green.solid
                  : isToday
                    ? accents.blue.solid
                    : palette.sunken,
                borderWidth: isToday && !hit ? 0 : border.hair,
                borderColor: palette.line,
              }}
            />
            <JText variant="caption" color={isToday ? ink.strong : ink.muted}>
              {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </JText>
          </View>
        );
      })}
    </View>
  );
}
