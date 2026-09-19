import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';

import { collectionShelf, summarise, placeTally, treeHeadline, treeStatus } from '../../engine/find-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { Button } from '../components/Button';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { Bar, StatCard } from '../components/Stat';
import { Card, CardButton, IconTile, Stamp } from '../components/Surface';
import { ChevronIcon, LeafIcon, LockIcon, SearchIcon, TargetIcon, TreeIcon } from '../icons';
import { accents, border, ink, palette, radius, space } from '../theme';

/**
 * The cabinet, for ages 6 to 9.
 *
 * Three across rather than two, because at this age the point of a collection
 * is seeing the whole set at once — which ones are filled and, far more
 * usefully, which ones are not. An empty slot is the only thing on this screen
 * that makes anybody go outside.
 *
 * A found kind is filled in with the child's own photograph. Their blurry
 * pigeon is the pigeon card, and that is the part they show their grandmother.
 * Nothing here earns a star: the reward is the card and the fact behind it.
 */
export function JuniorFinds() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { data } = useApp();

  const shelf = useMemo(() => collectionShelf(data.collection), [data.collection]);
  const totals = useMemo(() => summarise(data.collection), [data.collection]);
  const places = useMemo(() => placeTally(data.collection), [data.collection]);
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const headline = treeHeadline(tree);

  return (
    <JScreen
      header={
        <View>
          <JText variant="title" color={ink.onGround}>{t('collection.title')}</JText>
          <JText variant="small" color={ink.onGroundMuted}>
            {t('collection.subtitle', { found: totals.kindsFound, total: totals.kindsTotal })}
          </JText>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard
          icon={<SearchIcon size={24} color={accents.teal.base} />}
          value={`${totals.kindsFound}/${totals.kindsTotal}`}
          label={t('junior.kindsLabel')}
          accent="teal"
        />
        <StatCard
          icon={<TargetIcon size={24} color={accents.violet.base} />}
          value={`${totals.factsKnown}/${totals.factsTotal}`}
          label={t('junior.factsLabel')}
          accent="violet"
        />
      </View>

      <Card style={{ marginTop: space.md }}>
        <Bar
          value={totals.kindsTotal > 0 ? totals.kindsFound / totals.kindsTotal : 0}
          accent="teal"
          accessibilityLabel={t('collection.subtitle', {
            found: totals.kindsFound,
            total: totals.kindsTotal,
          })}
        />
        <JText variant="small" color={ink.muted} style={{ marginTop: space.sm }}>
          {t('collection.factsLine', { known: totals.factsKnown, total: totals.factsTotal })}
        </JText>
      </Card>

      {/* The tree friend. One named tree near home, photographed from the same
          spot every fortnight — the one thing in the app that cannot be hurried. */}
      <CardButton
        accent="teal"
        accessibilityLabel={data.tree ? data.tree.name : t('collection.adoptCard')}
        onPress={() => router.push('/tree')}
        padded={false}
        style={{ marginTop: space.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
          <IconTile accent="teal" size={48}>
            <TreeIcon size={24} />
          </IconTile>
          <View style={{ flex: 1, gap: 2 }}>
            <JText variant="caption" color={accents.teal.base}>
              {data.tree ? t('collection.treeCard').toUpperCase() : t('collection.adoptCard').toUpperCase()}
            </JText>
            <JText variant="bodyStrong" numberOfLines={2}>
              {data.tree
                ? t(`tree.headline${capitalise(headline.key)}` as TKey, {
                    name: data.tree.name,
                    days: headline.days,
                  })
                : t('tree.adoptBody')}
            </JText>
            {tree && tree.visits > 0 ? (
              <JText variant="small" color={ink.muted}>
                {t('tree.visits', { count: tree.visits })} ·{' '}
                {t('tree.seasonsSeen', { count: tree.seasons.length })}
              </JText>
            ) : null}
          </View>
          <ChevronIcon size={20} />
        </View>
      </CardButton>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Button
          label={t('collection.goFind')}
          icon={<SearchIcon size={22} />}
          onPress={() => router.push('/collect')}
        />
        {data.collection.length >= 2 ? (
          <Button
            label={t('collection.compare')}
            kind="cream"
            size="md"
            onPress={() => router.push('/compare')}
          />
        ) : null}
      </View>

      <Stamp accent="teal" style={{ marginTop: space.xxl }}>{t('junior.kitStamp')}</Stamp>

      {data.collection.length === 0 ? (
        <Card style={{ marginBottom: space.md }}>
          <JText variant="read" color={ink.body}>
            {t('collection.empty')}
          </JText>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {shelf.map((entry) => {
          const found = entry.finds.length > 0;
          return (
            <CardButton
              key={entry.kind.id}
              accessibilityLabel={pick(entry.kind.name)}
              disabled={!found}
              onPress={() => router.push({ pathname: '/find', params: { kind: entry.kind.id } })}
              padded={false}
              style={{ flexBasis: '30%', flexGrow: 1 }}
            >
              <View
                style={{
                  aspectRatio: 1,
                  borderTopLeftRadius: radius.card - border.ink,
                  borderTopRightRadius: radius.card - border.ink,
                  backgroundColor: found ? accents.teal.tint : palette.sunken,
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
                ) : found ? (
                  <JText variant="banner">{entry.kind.emoji}</JText>
                ) : (
                  <LockIcon size={26} />
                )}
              </View>
              <View style={{ padding: space.sm, gap: 1 }}>
                <JText variant="caption" numberOfLines={1} color={found ? ink.strong : ink.muted}>
                  {pick(entry.kind.name)}
                </JText>
                <JText variant="caption" numberOfLines={1} color={ink.muted} style={{ fontSize: 12 }}>
                  {found ? t('collection.found', { count: entry.finds.length }) : t('collection.notFound')}
                </JText>
              </View>
            </CardButton>
          );
        })}
      </View>

      {places.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
          <LeafIcon size={18} />
          <JText variant="small" color={ink.muted} style={{ flex: 1 }}>
            {t('collection.placeTally', {
              place: t(`findPlaces.${places[0].place}` as TKey).toLowerCase(),
            })}
          </JText>
        </View>
      ) : null}
    </JScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
