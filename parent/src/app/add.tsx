import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import * as api from '../api/client';
import type { AgeBand, Pairing } from '../api/types';
import { Button, Card, Field, Notice, OptionRow, Screen, TopBar, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import { useSession } from '../state/session';
import { colors, radii, spacing } from '../theme/tokens';

/**
 * Adding a child, and the code that links their phone.
 *
 * Two steps on one screen, because the code is the whole point of the first
 * step and routing to it separately makes it possible to lose. It is single
 * use and expires in half an hour, so the moment it appears is the moment it
 * has to be used.
 *
 * The direction matters and is not arbitrary: the code originates here, with
 * the account it will join, and is typed into the child's phone. The other way
 * round would let anyone holding a child's phone attach it to their own
 * account.
 */
export default function AddChild() {
  const { t } = useI18n();
  const router = useRouter();
  const { token } = useSession();

  const [name, setName] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('6-9');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<{ name: string; pairing: Pairing; childId: string } | null>(
    null,
  );

  const create = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    const result = await api.addChild(token, { name: name.trim(), ageBand });
    setBusy(false);

    if (!result.ok) {
      setError(result.error === 'full' ? t('error.full') : t('error.server'));
      return;
    }
    setPairing({
      name: result.value.child.name,
      pairing: result.value.pairing,
      childId: result.value.child.id,
    });
  }, [ageBand, name, t, token]);

  const refreshCode = useCallback(async () => {
    if (!token || !pairing) return;
    setBusy(true);
    const result = await api.newPairingCode(token, pairing.childId);
    setBusy(false);
    if (result.ok) setPairing({ ...pairing, pairing: result.value.pairing });
  }, [pairing, token]);

  /* ----------------------------------------------------------- the code */

  if (pairing) {
    return (
      <Screen>
        <TopBar title={t('children.pairTitle', { name: pairing.name })} />

        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
          <Txt variant="eyebrow" color={colors.inkFaint}>
            {t('children.nameLabel')}
          </Txt>
          <View
            style={{
              backgroundColor: colors.well,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.rule,
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.lg,
            }}
          >
            <Txt
              variant="display"
              numbers
              center
              // Tracked out hard. This is read aloud across a room, and a
              // six character code set tight is read wrong.
              style={{ letterSpacing: 6 }}
            >
              {pairing.pairing.pretty}
            </Txt>
          </View>
          <Txt variant="tiny" color={colors.inkFaint}>
            {t('children.pairExpires')}
          </Txt>
        </Card>

        <Card tone="well" style={{ marginTop: spacing.lg }}>
          <Txt variant="body" color={colors.inkSoft}>
            {t('children.pairBody')}
          </Txt>
        </Card>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <Button label={t('children.pairDone')} onPress={() => router.replace('/children')} />
          <Button
            label={t('children.newCode')}
            tone="quiet"
            busy={busy}
            onPress={() => void refreshCode()}
          />
        </View>
      </Screen>
    );
  }

  /* ----------------------------------------------------------- the form */

  const ready = name.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <TopBar title={t('children.addTitle')} />

        {error ? <Notice text={error} /> : null}

        <Card style={{ gap: spacing.lg }}>
          <Field
            label={t('children.nameLabel')}
            hint={t('children.nameHint')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            maxLength={40}
          />
        </Card>

        <Txt variant="eyebrow" color={colors.inkFaint} style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
          {t('children.ageLabel')}
        </Txt>
        <View style={{ gap: spacing.sm }}>
          {(
            [
              ['3-5', t('children.age35')],
              ['6-9', t('children.age69')],
              ['10-13', t('children.age1013')],
            ] as [AgeBand, string][]
          ).map(([band, label]) => (
            <OptionRow
              key={band}
              title={label}
              selected={ageBand === band}
              onPress={() => setAgeBand(band)}
            />
          ))}
        </View>

        <Button
          label={busy ? t('children.creating') : t('children.create')}
          onPress={() => void create()}
          disabled={!ready}
          busy={busy}
          style={{ marginTop: spacing.xl }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
