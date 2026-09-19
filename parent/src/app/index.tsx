import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import * as api from '../api/client';
import { Button, Card, Field, Mark, Notice, Screen, Txt } from '../components/ui';
import { useI18n, type TKey } from '../i18n';
import { useSession } from '../state/session';
import { colors, spacing } from '../theme/tokens';

/**
 * Signing in, or making an account.
 *
 * One screen for both, because they differ by a single field and a parent who
 * lands on the wrong one of two screens has to find their way back. The mode
 * flips in place and keeps whatever has already been typed.
 *
 * The line about what the children's phones send is on this screen rather than
 * buried in settings on purpose: it is the promise the whole product rests on,
 * and the moment someone decides whether to sign up is the moment it is worth
 * reading.
 */

const ERRORS: Record<api.ApiError, TKey> = {
  unconfigured: 'error.unconfigured',
  network: 'error.network',
  timeout: 'error.timeout',
  unauthorized: 'error.unauthorized',
  taken: 'error.taken',
  invalid: 'error.invalid',
  notFound: 'error.notFound',
  full: 'error.full',
  rateLimited: 'error.rateLimited',
  server: 'error.server',
};

export default function SignIn() {
  const { t } = useI18n();
  const { token, signIn } = useSession();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);

    const trimmed = email.trim();
    const result =
      mode === 'in'
        ? await api.signIn({ email: trimmed, password })
        : await api.register({ email: trimmed, password, name: name.trim() || undefined });

    setBusy(false);

    if (result.ok) {
      signIn(result.value);
      return;
    }

    // The server says which field it refused, and it is worth passing that on
    // rather than showing "invalid" over a form with three inputs in it.
    if (result.error === 'invalid' && result.reason === 'short') {
      setError(t('error.shortPassword'));
    } else if (result.error === 'invalid' && result.reason === 'email') {
      setError(t('error.badEmail'));
    } else {
      setError(t(ERRORS[result.error]));
    }
  }, [email, mode, name, password, signIn, t]);

  if (token) return <Redirect href="/children" />;

  const ready = email.trim().length > 3 && password.length >= 10;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={{ paddingTop: spacing.xxl, paddingBottom: spacing.xl }}>
          <Mark height={28} />
          <Txt variant="display" style={{ marginTop: spacing.lg }}>
            {t('auth.title')}
          </Txt>
          <Txt variant="body" color={colors.inkSoft} style={{ marginTop: spacing.sm }}>
            {t('auth.subtitle')}
          </Txt>
        </View>

        {error ? <Notice text={error} /> : null}

        <Card style={{ gap: spacing.lg }}>
          <Field
            label={t('auth.emailLabel')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="ad@example.com"
          />

          <Field
            label={t('auth.passwordLabel')}
            hint={mode === 'up' ? t('auth.passwordHint') : undefined}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={mode === 'up' ? 'newPassword' : 'password'}
          />

          {mode === 'up' ? (
            <Field
              label={t('auth.nameLabel')}
              hint={t('auth.nameHint')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          ) : null}

          <Button
            label={
              busy
                ? mode === 'in'
                  ? t('auth.signingIn')
                  : t('auth.registering')
                : mode === 'in'
                  ? t('auth.signIn')
                  : t('auth.register')
            }
            onPress={() => void submit()}
            disabled={!ready}
            busy={busy}
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setMode((current) => (current === 'in' ? 'up' : 'in'));
            setError(null);
          }}
          style={{ paddingVertical: spacing.lg, alignItems: 'center' }}
        >
          <Txt variant="label" color={colors.accent}>
            {mode === 'in' ? t('auth.toRegister') : t('auth.toSignIn')}
          </Txt>
        </Pressable>

        <Txt variant="tiny" color={colors.inkFaint} style={{ marginTop: spacing.lg }}>
          {t('auth.privacy')}
        </Txt>
      </Screen>
    </KeyboardAvoidingView>
  );
}
