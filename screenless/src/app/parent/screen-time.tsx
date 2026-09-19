import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { formatSpan } from '../../guard/budget';
import { GUARD_TIERS, type GuardTier } from '../../guard/types';
import { useGuard } from '../../guard/useGuard';
import {
  listApps,
  openOverlaySettings,
  openUsageAccessSettings,
  selectionCount,
  type NativeApp,
} from '../../../modules/screen-guard';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

const TIER_LABELS: Record<GuardTier, TKey> = {
  off: 'guard.tierOff',
  notice: 'guard.tierNotice',
  interrupt: 'guard.tierInterrupt',
  block: 'guard.tierBlock',
};

const TIER_BODIES: Record<GuardTier, TKey> = {
  off: 'guard.tierOffBody',
  notice: 'guard.tierNoticeBody',
  interrupt: 'guard.tierInterruptBody',
  block: 'guard.tierBlockBody',
};

const BUDGETS = [30, 45, 60, 90, 120];

/**
 * How often to tap the child on the shoulder.
 *
 * Fifteen is the shortest offered. Anything under that stops being a reminder
 * and becomes a metronome, and a child learns to ignore a metronome inside a
 * week. Zero is a real choice rather than a hidden switch: a family can take
 * the limit and leave the talking, or the talking and leave the limit.
 */
const NUDGE_INTERVALS = [0, 15, 30, 60];

/**
 * Where a parent sets up the daily app limit.
 *
 * The screen is arranged the way the feature escalates: what is watched, for
 * how long, and only then how hard the limit bites. A family that starts on
 * "warn only" and moves up a step a fortnight later gets far further than one
 * that starts by blocking, and putting the tiers in that order is the nudge.
 *
 * Everything here needs the parent code to reach, because it is the one screen
 * in the app that can take something away.
 */
