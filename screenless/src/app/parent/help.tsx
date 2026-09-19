import { Linking, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/** Screen time ceilings published by Turkish Green Crescent through the TBM programme. */
const CEILINGS = [
  { range: '3-6', minutes: '20-30' },
  { range: '6-9', minutes: '40-50' },
  { range: '9-12', minutes: '60-70' },
  { range: '12+', minutes: '120' },
];

export default function Help() {
  const { t } = useI18n();

  return (
    <Screen>
      <TopBar title={t('parent.helpTitle')} />

      <Txt variant="body" color={colors.textSoft}>
        {t('parent.helpBody')}
      </Txt>

      <Sticker background={colors.success} style={{ padding: spacing.lg, gap: spacing.md, marginTop: spacing.xl }}>
        <Txt variant="heading" color={colors.surface}>
          {t('parent.helpYedamTitle')}
        </Txt>
        <Txt variant="small" color={colors.surface}>
          {t('parent.helpYedamBody')}
        </Txt>
        <Button
          label={t('parent.helpYedamAction')}
          tone="neutral"
          size="md"
          onPress={() => void Linking.openURL('tel:115')}
        />
        <Button
          label={t('parent.helpYedamSite')}
          tone="ghost"
          size="sm"
          onPress={() => void WebBrowser.openBrowserAsync('https://www.yedam.org.tr')}
        />
      </Sticker>

      <Txt variant="heading" style={{ marginTop: spacing.xxl }}>
        {t('parent.guidanceTitle')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('parent.guidanceYesilay')}
      </Txt>

      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.sm }}>
        {CEILINGS.map((row) => (
          <View
            key={row.range}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <View
              style={{
                backgroundColor: colors.accent,
                borderRadius: radii.pill,
                borderWidth: borderWidth.hair,
                borderColor: colors.border,
                paddingHorizontal: spacing.md,
                paddingVertical: 2,
                minWidth: 62,
                alignItems: 'center',
              }}
            >
              <Txt variant="tiny">{row.range}</Txt>
            </View>
            <Txt variant="body" style={{ flex: 1 }}>
              {t('parent.guidanceRow', { range: row.range, minutes: row.minutes })}
            </Txt>
          </View>
        ))}
      </Sticker>

      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.lg }}>
        <Txt variant="small" color={colors.textSoft}>
          {t('parent.guidanceWho')}
        </Txt>
      </Sticker>
    </Screen>
  );
}
