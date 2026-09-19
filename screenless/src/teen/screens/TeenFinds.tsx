import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';

import { collectionShelf, summarise, placeTally, treeHeadline, treeStatus } from '../../engine/find-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { Button } from '../components/Button';
import { Bar, Stat, StatRow } from '../components/Stat';
import { Dot, Label, Panel, PanelButton, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { ChevronIcon, LockIcon, SearchIcon, TreeIcon } from '../icons';
import { border, radius, space } from '../theme';
import { useSkin } from '../skin';

/**
 * The collection, for ages 10 to 13.
 *
 * Three across on a dark grid, with the empty slots left visibly empty. The
 * gap is the mechanic — a set with two of twelve filled is a far better reason
 * to go outside than any number of encouraging sentences.
 *
 * A found kind is filled with the child's own photograph. Nothing here earns a
 * star: the payoff is the card and the fact behind it.
 */
export function TeenFinds() {
  const { palette, ink, accents } = useSkin();
  const router = useRouter();
  const { t, pick } = useI18n();
  const { data } = useApp();

  const shelf = useMemo(() => collectionShelf(data.collection), [data.collection]);
  const totals = useMemo(() => summarise(data.collection), [data.collection]);
  const places = useMemo(() => placeTally(data.collection), [data.collection]);
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const headline = treeHeadline(tree);

  return (
    <TScreen
      header={
        <View>
          <TText variant="label" color={ink.muted}>
            {t('teen.tabFinds')}
          </TText>
          <TText variant="display">{t('collection.title')}</TText>
        </View>
      }
    >
      <Panel>
        <StatRow>
          <Stat value={`${totals.kindsFound}/${totals.kindsTotal}`} label={t('teen.kindsLabel')} accent="mint" />
          <Stat value={`${totals.factsKnown}/${totals.factsTotal}`} label={t('teen.factsLabel')} />
        </StatRow>
        <Bar
          value={totals.kindsTotal > 0 ? totals.kindsFound / totals.kindsTotal : 0}
          accent="mint"
          style={{ marginTop: space.lg }}
          accessibilityLabel={t('collection.subtitle', {
            found: totals.kindsFound,
            total: totals.kindsTotal,
          })}
        />
      </Panel>

      {/* One named tree near home, re-photographed from the same spot every
          fortnight. The only thing in the app that cannot be hurried. */}
      <PanelButton
        accent="mint"
        accessibilityLabel={data.tree ? data.tree.name : t('collection.adoptCard')}
        onPress={() => router.push('/tree')}
        style={{ marginTop: space.lg }}
        padded={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
          <Dot accent="mint">
            <TreeIcon size={18} color={accents.mint.bright} />
          </Dot>
          <View style={{ flex: 1, gap: 2 }}>
            <TText variant="label" color={accents.mint.bright}>
              {data.tree ? t('collection.treeCard') : t('collection.adoptCard')}
            </TText>
            <TText variant="bodyStrong" numberOfLines={2}>
              {data.tree
                ? t(`tree.headline${capitalise(headline.key)}` as TKey, {
                    name: data.tree.name,
                    days: headline.days,
                  })
                : t('tree.adoptBody')}
            </TText>
          </View>
          <ChevronIcon size={16} />
        </View>
      </PanelButton>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Button
          label={t('collection.goFind')}
          icon={<SearchIcon size={18} color={accents.acid.on} />}
          onPress={() => router.push('/collect')}
        />
        {data.collection.length >= 2 ? (
          <Button
            label={t('collection.compare')}
            kind="outline"
            size="md"
            onPress={() => router.push('/compare')}
          />
        ) : null}
      </View>

      <Label style={{ marginTop: space.xxl }}>{t('teen.setLabel')}</Label>

      {data.collection.length === 0 ? (
        <Panel style={{ marginBottom: space.md }}>
          <TText variant="body" color={ink.body}>
            {t('collection.empty')}
          </TText>
        </Panel>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {shelf.map((entry) => {
          const found = entry.finds.length > 0;
          return (
            <PanelButton
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
                  borderTopLeftRadius: radius.card - border.hair,
                  borderTopRightRadius: radius.card - border.hair,
                  backgroundColor: palette.sunken,
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
                  <TText variant="display">{entry.kind.emoji}</TText>
                ) : (
                  <LockIcon size={18} color={ink.muted} />
                )}
              </View>
              <Rule />
              <View style={{ padding: space.sm, gap: 1 }}>
                <TText variant="caption" numberOfLines={1} color={found ? ink.strong : ink.muted}>
                  {pick(entry.kind.name)}
                </TText>
                <TText variant="label" numberOfLines={1} color={ink.muted} style={{ fontSize: 10 }}>
                  {found ? t('collection.found', { count: entry.finds.length }) : t('collection.notFound')}
                </TText>
              </View>
            </PanelButton>
          );
        })}
      </View>

      {places.length > 0 ? (
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.lg }}>
          {t('collection.placeTally', {
            place: t(`findPlaces.${places[0].place}` as TKey).toLowerCase(),
          })}
        </TText>
      ) : null}
    </TScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
