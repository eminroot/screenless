import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, StepDots, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

export default function Consent() {
  const router = useRouter();
  const { t } = useI18n();
  const { acceptConsent } = useApp();
  const [agreed, setAgreed] = useState(false);

  return (
    <Screen>
      <TopBar />
      <StepDots step={0} total={6} />

      <Txt variant="title">{t('consent.title')}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
        {t('consent.intro')}
      </Txt>

      <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
        <Point emoji="📱" title={t('consent.point1Title')} body={t('consent.point1Body')} />
        <Point emoji="🙈" title={t('consent.point2Title')} body={t('consent.point2Body')} />
        <Point emoji="🔑" title={t('consent.point3Title')} body={t('consent.point3Body')} />
      </View>

      <Sticker
        background={colors.surfaceAlt}
        style={{ padding: spacing.lg, marginTop: spacing.xl, gap: spacing.sm }}
      >
        <Txt variant="subheading">{t('consent.kvkkTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {t('consent.kvkkBody')}
        </Txt>
        <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
          <Txt variant="small" color={colors.infoDeep} style={{ textDecorationLine: 'underline' }}>
            {t('consent.readPolicy')}
          </Txt>
        </Pressable>
      </Sticker>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={() => setAgreed((v) => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radii.sm,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            backgroundColor: agreed ? colors.success : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {agreed ? (
            <Txt variant="bodyStrong" color={colors.surface}>
              ✓
            </Txt>
          ) : null}
        </View>
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {t('consent.agree')}
        </Txt>
      </Pressable>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label={t('consent.accept')}
          disabled={!agreed}
          onPress={() => {
            acceptConsent();
            router.push('/onboarding/child');
          }}
        />
      </View>
    </Screen>
  );
}

function Point({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Txt variant="heading">{emoji}</Txt>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="subheading">{title}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {body}
        </Txt>
      </View>
    </View>
  );
}
