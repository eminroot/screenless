import { View } from 'react-native';

import { Screen, Sticker, TopBar, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { colors, spacing } from '../theme/tokens';

const SECTIONS: { title: TKey; body: TKey }[] = [
  { title: 'privacy.s1Title', body: 'privacy.s1Body' },
  { title: 'privacy.s2Title', body: 'privacy.s2Body' },
  { title: 'privacy.s8Title', body: 'privacy.s8Body' },
  { title: 'privacy.s3Title', body: 'privacy.s3Body' },
  { title: 'privacy.s4Title', body: 'privacy.s4Body' },
  { title: 'privacy.s5Title', body: 'privacy.s5Body' },
  { title: 'privacy.s6Title', body: 'privacy.s6Body' },
  { title: 'privacy.s7Title', body: 'privacy.s7Body' },
];

const LAST_UPDATED = '2026-09-12';

export default function Privacy() {
  const { t } = useI18n();

  return (
    <Screen>
      <TopBar title={t('privacy.title')} />

      <Txt variant="tiny" color={colors.textFaint}>
        {t('privacy.updated', { date: LAST_UPDATED })}
      </Txt>

      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        {SECTIONS.map((section) => (
          <Sticker key={section.title} background={colors.surface} style={{ padding: spacing.lg, gap: spacing.sm }}>
            <Txt variant="subheading">{t(section.title)}</Txt>
            <Txt variant="body" color={colors.textSoft}>
              {t(section.body)}
            </Txt>
          </Sticker>
        ))}
      </View>
    </Screen>
  );
}
