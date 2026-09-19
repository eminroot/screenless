import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, RefreshControl, View, useWindowDimensions } from 'react-native';

import * as api from '../../../api/client';
import type { Child, Limits, Summary } from '../../../api/types';
import {
  CategoryBar,
  DayBars,
  Legend,
  Ring,
  StatTile,
  WeekdayBars,
  dayBarsMarkMissions,
} from '../../../components/charts';
import {
  Button,
  Card,
  Empty,
  Eyebrow,
  Loading,
  Notice,
  Rule,
  Screen,
  Segmented,
  TopBar,
  Txt,
} from '../../../components/ui';
import { useI18n, type TKey } from '../../../i18n';
import {
  formatCount,
  formatDayShort,
  formatSpan,
  splitSpan,
  weekdayLong,
} from '../../../lib/format';
import { useSession } from '../../../state/session';
import { colors, radii, spacing } from '../../../theme/tokens';

/**
 * One child, over one stretch of time.
 *
 * Ordered by what a parent actually wants to know, in the order they want it:
 *
 *   1. how much screen time, and which way is it going
 *   2. what happened instead
 *   3. which days are the problem
 *   4. is the limit doing anything
 *
 * Everything on this page is computed by the hub rather than here, so the two
 * apps cannot drift into disagreeing about what "average screen time" means in
 * front of the person paying for it.
 *
 * The honesty rule the whole screen turns on: a day the phone did not report
 * is drawn as a gap, never as zero, and every average says how many days it is
 * over. A dashboard that quietly treats a switched-off phone as a good day is
 * worse than no dashboard.
 */

const TIER_LABELS: Record<string, TKey> = {
  off: 'limits.tierOff',
  notice: 'limits.tierNotice',
  interrupt: 'limits.tierInterrupt',
  block: 'limits.tierBlock',
};

const CATEGORY_LABELS: Record<string, TKey> = {
  move: 'dash.catMove',
  outdoor: 'dash.catOutdoor',
  create: 'dash.catCreate',
  social: 'dash.catSocial',
  calm: 'dash.catCalm',
};

const CATEGORY_COLORS: Record<string, string> = {
  move: '#E8543F',
  outdoor: '#2F7D5B',
  create: '#C08A2E',
  social: '#4B4A7A',
  calm: '#7A9BB5',
};

