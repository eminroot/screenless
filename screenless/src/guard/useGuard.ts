import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  applyPlan,
  drainState,
  getCapability,
  getDeviceUsage,
  getUsage,
  isGuardNativeAvailable,
  liftGuard,
  presentPicker,
  requestAuthorization,
  selectionCount,
  stopGuard,
  type NativeCapability,
} from '../../modules/screen-guard';
import { dayKey } from '../engine/progress';
import { useI18n } from '../i18n';
import { presentNudge, renderNudgeList } from '../lib/screen-nudge';
import { useApp } from '../state/app-state';
import {
  addAppTime,
  budgetSeconds,
  decide,
  fractionUsed,
  minuteOfDay,
  remainingSeconds,
  rollover,
  setDeviceUsage,
  setUsage,
  takeGrace,
  totalSeconds,
} from './budget';
import { nextNudge, plannedNudges, recordNudge } from './nudge';
import type { GuardCapability, GuardDecision, GuardPermission } from './types';

/**
 * Joins the rules to the platform.
 *
 * The division of labour, which is the whole architecture of this feature:
 *
 * - `budget.ts` and `nudge.ts` own every rule and are unit tested.
 * - The native watchers own nothing but seconds and a shield, and run a flat
 *   plan that this hook compiles for them.
 * - This hook is the only place the two meet.
 *
 * It re-syncs whenever the app comes back to the foreground, because that is
 * when the child has just been somewhere else and the numbers have moved. It
 * does not poll while the app is open: the watcher is already doing that, and
 * a second timer would only drain the battery to tell us something we are
 * about to be told anyway.
 *
 * ## Who actually posts a reminder
 *
 * Whichever one can. On Android with usage access the watcher does, because it
 * is the only thing running when it matters: the child is in another app, this
 * hook is not executing, and a reminder that only arrives when ScreenLess is
 * already open is a reminder nobody needed. The copy is rendered here and
 * handed down as a list, so every decision about language, age band and which
 * suggestion comes next still happens in TypeScript.
 *
 * Where there is no watcher, meaning iOS, Expo Go and the web, this hook posts
 * them itself against whatever time it can see. The two cannot collide: they
 * share the same counter, and the app folds the watcher's count in before it
 * decides whether anything is due.
 */

/** Twelve hours of half-hourly reminders, which no day will exhaust. */
const PLANNED_NUDGES = 24;

