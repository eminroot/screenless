import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Chip, Screen, StepDots, TopBar, Txt } from '../../components/ui';
import { interestList, MIN_INTERESTS } from '../../data/interests';
import { useI18n } from '../../i18n';
import { categoryColors, colors, spacing } from '../../theme/tokens';
import { useDraft } from './_layout';

const tones = [
  categoryColors.move,
  categoryColors.outdoor,
  categoryColors.create,
  categoryColors.social,
  categoryColors.calm,
];

export default function InterestsStep() {
  const router = useRouter();
  const { t } = useI18n();
  const { draft, toggleInterest } = useDraft();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (draft.interests.length < MIN_INTERESTS) {
      setError(t('interests.validation'));
      return;
    }
    router.push('/onboarding/buddy');
  };

  return (
    <Screen>
      <TopBar />
      <StepDots step={3} total={6} />

      <Txt variant="title">{t('interests.title', { name: draft.nickname })}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
        {t('interests.subtitle')}
      </Txt>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        {interestList.map((interest, index) => (
          <View key={interest.id} style={{ width: '30%' }}>
            <Chip
              emoji={interest.emoji}
              label={t(interest.labelKey)}
              selected={draft.interests.includes(interest.id)}
              tone={tones[index % tones.length]}
              onPress={() => {
                toggleInterest(interest.id);
                setError(null);
              }}
            />
          </View>
        ))}
      </View>

      <Txt
        variant="small"
        color={error ? colors.primaryDeep : colors.textSoft}
        style={{ marginTop: spacing.xl }}
      >
        {error ?? t('interests.selected', { count: draft.interests.length })}
      </Txt>

      <View style={{ marginTop: spacing.lg }}>
        <Button label={t('common.continue')} onPress={submit} />
      </View>
    </Screen>
  );
}
