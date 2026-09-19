import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { MissionCard } from '../../components/MissionCard';
import { RewardGoal } from '../../components/RewardGoal';
import { FriendsCard } from '../../components/social/FriendsCard';
import { Button, Screen, SpeechBubble, Sticker, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { generateSurpriseTask } from '../../ai/gemini';
import { isGeminiConfigured } from '../../ai/config';
import { objectEmoji } from '../../data/room-objects';
import { currentContext, TIME_CHOICES, type TimeChoice } from '../../engine/context';
import { treeHeadline, treeStatus } from '../../engine/find-engine';
import { learnFromMissions } from '../../engine/learning';
import { buildRoomMission } from '../../engine/room-engine';
import { pickTask } from '../../engine/task-engine';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';
import { useExperience } from '../../experience';
import { LittleHome } from '../../little/screens/LittleHome';
import { JuniorHome } from '../../junior/screens/JuniorHome';
import { TeenHome } from '../../teen/screens/TeenHome';

export default function TodayRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleHome />;
  if (experience === 'junior') return <JuniorHome />;
  if (experience === 'teen') return <TeenHome />;
  return <Today />;
}

function Today() {
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, pendingMissions, assignMission } = useApp();
  const [busy, setBusy] = useState(false);
  const [minutes, setMinutes] = useState<TimeChoice>(null);
  const [indoorOnly, setIndoorOnly] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.greetingMorning' as const;
    if (hour < 18) return 'home.greetingDay' as const;
    return 'home.greetingEvening' as const;
  }, []);

  const waiting = pendingMissions.length > 0;
  const streak = data.progress.streak;
  const room = data.room;
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);

  const newMission = useCallback(
    async (surprise: boolean) => {
      if (!profile || busy) return;
      setBusy(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const context = currentContext({ maxMinutes: minutes, indoorOnly });
      const learned = learnFromMissions(data.missions, data.ideaVotes);

      let task = null;
      if (surprise && isGeminiConfigured) {
        const recent = data.missions.slice(-6).map((m) => pick(m.task.title));
        const result = await generateSurpriseTask({ profile, language, avoidTitles: recent });
        if (result.ok) task = result.value;
      }
      // A generated mission is a bonus. If anything goes wrong the child still
      // gets a real mission from the curated library.
      assignMission(
        task ??
          pickTask(profile, data.missions, {
            favourVariety: surprise,
            context,
            learned,
            allowDuo: data.settings.duoEnabled,
          }),
      );
      setBusy(false);
    },
    [profile, busy, data.missions, data.ideaVotes, data.settings.duoEnabled, assignMission, language, pick, minutes, indoorOnly],
  );

  /** Builds straight from the last scan, without walking the room again. */
  const missionFromRoom = useCallback(() => {
    if (!profile || !room) return;
    const task = buildRoomMission({
      scan: room,
      profile,
      missions: data.missions,
      allowDuo: data.settings.duoEnabled,
    });
    if (!task) {
      router.push('/scan');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    assignMission(task);
    router.push('/mission');
  }, [profile, room, data.missions, data.settings.duoEnabled, assignMission, router]);

  if (!profile) return null;

  const buddyMood = waiting ? 'happy' : activeMission ? 'talking' : 'idle';
  const buddyLine = waiting
    ? t('home.waitingBody')
    : activeMission
      ? pick(activeMission.task.title)
      : t('home.noMission');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Txt variant="title" style={{ flex: 1 }} numberOfLines={2}>
          {t(greeting, { name: profile.nickname })}
        </Txt>
        <StreakPill
          count={streak}
          label={streak > 0 ? t('home.streak', { count: streak }) : t('home.streakZero')}
        />
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing.lg, gap: spacing.md }}>
        <SpeechBubble text={buddyLine} tailSide="left" />
        <Buddy
          id={profile.buddyId}
          size={190}
          mood={buddyMood}
          wearing={data.wardrobe.worn}
          label={profile.buddyName}
        />
      </View>

      <RewardGoal style={{ marginTop: spacing.lg }} />
      <FriendsCard style={{ marginTop: spacing.lg }} />

      {/* A tree that has changed, or is overdue, outranks anything else here:
          it is the one thing on this screen with a clock on it. */}
      {data.tree && tree && (tree.due || tree.grew || tree.changed) ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={data.tree.name}
          onPress={() => router.push('/tree')}
          style={{ marginTop: spacing.lg }}
        >
          <Sticker background={colors.success} style={{ padding: spacing.lg, gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Txt variant="title">🌳</Txt>
              <Txt variant="heading" color={colors.surface} style={{ flex: 1 }}>
                {t(`tree.headline${treeKey(tree)}` as TKey, {
                  name: data.tree.name,
                  days: Math.max(1, tree.daysUntil),
                })}
              </Txt>
            </View>
          </Sticker>
        </Pressable>
      ) : null}

      {waiting ? (
        <Sticker
          background={colors.accent}
          style={{ padding: spacing.lg, gap: spacing.sm, marginTop: spacing.lg }}
        >
          <Txt variant="heading">{t('home.waitingTitle')}</Txt>
          <Txt variant="body">{t('home.waitingBody')}</Txt>
        </Sticker>
      ) : activeMission ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.lg }}>
          <Txt variant="subheading" color={colors.textSoft}>
            {t('home.missionTitle')}
          </Txt>
          <MissionCard task={activeMission.task} />
          <Button
            label={t('home.startMission')}
            tone="primary"
            onPress={() => router.push('/mission')}
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
          <ContextBar
            minutes={minutes}
            indoorOnly={indoorOnly}
            onMinutes={setMinutes}
            onIndoor={setIndoorOnly}
          />

          {/* Hidden when the child has said they are stuck inside, since every
              one of these missions is an outdoor one. */}
          {!indoorOnly ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/collect')}>
              <Sticker background={colors.success} style={{ padding: spacing.lg, gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Txt variant="title">🔎</Txt>
                  <Txt variant="heading" color={colors.surface} style={{ flex: 1 }}>
                    {t('collect.title')}
                  </Txt>
                </View>
                <Txt variant="small" color={colors.surface}>
                  {t('collect.buddyLine')}
                </Txt>
              </Sticker>
            </Pressable>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => router.push('/scan')}>
            <Sticker background={colors.magic} style={{ padding: spacing.lg, gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Txt variant="title">📷</Txt>
                <Txt variant="heading" color={colors.surface} style={{ flex: 1 }}>
                  {t('home.scanTitle')}
                </Txt>
              </View>
              <Txt variant="small" color={colors.surface}>
                {t('home.scanBody')}
              </Txt>
            </Sticker>
          </Pressable>

          {room && room.objects.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={missionFromRoom}>
              <Sticker background={colors.surface} offset={4} style={{ padding: spacing.md, gap: spacing.sm }}>
                <Txt variant="tiny" color={colors.textSoft}>
                  {t('home.lastScan')}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', flex: 1, gap: 2 }}>
                    {room.objects.slice(0, 8).map((object) => (
                      <Txt key={object} variant="subheading">
                        {objectEmoji(object)}
                      </Txt>
                    ))}
                  </View>
                  <Txt variant="tiny" color={colors.magicDeep}>
                    {t('home.useRoom')}
                  </Txt>
                </View>
              </Sticker>
            </Pressable>
          ) : null}

          <Button
            label={t('home.newMission')}
            tone="primary"
            busy={busy}
            onPress={() => void newMission(false)}
          />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('home.storyCta')}
                tone="accent"
                size="md"
                onPress={() => router.push('/story')}
              />
            </View>
            {isGeminiConfigured ? (
              <View style={{ flex: 1 }}>
                <Button
                  label={t('home.surprise')}
                  tone="magic"
                  size="md"
                  busy={busy}
                  onPress={() => void newMission(true)}
                />
              </View>
            ) : null}
          </View>
        </View>
      )}

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label={t('home.chatCta', { buddy: profile.buddyName })}
          tone="ghost"
          size="md"
          onPress={() => router.push('/(tabs)/chat')}
        />
      </View>
    </Screen>
  );
}

