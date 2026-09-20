import { useCallback, useContext, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { thinkThenReply } from '../../chat/buddy-replies';
import { checkChildInput } from '../../ai/safety';
import { Buddy } from '../../components/buddy/Buddy';
import { useI18n } from '../../i18n';
import { useNarrator } from '../../lib/voice';
import { makeId, useApp } from '../../state/app-state';
import type { ChatMessage } from '../../state/types';
import { IconButton } from '../components/Button';
import { JText } from '../components/JText';
import { Card, CardButton, IconTile } from '../components/Surface';
import { ChatIcon, ChevronIcon, RefreshIcon, SendIcon, SpeakerIcon } from '../icons';
import {
  accents,
  border,
  fontsJunior,
  ink,
  MAX_COLUMN,
  palette,
  radius,
  space,
} from '../theme';

/**
 * Talking to the buddy, for ages 6 to 9.
 *
 * A conversation, laid out like one: the buddy on the left, the child on the
 * right, a real text field at the bottom. At this age children type — badly,
 * slowly, and with enormous determination — so the field is the main way in
 * and the three starters are there for the days nothing comes to mind.
 *
 * What comes back is filtered on the way in and again on the way out, and
 * nothing about the child is ever sent.
 */
export function JuniorChat() {
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const { t, language } = useI18n();
  const { profile, data, activeMission, pushChat, clearChat } = useApp();

  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);

  const say = useCallback(
    (text: string) => {
      pushChat({ id: makeId('b'), role: 'buddy', text, at: new Date().toISOString() });
      narrator.say(text);
    },
    [pushChat, narrator],
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
  const canSend = Boolean(draft.trim()) && !thinking;

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* The buddy stays at the top through the whole conversation, so the
            child can always see who they are talking to. */}
        <View
          style={{
            paddingTop: insets.top + space.sm,
            paddingHorizontal: space.lg,
            paddingBottom: space.md,
            backgroundColor: palette.surface,
            borderBottomWidth: border.hair,
            borderBottomColor: palette.ink,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: MAX_COLUMN,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
            }}
          >
            <IconTile accent="blue" size={48}>
              <Buddy id={profile.buddyId} size={46} mood={thinking ? 'talking' : 'idle'} wearing={data.wardrobe.worn} still />
            </IconTile>
            <View style={{ flex: 1 }}>
              <JText variant="bodyStrong" numberOfLines={1}>
                {profile.buddyName}
              </JText>
              <JText variant="small" color={ink.muted} numberOfLines={2}>
                {t('chat.safetyNotice')}
              </JText>
            </View>
            {data.chat.length > 0 ? (
              <IconButton
                icon={<RefreshIcon size={22} />}
                kind="cream"
                size={44}
                accessibilityLabel={t('chat.clear')}
                onPress={clearChat}
              />
            ) : null}
          </View>
        </View>

        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.md }}>
            {data.chat.length === 0 ? (
              <View style={{ gap: space.md }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <IconTile accent="violet" size={48}>
                      <ChatIcon size={24} color={accents.violet.base} />
                    </IconTile>
                    <View style={{ flex: 1 }}>
                      <JText variant="heading">{t('chat.emptyTitle')}</JText>
                      <JText variant="small" color={ink.muted}>
                        {t('chat.emptyBody', { buddy: profile.buddyName })}
                      </JText>
                    </View>
                  </View>
                </Card>

                {starters.map((starter) => (
                  <CardButton key={starter} accessibilityLabel={starter} onPress={() => void send(starter)} padded={false}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                        padding: space.lg,
                      }}
                    >
                      <JText variant="body" style={{ flex: 1 }}>
                        {starter}
                      </JText>
                      <ChevronIcon size={20} />
                    </View>
                  </CardButton>
                ))}
              </View>
            ) : (
              data.chat.map((message) => (
                <SpeechRow
                  key={message.id}
                  message={message}
                  onSpeak={data.settings.voiceEnabled ? () => narrator.say(message.text) : undefined}
                />
              ))
            )}

            {thinking ? (
              <Animated.View entering={FadeInDown.duration(160)} style={{ alignSelf: 'flex-start', maxWidth: '86%' }}>
                <View
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: radius.card,
                    borderWidth: border.ink,
                    borderColor: palette.ink,
                    paddingVertical: space.md,
                    paddingHorizontal: space.lg,
                  }}
                >
                  <JText variant="body" color={ink.muted}>
                    {t('chat.thinking', { buddy: profile.buddyName })}
                  </JText>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        {/* ------------------------------------------------------- the input */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(tabBar, insets.bottom + space.md),
            backgroundColor: palette.surface,
            borderTopWidth: border.hair,
            borderTopColor: palette.ink,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: MAX_COLUMN,
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: space.sm,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={ink.muted}
              multiline
              maxLength={300}
              style={{
                flex: 1,
                minHeight: 52,
                maxHeight: 120,
                backgroundColor: palette.sunken,
                borderRadius: radius.chip,
                borderWidth: border.ink,
                borderColor: palette.ink,
                paddingHorizontal: space.lg,
                paddingTop: space.md,
                paddingBottom: space.md,
                fontFamily: fontsJunior.medium,
                fontSize: 17,
                color: ink.strong,
              }}
            />
            <IconButton
              icon={<SendIcon size={22} color={canSend ? '#FFFFFF' : ink.muted} />}
              accent="blue"
              kind={canSend ? 'solid' : 'cream'}
              size={52}
              disabled={!canSend}
              accessibilityLabel={t('chat.send')}
              onPress={() => void send(draft)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** One line of the conversation. The buddy on the left, the child on the right. */
function SpeechRow({ message, onSpeak }: { message: ChatMessage; onSpeak?: () => void }) {
  const mine = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: space.sm,
          backgroundColor: mine ? accents.blue.solid : palette.surface,
          borderRadius: radius.card,
          borderWidth: mine ? 0 : border.ink,
          borderColor: palette.ink,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
        }}
      >
        <JText variant="read" color={mine ? '#FFFFFF' : ink.strong} style={{ flexShrink: 1 }}>
          {message.text}
        </JText>
        {!mine && onSpeak ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={message.text}
            onPress={onSpeak}
            hitSlop={12}
          >
            <SpeakerIcon size={20} color={accents.blue.base} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
