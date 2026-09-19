import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { buddySpecs, isStrongMatch, newBuddies, rankBuddies } from '../../components/buddy/specs';
import { Button, Field, Screen, StepDots, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import type { BuddyId } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { useDraft } from './_layout';

export default function BuddyStep() {
  const router = useRouter();
  const { t } = useI18n();
  const { draft, patch } = useDraft();
  const [error, setError] = useState<string | null>(null);

  // Ranked once per interest set, so the grid does not reshuffle while tapping.
  const ranked = useMemo(() => rankBuddies(draft.interests), [draft.interests]);
  const selected: BuddyId = draft.buddyId ?? ranked[0];
  const defaultName = t(`buddyNames.${selected}` as TKey);

  // Keep the name in step with the buddy until the parent types their own.
  const [touchedName, setTouchedName] = useState(false);
  useEffect(() => {
    if (!touchedName) patch({ buddyName: defaultName });
  }, [defaultName, touchedName, patch]);

  const submit = () => {
    const name = (draft.buddyName || defaultName).trim();
    if (!name) {
      setError(t('buddy.validation'));
      return;
    }
    patch({ buddyId: selected, buddyName: name });
    router.push('/onboarding/pin');
  };

  return (
    <Screen avoidKeyboard>
      <TopBar />
      <StepDots step={4} total={6} />

      <Txt variant="title">{t('buddy.title', { name: draft.nickname })}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
        {t('buddy.subtitle')}
      </Txt>

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Buddy key={selected} id={selected} size={200} mood="happy" label={defaultName} />
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
          {t(`buddyTraits.${selected}` as TKey)}
        </Txt>
      </View>

      <Txt variant="tiny" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        {t('buddy.matchNote', { name: draft.nickname })}
      </Txt>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginTop: spacing.sm,
        }}
      >
        {ranked.map((id) => {
          const active = id === selected;
          const matched = isStrongMatch(id, draft.interests);
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`buddyNames.${id}` as TKey)}
              style={{ width: '30.5%' }}
              onPress={() => {
                void Haptics.selectionAsync();
                patch({ buddyId: id });
              }}
            >
              <Sticker
                background={active ? buddySpecs[id].light : colors.surface}
                offset={active ? 5 : 3}
                border={active ? borderWidth.chunky : borderWidth.hair}
                style={{ alignItems: 'center', paddingVertical: spacing.sm }}
              >
                <Buddy id={id} size={70} mood="idle" />
                <Txt variant="tiny" center numberOfLines={1}>
                  {t(`buddyNames.${id}` as TKey)}
                </Txt>
              </Sticker>

              {matched || newBuddies.has(id) ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: 0,
                    backgroundColor: matched ? colors.accent : colors.magic,
                    borderRadius: radii.pill,
                    borderWidth: borderWidth.hair,
                    borderColor: colors.border,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 1,
                  }}
                >
                  <Txt variant="tiny" color={matched ? colors.text : colors.surface}>
                    {matched ? t('buddy.matched') : t('buddy.isNew')}
                  </Txt>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Field
          label={t('buddy.nameTitle')}
          placeholder={t('buddy.namePlaceholder')}
          hint={t('buddy.suggested', { name: defaultName })}
          value={draft.buddyName}
          onChangeText={(value) => {
            setTouchedName(true);
            patch({ buddyName: value.slice(0, 14) });
            setError(null);
          }}
          maxLength={14}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={error}
        />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label={t('buddy.confirm')} onPress={submit} tone="magic" />
      </View>
    </Screen>
  );
}
