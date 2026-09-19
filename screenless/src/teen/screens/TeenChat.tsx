import { useCallback, useContext, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { chatWithBuddy } from '../../ai/gemini';
import { checkChildInput } from '../../ai/safety';
import { Buddy } from '../../components/buddy/Buddy';
import { useI18n } from '../../i18n';
import { useNarrator } from '../../lib/voice';
import { makeId, useApp } from '../../state/app-state';
import type { ChatMessage } from '../../state/types';
import { IconButton } from '../components/Button';
import { PanelButton, Rule } from '../components/Surface';
import { TText } from '../components/TText';
import { ChevronIcon, RefreshIcon, SendIcon, SpeakerIcon } from '../icons';
import { border, fontsTeen, MAX_COLUMN, radius, space } from '../theme';
import { useSkin } from '../skin';

/**
 * Talking to the buddy, for ages 10 to 13.
 *
 * An ordinary messaging layout, because that is the only layout this age reads
 * as a conversation. Their own messages are acid blocks on the right; the
 * buddy is a plain panel on the left. No speech bubble tails, no oversized
 * avatar, nothing that signals "app for kids" if somebody glances over.
 *
 * What comes back is filtered on the way in and again on the way out, and
 * nothing about the child is ever sent.
 */
export function TeenChat() {
  const { palette, ink, accents } = useSkin();
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

      const result = await chatWithBuddy({
        profile,
        language,
        mission: activeMission,
        history: data.chat,
        message: verdict.text,
      });

      if (result.ok) say(result.value);
      else if (result.failure === 'blocked' || result.failure === 'unsafe') say(t('chat.blocked'));
      else if (result.failure === 'network' || result.failure === 'unconfigured') {
        say(t('chat.offline', { buddy: profile.buddyName }));
      } else say(t('chat.error', { buddy: profile.buddyName }));

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
        <View
          style={{
            paddingTop: insets.top + space.sm,
            paddingHorizontal: space.lg,
            paddingBottom: space.md,
            borderBottomWidth: border.hair,
            borderBottomColor: palette.line,
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
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: palette.sunken,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Buddy id={profile.buddyId} size={37} mood={thinking ? 'talking' : 'idle'} wearing={data.wardrobe.worn} still />
            </View>
            <View style={{ flex: 1 }}>
              <TText variant="bodyStrong" numberOfLines={1}>
                {profile.buddyName}
              </TText>
              <TText variant="caption" color={ink.muted} numberOfLines={1}>
                {t('chat.safetyNotice')}
              </TText>
            </View>
            {data.chat.length > 0 ? (
              <IconButton
                icon={<RefreshIcon size={17} />}
                kind="outline"
                size={38}
                accessibilityLabel={t('chat.clear')}
                onPress={clearChat}
              />
            ) : null}
          </View>
        </View>

        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.sm }}>
            {data.chat.length === 0 ? (
              <View style={{ gap: space.sm }}>
                <TText variant="label" color={ink.muted} style={{ marginBottom: space.xs }}>
                  {t('teen.startersLabel')}
                </TText>
                {starters.map((starter, index) => (
                  <View key={starter}>
                    {index > 0 ? <Rule /> : null}
                    <PanelButton
                      accessibilityLabel={starter}
                      onPress={() => void send(starter)}
                      padded={false}
                      style={{ borderWidth: 0 }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.md,
                          paddingVertical: space.md,
                        }}
                      >
                        <TText variant="body" color={ink.body} style={{ flex: 1 }}>
                          {starter}
                        </TText>
                        <ChevronIcon size={16} />
                      </View>
                    </PanelButton>
                  </View>
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
              <Animated.View entering={FadeIn.duration(140)} style={{ alignSelf: 'flex-start', maxWidth: '86%' }}>
                <View
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: radius.card,
                    borderWidth: border.hair,
                    borderColor: palette.line,
                    paddingVertical: space.md,
                    paddingHorizontal: space.lg,
                  }}
                >
                  <TText variant="body" color={ink.muted}>
                    {t('chat.thinking', { buddy: profile.buddyName })}
                  </TText>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: Math.max(tabBar, insets.bottom + space.md),
            borderTopWidth: border.hair,
            borderTopColor: palette.line,
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
                minHeight: 46,
                maxHeight: 120,
                backgroundColor: palette.sunken,
                borderRadius: radius.chip,
                borderWidth: border.hair,
                borderColor: palette.line,
                paddingHorizontal: space.lg,
                paddingTop: space.md,
                paddingBottom: space.md,
                fontFamily: fontsTeen.medium,
                fontSize: 16,
                color: ink.strong,
              }}
            />
            <IconButton
              icon={<SendIcon size={18} color={canSend ? accents.acid.on : ink.muted} />}
              kind={canSend ? 'solid' : 'outline'}
              size={46}
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

/** One line of the conversation. The child on the right in acid, the buddy on the left. */
function SpeechRow({ message, onSpeak }: { message: ChatMessage; onSpeak?: () => void }) {
  const { palette, ink, accents } = useSkin();
  const mine = message.role === 'user';

  return (
    <Animated.View
      entering={FadeIn.duration(140)}
      style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: space.sm,
          backgroundColor: mine ? accents.acid.solid : palette.surface,
          borderRadius: radius.card,
          borderWidth: border.hair,
          borderColor: mine ? accents.acid.solid : palette.line,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
        }}
      >
        <TText variant="body" color={mine ? accents.acid.on : ink.body} style={{ flexShrink: 1 }}>
          {message.text}
        </TText>
        {!mine && onSpeak ? (
          <Pressable accessibilityRole="button" accessibilityLabel={message.text} onPress={onSpeak} hitSlop={12}>
            <SpeakerIcon size={16} color={ink.muted} />
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}