export default function ScreenTimeSetup() {
  const { t } = useI18n();
  const { setGuardConfig } = useApp();
  const guard = useGuard();
  const [apps, setApps] = useState<NativeApp[] | null>(null);

  const config = guard.config;
  const iosPicked = Platform.OS === 'ios' ? selectionCount() : config.watched.length;

  const patch = useCallback(
    (next: Partial<typeof config>) => setGuardConfig({ ...config, ...next }),
    [config, setGuardConfig],
  );

  const loadApps = useCallback(() => {
    setApps(listApps().filter((app) => !app.system));
  }, []);

  const status = useMemo(() => {
    if (!config.enabled || config.tier === 'off') return t('guard.statusOff');
    if (guard.day.liftedByParent) return t('guard.statusLifted');
    if (guard.decision.reason === 'curfew') return t('guard.statusCurfew');
    if (guard.decision.remainingSec <= 0) return t('guard.statusSpent');
    return t('guard.statusUnder', { left: formatSpan(guard.decision.remainingSec) });
  }, [config, guard.day.liftedByParent, guard.decision, t]);

  /* ----------------------------------------------------- not on this device */

  if (!guard.capabilities.available) {
    return (
      <Screen>
        <TopBar />
        <Txt variant="title">{t('guard.title')}</Txt>
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs, marginTop: spacing.lg }}>
          <Txt variant="bodyStrong">{t('guard.unavailable')}</Txt>
          <Txt variant="small" color={colors.textSoft}>
            {t('guard.unavailableBody')}
          </Txt>
        </Sticker>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar />
      <Txt variant="title">{t('guard.title')}</Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('guard.subtitle')}
      </Txt>

      {/* ------------------------------------------------------- today so far */}
      <Sticker background={colors.info} style={{ padding: spacing.lg, gap: spacing.xs, marginTop: spacing.lg }}>
        <Txt variant="tiny" color={colors.surface}>
          {t('guard.title')}
        </Txt>
        <Txt variant="heading" color={colors.surface}>
          {status}
        </Txt>
        {!guard.showsMinutes ? (
          // iOS never hands an app the numbers, so saying so is better than
          // showing a zero that looks like a bug.
          <Txt variant="small" color={colors.surface}>
            {t('guard.iosNoMinutes')}
          </Txt>
        ) : null}
      </Sticker>

      {/* ---------------------------------------------------- what to turn on */}
      {guard.capabilities.missing.length > 0 ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Txt variant="subheading">{t('guard.setUpTitle')}</Txt>

          {guard.capabilities.missing.includes('usageAccess') ? (
            <Permission
              title={t('guard.usageAccess')}
              body={t('guard.usageAccessBody')}
              action={t('guard.openSettings')}
              onPress={() => {
                openUsageAccessSettings();
              }}
            />
          ) : null}

          {guard.capabilities.missing.includes('overlay') ? (
            <Permission
              title={t('guard.overlay')}
              body={t('guard.overlayBody')}
              action={t('guard.openSettings')}
              onPress={() => {
                openOverlaySettings();
              }}
            />
          ) : null}

          {guard.capabilities.missing.includes('familyControls') ? (
            <Permission
              title={t('guard.familyControls')}
              body={t('guard.familyControlsBody')}
              action={t('guard.grant')}
              onPress={() => void guard.setUp()}
            />
          ) : null}

          {guard.capabilities.missing.includes('appSelection') ? (
            <Permission
              title={t('guard.appSelection')}
              body={t('guard.appSelectionBody')}
              action={t('guard.pickApps')}
              onPress={() => void guard.pickApps()}
            />
          ) : null}
        </View>
      ) : null}

      {/* -------------------------------------------------------------- apps */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('guard.appsLabel')}
      </Txt>

      {Platform.OS === 'ios' ? (
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Txt variant="small" color={colors.textSoft}>
            {iosPicked > 0 ? t('guard.appsChosen', { count: iosPicked }) : t('guard.appsNone')}
          </Txt>
          <Button label={t('guard.pickApps')} tone="neutral" size="md" onPress={() => void guard.pickApps()} />
        </View>
      ) : (
        <View style={{ marginTop: spacing.md }}>
          <Txt variant="small" color={colors.textSoft}>
            {config.watched.length > 0
              ? t('guard.appsChosen', { count: config.watched.length })
              : t('guard.appsNone')}
          </Txt>

          {apps === null ? (
            <Button label={t('guard.pickApps')} tone="neutral" size="md" style={{ marginTop: spacing.md }} onPress={loadApps} />
          ) : (
            <ScrollView style={{ maxHeight: 280, marginTop: spacing.md }} nestedScrollEnabled>
              {apps.map((app) => {
                const on = config.watched.includes(app.id);
                return (
                  <Pressable
                    key={app.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={app.label}
                    onPress={() =>
                      patch({
                        watched: on
                          ? config.watched.filter((id) => id !== app.id)
                          : [...config.watched, app.id],
                      })
                    }
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        borderBottomWidth: borderWidth.hair,
                        borderColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: radii.sm,
                          borderWidth: borderWidth.thick,
                          borderColor: colors.border,
                          backgroundColor: on ? colors.success : colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {on ? <Txt variant="tiny" color={colors.surface}>✓</Txt> : null}
                      </View>
                      <Txt variant="body" style={{ flex: 1 }} numberOfLines={1}>
                        {app.label}
                      </Txt>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ------------------------------------------------------------ budget */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('guard.budgetLabel')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
        {BUDGETS.map((minutes) => (
          <Choice
            key={minutes}
            label={t('common.minutesShort', { count: minutes })}
            active={config.dailyBudgetMin === minutes}
            onPress={() => patch({ dailyBudgetMin: minutes })}
          />
        ))}
      </View>

      {/* --------------------------------------------------------- reminders */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('guard.nudgeLabel')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('guard.nudgeBody')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
        {NUDGE_INTERVALS.map((minutes) => (
          <Choice
            key={minutes}
            label={minutes === 0 ? t('guard.nudgeOff') : t('guard.nudgeEvery', { count: minutes })}
            active={config.nudgeEveryMin === minutes}
            onPress={() => patch({ nudgeEveryMin: minutes })}
          />
        ))}
      </View>
      {guard.day.nudgeCount > 0 ? (
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
          {t('guard.nudgeSentToday', { count: guard.day.nudgeCount })}
        </Txt>
      ) : null}

      {/* -------------------------------------------------------------- tier */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('guard.title')}
      </Txt>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {GUARD_TIERS.map((tier) => {
          const on = config.tier === tier;
          return (
            <Pressable
              key={tier}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(TIER_LABELS[tier])}
              onPress={() => patch({ tier, enabled: tier !== 'off' })}
            >
              <Sticker
                background={on ? colors.accent : colors.surface}
                offset={on ? 5 : 3}
                style={{ padding: spacing.lg, gap: spacing.xs }}
              >
                <Txt variant="bodyStrong">{t(TIER_LABELS[tier])}</Txt>
                <Txt variant="small" color={colors.textSoft}>
                  {t(TIER_BODIES[tier], { count: config.graceMinutes })}
                </Txt>
              </Sticker>
            </Pressable>
          );
        })}
      </View>

      {/* ------------------------------------------------------------ escape */}
      {config.enabled && config.tier !== 'off' ? (
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {guard.day.liftedByParent ? (
            <Txt variant="small" color={colors.textSoft} center>
              {t('guard.lifted')}
            </Txt>
          ) : (
            <Button label={t('guard.liftToday')} tone="neutral" size="md" onPress={guard.liftToday} />
          )}
          <Button label={t('guard.disable')} tone="ghost" size="md" onPress={guard.disable} />
        </View>
      ) : null}
    </Screen>
  );
}

/* -------------------------------------------------------------- components */

function Permission({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.sm }}>
      <Txt variant="bodyStrong">{title}</Txt>
      <Txt variant="small" color={colors.textSoft}>
        {body}
      </Txt>
      <Button label={action} tone="info" size="md" onPress={onPress} />
    </Sticker>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.info : colors.surface,
        borderRadius: radii.pill,
        borderWidth: borderWidth.thick,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      }}
    >
      <Txt variant="small" color={active ? colors.surface : colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}
