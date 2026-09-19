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

import { askParentCoach } from '../../ai/gemini';
import { checkParentInput } from '../../ai/safety';
import { Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { makeId, useApp } from '../../state/app-state';
import { borderWidth, colors, fonts, radii, spacing } from '../../theme/tokens';

export default function Coach() {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  const { profile, data, pushCoachChat, clearCoachChat } = useApp();

  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const ask = useCallback(
    async (raw: string) => {
      if (busy) return;
      const verdict = checkParentInput(raw);
      if (!verdict.ok) return;

      pushCoachChat({ id: makeId('p'), role: 'user', text: verdict.text, at: new Date().toISOString() });
      setDraft('');
      setBusy(true);

      const result = await askParentCoach({
        profile,
        language,
        history: data.coachChat,
        question: verdict.text,
      });

      pushCoachChat({
        id: makeId('c'),
        role: 'buddy',
        text: result.ok ? result.value : t('errors.network'),
        at: new Date().toISOString(),
      });
      setBusy(false);
    },
    [busy, pushCoachChat, profile, language, data.coachChat, t],
  );

  const starters = [t('parent.coachStarter1'), t('parent.coachStarter2'), t('parent.coachStarter3')];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg, paddingHorizontal: spacing.xl }}>
        <TopBar
          title={t('parent.coachTitle')}
          right={
            data.coachChat.length > 0 ? (
              <Pressable onPress={clearCoachChat} hitSlop={10}>
                <Txt variant="subheading">🧹</Txt>
              </Pressable>
            ) : undefined
          }
        />
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
      >
        <Txt variant="body" color={colors.textSoft}>
          {t('parent.coachSubtitle')}
        </Txt>

        {data.coachChat.length === 0 ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {starters.map((starter) => (
              <Pressable key={starter} onPress={() => void ask(starter)}>
                <Sticker background={colors.surface} offset={4} style={{ padding: spacing.md }}>
                  <Txt variant="small">{starter}</Txt>
                </Sticker>
              </Pressable>
            ))}
          </View>
        ) : (
          data.coachChat.map((message) => {
            const mine = message.role === 'user';
            return (
              <View
                key={message.id}
                style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '88%' }}
              >
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
          })
        )}

        {busy ? (
          <Txt variant="small" color={colors.textFaint}>
            {t('common.loading')}
          </Txt>
        ) : null}

        <Txt variant="tiny" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
          {t('parent.coachDisclaimer')}
        </Txt>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          borderTopWidth: borderWidth.thick,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'flex-end',
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('parent.coachPlaceholder')}
          placeholderTextColor={colors.textFaint}
          multiline
          maxLength={600}
          style={{
            flex: 1,
            maxHeight: 110,
            minHeight: 48,
            backgroundColor: colors.bg,
            borderRadius: radii.md,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: colors.text,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          disabled={!draft.trim() || busy}
          onPress={() => void ask(draft)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: draft.trim() && !busy ? colors.info : colors.surfaceAlt,
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