/** Picks which tree line to show, matching the key names in the bundles. */
function treeKey(status: NonNullable<ReturnType<typeof treeStatus>>): string {
  const { key } = treeHeadline(status);
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/* -------------------------------------------------------------- components */

/**
 * The two things the app cannot work out on its own: how long the child has,
 * and whether they can go outside. Everything else about the moment, the hour
 * and the day of the week, it reads from the clock.
 */
function ContextBar({
  minutes,
  indoorOnly,
  onMinutes,
  onIndoor,
}: {
  minutes: TimeChoice;
  indoorOnly: boolean;
  onMinutes: (value: TimeChoice) => void;
  onIndoor: (value: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <View style={{ gap: spacing.sm }}>
      <Txt variant="tiny" color={colors.textSoft}>
        {t('home.howLong')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {TIME_CHOICES.map((choice) => (
          <Toggle
            key={String(choice)}
            label={choice === null ? t('home.timeAny') : t('common.minutesShort', { count: choice })}
            active={minutes === choice}
            onPress={() => onMinutes(choice)}
          />
        ))}
        <Toggle label={t('home.indoors')} active={indoorOnly} onPress={() => onIndoor(!indoorOnly)} />
      </View>
    </View>
  );
}

function Toggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={{
        backgroundColor: active ? colors.info : colors.surface,
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
      }}
    >
      <Txt variant="tiny" color={active ? colors.surface : colors.textSoft}>
        {label}
      </Txt>
    </Pressable>
  );
}

function StreakPill({ count, label }: { count: number; label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: count > 0 ? colors.accent : colors.surface,
        borderRadius: radii.pill,
        borderWidth: borderWidth.thick,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        maxWidth: 140,
      }}
    >
      <Txt variant="small">{count > 0 ? '🔥' : '✨'}</Txt>
      <Txt variant="tiny" numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </Txt>
    </View>
  );
}
