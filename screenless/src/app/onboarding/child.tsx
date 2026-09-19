import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Field, Screen, StepDots, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { AGE_BANDS, type AgeBand } from '../../state/types';
import { colors, spacing } from '../../theme/tokens';
import { useDraft } from './_layout';

const ageLabels: Record<AgeBand, 'child.ageBand35' | 'child.ageBand69' | 'child.ageBand1014'> = {
  '3-5': 'child.ageBand35',
  '6-9': 'child.ageBand69',
  '10-14': 'child.ageBand1014',
};

export default function ChildStep() {
  const router = useRouter();
  const { t } = useI18n();
  const { draft, patch } = useDraft();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!draft.nickname.trim() || !draft.ageBand) {
      setError(t('child.validation'));
      return;
    }
    router.push('/onboarding/username');
  };

  return (
    <Screen avoidKeyboard>
      <TopBar />
      <StepDots step={1} total={6} />

      <Txt variant="title">{t('child.title')}</Txt>

      <View style={{ marginTop: spacing.xl }}>
        <Field
          label={t('child.nicknameLabel')}
          placeholder={t('child.nicknamePlaceholder')}
          hint={t('child.nicknameHint')}
          value={draft.nickname}
          onChangeText={(nickname) => {
            patch({ nickname: nickname.slice(0, 16) });
            setError(null);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={16}
          returnKeyType="done"
        />
      </View>

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('child.ageLabel')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: 2 }}>
        {t('child.ageBandHint')}
      </Txt>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        {AGE_BANDS.map((band) => {
          const selected = draft.ageBand === band;
          return (
            <Pressable
              key={band}
              style={{ flex: 1 }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                patch({ ageBand: band });
                setError(null);
              }}
            >
              <Sticker background={selected ? colors.info : colors.surface}>
                <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
                  <Txt variant="subheading" color={selected ? colors.surface : colors.text} center>
                    {t(ageLabels[band])}
                  </Txt>
                </View>
              </Sticker>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Txt variant="small" color={colors.primaryDeep} style={{ marginTop: spacing.lg }}>
          {error}
        </Txt>
      ) : null}

      <View style={{ marginTop: spacing.xxl }}>
        <Button label={t('common.continue')} onPress={submit} />
      </View>
    </Screen>
  );
}
