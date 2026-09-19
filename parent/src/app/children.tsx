import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, View, useWindowDimensions } from 'react-native';

import * as api from '../api/client';
import type { ChildCard } from '../api/types';
import { MiniWeek } from '../components/charts';
import { Button, Card, Empty, Loading, Notice, Screen, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import { formatSpan, relativeTime } from '../lib/format';
import { useSession } from '../state/session';
import { colors, radii, spacing } from '../theme/tokens';

/**
 * Every child, with enough on each card to decide whether to open it.
 *
 * One request fills this whole screen: the hub returns today and a week of
 * bars alongside each child, because a list that costs one request per row
 * takes a second per child on a slow connection and a family with three
 * children would watch it fill in one at a time.
 *
 * Refetched on focus rather than cached, since the numbers move while a parent
 * is looking at something else, and a stale figure with no way to tell is the
 * one thing that would stop this being believed.
 */
export default function Children() {
  const { t, language } = useI18n();
  const router = useRouter();
  const { token, parent } = useSession();

  const [children, setChildren] = useState<ChildCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!token) return;
      if (!quiet) setError(null);
      const result = await api.listChildren(token);
      if (result.ok) {
        setChildren(result.value.children);
        setError(null);
      } else if (!quiet) {
        setError(result.error === 'network' ? t('error.network') : t('error.server'));
      }
    },
    [t, token],
  );

  /**
   * Refetched on focus, and only on focus.
   *
   * `children` must not be in these dependencies. It looks harmless and it is
   * an infinite request loop: `load` writes `children`, the new value changes
   * the callback's identity, the focus effect re-runs, and the list hammers
   * the server until the rate limiter starts answering 429. Whether this is
   * the first load is a ref, because it changes nothing on screen.
   */
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void load(loadedOnce.current);
      loadedOnce.current = true;
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (!token) return <Redirect href="/" />;

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />
      }
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xl,
          marginTop: spacing.sm,
        }}
      >
        <View>
          <Txt variant="title">{t('children.title')}</Txt>
          {parent ? (
            <Txt variant="tiny" color={colors.inkFaint}>
              {parent.name || parent.email}
            </Txt>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={{
            width: 38,
            height: 38,
            borderRadius: radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <Txt variant="heading" color={colors.inkSoft}>
            {'⚙'}
          </Txt>
        </Pressable>
      </View>

      {error ? <Notice text={error} /> : null}

      {children === null ? (
        <Loading label={t('common.loading')} />
      ) : children.length === 0 ? (
        <Empty
          title={t('children.emptyTitle')}
          body={t('children.emptyBody')}
          action={<Button label={t('children.add')} onPress={() => router.push('/add')} />}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {children.map((child) => (
            <ChildRow key={child.id} child={child} language={language} />
          ))}
          <Button
            label={t('children.add')}
            tone="quiet"
            onPress={() => router.push('/add')}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      )}
    </Screen>
  );
}

function ChildRow({ child, language }: { child: ChildCard; language: 'en' | 'tr' | 'az' }) {
  const { t } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const stripWidth = Math.min(140, Math.max(90, width * 0.28));

  const seen = relativeTime(child.lastReport, language);

  return (
    <Card onPress={() => router.push(`/child/${child.id}`)} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{child.name}</Txt>
          <Txt variant="tiny" color={colors.inkFaint} numbers>
            {child.streak > 0
              ? t('children.levelStreak', { level: child.level, streak: child.streak })
              : t('children.noStreak', { level: child.level })}
          </Txt>
        </View>
        <MiniWeek days={child.week} width={stripWidth} />
      </View>

      {!child.paired ? (
        <View
          style={{
            backgroundColor: colors.warnSoft,
            borderRadius: radii.sm,
            padding: spacing.sm,
          }}
        >
          <Txt variant="label" color={colors.warn}>
            {t('children.notPaired')}
          </Txt>
          <Txt variant="tiny" color={colors.inkSoft}>
            {t('children.notPairedBody')}
          </Txt>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Txt variant="bodyStrong" numbers style={{ flex: 1 }}>
            {child.today.reported
              ? t('children.todayScreen', { time: formatSpan(child.today.screenSec) })
              : t('children.neverReported')}
          </Txt>
          {child.today.missionsDone > 0 ? (
            <Txt variant="label" color={colors.active} numbers>
              {t('children.todayMissions', { count: child.today.missionsDone })}
            </Txt>
          ) : null}
        </View>
      )}

      {seen ? (
        <Txt variant="tiny" color={colors.inkFaint}>
          {t('children.lastSeen', { when: seen })}
        </Txt>
      ) : null}
    </Card>
  );
}
