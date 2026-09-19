import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import * as api from '../../../api/client';
import { TIERS, type Limits, type Tier } from '../../../api/types';
import {
  Button,
  Card,
  Eyebrow,
  Loading,
  Notice,
  OptionRow,
  Screen,
  Segmented,
  Switch,
  TopBar,
  Txt,
} from '../../../components/ui';
import { useI18n, type TKey } from '../../../i18n';
import { formatClock, formatSpan } from '../../../lib/format';
import { useSession } from '../../../state/session';
import { colors, spacing } from '../../../theme/tokens';

/**
 * Where a parent sets the daily limit.
 *
 * Laid out in the order the feature escalates, which is also the order a
 * family should adopt it: how long, how often to say something, only then how
 * hard it bites. Families who start on "warn only" and move up a step a
 * fortnight later get much further than ones who start by blocking, and
 * putting the tiers last is the nudge.
 *
 * Nothing here can force enforcement on. `enabled` means "the parent wants
 * this"; whether it can actually happen depends on two Android permissions
 * only a human standing at the child's phone can grant. The alternative is a
 * parent app that cheerfully reports a limit is running when nothing on the
 * child's phone is able to hold it.
 */

/**
 * Five, not six. `1h 30m` wraps onto two lines once a sixth segment is added
 * at phone width, and a control that reflows is a control that looks broken.
 */
const BUDGETS = [30, 60, 90, 120, 180];

/**
 * Fifteen is the shortest reminder offered. Anything under that stops being a
 * reminder and becomes a metronome, and a child learns to ignore a metronome
 * inside a week.
 */
const INTERVALS = [0, 15, 30, 60];

const CURFEW_STARTS = [-1, 19 * 60, 20 * 60, 21 * 60, 22 * 60];
const CURFEW_ENDS = [6 * 60, 7 * 60, 8 * 60];

const TIER_LABELS: Record<Tier, TKey> = {
  off: 'limits.tierOff',
  notice: 'limits.tierNotice',
  interrupt: 'limits.tierInterrupt',
  block: 'limits.tierBlock',
};

const TIER_BODIES: Record<Tier, TKey> = {
  off: 'limits.tierOffBody',
  notice: 'limits.tierNoticeBody',
  interrupt: 'limits.tierInterruptBody',
  block: 'limits.tierBlockBody',
};

