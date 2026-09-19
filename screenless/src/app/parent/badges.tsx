import { useState } from 'react';
import { View } from 'react-native';

import { BadgeArt, badgeSvgMarkup } from '../../components/BadgeArt';
import { QrCode } from '../../components/QrCode';
import { qrSvgMarkup } from '../../lib/qr';
import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { BADGE_COUNT, badgeCodes, badgePayload, HIDE_BADGE } from '../../engine/badges';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { confirmAction } from '../../lib/confirm';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

function nameKey(n: number): TKey {
  return `badges.name${n}` as TKey;
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Setting up the treasure badges.
 *
 * One sheet, six badges, printed once. The page is built here as plain HTML
 * and handed to the system print dialog, which on every phone also offers
 * "save as PDF", so a family can print it at a library or a relative's.
 * Families with no printer at all copy the three digit codes by hand; typing a
 * code is accepted exactly like scanning one.
 */
export default function Badges() {
  const { t } = useI18n();
  const { data, createBadges, removeBadges } = useApp();
  const [printError, setPrintError] = useState(false);
  const [printing, setPrinting] = useState(false);

  const set = data.badges;
  const codes = set ? badgeCodes(set.key) : [];
  const numbers = Array.from({ length: BADGE_COUNT }, (_, i) => i + 1);

  const print = async () => {
    if (!set) return;
    setPrinting(true);
    setPrintError(false);
    try {
      const cards = numbers
        .map(
          (n) => `
          <div class="card">
            <div class="head">${badgeSvgMarkup(n, 64)}<div><b>${escape(t('badges.badgeLabel', { number: n }))}</b><br/>${escape(t(nameKey(n)))}</div></div>
            ${qrSvgMarkup(badgePayload(set.key, n), 190)}
            <div class="code">${escape(t('badges.codeLabel', { code: codes[n - 1] }))}</div>
            <div class="hint">${escape(t('badges.sheetHint'))}</div>
          </div>`,
        )
        .join('');
      const html = `<!doctype html><html><head><meta charset="utf-8"/>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #111739; margin: 0; }
          h1 { font-size: 18px; margin: 0 0 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
          .card { border: 2px dashed #9AA6DC; border-radius: 12px; padding: 5mm; text-align: center; page-break-inside: avoid; }
          .head { display: flex; align-items: center; gap: 10px; justify-content: center; text-align: left; font-size: 15px; }
          .code { font-size: 22px; font-weight: 800; letter-spacing: 4px; margin-top: 4px; }
          .hint { font-size: 11px; color: #43507F; margin-top: 2px; }
        </style></head><body>
        <h1>ScreenLess · ${escape(t('badges.title'))}</h1>
        <div class="grid">${cards}</div>
        </body></html>`;
      const Print = await import('expo-print');
      await Print.printAsync({ html });
    } catch (error) {
      if (__DEV__) console.warn('[badges] print failed', error);
      setPrintError(true);
    } finally {
      setPrinting(false);
    }
  };

  const renew = async () => {
    const ok = await confirmAction({
      title: t('badges.renewTitle'),
      body: t('badges.renewBody'),
      action: t('badges.renew'),
      cancel: t('common.cancel'),
    });
    if (ok) createBadges();
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: t('badges.removeTitle'),
      body: t('badges.removeBody'),
      action: t('badges.remove'),
      cancel: t('common.cancel'),
    });
    if (ok) removeBadges();
  };

  return (
    <Screen>
      <TopBar title={t('badges.title')} />

      <Txt variant="body" color={colors.textSoft}>
        {t('badges.intro')}
      </Txt>

      {!set ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' }}>
            {numbers.map((n) => (
              <BadgeArt key={n} number={n} size={64} />
            ))}
          </View>
          <Button label={t('badges.make')} tone="primary" onPress={createBadges} />
        </View>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
          <Sticker background={colors.success} style={{ padding: spacing.md }}>
            <Txt variant="bodyStrong" color={colors.surface}>
              {t('badges.ready')}
            </Txt>
          </Sticker>

          <Button label={t('badges.print')} tone="info" busy={printing} onPress={() => void print()} />
          {printError ? (
            <Txt variant="small" color={colors.primaryDeep}>
              {t('badges.printFailed')}
            </Txt>
          ) : null}
          <Txt variant="small" color={colors.textSoft}>
            {t('badges.noPrinter')}
          </Txt>

          <View style={{ gap: spacing.md }}>
            {numbers.map((n) => (
              <Sticker key={n} background={colors.surface} style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <BadgeArt number={n} size={52} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyStrong">
                      {t('badges.badgeLabel', { number: n })} · {t(nameKey(n))}
                    </Txt>
                    <Txt variant="subheading" style={{ letterSpacing: 3 }}>
                      {codes[n - 1]}
                    </Txt>
                    {n === HIDE_BADGE ? (
                      <Txt variant="tiny" color={colors.textFaint}>
                        {t('badges.hideNote')}
                      </Txt>
                    ) : null}
                  </View>
                  <View
                    style={{
                      borderRadius: radii.sm,
                      borderWidth: borderWidth.hair,
                      borderColor: colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <QrCode value={badgePayload(set.key, n)} size={84} />
                  </View>
                </View>
              </Sticker>
            ))}
          </View>

          <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
            <Txt variant="bodyStrong">{t('badges.whereTitle')}</Txt>
            <Txt variant="small" color={colors.textSoft}>
              {t('badges.whereBody')}
            </Txt>
          </Sticker>

          <View style={{ gap: spacing.sm }}>
            <Button label={t('badges.renew')} tone="neutral" size="md" onPress={() => void renew()} />
            <Button label={t('badges.remove')} tone="ghost" size="md" onPress={() => void remove()} />
          </View>
        </View>
      )}
    </Screen>
  );
}
