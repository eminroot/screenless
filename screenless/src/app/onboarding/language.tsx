import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, Sticker, Txt } from '../../components/ui';
import { LANGUAGES, languageMeta, useI18n, type Language } from '../../i18n';
import { useApp } from '../../state/app-state';
import { colors, spacing } from '../../theme/tokens';

export default function LanguageStep() {
  const router = useRouter();
  const { t, language } = useI18n();
  const { setLanguage } = useApp();
  const [choice, setChoice] = useState<Language>(language);

  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center', gap: spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="display">{t('language.title')}</Txt>
        <Txt variant="body" color={colors.textSoft}>
          {t('language.subtitle')}
        </Txt>
      </View>

      <View style={{ gap: spacing.lg }}>
        {LANGUAGES.map((code) => {
          const meta = languageMeta[code];
          const selected = choice === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                setChoice(code);
                setLanguage(code);
              }}
            >
              <Sticker background={selected ? colors.accent : colors.surface}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.lg,
                    padding: spacing.lg,
                  }}
                >
                  <Txt variant="title">{meta.flag}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt variant="heading">{meta.label}</Txt>
                    <Txt variant="small" color={colors.textSoft}>
                      {meta.english}
                    </Txt>
                  </View>
                  {selected ? <Txt variant="heading">✓</Txt> : null}
                </View>
              </Sticker>
            </Pressable>
          );
        })}
      </View>

      <Button label={t('common.continue')} onPress={() => router.push('/onboarding/welcome')} />
    </Screen>
  );
}
