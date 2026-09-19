import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { dayKey } from '../../engine/progress';
import { goalFor, milestoneProgress, nextMilestone, recentDays, todayWalk } from '../../engine/walk';
import { useI18n } from '../../i18n';
import { useStepCounter } from '../../lib/pedometer';
import { useApp } from '../../state/app-state';
import { Button } from '../components/Button';
import { Bar, Stat, StatRow, WeekStrip } from '../components/Stat';
import { Label, Panel, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { CheckIcon, CoinIcon, FlameIcon, PlayIcon } from '../icons';
import { space } from '../theme';
import { useSkin } from '../skin';

/**
 * Steps, for ages 10 to 14.
 *
 * One very large figure against a goal, the week as a real chart under it, and
 * the totals below that. No ring, no mascot, no encouragement — at this age the
 * data is the encouragement, and dressing it up is what makes an app feel like
 * it is talking down to you.
 *
 * Counting happens only while this screen is open and the child has pressed
 * start. Counting in the background would mean a foreground service and a
 * permanent notification on Android, and this app does not measure anybody who
 * did not ask it to.
 *
 * Steps make coins, never stars. Stars are what a parent promised something
 * against, and ten thousand steps at a star each would settle every promise in
 * the app in one afternoon.
 */
export function TeenWalk() {
  const { ink, accents } = useSkin();
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

  return (
    <TScreen
      header={
        <View>
          <TText variant="label" color={ink.muted}>
            {t('teen.tabSteps')}
          </TText>
          <TText variant="display">{t('walk.title')}</TText>
        </View>
      }
    >
      <Panel accent={reached ? 'acid' : undefined}>
        <TText variant="statBig" color={reached ? accents.acid.bright : ink.strong}>
          {today.steps.toLocaleString()}
        </TText>
        <TText variant="label" color={ink.muted}>
          {t('teen.goalOf', { count: goal.toLocaleString() })}
        </TText>
        <Bar
          value={goal > 0 ? today.steps / goal : 0}
          height={8}
          style={{ marginTop: space.lg }}
          accessibilityLabel={
            reached ? t('walk.goalDone', { count: today.steps }) : t('walk.goalLeft', { count: remaining })
          }
        />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {celebrating || reached
            ? t('walk.goalDone', { count: today.steps })
            : t('walk.goalLeft', { count: remaining })}
          {counter.walking && counter.cadence > 0 ? ` · ${t('walk.cadence', { count: counter.cadence })}` : ''}
        </TText>
      </Panel>

      <Button
        label={running ? t('walk.stop') : t('teen.startWalk')}
        accent={running ? 'coral' : 'acid'}
        kind={running ? 'outline' : 'solid'}
        icon={
          running ? (
            <CheckIcon size={18} color={ink.strong} />
          ) : (
            <PlayIcon size={18} color={accents.acid.on} />
          )
        }
        style={{ marginTop: space.lg }}
        onPress={toggle}
      />

      {running ? (
        <TText variant="caption" color={ink.muted} center style={{ marginTop: space.sm }}>
          {t('walk.keepOpen')}
        </TText>
      ) : null}

      {!counter.supported ? (
        <Panel style={{ marginTop: space.lg }}>
          <TText variant="body" color={ink.body}>
            {t('walk.unsupported')}
          </TText>
        </Panel>
      ) : null}

      <Label style={{ marginTop: space.xxl }}>{t('teen.weekLabel')}</Label>
      <Panel>
        <WeekStrip days={week} goal={goal} today={dayKey()} />
        <Rule style={{ marginVertical: space.lg }} />
        <StatRow>
          <Stat
            value={data.walk.coins.toLocaleString()}
            label={t('teen.coinsLabel')}
            icon={<CoinIcon size={15} color={ink.muted} />}
          />
          <Stat
            value={data.walk.goalStreak}
            label={t('teen.streakLabel')}
            accent="coral"
            icon={<FlameIcon size={15} color={accents.coral.bright} />}
          />
          <Stat value={data.walk.bestDay.toLocaleString()} label={t('teen.bestLabel')} />
        </StatRow>
      </Panel>

      <Label style={{ marginTop: space.xxl }}>{t('teen.allTimeLabel')}</Label>
      <Panel>
        <TText variant="bodyStrong">{t('walk.lifetime', { count: data.walk.lifetimeSteps })}</TText>
        <Bar
          value={milestoneProgress(data.walk.lifetimeSteps)}
          accent="violet"
          style={{ marginTop: space.md }}
        />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {upcoming === null
            ? t('walk.allMilestones')
            : t('walk.nextMilestone', { count: upcoming - data.walk.lifetimeSteps })}
        </TText>

        <Rule style={{ marginVertical: space.lg }} />

        {/* Says plainly what is and is not measured, on the child's own screen. */}
        <TText variant="label">{t('walk.privacyTitle')}</TText>
        <TText variant="caption" color={ink.body} style={{ marginTop: space.xs }}>
          {t('walk.privacyBody')}
        </TText>
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {t('walk.coinNote')}
        </TText>
      </Panel>
    </TScreen>
  );
}
