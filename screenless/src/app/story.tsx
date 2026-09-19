import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { rankStories, type Story } from '../data/stories';
import { currentContext } from '../engine/context';
import { learnFromMissions } from '../engine/learning';
import { pickTask } from '../engine/task-engine';
import { useI18n } from '../i18n';
import { useNarrator } from '../lib/voice';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

/**
 * The buddy as a talking book.
 *
 * Reading happens at the phone's own text to speech, which means it works with
 * no connection and no account, and every story ends by sending the child at
 * something real rather than at the next episode.
 */
export default function StoryScreen() {
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, markStoryHeard, assignMission } = useApp();

  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
  const { say, stop } = narrator;

  const stories = useMemo(
    () => (profile ? rankStories(profile.ageBand, profile.interests, data.storiesHeard) : []),
    [profile, data.storiesHeard],
  );

  const lastPage = story ? story.pages.length : 0;
  const onCloser = story ? page >= lastPage : false;
  const text = story ? (onCloser ? pick(story.closer) : pick(story.pages[page])) : '';

  // Every page reads itself out as it arrives.
  useEffect(() => {
    if (!story) return;
    say(text);
  }, [story?.id, page, say, text, story]);

  useEffect(() => () => stop(), [stop]);

  const open = useCallback(
    (chosen: Story) => {
      void Haptics.selectionAsync();
      setStory(chosen);
      setPage(0);
    },
    [],
  );

  const close = useCallback(() => {
    stop();
    setStory(null);
    setPage(0);
  }, [stop]);

  const finish = useCallback(() => {
    if (!story || !profile) return;
    stop();
    markStoryHeard(story.id);

    // The closing line points at something to go and do, so the button after it
    // hands over a real mission rather than another story.
    const task = pickTask(profile, data.missions, {
      favourVariety: true,
      context: currentContext(),
      learned: learnFromMissions(data.missions, data.ideaVotes),
      allowDuo: data.settings.duoEnabled,
      badgesReady: Boolean(data.badges),
    });
    assignMission(task);
    router.replace('/mission');
  }, [story, profile, stop, markStoryHeard, data.missions, data.ideaVotes, data.settings.duoEnabled, data.badges, assignMission, router]);

  if (!profile) return null;

  /* ---------------------------------------------------------------- reader */
  if (story) {
    return (
      <Screen>
        <TopBar onBack={close} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Txt variant="subheading">{story.emoji}</Txt>
          <Txt variant="subheading" style={{ flex: 1 }} numberOfLines={1}>
            {pick(story.title)}
          </Txt>
          <Txt variant="tiny" color={colors.textFaint}>
            {onCloser
              ? t('story.theEnd')
              : t('common.of', { current: page + 1, total: lastPage })}
          </Txt>
        </View>

        <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.lg }}>
          <Buddy
            id={profile.buddyId}
            size={150}
            mood={narrator.speaking ? 'talking' : onCloser ? 'happy' : 'idle'}
            wearing={data.wardrobe.worn}
            label={profile.buddyName}
          />
        </View>

        <Sticker
          background={onCloser ? colors.accent : colors.surface}
          style={{ padding: spacing.xl, marginTop: spacing.lg, minHeight: 190, justifyContent: 'center' }}
        >
          <Txt variant="body" style={{ fontSize: 18, lineHeight: 28 }}>
            {text}
          </Txt>
        </Sticker>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, justifyContent: 'center' }}>
          {story.pages.map((_, index) => (
            <View
              key={index}
              style={{
                width: 9,
                height: 9,
                borderRadius: radii.pill,
                backgroundColor: index <= page ? colors.primary : colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          ))}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {data.settings.voiceEnabled ? (
            <Button
              label={narrator.speaking ? t('story.pause') : t('story.readAgain')}
              tone="magic"
              size="md"
              onPress={() => (narrator.speaking ? stop() : say(text))}
            />
          ) : null}

          {onCloser ? (
            <Button label={t('story.giveMission')} tone="primary" onPress={finish} />
          ) : (
            <Button label={t('story.next')} tone="primary" onPress={() => setPage((p) => p + 1)} />
          )}

          {page > 0 ? (
            <Button
              label={t('story.back')}
              tone="ghost"
              size="md"
              onPress={() => setPage((p) => Math.max(0, p - 1))}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- picker */
  return (
    <Screen>
      <TopBar onBack={() => router.replace('/(tabs)')} />

      <Txt variant="title">{t('story.title')}</Txt>
      <Txt variant="body" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('story.subtitle', { buddy: profile.buddyName })}
      </Txt>

      <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
        <SpeechBubble text={t('story.buddyLine')} tailSide="left" />
        <Buddy id={profile.buddyId} size={160} mood="happy" label={profile.buddyName} />
      </View>

      <View style={{ gap: spacing.md }}>
        {stories.map((item) => {
          const heard = data.storiesHeard.includes(item.id);
          return (
            <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item)}>
              <Sticker background={colors.surface} offset={4}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.lg,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radii.md,
                      borderWidth: borderWidth.thick,
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt variant="heading">{item.emoji}</Txt>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyStrong">{pick(item.title)}</Txt>
                    <Txt variant="tiny" color={colors.textSoft}>
                      {t('story.minutes', { count: item.minutes })}
                      {heard ? ` · ${t('story.heard')}` : ''}
                    </Txt>
                  </View>
                  <Txt variant="subheading" color={colors.textFaint}>
                    ›
                  </Txt>
                </View>
              </Sticker>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
