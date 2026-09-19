import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';

import { collectionShelf, summarise, treeHeadline, treeStatus } from '../../engine/find-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { ClayButton, ClayCard, ClayTile } from '../components/Clay';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { Meter } from '../components/Meter';
import { StatStrip } from '../components/StatStrip';
import { ExploreIcon, LockIcon, TargetIcon, TreeIcon } from '../icons';
import { ink, lip, round, space, tones, TONE_CYCLE } from '../theme';

/**
 * The cabinet, for ages 3 to 5.
 *
 * Every kind is on the shelf whether the child has found it or not, because an
 * empty slot is the only thing here that makes anyone go outside. A found one
 * is filled in with the child's own photograph rather than an illustration:
 * their blurry pigeon is the pigeon card, and that is the part they show their
 * grandmother.
 *
 * Nothing on this screen earns a star. The reward is the card.
 */
export function LittleFinds() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { data } = useApp();

  const shelf = useMemo(() => collectionShelf(data.collection), [data.collection]);
  const totals = useMemo(() => summarise(data.collection), [data.collection]);
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const headline = treeHeadline(tree);

  return (
    <LittleScreen header={<StatStrip />}>
      <LText variant="title">{t('collection.title')}</LText>

      <ClayCard style={{ padding: space.lg, gap: space.sm, marginTop: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <TargetIcon size={26} color={tones.bubble.face} />
          <LText variant="label" style={{ flex: 1 }}>
            {t('collection.subtitle', { found: totals.kindsFound, total: totals.kindsTotal })}
          </LText>
        </View>
        <Meter
          value={totals.kindsTotal > 0 ? totals.kindsFound / totals.kindsTotal : 0}
          tone="bubble"
          accessibilityLabel={t('collection.subtitle', { found: totals.kindsFound, total: totals.kindsTotal })}
        />
        <LText variant="small" color={ink.soft}>
          {t('collection.factsLine', { known: totals.factsKnown, total: totals.factsTotal })}
        </LText>
      </ClayCard>

      {/* The tree friend. One named tree near home, photographed from the same
          spot every fortnight — the only thing in the app that cannot be hurried. */}
      <ClayTile
        tone="aqua"
        accessibilityLabel={data.tree ? data.tree.name : t('collection.adoptCard')}
        onPress={() => router.push('/tree')}
        wrapperStyle={{ marginTop: space.lg }}
        style={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: round.md,
            backgroundColor: 'rgba(255,255,255,0.28)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TreeIcon size={46} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <LText variant="tiny" color={tones.aqua.ink}>
            {data.tree ? t('collection.treeCard') : t('collection.adoptCard')}
          </LText>
          <LText variant="heading" color={tones.aqua.ink} numberOfLines={3}>
            {data.tree
              ? t(`tree.headline${capitalise(headline.key)}` as TKey, { name: data.tree.name, days: headline.days })
              : t('tree.adoptBody')}
          </LText>
        </View>
      </ClayTile>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <ClayButton
          label={t('collection.goFind')}
          tone="mint"
          size="xl"
          icon={<ExploreIcon size={30} />}
          onPress={() => router.push('/collect')}
        />
        {data.collection.length >= 2 ? (
          <ClayButton label={t('collection.compare')} tone="white" size="md" onPress={() => router.push('/compare')} />
        ) : null}
      </View>

      {data.collection.length === 0 ? (
        <ClayCard style={{ padding: space.lg, marginTop: space.lg }}>
          <LText variant="body" color={ink.soft}>
            {t('collection.empty')}
          </LText>
        </ClayCard>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.lg }}>
        {shelf.map((entry, index) => {
          const found = entry.finds.length > 0;
          const tone = TONE_CYCLE[index % TONE_CYCLE.length];
          const palette = tones[tone];
          return (
            <ClayTile
              key={entry.kind.id}
              accessibilityLabel={pick(entry.kind.name)}
              onPress={() => {
                if (found) router.push({ pathname: '/find', params: { kind: entry.kind.id } });
              }}
              face={found ? palette.face : tones.white.face}
              lip={found ? palette.lip : tones.white.lip}
              depth={lip.md}
              radius={round.md}
              wrapperStyle={{ flexBasis: '47%', flexGrow: 1, opacity: found ? 1 : 0.78 }}
              style={{ padding: space.sm, gap: space.xs }}
            >
              <View
                style={{
                  aspectRatio: 1,
                  borderRadius: round.sm,
                  backgroundColor: found ? 'rgba(255,255,255,0.9)' : tones.white.soft,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {entry.cover ? (
                  <Image source={{ uri: entry.cover }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : found ? (
                  <LText variant="giant">{entry.kind.emoji}</LText>
                ) : (
                  <LockIcon size={44} />
                )}
              </View>

              <LText
                variant="label"
                numberOfLines={1}
                color={found ? palette.ink : ink.faint}
                style={{ paddingHorizontal: space.xs }}
              >
                {pick(entry.kind.name)}
              </LText>
              <LText
                variant="tiny"
                numberOfLines={1}
                color={found ? palette.ink : ink.faint}
                style={{ paddingHorizontal: space.xs, paddingBottom: space.xs }}
              >
                {found ? t('collection.found', { count: entry.finds.length }) : t('collection.notFound')}
              </LText>
            </ClayTile>
          );
        })}
      </View>
    </LittleScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
