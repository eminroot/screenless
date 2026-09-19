import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Button, Field, Txt } from '../ui';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { checkUsername, claimUsername, renameUsername } from '../../online/api';
import { isLeaderboardConfigured } from '../../online/config';
import { holdNetwork, type ApiError } from '../../online/network';
import {
  cleanUsername,
  suggestUsernames,
  usernameFormatProblem,
  usernameKey,
  USERNAME_MAX,
  type UsernameProblem,
} from '../../online/username';
import { useApp } from '../../state/app-state';
import type { BuddyId } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

type Status = 'empty' | 'current' | 'checking' | 'available' | 'taken' | UsernameProblem | ApiError;

/** Long enough that a parent typing at normal speed sends one check, not six. */
const CHECK_DELAY_MS = 450;

/**
 * Choosing a username, or changing the one the child has.
 *
 * Only ever on screen after a parent has said yes, and it holds the network
 * door open for exactly as long as it is mounted. On success it records the
 * account itself, then calls `onDone`.
 */
export function UsernamePicker({
  buddyId,
  submitLabel,
  onDone,
}: {
  buddyId: BuddyId | null;
  submitLabel: string;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const { data, goOnline, updateAccount, loseAccount } = useApp();
  const account = data.social.mode === 'online' ? data.social.account : null;

  const [value, setValue] = useState('');
  const [checked, setChecked] = useState<{ name: string; status: Status } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  useEffect(() => {
    holdNetwork('picker', true);
    return () => holdNetwork('picker', false);
  }, []);

  const name = cleanUsername(value);
  const problem = name ? usernameFormatProblem(name) : null;
  const ownKey = account !== null && name !== '' && usernameKey(name) === usernameKey(account.username);
  const needsCheck = name !== '' && !problem && !ownKey && isLeaderboardConfigured;

  useEffect(() => {
    if (!needsCheck) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkUsername(name);
      if (cancelled) return;
      const status: Status = result.ok
        ? result.value.available
          ? 'available'
          : (result.value.reason ?? 'taken')
        : result.error;
      setChecked({ name, status });
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, needsCheck]);

  let status: Status;
  if (!isLeaderboardConfigured) status = 'unconfigured';
  else if (!name) status = 'empty';
  else if (problem) status = problem;
  else if (ownKey) status = name === account?.username ? 'current' : 'available';
  else status = checked?.name === name ? checked.status : 'checking';

  const suggestions = useMemo(() => (status === 'taken' ? suggestUsernames(name) : []), [status, name]);

  const submit = async () => {
    if (status !== 'available' || busy) return;
    setBusy(true);
    setFailure(null);

    if (account) {
      const result = await renameUsername(account, name);
      setBusy(false);
      if (result.ok) {
        updateAccount({ username: result.value.username });
        onDone();
        return;
      }
      if (result.error === 'unauthorized') loseAccount();
      settleFailure(result.error, result.reason);
      return;
    }

    const result = await claimUsername(name, buddyId);
    setBusy(false);
    if (result.ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goOnline(result.value);
      onDone();
      return;
    }
    settleFailure(result.error, result.reason);
  };

  /** A clash found at the last moment shows up where the check result would. */
  const settleFailure = (error: ApiError, reason?: string) => {
    if (error === 'taken') setChecked({ name, status: 'taken' });
    else if (error === 'invalid') setChecked({ name, status: (reason as UsernameProblem) ?? 'invalid' });
    else setFailure(error);
  };

  const line = describe(status, name, account?.username ?? '');

  return (
    <View style={{ gap: spacing.md }}>
      <Field
        label={t('social.usernameLabel')}
        placeholder={t('social.usernamePlaceholder')}
        value={value}
        onChangeText={(next) => {
          setValue(next.slice(0, USERNAME_MAX + 4));
          setFailure(null);
        }}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="off"
        maxLength={USERNAME_MAX + 4}
        returnKeyType="done"
        onSubmitEditing={() => void submit()}
        editable={isLeaderboardConfigured && !busy}
      />

      <Txt variant="small" color={line.color}>
        {status === 'available' ? '✓ ' : ''}
        {t(line.key, line.vars)}
      </Txt>

      {suggestions.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Txt variant="tiny" color={colors.textSoft}>
            {t('social.tryOne')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => {
                  void Haptics.selectionAsync();
                  setValue(suggestion);
                }}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.pill,
                  borderWidth: borderWidth.hair,
                  borderColor: colors.border,
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                }}
              >
                <Txt variant="small">{suggestion}</Txt>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {failure ? (
        <Txt variant="small" color={colors.primaryDeep}>
          {t(describe(failure, name, '').key)}
        </Txt>
      ) : null}

      <Button
        label={submitLabel}
        tone="success"
        busy={busy}
        disabled={status !== 'available'}
        onPress={() => void submit()}
      />
    </View>
  );
}

function describe(
  status: Status,
  name: string,
  current: string,
): { key: TKey; vars?: Record<string, string>; color: string } {
  const bad = colors.primaryDeep;
  switch (status) {
    case 'empty':
      return { key: 'social.usernameHint', color: colors.textSoft };
    case 'current':
      return { key: 'social.alreadyYours', vars: { username: current }, color: colors.textSoft };
    case 'checking':
      return { key: 'social.checking', color: colors.textSoft };
    case 'available':
      return { key: 'social.available', vars: { username: name }, color: colors.successDeep };
    case 'taken':
      return { key: 'social.taken', color: bad };
    case 'short':
    case 'long':
    case 'chars':
    case 'start':
    case 'digits':
      return { key: `social.${status}`, color: bad };
    case 'rateLimited':
      return { key: 'social.rateLimited', color: bad };
    case 'unconfigured':
    case 'offline':
      return { key: 'social.unconfigured', color: colors.textSoft };
    case 'network':
    case 'server':
      return { key: 'social.network', color: bad };
    default:
      return { key: 'social.refused', color: bad };
  }
}
