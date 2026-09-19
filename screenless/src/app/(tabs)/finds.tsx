import { useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, Sticker, Txt } from '../../components/ui';
import { collectionShelf, summarise, placeTally, treeHeadline, treeStatus } from '../../engine/find-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { useExperience } from '../../experience';
import { LittleFinds } from '../../little/screens/LittleFinds';
import { JuniorFinds } from '../../junior/screens/JuniorFinds';
import { TeenFinds } from '../../teen/screens/TeenFinds';

/**
 * The cabinet.
 *
 * Every kind is on the shelf whether the child has found it or not, because an
 * empty slot is the only thing here that makes anyone go outside. A found one
 * is filled in with the child's own photograph rather than an illustration:
 * their blurry pigeon is the pigeon card, and that is the part they show their
 * grandmother.
 */
export default function FindsRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleFinds />;
  if (experience === 'junior') return <JuniorFinds />;
  if (experience === 'teen') return <TeenFinds />;
  return <Finds />;
}

function Finds() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { data } = useApp();

  const shelf = useMemo(() => collectionShelf(data.collection), [data.collection]);
  const totals = useMemo(() => summarise(data.collection), [data.collection]);
  const places = useMemo(() => placeTally(data.collection), [data.collection]);
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const headline = treeHeadline(tree);

  return (
    <Screen>
      <Txt variant="title">{t('collection.title')}</Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('collection.subtitle', { found: totals.kindsFound, total: totals.kindsTotal })}
        {'  ·  '}
        {t('collection.factsLine', { known: totals.factsKnown, total: totals.factsTotal })}
      </Txt>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={data.tree ? data.tree.name : t('collection.adoptCard')}
        onPress={() => router.push('/tree')}
        style={{ marginTop: spacing.lg }}
      >
        <Sticker background={colors.success} style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Txt variant="tiny" color={colors.surface}>
            {data.tree ? t('collection.treeCard') : t('collection.adoptCard')}
          </Txt>
          <Txt variant="heading" color={colors.surface}>
            {data.tree
              ? t(`tree.headline${cap(headline.key)}` as TKey, {
                  name: data.tree.name,
                  days: headline.days,
                })
              : t('tree.adoptBody')}
          </Txt>
          {tree && tree.visits > 0 ? (
            <Txt variant="small" color={colors.surface}>
              {t('tree.visits', { count: tree.visits })}
              {'  ·  '}
              {t('tree.seasonsSeen', { count: tree.seasons.length })}
            </Txt>
          ) : null}
        </Sticker>
      </Pressable>

      <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
        <Button label={t('collection.goFind')} tone="primary" onPress={() => router.push('/collect')} />
        {data.collection.length >= 2 ? (
          <Button
            label={t('collection.compare')}
            tone="neutral"
            size="md"
            onPress={() => router.push('/compare')}
          />
        ) : null}
      </View>

      {data.collection.length === 0 ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('collection.empty')}
          </Txt>
        </Sticker>
      ) : null}

      <View style={grid}>
        {shelf.map((entry) => {
          const found = entry.finds.length > 0;
          return (
            <Pressable
              key={entry.kind.id}
              accessibilityRole="button"
              accessibilityLabel={pick(entry.kind.name)}
              accessibilityState={{ disabled: !found }}
              disabled={!found}
              onPress={() => router.push({ pathname: '/find', params: { kind: entry.kind.id } })}
              style={{ width: '47%' }}
            >
              <Sticker
                background={found ? entry.kind.color : colors.surface}
                offset={found ? 5 : 2}
                border={found ? borderWidth.thick : borderWidth.hair}
                style={{ padding: spacing.sm, gap: spacing.xs }}
              >
                <View
                  style={{
                    aspectRatio: 1,
                    borderRadius: radii.md,
                    borderWidth: borderWidth.hair,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {entry.cover ? (
                    <Image
                      source={{ uri: entry.cover }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Txt variant="display" style={{ opacity: found ? 1 : 0.18 }}>
                      {entry.kind.emoji}
                    </Txt>
                  )}
                </View>

                <Txt variant="bodyStrong" numberOfLines={1} color={found ? colors.surface : colors.textFaint}>
                  {pick(entry.kind.name)}
                </Txt>
                <Txt variant="tiny" numberOfLines={1} color={found ? colors.surface : colors.textFaint}>
                  {found
                    ? t('collection.found', { count: entry.finds.length })
                    : t('collection.notFound')}
                </Txt>
              </Sticker>
            </Pressable>
          );
        })}
      </View>

      {places.length > 0 ? (
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.lg }}>
          {t('collection.placeTally', {
            place: t(`findPlaces.${places[0].place}` as TKey).toLowerCase(),
          })}
        </Txt>
      ) : null}
    </Screen>
  );
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const grid = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.md,
  marginTop: spacing.lg,
} as const;
