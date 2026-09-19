import { useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Button, Field, Txt } from '../ui';
import { useI18n } from '../../i18n';
import { addFriend } from '../../online/api';
import { normaliseInviteCode } from '../../online/username';
import { useApp } from '../../state/app-state';
import { colors, spacing } from '../../theme/tokens';

/**
 * Typing in another child's invite code. Always behind the parent code: this
 * is the one action that lets someone new see this child's username.
 */
export function AddFriendForm({ onAdded }: { onAdded?: () => void }) {
  const { t } = useI18n();
  const { data, loseAccount } = useApp();
  const account = data.social.mode === 'online' ? data.social.account : null;

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; good: boolean } | null>(null);

  if (!account) return null;

  const submit = async () => {
    const normalised = normaliseInviteCode(code);
    if (!normalised) {
      setMessage({ text: t('social.codeInvalid'), good: false });
      return;
    }

    setBusy(true);
    const result = await addFriend(account, normalised);
    setBusy(false);

    if (result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const username = result.value.friend.username;
      setMessage({
        text: result.value.already ? t('social.alreadyFriend', { username }) : t('social.added', { username }),
        good: true,
      });
      setCode('');
      onAdded?.();
      return;
    }

    if (result.error === 'unauthorized') loseAccount();
    const key =
      result.error === 'notFound'
        ? 'social.codeNotFound'
        : result.error === 'self'
          ? 'social.codeSelf'
          : result.error === 'full'
            ? 'social.friendsFull'
            : result.error === 'invalid'
              ? 'social.codeInvalid'
              : result.error === 'rateLimited'
                ? 'social.rateLimited'
                : 'social.network';
    setMessage({ text: t(key), good: false });
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Field
        label={t('social.addTitle')}
        hint={t('social.addBody')}
        placeholder={t('social.codePlaceholder')}
        value={code}
        onChangeText={(next) => {
          setCode(next.toUpperCase().slice(0, 9));
          setMessage(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={9}
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
        style={{ letterSpacing: 3 }}
      />
      {message ? (
        <Txt variant="small" color={message.good ? colors.successDeep : colors.primaryDeep}>
          {message.text}
        </Txt>
      ) : null}
      <Button
        label={t('social.add')}
        tone="info"
        size="md"
        busy={busy}
        disabled={code.trim().length === 0}
        onPress={() => void submit()}
      />
    </View>
  );
}
