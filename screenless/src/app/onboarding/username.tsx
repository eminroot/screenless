import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { UsernamePicker } from '../../components/social/UsernamePicker';
import { Button, Screen, StepDots, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { deleteAccount } from '../../online/api';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { useDraft } from './_layout';

type Choice = 'online' | 'offline';

/**
 * The parent decides whether this child gets a username.
 *
 * Nothing is preselected, so neither answer happens by tapping Continue
 * without reading. Saying no persists straight away and the app never touches
 * the friends board. Saying yes only opens the network while the picker is on
 * screen, and the username is claimed the moment the parent confirms it.
 */
export default function UsernameStep() {
  const router = useRouter();
  const { t } = useI18n();
  const { draft } = useDraft();
  const { data, goOffline } = useApp();
  const account = data.social.mode === 'online' ? data.social.account : null;

  const [choice, setChoice] = useState<Choice | null>(
    data.social.mode === 'unset' ? null : data.social.mode,
  );
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = draft.nickname.trim();
  const next = () => router.push('/onboarding/interests');

  const pick = (value: Choice) => {
    void Haptics.selectionAsync();
    setChoice(value);
    setError(null);
  };

  const keepOffline = async () => {
    // Changing their mind after claiming one: the username is deleted from the
    // server before this phone forgets it, or it would sit there unowned.
    if (account) {
      setBusy(true);
      const result = await deleteAccount(account);
      setBusy(false);
      if (!result.ok && result.error !== 'unauthorized') {
        setError(t('social.network'));
        return;
      }
    }
    goOffline();
    next();
  };

  return (
    <Screen avoidKeyboard>
      <TopBar />
      <StepDots step={2} total={6} />

      <Txt variant="title">{t('social.setupTitle', { name })}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.sm }}>
        {t('social.setupBody')}
      </Txt>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <ChoiceCard
          selected={choice === 'online'}
          title={t('social.choiceOnline')}
          body={t('social.choiceOnlineBody')}
          onPress={() => pick('online')}
        />
        <ChoiceCard
          selected={choice === 'offline'}
          title={t('social.choiceOffline')}
          body={t('social.choiceOfflineBody')}
          onPress={() => pick('offline')}
        />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {choice === 'online' ? (
          account && !changing ? (
            <>
              <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
                <Txt variant="subheading">{t('social.alreadyYours', { username: account.username })}</Txt>
              </Sticker>
              <Button label={t('social.keep', { username: account.username })} tone="success" onPress={next} />
              <Button label={t('social.change')} tone="ghost" size="md" onPress={() => setChanging(true)} />
            </>
          ) : (
            <UsernamePicker
              buddyId={draft.buddyId}
              submitLabel={account ? t('social.rename') : t('social.claimAndContinue')}
              onDone={() => {
                setChanging(false);
                next();
              }}
            />
          )
        ) : null}

        {choice === 'offline' ? (
          <Button
            label={account ? t('social.removeAndContinue') : t('common.continue')}
            busy={busy}
            onPress={() => void keepOffline()}
          />
        ) : null}

        {error ? (
          <Txt variant="small" color={colors.primaryDeep}>
            {error}
          </Txt>
        ) : null}

        {choice ? (
          <Txt variant="tiny" color={colors.textFaint}>
            {t('social.laterNote')}
          </Txt>
        ) : null}
      </View>
    </Screen>
  );
}

function ChoiceCard({
  selected,
  title,
  body,
  onPress,
}: {
  selected: boolean;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <Sticker background={selected ? colors.accent : colors.surface} offset={selected ? 5 : 4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="subheading">{title}</Txt>
            <Txt variant="small" color={selected ? colors.text : colors.textSoft}>
              {body}
            </Txt>
          </View>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: radii.pill,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              backgroundColor: selected ? colors.surface : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected ? <Txt variant="tiny">✓</Txt> : null}
          </View>
        </View>
      </Sticker>
    </Pressable>
  );
}