export function useGuard() {
  const { t } = useI18n();
  const { data, setGuardDay, setGuardConfig } = useApp();
  const config = data.guard;
  const profile = data.profile;
  const [capability, setCapability] = useState<NativeCapability>(() => getCapability());

  const today = dayKey();
  const day = useMemo(() => rollover(data.guardDay, today), [data.guardDay, today]);

  /** The last plan handed to the watcher, so an identical one is not re-sent. */
  const lastPlan = useRef<string | null>(null);

  /* ------------------------------------------------------------ capability */

  const refreshCapability = useCallback(() => {
    setCapability(getCapability());
  }, []);

  useEffect(() => {
    // Android sends the parent into Settings with no way to call us back, so
    // the only reliable moment to re-check is when they return.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshCapability();
    });
    return () => sub.remove();
  }, [refreshCapability]);

  /* --------------------------------------------------------- the date moves */

  /**
   * Makes sure the stored day is today's, whatever platform this is.
   *
   * It has to be here rather than folded into the native sync, because the
   * native sync returns immediately when there is no watcher: on iOS, on the
   * web and in Expo Go the date would otherwise never be written at all. A
   * fresh install starts with an empty date, and a day with no date is dropped
   * from the report, so without this a phone could run for a week and send
   * nothing.
   *
   * Writing it is also what banks yesterday. `setGuardDay` pushes the day
   * being replaced into the queue, so this is the line that stops a phone left
   * open past midnight losing the whole of the day before.
   */
  useEffect(() => {
    if (data.guardDay.date !== today) setGuardDay(rollover(data.guardDay, today));
  }, [data.guardDay, today, setGuardDay]);

  /* --------------------------------------------------- time inside this app */

  /**
   * The one screen time figure that works everywhere.
   *
   * Android measures the whole phone and iOS measures nothing at all, but both
   * can watch this app's own foreground time, and it needs no permission. On
   * iOS it is the only number a parent will ever see; everywhere else it is
   * how much of the child's screen time was this app rather than something
   * else, which is worth knowing on its own.
   */
  const latest = useRef({ day: data.guardDay, setGuardDay });
  latest.current = { day: data.guardDay, setGuardDay };

  useEffect(() => {
    let since = Date.now();

    const flush = () => {
      const seconds = (Date.now() - since) / 1000;
      since = Date.now();
      if (seconds < 1) return;
      const { day: current, setGuardDay: write } = latest.current;
      write(addAppTime(rollover(current, dayKey()), seconds));
    };

    // Banked every couple of minutes rather than only on the way out, so a
    // child who plays for an hour and then has the phone taken away mid-app
    // does not lose the hour. Two minutes is a good trade: the granularity is
    // finer than anything the parent's chart shows, and it costs one small
    // write to storage.
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') flush();
    }, 120_000);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') since = Date.now();
      else flush();
    });

    return () => {
      flush();
      clearInterval(timer);
      sub.remove();
    };
    // Subscribed once and left alone. Everything that changes is read through
    // `latest`, so a re-subscribe cannot drop the running count on the floor.
  }, []);

  /* ----------------------------------------------------------------- sync */

  /**
   * Pulls what happened while the app was closed, folds it in, and pushes a
   * fresh plan back down.
   */
  const sync = useCallback(() => {
    if (!isGuardNativeAvailable) return;

    let next = rollover(data.guardDay, today);

    // What the watcher measured.
    const native = drainState();
    if (native && native.day === today) {
      if (typeof native.usedSec === 'number') next = setUsage(next, native.usedSec);
      if (typeof native.deviceSec === 'number') next = setDeviceUsage(next, native.deviceSec);
      // Reminders the watcher posted while we were away. Taken as the larger
      // of the two counts rather than added, because on Android the watcher is
      // the only thing that posts and this is the authoritative figure.
      if (typeof native.nudgesSent === 'number' && native.nudgesSent > next.nudgeCount) {
        next = { ...next, nudgeCount: native.nudgesSent };
      }
    }

    // Android can also be asked directly, which is more accurate than the
    // running tally after the service has been restarted by the system.
    if (Platform.OS === 'android') {
      if (config.watched.length > 0) {
        const samples = getUsage(config.watched);
        if (samples.length > 0) next = setUsage(next, totalSeconds(samples));
      }
      next = setDeviceUsage(next, getDeviceUsage());
    }

    // The child pressed the extend button on the shield while we were away.
    if (native?.graceRequestedFor === today) {
      next = takeGrace(config, next);
    }

    if (next !== data.guardDay) setGuardDay(next);

    // Compile the plan. The native side gets a limit, a window and a list of
    // sentences, never a rule.
    const limitSec = budgetSeconds(config) + Math.max(0, next.graceLeftSec);
    const gracesLeft = Math.max(0, config.graceCount - next.gracesUsed);
    const band = profile?.ageBand ?? '6-9';
    const buddyName = profile?.buddyName ?? '';
    const planned = plannedNudges(config, next, PLANNED_NUDGES);
    const rendered = renderNudgeList(t, band, buddyName, planned);

    const plan = {
      enabled: config.enabled && !next.liftedByParent,
      tier: config.tier,
      packages: config.watched,
      limitSec,
      curfewStartMin: config.curfew?.startMin ?? -1,
      curfewEndMin: config.curfew?.endMin ?? -1,
      day: today,
      blockTitle: t('guard.shieldTitle'),
      blockBody:
        config.tier === 'block' ? t('guard.shieldBodyBlock') : t('guard.shieldBodyInterrupt'),
      graceLabel: t('guard.shieldGrace', { count: config.graceMinutes }),
      graceAvailable: config.tier === 'interrupt' && gracesLeft > 0,
      notificationTitle: t('guard.serviceTitle'),
      notificationBody: t('guard.serviceBody'),
      nudgeEverySec: Math.max(0, Math.round(config.nudgeEveryMin * 60)),
      nudgeTitles: rendered.titles,
      nudgeBodies: rendered.bodies,
      nudgeChannelName: t('nudge.channelName'),
    };

    // Pushed down only when it actually changed.
    //
    // `apply` restarts the watcher, and this hook runs on every tick of the
    // app time counter, so re-applying unconditionally would stop and start a
    // foreground service every couple of minutes all day. Comparing the
    // compiled plan is the cheapest way to tell, and it is exact: the plan is
    // the entire contract with the native side.
    const encoded = JSON.stringify(plan);
    if (encoded === lastPlan.current) return true;
    lastPlan.current = encoded;
    return applyPlan(plan);
  }, [config, data.guardDay, today, setGuardDay, t, profile]);

  useEffect(() => {
    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [sync]);

  /* -------------------------------------------------------- posting a nudge */

  /**
   * The fallback path, for every platform without a watcher.
   *
   * Runs only when the native side cannot post: on Android the service owns
   * this entirely and firing here as well would double every reminder. On iOS
   * and in Expo Go it is this or nothing.
   *
   * A reminder is only written into the day once it has actually gone out.
   * Marking one as delivered that a denied permission swallowed would silence
   * that checkpoint for the rest of the day.
   */
  /**
   * Whether something other than this hook will post the reminders.
   *
   * Android: the foreground service does, as soon as usage access is granted,
   * because that is when it runs at all.
   *
   * iOS: the monitor extension does, but only while the plan is actually
   * armed. Apple's thresholds are registered when a limit is applied, so with
   * the guard off or no apps picked nothing over there will ever fire and this
   * hook is the only thing left.
   */
  const watcherPosts =
    isGuardNativeAvailable &&
    (Platform.OS === 'android'
      ? capability.canReadUsage
      : capability.canEnforce && config.enabled && config.tier !== 'off');

  useEffect(() => {
    if (watcherPosts || !profile) return;
    const due = nextNudge(config, day, minuteOfDay());
    if (!due) return;

    let cancelled = false;
    void presentNudge({
      t,
      band: profile.ageBand,
      buddyName: profile.buddyName,
      nudge: due,
    }).then((sent) => {
      if (sent && !cancelled) {
        setGuardDay(recordNudge(day, due, Date.now(), config.nudgeEveryMin));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [watcherPosts, config, day, profile, setGuardDay, t]);

  /* ------------------------------------------------------------- readouts */

  const decision: GuardDecision = useMemo(
    () => decide(config, day, minuteOfDay()),
    [config, day],
  );

  const capabilities: GuardCapability = useMemo(
    () => ({
      available: capability.available,
      canReadUsage: capability.canReadUsage,
      canEnforce: capability.canEnforce,
      missing: capability.missing as GuardPermission[],
    }),
    [capability],
  );

  /* -------------------------------------------------------------- actions */

  const setUp = useCallback(async () => {
    if (Platform.OS === 'ios') {
      const granted = await requestAuthorization();
      if (granted && selectionCount() === 0) await presentPicker();
      refreshCapability();
      return granted;
    }
    return false;
  }, [refreshCapability]);

  const pickApps = useCallback(async () => {
    const picked = await presentPicker();
    refreshCapability();
    return picked;
  }, [refreshCapability]);

  const disable = useCallback(() => {
    stopGuard();
    setGuardConfig({ ...config, enabled: false });
  }, [config, setGuardConfig]);

  const liftToday = useCallback(() => {
    liftGuard();
    setGuardDay({ ...day, liftedByParent: true });
  }, [day, setGuardDay]);

  return {
    /** The parent's settings. */
    config,
    /** Today so far. On iOS `usedSec` stays zero: Apple reports no figures. */
    day,
    decision,
    capabilities,
    /** Zero to one. Meaningless on iOS, where nothing can be measured. */
    fraction: fractionUsed(config, day),
    remainingSec: remainingSeconds(config, day),
    /** iOS cannot show minutes, so the UI shows state instead. */
    showsMinutes: capability.canReadUsage,
    refreshCapability,
    sync,
    setUp,
    pickApps,
    disable,
    liftToday,
  };
}
