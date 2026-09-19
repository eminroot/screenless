import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, Sticker, TopBar, Txt } from '../components/ui';
import { findKind, isFindKind } from '../data/finds';
import { factsKnown, findEmoji, findName, knownFacts, variantFor } from '../engine/find-engine';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

/** One shelf of the cabinet: every one of these the child has found, and what they know. */
export default function FindDetail() {
  const router = useRouter();
  const { kind: raw } = useLocalSearchParams<{ kind?: string }>();
  const { t, pick } = useI18n();
  const { data, removeFind } = useApp();
  const [confirming, setConfirming] = useState<string | null>(null);

  const kindId = raw && isFindKind(raw) ? raw : null;
  const kind = kindId ? findKind(kindId) : null;

  const finds = useMemo(
    () => (kindId ? data.collection.filter((f) => f.kind === kindId).slice().reverse() : []),
    [data.collection, kindId],
  );
  const known = useMemo(() => factsKnown(data.collection), [data.collection]);
  const facts = useMemo(() => (kindId ? knownFacts(kindId, known) : []), [kindId, known]);

  /** Sub kinds the child has actually sorted, matched on the answer tag itself. */
  const foundTags = useMemo(() => {
    const tags = new Set<string>();
    for (const find of finds) {
      const variant = variantFor(find.kind, find.answers);
      if (variant) tags.add(variant.tag);
    }
    return tags;
  }, [finds]);

  if (!kind) {
    return (
      <Screen>
        <TopBar onBack={() => router.replace('/(tabs)/finds')} />
        <Txt variant="body">{t('collection.empty')}</Txt>
      </Screen>
    );
  }

  const left = kind.facts.length - facts.length;

  return (
    <Screen>
      <TopBar onBack={() => router.replace('/(tabs)/finds')} />

      <Sticker background={kind.color} style={{ padding: spacing.lg, gap: 2 }}>
        <Txt variant="display">{kind.emoji}</Txt>
        <Txt variant="title" color={colors.surface}>
          {pick(kind.name)}
        </Txt>
        <Txt variant="small" color={colors.surface}>
          {t('collection.found', { count: finds.length })}
        </Txt>
      </Sticker>

      {/* What the child knows so far, and how much is still out there. */}
      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('collection.knownFacts')}
      </Txt>
      {facts.length === 0 ? (
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
          {t('collection.noFactsYet')}
        </Txt>
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {facts.map((fact) => (
            <Sticker key={fact.id} background={colors.accent} style={{ padding: spacing.lg }}>
              <Txt variant="bodyStrong">{pick(fact.text)}</Txt>
            </Sticker>
          ))}
        </View>
      )}
      {left > 0 && finds.length > 0 ? (
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
          {t('collect.factLocked')}
        </Txt>
      ) : null}

      {/* Sub kinds the child sorted for themselves, which is the real taxonomy. */}
      {kind.variants.length > 0 ? (
        <>
          <Txt variant="heading" style={{ marginTop: spacing.xl }}>
            {t('collection.variants')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
            {kind.variants.map((variant) => {
              const got = foundTags.has(variant.tag);
              return (
                <Sticker
                  key={variant.tag}
                  background={got ? colors.success : colors.surface}
                  offset={got ? 4 : 2}
                  border={got ? borderWidth.thick : borderWidth.hair}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Txt variant="small" style={{ opacity: got ? 1 : 0.25 }}>
                    {variant.emoji}
                  </Txt>
                  <Txt variant="tiny" color={got ? colors.surface : colors.textFaint}>
                    {pick(variant.name)}
                  </Txt>
                </Sticker>
              );
            })}
          </View>
        </>
      ) : null}

      {/* The child's own photographs, newest first. */}
      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('collection.yourPhotos')}
      </Txt>
      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {finds.map((find) => (
          <Sticker key={find.id} background={colors.surface} style={{ padding: spacing.md, gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: radii.md,
                  borderWidth: borderWidth.hair,
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {find.photoUri ? (
                  <Image
                    source={{ uri: find.photoUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Txt variant="title">{findEmoji(find)}</Txt>
                )}
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {find.nickname || pick(findName(find))}
                </Txt>
                <Txt variant="tiny" color={colors.textSoft}>
                  {new Date(find.at).toLocaleDateString()}
                  {find.place ? `  ·  ${t(`findPlaces.${find.place}` as TKey)}` : ''}
                </Txt>
                {find.answers.length > 0 ? (
                  <AnswerRow kindId={kind.id} answers={find.answers} />
                ) : null}
              </View>
            </View>

            {confirming === find.id ? (
              <View style={{ gap: spacing.sm }}>
                <Txt variant="tiny" color={colors.textSoft}>
                  {t('collection.removeWarn')}
                </Txt>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label={t('collection.removeFind')}
                    tone="primary"
                    size="sm"
                    full={false}
                    onPress={() => {
                      removeFind(find.id);
                      setConfirming(null);
                    }}
                  />
                  <Button
                    label={t('common.cancel')}
                    tone="neutral"
                    size="sm"
                    full={false}
                    onPress={() => setConfirming(null)}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('collection.removeFind')}
                hitSlop={8}
                onPress={() => setConfirming(find.id)}
              >
                <Txt variant="tiny" color={colors.textFaint}>
                  {t('collection.removeFind')}
                </Txt>
              </Pressable>
            )}
          </Sticker>
        ))}
      </View>

      <Button
        label={t('collection.goFind')}
        tone="primary"
        style={{ marginTop: spacing.xl }}
        onPress={() => router.replace('/collect')}
      />
    </Screen>
  );
}

/** The child's own answers, so the card shows how they decided rather than a label. */
function AnswerRow({ kindId, answers }: { kindId: string; answers: string[] }) {
  const { pick } = useI18n();
  const kind = isFindKind(kindId) ? findKind(kindId) : null;
  if (!kind) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {answers.map((tag, index) => {
          const option = kind.questions[index]?.options.find((o) => o.tag === tag);
          if (!option) return null;
          return (
            <View
              key={`${tag}-${index}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: colors.surfaceAlt,
                borderRadius: radii.pill,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
              }}
            >
              <Txt variant="tiny">{option.emoji}</Txt>
              <Txt variant="tiny" color={colors.textSoft}>
                {pick(option.label)}
              </Txt>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