export default function ChildDashboard() {
  const { t, language } = useI18n();
  const router = useRouter();
  const { token } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

  const [range, setRange] = useState<api.Range>('week');
  const [child, setChild] = useState<Child | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    const result = await api.fetchSummary(token, id, range);
    if (result.ok) {
      setChild(result.value.child);
      setLimits(result.value.limits);
      setSummary(result.value.summary);
      setError(null);
    } else if (result.error === 'notFound') {
      router.replace('/children');
    } else {
      setError(result.error === 'network' ? t('error.network') : t('error.server'));
    }
  }, [id, range, router, t, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = useCallback(() => {
    if (!token || !id || !child) return;
    const go = async () => {
      await api.removeChild(token, id);
      router.replace('/children');
    };

    const title = t('children.removeTitle', { name: child.name });
    const body = t('children.removeBody');

    if (Platform.OS === 'web') {
      const ask = (globalThis as { confirm?: (message: string) => boolean }).confirm;
      if (ask && ask(`${title}\n\n${body}`)) void go();
      return;
    }
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: () => void go() },
    ]);
  }, [child, id, router, t, token]);

  /* ------------------------------------------------------------- loading */

  if (!summary || !child || !limits) {
    return (
      <Screen>
        <TopBar title={child?.name} />
        {error ? <Notice text={error} /> : <Loading label={t('common.loading')} />}
      </Screen>
    );
  }

  const chartWidth = Math.max(240, width - spacing.gutter * 2 - spacing.lg * 2);
  const screen = splitSpan(summary.averages.screenSec);
  const reported = summary.totals.reportedDays;
  const nothingYet = reported === 0;
  const missingDays = summary.days.filter((day) => !day.reported).length;
  const marksMissions = dayBarsMarkMissions(summary.days.length, chartWidth);

  const heaviest = summary.weekdays.reduce(
    (best, entry) => (entry.screenSec > summary.weekdays[best].screenSec ? entry.weekday : best),
    0,
  );

  const categories = Object.entries(summary.categories).map(([key, value]) => ({
    key,
    value,
    color: CATEGORY_COLORS[key] ?? colors.screen,
  }));
  const categoryTotal = categories.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />
      }
    >
      <TopBar title={child.name} />

      {error ? <Notice text={error} /> : null}

      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: t('dash.week') },
          { value: 'month', label: t('dash.month') },
          { value: 'quarter', label: t('dash.quarter') },
        ]}
      />

      {nothingYet ? (
        <View style={{ marginTop: spacing.xl }}>
          <Empty title={t('dash.emptyTitle')} body={t('dash.emptyBody')} />
        </View>
      ) : (
        <>
          {/* --------------------------------------------------- headline */}
          <Card style={{ marginTop: spacing.lg, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <StatTile
                label={t('dash.screenTime')}
                value={screen.value}
                unit={`${screen.unit} ${t('dash.screenTimePerDay')}`}
                change={summary.change.screenPerDay}
                lowerIsBetter
              />
              <StatTile
                label={t('dash.missions')}
                value={String(summary.totals.missionsDone)}
                change={summary.change.missionsDone}
              />
            </View>
            <Rule />
            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <StatTile
                label={t('dash.active')}
                value={String(summary.totals.activeMin)}
                unit="min"
                change={summary.change.activeMin}
              />
              <StatTile
                label={t('dash.steps')}
                value={formatCount(summary.totals.steps, language)}
                change={summary.change.steps}
              />
            </View>
            <Txt variant="tiny" color={colors.inkFaint} numbers>
              {reported === 1
                ? t('dash.reportedOne')
                : t('dash.reportedDays', { reported, total: summary.range.days })}
              {summary.previous.reportedDays > 0
                ? ` · ${t('dash.vsPrevious', { days: summary.range.days })}`
                : ''}
            </Txt>
          </Card>

          {/* ------------------------------------------------- day by day */}
          <Eyebrow style={{ marginTop: spacing.xl }}>{t('dash.dailyTitle')}</Eyebrow>
          <Card style={{ gap: spacing.md }}>
            <DayBars
              days={summary.days}
              budgetMin={limits.enabled ? limits.dailyBudgetMin : 0}
              width={chartWidth}
            />
            <Legend
              items={[
                { color: colors.screen, label: t('dash.dailyLegendScreen') },
                // Coral is the loudest thing in the chart and used to go
                // unnamed here.
                ...(limits.enabled
                  ? [{ color: colors.accent, label: t('dash.dailyLegendOver') }]
                  : []),
                ...(marksMissions
                  ? [
                      {
                        color: colors.screen,
                        dot: colors.paper,
                        label: t('dash.dailyLegendMissions'),
                      },
                    ]
                  : []),
                ...(missingDays > 0 ? [{ color: colors.gap, label: t('common.noData') }] : []),
              ]}
            />
            {/* The rule this app rests on, said only when there is something to
                say it about. On a complete stretch it was a paragraph
                explaining an absence nobody could see. */}
            {missingDays > 0 ? (
              <Txt variant="tiny" color={colors.inkFaint}>
                {t('dash.gapNote')}
              </Txt>
            ) : null}
          </Card>

          {/* ---------------------------------------------------- the limit */}
          <Eyebrow style={{ marginTop: spacing.xl }}>{t('dash.limitTitle')}</Eyebrow>
          <Card style={{ gap: spacing.md }}>
            <Txt variant="heading">
              {limits.enabled
                ? t('dash.limitSet', {
                    time: formatSpan(limits.dailyBudgetMin * 60),
                    tier: t(TIER_LABELS[limits.tier] ?? 'limits.tierNotice').toLowerCase(),
                  })
                : t('dash.limitOff')}
            </Txt>
            {limits.enabled ? (
              <Txt
                variant="body"
                color={summary.totals.overLimitDays > 0 ? colors.warn : colors.good}
                numbers
              >
                {summary.totals.overLimitDays > 0
                  ? t('dash.overLimitDays', { count: summary.totals.overLimitDays, reported })
                  : t('dash.withinLimit')}
              </Txt>
            ) : null}
            <Button
              label={t('dash.editLimit')}
              tone="quiet"
              size="md"
              onPress={() => router.push(`/child/${child.id}/limits`)}
            />
          </Card>

          {/* -------------------------------------------- day of the week */}
          <Eyebrow style={{ marginTop: spacing.xl }}>{t('dash.weekdayTitle')}</Eyebrow>
          <Card style={{ gap: spacing.md }}>
            <WeekdayBars weekdays={summary.weekdays} width={chartWidth} />
            {summary.weekdays[heaviest].days > 0 ? (
              <Txt variant="body" color={colors.inkSoft}>
                {t('dash.weekdayHeaviest', {
                  day: weekdayLong(heaviest, language),
                  time: formatSpan(summary.weekdays[heaviest].screenSec),
                })}
              </Txt>
            ) : null}
          </Card>

          {/* ------------------------------------------ balance and nudges */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
            <View style={{ flex: 1 }}>
              <Eyebrow>{t('dash.balance')}</Eyebrow>
              <Card style={{ alignItems: 'center', gap: spacing.sm }}>
                <Ring percent={summary.balance ?? 0} color={colors.good} />
                <Txt variant="tiny" color={colors.inkFaint} center>
                  {t('dash.balanceBody')}
                </Txt>
              </Card>
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>{t('dash.remindersTitle')}</Eyebrow>
              <Card style={{ alignItems: 'center', gap: spacing.sm }}>
                {summary.nudgeResponse === null ? (
                  <>
                    <Ring percent={0} color={colors.rule} />
                    <Txt variant="tiny" color={colors.inkFaint} center>
                      {t('dash.remindersNone')}
                    </Txt>
                  </>
                ) : (
                  <>
                    {/* Green, not coral. Reminders being acted on is the good
                        outcome, and coral here painted the better of the two
                        numbers on this row as the alarm. */}
                    <Ring percent={summary.nudgeResponse} color={colors.good} />
                    <Txt variant="tiny" color={colors.inkFaint} center numbers>
                      {t('dash.remindersBody', {
                        shown: summary.totals.nudges,
                        heeded: summary.totals.nudgeHeeded,
                      })}
                    </Txt>
                  </>
                )}
              </Card>
            </View>
          </View>

          {/* ------------------------------------------------- categories */}
          {categoryTotal > 0 ? (
            <>
              <Eyebrow style={{ marginTop: spacing.xl }}>{t('dash.categoryTitle')}</Eyebrow>
              <Card style={{ gap: spacing.md }}>
                <CategoryBar counts={categories} width={chartWidth} />
                <View style={{ gap: spacing.sm }}>
                  {categories
                    .filter((entry) => entry.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .map((entry) => (
                      <View
                        key={entry.key}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                      >
                        <View
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: radii.pill,
                            backgroundColor: entry.color,
                          }}
                        />
                        <Txt variant="body" style={{ flex: 1 }}>
                          {t(CATEGORY_LABELS[entry.key] ?? 'dash.catMove')}
                        </Txt>
                        <Txt variant="bodyStrong" numbers>
                          {entry.value}
                        </Txt>
                      </View>
                    ))}
                </View>
              </Card>
            </>
          ) : null}

          {/* ------------------------------------------------- best days */}
          {summary.best.missions || summary.best.steps ? (
            <>
              <Eyebrow style={{ marginTop: spacing.xl }}>{t('dash.bestTitle')}</Eyebrow>
              <Card style={{ gap: spacing.sm }}>
                {summary.best.missions && summary.best.missions.value > 0 ? (
                  <Txt variant="body" numbers>
                    {t('dash.bestMissions', {
                      count: summary.best.missions.value,
                      date: formatDayShort(summary.best.missions.date, language),
                    })}
                  </Txt>
                ) : null}
                {summary.best.steps && summary.best.steps.value > 0 ? (
                  <Txt variant="body" numbers>
                    {t('dash.bestSteps', {
                      count: formatCount(summary.best.steps.value, language),
                      date: formatDayShort(summary.best.steps.date, language),
                    })}
                  </Txt>
                ) : null}
              </Card>
            </>
          ) : null}
        </>
      )}

      <Button
        label={t('common.remove')}
        tone="danger"
        size="md"
        onPress={remove}
        style={{ marginTop: spacing.xxl }}
      />
    </Screen>
  );
}
