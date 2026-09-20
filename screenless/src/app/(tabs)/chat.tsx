import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { thinkThenReply } from '../../chat/buddy-replies';
import { checkChildInput } from '../../ai/safety';
import { Buddy } from '../../components/buddy/Buddy';
import { Sticker, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { makeId, useApp } from '../../state/app-state';
import type { ChatMessage } from '../../state/types';
import { borderWidth, colors, fonts, radii, spacing } from '../../theme/tokens';
import { useExperience } from '../../experience';
import { LittleChat } from '../../little/screens/LittleChat';
import { JuniorChat } from '../../junior/screens/JuniorChat';
import { TeenChat } from '../../teen/screens/TeenChat';

export default function ChatRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleChat />;
  if (experience === 'junior') return <JuniorChat />;
  if (experience === 'teen') return <TeenChat />;
  return <Chat />;
}

function Chat() {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const { profile, data, activeMission, pushChat, clearChat } = useApp();

  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const say = useCallback(
    (text: string) => {
      pushChat({ id: makeId('b'), role: 'buddy', text, at: new Date().toISOString() });
    },
    [pushChat],
  );

  const send = useCallback(
    async (raw: string) => {
      if (!profile || thinking) return;

      const verdict = checkChildInput(raw);
      if (!verdict.ok) {
        if (verdict.reason === 'personal') say(t('chat.personalWarning'));
        if (verdict.reason === 'escalate') say(t('chat.escalate'));
        setDraft('');
        return;
      }

      const message: ChatMessage = {
        id: makeId('u'),
        role: 'user',
        text: verdict.text,
        at: new Date().toISOString(),
      };
      pushChat(message);
      setDraft('');
      setThinking(true);

      say(
        await thinkThenReply({
          text: verdict.text,
          profile,
          language,
          mission: activeMission,
          history: data.chat,
        }),
      );

      setThinking(false);
    },
    [profile, thinking, pushChat, say, t, language, activeMission, data.chat],
  );

  if (!profile) return null;

  const starters = [t('chat.starter1'), t('chat.starter2'), t('chat.starter3')];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          borderBottomWidth: borderWidth.thick,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Buddy
          id={profile.buddyId}
          size={62}
          mood={thinking ? 'talking' : 'idle'}
          wearing={data.wardrobe.worn}
          label={profile.buddyName}
        />
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" numberOfLines={1}>
            {t('chat.title', { buddy: profile.buddyName })}
          </Txt>
          <Txt variant="tiny" color={colors.textFaint} numberOfLines={2}>
            {t('chat.safetyNotice')}
          </Txt>
        </View>
        {data.chat.length > 0 ? (
          <Pressable onPress={clearChat} hitSlop={10} accessibilityLabel={t('chat.clear')}>
            <Txt variant="subheading">🧹</Txt>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        {data.chat.length === 0 ? (
          <View style={{ gap: spacing.md, alignItems: 'center', paddingTop: spacing.xl }}>
            <Txt variant="heading">{t('chat.emptyTitle')}</Txt>
            <Txt variant="body" color={colors.textSoft} center>
              {t('chat.emptyBody', { buddy: profile.buddyName })}
            </Txt>
            <View style={{ gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' }}>
              {starters.map((starter) => (
                <Pressable key={starter} onPress={() => void send(starter)}>
                  <Sticker background={colors.surface} offset={4} style={{ padding: spacing.md }}>
                    <Txt variant="bodyStrong" center>
                      {starter}
                    </Txt>
                  </Sticker>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          data.chat.map((message) => <Bubble key={message.id} message={message} />)
        )}

        {thinking ? (
          <View style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
            <Sticker background={colors.surface} offset={4} style={{ padding: spacing.md }}>
              <Txt variant="small" color={colors.textSoft}>
                {t('chat.thinking', { buddy: profile.buddyName })}
              </Txt>
            </Sticker>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          paddingBottom: spacing.lg,
          borderTopWidth: borderWidth.thick,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'flex-end',
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={300}
          style={{
            flex: 1,
            maxHeight: 110,
            minHeight: 48,
            backgroundColor: colors.bg,
            borderRadius: radii.md,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.text,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          disabled={!draft.trim() || thinking}
          onPress={() => void send(draft)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: draft.trim() && !thinking ? colors.magic : colors.surfaceAlt,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="subheading" color={colors.surface}>
            ➤
          </Txt>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '84%' }}>
      <Sticker
        background={mine ? colors.info : colors.surface}
        offset={4}
        style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
      >
        <Txt variant="body" color={mine ? colors.surface : colors.text}>
          {message.text}
        </Txt>
      </Sticker>
    </View>
  );
}
