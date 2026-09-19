import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import * as api from '../api/client';
import {
  Button,
  Card,
  Eyebrow,
  Field,
  Notice,
  Screen,
  Segmented,
  TopBar,
  Txt,
} from '../components/ui';
import { languageMeta, LANGUAGES, useI18n, type Language } from '../i18n';
import { useSession } from '../state/session';
import { colors, spacing } from '../theme/tokens';

/**
 * The account, the language, and the two ways out.
 *
 * "What this app can see" is on this screen rather than in a privacy policy
 * nobody opens, written as a list rather than a paragraph. It is the claim the
 * whole product rests on and it should be checkable in ten seconds by someone
 * who is suspicious, which is the correct thing to be about an app that
 * watches a child's phone.
 */
export default function Settings() {
  const { t } = useI18n();
  const router = useRouter();
  const { parent, token, language, setLanguage, signOut } = useSession();

  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leave = useCallback(() => {
    const go = async () => {
      await signOut();
      router.replace('/');
    };
    const title = t('settings.signOutTitle');
    const body = t('settings.signOutBody');

    if (Platform.OS === 'web') {
      const ask = (globalThis as { confirm?: (message: string) => boolean }).confirm;
      if (ask && ask(`${title}\n\n${body}`)) void go();
      return;
    }
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), onPress: () => void go() },
    ]);
  }, [router, signOut, t]);

  const destroy = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    const result = await api.deleteAccount(token, password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error === 'unauthorized' ? t('error.unauthorized') : t('error.server'));
      return;
    }
    // Everything is gone server side; drop the local session and start over.
    await signOut();
    router.replace('/');
  }, [password, router, signOut, t, token]);

  return (
    <Screen>
      <TopBar title={t('settings.title')} />

      {error ? <Notice text={error} /> : null}

      <Eyebrow>{t('settings.account')}</Eyebrow>
      <Card style={{ gap: 2 }}>
        <Txt variant="bodyStrong">{parent?.name || t('common.appName')}</Txt>
        <Txt variant="tiny" color={colors.inkFaint}>
          {parent?.email}
        </Txt>
      </Card>

      <Eyebrow style={{ marginTop: spacing.xl }}>{t('settings.languageLabel')}</Eyebrow>
      <Segmented
        value={language}
        onChange={(next) => setLanguage(next as Language)}
        options={LANGUAGES.map((code) => ({ value: code, label: languageMeta[code].label }))}
      />

      <Eyebrow style={{ marginTop: spacing.xl }}>{t('settings.aboutTitle')}</Eyebrow>
      <Card tone="well">
        <Txt variant="body" color={colors.inkSoft}>
          {t('settings.aboutBody')}
        </Txt>
      </Card>

      <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
        <Button label={t('settings.signOut')} tone="quiet" onPress={leave} />
      </View>

      {/* ----------------------------------------------------- the last door */}
      <Eyebrow style={{ marginTop: spacing.xxl }}>{t('settings.deleteTitle')}</Eyebrow>
      <Card style={{ gap: spacing.md }}>
        <Txt variant="body" color={colors.inkSoft}>
          {t('settings.deleteBody')}
        </Txt>

        {deleting ? (
          <>
            <Field
              label={t('settings.deleteConfirm')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              label={t('settings.deleteAction')}
              tone="danger"
              size="md"
              busy={busy}
              disabled={password.length < 10}
              onPress={() => void destroy()}
            />
            <Button
              label={t('common.cancel')}
              tone="ghost"
              size="md"
              onPress={() => {
                setDeleting(false);
                setPassword('');
                setError(null);
              }}
            />
          </>
        ) : (
          <Button
            label={t('settings.deleteTitle')}
            tone="danger"
            size="md"
            onPress={() => setDeleting(true)}
          />
        )}
      </Card>
    </Screen>
  );
}