export default function EditLimits() {
  const { t } = useI18n();
  const router = useRouter();
  const { token } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loaded, setLoaded] = useState<Limits | null>(null);
  const [draft, setDraft] = useState<Limits | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;
    void api.fetchSummary(token, id, 'week').then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setLoaded(result.value.limits);
        setDraft(result.value.limits);
      } else {
        setError(t('error.server'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, t, token]);

  const patch = useCallback((next: Partial<Limits>) => {
    setSaved(false);
    setDraft((current) => (current ? { ...current, ...next } : current));
  }, []);

  const dirty = useMemo(() => {
    if (!draft || !loaded) return false;
    return JSON.stringify({ ...draft, revision: 0 }) !== JSON.stringify({ ...loaded, revision: 0 });
  }, [draft, loaded]);

  const save = useCallback(async () => {
    if (!token || !id || !draft) return;
    setBusy(true);
    setError(null);
    const result = await api.saveLimits(token, id, {
      enabled: draft.enabled,
      tier: draft.tier,
      dailyBudgetMin: draft.dailyBudgetMin,
      nudgeEveryMin: draft.nudgeEveryMin,
      graceCount: draft.graceCount,
      graceMinutes: draft.graceMinutes,
      curfew:
        draft.curfewStartMin >= 0 && draft.curfewEndMin >= 0
          ? { startMin: draft.curfewStartMin, endMin: draft.curfewEndMin }
          : null,
    });
    setBusy(false);

    if (!result.ok) {
      setError(t('error.server'));
      return;
    }
    // The server clamps, so what comes back is the truth about what was saved.
    setLoaded(result.value.limits);
    setDraft(result.value.limits);
    setSaved(true);
  }, [draft, id, t, token]);

  if (!draft) {
    return (
      <Screen>
        <TopBar title={t('limits.title')} />
        {error ? <Notice text={error} /> : <Loading label={t('common.loading')} />}
      </Screen>
    );
  }

  const hasCurfew = draft.curfewStartMin >= 0 && draft.curfewEndMin >= 0;

  return (
    <Screen>
      <TopBar title={t('limits.title')} />

      {error ? <Notice text={error} /> : null}
      {saved ? <Notice text={t('common.saved')} tone="good" /> : null}

      <Txt variant="body" color={colors.inkSoft} style={{ marginBottom: spacing.xl }}>
        {t('limits.subtitle')}
      </Txt>

      {/* ------------------------------------------------------------- on */}
      <Card style={{ gap: spacing.sm }}>
        <Switch
          value={draft.enabled}
          label={t('limits.enabledLabel')}
          onChange={(enabled) => patch({ enabled })}
        />
        {!draft.enabled ? (
          <Txt variant="tiny" color={colors.inkFaint}>
            {t('limits.enabledOff')}
          </Txt>
        ) : null}
      </Card>

      {/* --------------------------------------------------------- budget */}
      <Eyebrow style={{ marginTop: spacing.xl }}>{t('limits.budgetLabel')}</Eyebrow>
      <Card style={{ gap: spacing.md }}>
        <Segmented
          value={draft.dailyBudgetMin}
          onChange={(dailyBudgetMin) => patch({ dailyBudgetMin })}
          options={BUDGETS.map((minutes) => ({
            value: minutes,
            label: formatSpan(minutes * 60),
          }))}
        />
        <Txt variant="tiny" color={colors.inkFaint}>
          {t('limits.budgetBody')}
        </Txt>
      </Card>

      {/* ------------------------------------------------------ reminders */}
      <Eyebrow style={{ marginTop: spacing.xl }}>{t('limits.nudgeLabel')}</Eyebrow>
      <Card style={{ gap: spacing.md }}>
        <Segmented
          value={draft.nudgeEveryMin}
          onChange={(nudgeEveryMin) => patch({ nudgeEveryMin })}
          options={INTERVALS.map((minutes) => ({
            value: minutes,
            label: minutes === 0 ? t('limits.nudgeOff') : t('common.minutesShort', { count: minutes }),
          }))}
        />
        <Txt variant="tiny" color={colors.inkFaint}>
          {t('limits.nudgeBody')}
        </Txt>
      </Card>

      {/* ----------------------------------------------------- quiet hours */}
      <Eyebrow style={{ marginTop: spacing.xl }}>{t('limits.curfewLabel')}</Eyebrow>
      <Card style={{ gap: spacing.md }}>
        <Txt variant="label" color={colors.inkSoft}>
          {t('limits.curfewFrom')}
        </Txt>
        <Segmented
          value={draft.curfewStartMin}
          onChange={(curfewStartMin) =>
            patch({
              curfewStartMin,
              // Turning the curfew on has to give it an end, or the window is
              // half written and the child's phone reads it as no curfew.
              curfewEndMin: curfewStartMin < 0 ? -1 : draft.curfewEndMin >= 0 ? draft.curfewEndMin : 7 * 60,
            })
          }
          options={CURFEW_STARTS.map((minutes) => ({
            value: minutes,
            label: minutes < 0 ? t('limits.curfewNone') : formatClock(minutes),
          }))}
        />
        {hasCurfew ? (
          <>
            <Txt variant="label" color={colors.inkSoft}>
              {t('limits.curfewTo')}
            </Txt>
            <Segmented
              value={draft.curfewEndMin}
              onChange={(curfewEndMin) => patch({ curfewEndMin })}
              options={CURFEW_ENDS.map((minutes) => ({
                value: minutes,
                label: formatClock(minutes),
              }))}
            />
          </>
        ) : null}
        <Txt variant="tiny" color={colors.inkFaint}>
          {t('limits.curfewBody')}
        </Txt>
      </Card>

      {/* ----------------------------------------------------------- tier */}
      <Eyebrow style={{ marginTop: spacing.xl }}>{t('limits.tierLabel')}</Eyebrow>
      <View style={{ gap: spacing.sm }}>
        {TIERS.map((tier) => (
          <OptionRow
            key={tier}
            title={t(TIER_LABELS[tier])}
            body={t(TIER_BODIES[tier])}
            selected={draft.tier === tier}
            onPress={() => patch({ tier })}
          />
        ))}
      </View>

      <Card tone="well" style={{ marginTop: spacing.xl }}>
        <Txt variant="tiny" color={colors.inkSoft}>
          {t('limits.appsNote')}
        </Txt>
      </Card>

      <Button
        label={busy ? t('limits.savingChanges') : t('limits.saveChanges')}
        onPress={() => void save()}
        disabled={!dirty}
        busy={busy}
        style={{ marginTop: spacing.xl }}
      />
      <Button
        label={t('common.back')}
        tone="ghost"
        size="md"
        onPress={() => router.back()}
        style={{ marginTop: spacing.sm }}
      />
    </Screen>
  );
}
