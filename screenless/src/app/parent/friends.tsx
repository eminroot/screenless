import { useState } from 'react';
import { Share, View } from 'react-native';

import { Buddy } from '../../components/buddy/Buddy';
import { AddFriendForm } from '../../components/social/AddFriendForm';
import { UsernamePicker } from '../../components/social/UsernamePicker';
import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { confirmAction } from '../../lib/confirm';
import { deleteAccount, newInviteCode, removeFriend } from '../../online/api';
import { forgetBoard, useBoard } from '../../online/useBoard';
import { formatInviteCode } from '../../online/username';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, spacing } from '../../theme/tokens';

/**
 * Everything about the username in one place, for the parent.
 *
 * Reached from the parent tab, which is behind the parent code. Turning the
 * username on, renaming it, handing out and replacing the invite code, adding
 * and removing friends, and deleting all of it from the server.
 */
export default function ParentFriends() {
  const { t } = useI18n();
  const { data, profile, goOffline, updateAccount, loseAccount } = useApp();
  const account = data.social.mode === 'online' ? data.social.account : null;
  const { board, error: boardError, refresh } = useBoard();

  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState<'code' | 'remove' | string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  if (!profile) return null;
  const name = profile.nickname;

  if (!account) {
    return (
      <Screen avoidKeyboard>
        <TopBar title={t('social.parentTitle')} />

        {data.social.lostUsername ? (
          <Sticker background={colors.accent} style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <Txt variant="body">{t('social.lost', { username: data.social.lostUsername })}</Txt>
          </Sticker>
        ) : null}

        {notice ? (
          <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginBottom: spacing.lg }}>
            <Txt variant="body">{notice}</Txt>
          </Sticker>
        ) : null}

        <Txt variant="heading">{t('social.offlineTitle')}</Txt>
        <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
          {t('social.offlineBody', { name })}
        </Txt>

        <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
          {t('social.sharedTitle')}
        </Txt>
        <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
          {t('social.sharedBody')}
        </Txt>

        <View style={{ marginTop: spacing.xl }}>
          {picking ? (
            <UsernamePicker
              buddyId={profile.buddyId}
              submitLabel={t('social.claim')}
              onDone={() => {
                setPicking(false);
                setNotice(null);
              }}
            />
          ) : (
            <Button
              label={t('social.giveUsername', { name })}
              tone="success"
              onPress={() => {
                setNotice(null);
                setPicking(true);
              }}
            />
          )}
        </View>
      </Screen>
    );
  }

  const friends = board?.entries.filter((entry) => !entry.me) ?? [];

  const shareCode = async () => {
    try {
      await Share.share({
        message: t('social.shareMessage', {
          username: account.username,
          code: formatInviteCode(account.inviteCode),
        }),
      });
    } catch {
      // A dismissed or unsupported share sheet is not an error worth showing.
    }
  };

  const rotateCode = async () => {
    const ok = await confirmAction({
      title: t('social.newCodeTitle'),
      body: t('social.newCodeBody'),
      action: t('social.newCode'),
      cancel: t('common.cancel'),
    });
    if (!ok) return;
    setBusy('code');
    const result = await newInviteCode(account);
    setBusy(null);
    if (result.ok) {
      updateAccount({ inviteCode: result.value.inviteCode });
      forgetBoard();
      setFailure(null);
    } else {
      if (result.error === 'unauthorized') loseAccount();
      setFailure(t('social.network'));
    }
  };

  const dropFriend = async (friendId: string, username: string) => {
    const ok = await confirmAction({
      title: t('social.removeFriendTitle', { username }),
      body: t('social.removeFriendBody'),
      action: t('social.removeFriend'),
      cancel: t('common.cancel'),
    });
    if (!ok) return;
    setBusy(friendId);
    const result = await removeFriend(account, friendId);
    setBusy(null);
    if (result.ok) {
      setFailure(null);
      void refresh();
    } else {
      if (result.error === 'unauthorized') loseAccount();
      setFailure(t('social.network'));
    }
  };

  const removeUsername = async () => {
    const ok = await confirmAction({
      title: t('social.removeConfirmTitle', { username: account.username }),
      body: t('social.removeConfirmBody'),
      action: t('social.removeAction'),
      cancel: t('common.cancel'),
    });
    if (!ok) return;

    setBusy('remove');
    const result = await deleteAccount(account);
    setBusy(null);

    if (result.ok || result.error === 'unauthorized') {
      forgetBoard();
      goOffline();
      setNotice(t('social.removed'));
      return;
    }

    // Unreachable server: say so, and let the parent decide rather than
    // pretending the username is gone.
    const localOnly = await confirmAction({
      title: t('social.removeFailedTitle'),
      body: t('social.removeFailedBody'),
      action: t('social.removeLocalOnly'),
      cancel: t('common.cancel'),
    });
    if (localOnly) {
      forgetBoard();
      goOffline();
    }
  };

  return (
    <Screen avoidKeyboard>
      <TopBar title={t('social.parentTitle')} />

      {failure ? (
        <Txt variant="small" color={colors.primaryDeep} style={{ marginBottom: spacing.md }}>
          {failure}
        </Txt>
      ) : null}

      <Txt variant="heading">{t('social.usernameTitle')}</Txt>
      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Buddy id={profile.buddyId} size={52} still />
          <Txt variant="title" style={{ flex: 1 }} numberOfLines={1}>
            {account.username}
          </Txt>
          {!renaming ? (
            <Button label={t('social.change')} tone="neutral" size="sm" full={false} onPress={() => setRenaming(true)} />
          ) : null}
        </View>
        {renaming ? (
          <UsernamePicker buddyId={profile.buddyId} submitLabel={t('social.rename')} onDone={() => setRenaming(false)} />
        ) : null}
      </Sticker>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('social.codeTitle')}
      </Txt>
      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.md }}>
        <Txt variant="display" center style={{ letterSpacing: 4 }} selectable>
          {formatInviteCode(account.inviteCode)}
        </Txt>
        <Txt variant="small" color={colors.textSoft} center>
          {t('social.codeBody')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t('social.shareCode')} tone="info" size="md" onPress={() => void shareCode()} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('social.newCode')}
              tone="neutral"
              size="md"
              busy={busy === 'code'}
              onPress={() => void rotateCode()}
            />
          </View>
        </View>
      </Sticker>

      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.xl }}>
        <AddFriendForm onAdded={() => void refresh()} />
      </Sticker>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('social.friendsTitle')}
        {friends.length > 0 ? ` · ${friends.length}` : ''}
      </Txt>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {!board && boardError ? (
          <Txt variant="small" color={colors.primaryDeep}>
            {t('social.loadFailed')}
          </Txt>
        ) : board && friends.length === 0 ? (
          <Txt variant="body" color={colors.textSoft}>
            {t('social.friendsEmpty')}
          </Txt>
        ) : null}

        {friends.map((friend) => (
          <Sticker
            key={friend.id}
            background={colors.surface}
            offset={3}
            border={borderWidth.hair}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Buddy id={friend.buddyId} size={40} still />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" numberOfLines={1}>
                {friend.username}
              </Txt>
              <Txt variant="tiny" color={colors.textSoft}>
                {t('board.level', { level: friend.level })} · {friend.stars} ★
              </Txt>
            </View>
            <Button
              label={t('social.removeFriend')}
              tone="neutral"
              size="sm"
              full={false}
              busy={busy === friend.id}
              onPress={() => void dropFriend(friend.id, friend.username)}
            />
          </Sticker>
        ))}
      </View>

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('social.sharedTitle')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('social.sharedBody')}
      </Txt>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('social.removeTitle')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('social.removeBody')}
      </Txt>
      <View style={{ marginTop: spacing.md }}>
        <Button
          label={t('social.removeTitle')}
          tone="primary"
          size="md"
          busy={busy === 'remove'}
          onPress={() => void removeUsername()}
        />
      </View>
    </Screen>
  );
}
