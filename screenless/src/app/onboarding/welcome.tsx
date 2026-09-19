import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Buddy } from '../../components/buddy/Buddy';
import { Button, Screen, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { colors, spacing } from '../../theme/tokens';

export default function Welcome() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', paddingTop: spacing.xl }}>
        <Txt variant="display" center>
          ScreenLess
        </Txt>
        <Txt variant="subheading" color={colors.textSoft} center style={{ marginTop: spacing.sm }}>
          {t('welcome.tagline')}
        </Txt>
      </View>

      <View style={{ alignItems: 'center' }}>
        <Buddy id="fox" size={240} mood="happy" label="ScreenLess buddy" />
      </View>

      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.md }}>
          <Line index={1} text={t('welcome.line1')} />
          <Line index={2} text={t('welcome.line2')} />
          <Line index={3} text={t('welcome.line3')} />
        </View>

        <Button label={t('welcome.start')} onPress={() => router.push('/onboarding/consent')} />
        <Txt variant="small" color={colors.textFaint} center>
          {t('welcome.parentNote')}
        </Txt>
      </View>
    </Screen>
  );
}

function Line({ index, text }: { index: number; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.accent,
          borderWidth: 3,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt variant="tiny">{index}</Txt>
      </View>
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}
