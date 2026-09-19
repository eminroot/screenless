import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';

import { Button, Field, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { confirmAction } from '../../lib/confirm';
import { useApp } from '../../state/app-state';
import { pairDevice, unpairDevice, type HubError } from '../../sync/api';
import { isHubConfigured } from '../../sync/config';
import { applyLimits } from '../../sync/limits';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/**
 * Linking this phone to a parent's dashboard.
 *
 * Behind the parent code, like everything else in here, because it is the one
 * screen that decides whether anything at all leaves the device.
 *
 * The flow is deliberately one way round: the parent makes a child in *their*
 * app, reads a six character code off it, and types the code in here. Doing it
 * the other way, with this phone showing a code the parent types into theirs,
 * looks equivalent and is not: it would let anyone holding a child's phone
 * attach it to their own account. The code has to originate with the account
 * it will join.
 *
 * Unlinking is one tap and takes nothing with it. Missions, the buddy, the
 * wardrobe, the streak and every setting are untouched, which is what lets a
 * family try this and change their mind.
 */

const ERROR_KEYS: Record<HubError, TKey> = {
  unconfigured: 'hub.errorUnavailable',
  network: 'hub.errorNetwork',
  timeout: 'hub.errorNetwork',
  badCode: 'hub.errorBadCode',
  noCode: 'hub.errorNoCode',
  unlinked: 'hub.errorNoCode',
  rateLimited: 'hub.errorTooMany',
  server: 'hub.errorServer',
};

/** `ABC-123` as it is typed, which is how the parent app prints it. */
function pretty(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return cleaned.length > 3 ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` : cleaned;
}

export default function ParentLink() {
  const { t } = useI18n();
  const { data, linkHub, unlinkHub, setGuardConfig } = useApp();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hub = data.hub;

  const link = useCallback(async () => {
    setBusy(true);
    setError(null);
    const result = await pairDevice(code, Platform.OS);
    setBusy(false);

    if (!result.ok) {
      setError(t(ERROR_KEYS[result.error]));
      return;
    }

    linkHub({
      token: result.value.token,
      deviceId: result.value.deviceId,
      childId: result.value.childId,
      linkedAt: new Date().toISOString(),
      revision: result.value.limits.revision,
      lastSentDay: null,
      lastSentAt: null,
      failures: 0,
    });
    // Whatever the parent had already set is in force immediately, rather than
    // ten minutes later when the first sync happens to run.
    setGuardConfig(applyLimits(data.guard, result.value.limits));
    setCode('');
  }, [code, data.guard, linkHub, setGuardConfig, t]);

  const unlink = useCallback(async () => {
    if (!hub) return;
    const sure = await confirmAction({
      title: t('hub.unlinkTitle'),
      body: t('hub.unlinkBody'),
      action: t('hub.unlink'),
      cancel: t('common.cancel'),
    });
    if (!sure) return;

    setBusy(true);
    // Told to the server so the parent's list stops showing a phone that is no
    // longer reporting, but the link is dropped here either way: a parent who
    // is offline still gets to unlink.
    await unpairDevice(hub.token);
    unlinkHub();
    setBusy(false);
  }, [hub, t, unlinkHub]);

  /* ------------------------------------------------ not in this build at all */

  if (!isHubConfigured) {
    return (
      <Screen>
        <TopBar title={t('hub.title')} />
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Txt variant="bodyStrong">{t('hub.unavailable')}</Txt>
          <Txt variant="small" color={colors.textSoft}>
            {t('hub.unavailableBody')}
          </Txt>
        </Sticker>
      </Screen>
    );
  }

  /* ------------------------------------------------------------ already on */

  if (hub) {
    const sent = hub.lastSentAt ? new Date(hub.lastSentAt) : null;
    return (
      <Screen>
        <TopBar title={t('hub.title')} />

        <Sticker background={colors.info} style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Txt variant="tiny" color={colors.surface}>
            {t('hub.linkedLabel')}
          </Txt>
          <Txt variant="heading" color={colors.surface}>
            {sent
              ? t('hub.lastSent', {
                  time: sent.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                })
              : t('hub.notSentYet')}
          </Txt>
          {hub.failures > 0 ? (
            <Txt variant="small" color={colors.surface}>
              {t('hub.tryingAgain')}
            </Txt>
          ) : null}
        </Sticker>

        <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
          {t('hub.sendsTitle')}
        </Txt>
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.lg,
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
          }}
        >
          <Txt variant="body">{t('hub.sendsList')}</Txt>
          <Txt variant="bodyStrong" style={{ marginTop: spacing.sm }}>
            {t('hub.keepsTitle')}
          </Txt>
          <Txt variant="body">{t('hub.keepsList')}</Txt>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label={t('hub.unlink')}
            tone="ghost"
            size="md"
            disabled={busy}
            onPress={() => void unlink()}
          />
        </View>
      </Screen>
    );
  }

  /* --------------------------------------------------------- not linked yet */

  const ready = pretty(code).replace('-', '').length === 6;

  return (
    <Screen avoidKeyboard>
      <TopBar title={t('hub.title')} />

      <Txt variant="heading">{t('hub.offTitle')}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('hub.offBody')}
      </Txt>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Field
          label={t('hub.codeLabel')}
          hint={t('hub.codeHint')}
          value={pretty(code)}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          error={error}
          placeholder="ABC-123"
        />
        <Button
          label={busy ? t('hub.linking') : t('hub.link')}
          tone="primary"
          size="lg"
          disabled={!ready || busy}
          onPress={() => void link()}
        />
      </View>

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('hub.sendsTitle')}
      </Txt>
      <View
        style={{
          marginTop: spacing.md,
          padding: spacing.lg,
          gap: spacing.sm,
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
        }}
      >
        <Txt variant="body">{t('hub.sendsList')}</Txt>
        <Txt variant="bodyStrong" style={{ marginTop: spacing.sm }}>
          {t('hub.keepsTitle')}
        </Txt>
        <Txt variant="body">{t('hub.keepsList')}</Txt>
      </View>
    </Screen>
  );
}
