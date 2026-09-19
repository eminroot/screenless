import { useCallback, useContext, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';

import { chatWithBuddy } from '../../ai/gemini';
import { checkChildInput } from '../../ai/safety';
import { Buddy } from '../../components/buddy/Buddy';
import { useI18n } from '../../i18n';
import { useNarrator } from '../../lib/voice';
import { makeId, useApp } from '../../state/app-state';
import type { ChatMessage } from '../../state/types';
import { ClayCard, ClayIconButton, ClayTile } from '../components/Clay';
import { LText } from '../components/LText';
import { Mascot } from '../components/Mascot';
import { Sky } from '../components/Sky';
import { PlayIcon, SpeakerIcon, TalkIcon } from '../icons';
import { fontsLittle, ink, lip, MAX_COLUMN, round, space, tones } from '../theme';

/**
 * Talking to the buddy, for ages 3 to 5.
 *
 * A child this age is usually typing with a parent beside them, or not typing
 * at all: the three starter blocks do most of the work and the buddy reads
 * every reply out loud. What comes back is filtered on the way in and again on
 * the way out, and nothing about the child is ever sent.
 */
export function LittleChat() {
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
    <View style={{ flex: 1 }}>
      <Sky />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* The buddy stays at the top through the whole conversation, so the
            child can always see who they are talking to. */}
        <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg }}>
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
            <ClayCard radius={round.md} depth={lip.md} style={{ padding: space.xs }}>
              <Buddy id={profile.buddyId} size={58} mood={thinking ? 'talking' : 'idle'} wearing={data.wardrobe.worn} still />
            </ClayCard>
            <View style={{ flex: 1 }}>
              <LText variant="heading" numberOfLines={1}>
                {profile.buddyName}
              </LText>
              <LText variant="tiny" color={ink.soft} numberOfLines={2}>
                {t('chat.safetyNotice')}
              </LText>
            </View>
            {data.chat.length > 0 ? (
              <ClayIconButton
                icon={<TalkIcon size={24} color={tones.coral.ink} />}
                tone="coral"
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
          contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.md }}>
            {data.chat.length === 0 ? (
              <View style={{ gap: space.md, alignItems: 'center' }}>
                <Mascot
                  id={profile.buddyId}
                  name={profile.buddyName}
                  size={150}
                  mood="happy"
                  wearing={data.wardrobe.worn}
                  halo="bubble"
                  onTap={() => narrator.say(t('chat.emptyBody', { buddy: profile.buddyName }))}
                />
                <LText variant="title" center>
                  {t('chat.emptyTitle')}
                </LText>
                <LText variant="body" color={ink.soft} center>
                  {t('chat.emptyBody', { buddy: profile.buddyName })}
                </LText>

                <View style={{ gap: space.sm, marginTop: space.sm, alignSelf: 'stretch' }}>
                  {starters.map((starter, index) => (
                    <ClayTile
                      key={starter}
                      tone={(['sun', 'sky', 'bubble'] as const)[index % 3]}
                      accessibilityLabel={starter}
                      onPress={() => void send(starter)}
                      style={{
                        padding: space.lg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                      }}
                    >
                      <LText
                        variant="label"
                        color={tones[(['sun', 'sky', 'bubble'] as const)[index % 3]].ink}
                        style={{ flex: 1 }}
                      >
                        {starter}
                      </LText>
                      <PlayIcon size={22} color={tones[(['sun', 'sky', 'bubble'] as const)[index % 3]].ink} />
                    </ClayTile>
                  ))}
                </View>
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
              <Animated.View entering={FadeInDown.duration(180)} style={{ alignSelf: 'flex-start', maxWidth: '84%' }}>
                <ClayCard radius={round.lg} style={{ paddingVertical: space.md, paddingHorizontal: space.lg }}>
                  <LText variant="body" color={ink.soft}>
                    {t('chat.thinking', { buddy: profile.buddyName })}
                  </LText>
                </ClayCard>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        {/* ------------------------------------------------------- the input */}
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.sm,
            paddingBottom: Math.max(tabBar, insets.bottom + space.md),
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
            <View style={{ flex: 1, paddingBottom: lip.md }}>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: lip.md,
                  bottom: 0,
                  borderRadius: round.lg,
                  backgroundColor: tones.white.lip,
                }}
              />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={ink.faint}
                multiline
                maxLength={300}
                style={{
                  minHeight: 56,
                  maxHeight: 120,
                  backgroundColor: tones.white.face,
                  borderRadius: round.lg,
                  paddingHorizontal: space.lg,
                  paddingTop: space.md,
                  paddingBottom: space.md,
                  fontFamily: fontsLittle.body,
                  fontSize: 17,
                  color: ink.text,
                }}
              />
            </View>

            <ClayIconButton
              icon={<PlayIcon size={26} color={canSend ? tones.grape.ink : ink.faint} />}
              tone={canSend ? 'grape' : 'white'}
              size={56}
              accessibilityLabel={t('chat.send')}
              onPress={() => {
                if (canSend) void send(draft);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/** One line of the conversation. The buddy speaks on the left, the child on the right. */
function SpeechRow({ message, onSpeak }: { message: ChatMessage; onSpeak?: () => void }) {
  const mine = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}
    >
      <ClayCard
        tone={mine ? 'sky' : 'white'}
        radius={round.lg}
        style={{
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
        }}
      >
        <LText variant="body" color={mine ? tones.sky.ink : ink.text} style={{ flexShrink: 1 }}>
          {message.text}
        </LText>
        {!mine && onSpeak ? (
          <Pressable accessibilityRole="button" accessibilityLabel={message.text} onPress={onSpeak} hitSlop={8}>
            <SpeakerIcon size={24} color={tones.grape.face} />
          </Pressable>
        ) : null}
      </ClayCard>
    </Animated.View>
  );
}
