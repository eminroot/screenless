import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { isGeminiConfigured } from '../../ai/config';
import { generateSurpriseTask } from '../../ai/gemini';
import { currentContext } from '../../engine/context';
import { treeHeadline, treeStatus } from '../../engine/find-engine';
import { learnFromMissions } from '../../engine/learning';
import { buildRoomMission } from '../../engine/room-engine';
import { pickTask } from '../../engine/task-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import { ClayButton, ClayCard, ClayIconButton, ClayTile } from '../components/Clay';
import { Bubble } from '../components/Bubble';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { InboxCard } from '../components/InboxCard';
import { Mascot } from '../components/Mascot';
import { RewardCard } from '../components/RewardCard';
import { StatStrip } from '../components/StatStrip';
import {
  BookIcon,
  CameraIcon,
  CoinIcon,
  ExploreIcon,
  HomeIcon,
  LockIcon,
  PlayIcon,
  SparkleIcon,
  TreeIcon,
  WalkIcon,
} from '../icons';
import { ink, lip, round, space, tones, type ToneName } from '../theme';

/**
 * Today, for ages 3 to 5.
 *
 * The screen is one decision deep. The buddy is the biggest thing on it and
 * says the one sentence that matters; under the buddy is a single fat button
 * that does the one thing this screen is for. Everything else — the places to
 * explore, the room camera, a story, the walk — sits below in picture blocks
 * that a child who cannot read can still tell apart, and none of them compete
 * with the button for attention.
 *
 * The grown up gets in through the lock in the top corner, not a tab. A three
 * year old who taps a parent tab only ever meets a code pad.
 */
export function LittleHome() {
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, pendingMissions, assignMission } = useApp();

  const [busy, setBusy] = useState(false);
  const [indoors, setIndoors] = useState(false);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);

  const waiting = pendingMissions.length > 0;
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const room = data.room;

  const newMission = useCallback(
    async (surprise: boolean) => {
      if (!profile || busy) return;
      setBusy(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const context = currentContext({ maxMinutes: null, indoorOnly: indoors });
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
      router.push('/mission');
    },
    [profile, busy, indoors, data.missions, data.ideaVotes, data.settings.duoEnabled, assignMission, language, pick, router],
  );

  /** Builds straight from the last scan, without walking the room again. */
  const missionFromRoom = useCallback(() => {
    if (!profile || !room) {
      router.push('/scan');
      return;
    }
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

  const greeting =
    new Date().getHours() < 12
      ? 'home.greetingMorning'
      : new Date().getHours() < 18
        ? 'home.greetingDay'
        : 'home.greetingEvening';

  const line = waiting
    ? t('home.waitingBody')
    : activeMission
      ? pick(activeMission.task.title)
      : t('little.homeAsk');

  const mood = waiting ? 'happy' : activeMission ? 'talking' : 'idle';

  return (
    <LittleScreen
      header={
        <StatStrip
          trailing={
            <ClayIconButton
              icon={<LockIcon size={26} />}
              size={44}
              accessibilityLabel={t('tabs.parent')}
              onPress={() => router.push('/(tabs)/parent')}
            />
          }
        />
      }
    >
      <LText variant="title" center style={{ marginTop: space.sm }} numberOfLines={2}>
        {t(greeting, { name: profile.nickname })}
      </LText>

      <View style={{ alignItems: 'center', marginTop: space.md }}>
        <Mascot
          id={profile.buddyId}
          name={profile.buddyName}
          size={190}
          mood={narrator.speaking ? 'talking' : mood}
          wearing={data.wardrobe.worn}
          halo={waiting ? 'sun' : 'mint'}
          props={[
            { label: '★', tone: 'sun' },
            { label: '!', tone: 'bubble' },
          ]}
          onTap={() => narrator.say(line)}
        />
      </View>

      <Bubble
        text={line}
        tail="none"
        style={{ marginTop: space.sm }}
        onSpeak={data.settings.voiceEnabled ? () => narrator.say(line) : undefined}
      />

      {/* ------------------------------------------ what a grown up sent down */}
      <InboxCard />

      {/* ------------------------------------------------- the one big button */}
      <View style={{ marginTop: space.lg, gap: space.md }}>
        {waiting ? (
          <ClayCard tone="sun" style={{ padding: space.lg, gap: space.xs }}>
            <LText variant="heading" color={tones.sun.ink}>
              {t('home.waitingTitle')}
            </LText>
            <LText variant="body" color={tones.sun.ink}>
              {t('home.waitingBody')}
            </LText>
          </ClayCard>
        ) : activeMission ? (
          <>
            <ClayCard style={{ padding: space.lg, gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: round.md,
                    backgroundColor: tones.sky.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LText variant="title">{activeMission.task.emoji}</LText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <LText variant="heading" numberOfLines={2}>
                    {pick(activeMission.task.title)}
                  </LText>
                  <LText variant="small" color={ink.soft}>
                    {t('common.starsCount', { count: activeMission.task.stars })}
                  </LText>
                </View>
              </View>
            </ClayCard>
            <ClayButton
              label={t('home.startMission')}
              tone="mint"
              size="xl"
              icon={<PlayIcon size={30} color={tones.mint.ink} />}
              onPress={() => router.push('/mission')}
            />
          </>
        ) : (
          <>
            <WhereBar indoors={indoors} onChange={setIndoors} />
            <ClayButton
              label={t('home.newMission')}
              tone="mint"
              size="xl"
              icon={<PlayIcon size={30} color={tones.mint.ink} />}
              disabled={busy}
              onPress={() => void newMission(false)}
            />
            {isGeminiConfigured ? (
              <ClayButton
                label={t('home.surprise')}
                tone="grape"
                size="md"
                icon={<SparkleIcon size={22} color={tones.grape.ink} />}
                disabled={busy}
                onPress={() => void newMission(true)}
              />
            ) : null}
          </>
        )}
      </View>

      <RewardCard style={{ marginTop: space.lg }} />

      {/* A tree that has changed, or is overdue, outranks anything below it:
          it is the one thing on this screen with a clock on it. */}
      {data.tree && tree && (tree.due || tree.grew || tree.changed) ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: space.lg }}>
          <ClayTile
            tone="aqua"
            accessibilityLabel={data.tree.name}
            onPress={() => router.push('/tree')}
            style={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}
          >
            <TreeIcon size={46} />
            <LText variant="heading" color={tones.aqua.ink} style={{ flex: 1 }} numberOfLines={2}>
              {t(`tree.headline${capitalise(treeHeadline(tree).key)}` as TKey, {
                name: data.tree.name,
                days: Math.max(1, tree.daysUntil),
              })}
            </LText>
          </ClayTile>
        </Animated.View>
      ) : null}

      {/* -------------------------------------------------- the other things */}
      <LText variant="label" color={ink.soft} style={{ marginTop: space.xl, marginBottom: space.sm }}>
        {t('little.alsoTry')}
      </LText>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        <Activity
          tone="sun"
          icon={<CoinIcon size={48} />}
          label={t('wardrobe.open')}
          onPress={() => router.push('/wardrobe')}
        />
        <Activity
          tone="mint"
          icon={<ExploreIcon size={48} />}
          label={t('collect.title')}
          onPress={() => router.push('/collect')}
        />
        <Activity
          tone="grape"
          icon={<CameraIcon size={48} />}
          label={t('home.scanTitle')}
          onPress={missionFromRoom}
        />
        <Activity
          tone="sky"
          icon={<BookIcon size={48} />}
          label={t('home.storyCta')}
          onPress={() => router.push('/story')}
        />
        <Activity
          tone="coral"
          icon={<WalkIcon size={48} />}
          label={t('walk.title')}
          onPress={() => router.push('/(tabs)/walk')}
        />
      </View>
    </LittleScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* -------------------------------------------------------------- components */

/**
 * The only thing the app cannot work out for itself that a four year old can
 * answer: are you indoors or out. The original interface also asks how many
 * minutes they have, which is a question at this age nobody can answer.
 */
function WhereBar({ indoors, onChange }: { indoors: boolean; onChange: (value: boolean) => void }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <Where
        active={!indoors}
        tone="mint"
        icon={<TreeIcon size={34} />}
        label={t('little.outside')}
        onPress={() => onChange(false)}
      />
      <Where
        active={indoors}
        tone="sun"
        icon={<HomeIcon size={34} />}
        label={t('home.indoors')}
        onPress={() => onChange(true)}
      />
    </View>
  );
}

function Where({
  active,
  tone,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  tone: ToneName;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const palette = tones[tone];
  return (
    <ClayTile
      accessibilityLabel={label}
      onPress={onPress}
      face={active ? palette.face : tones.white.face}
      lip={active ? palette.lip : tones.white.lip}
      depth={lip.md}
      radius={round.md}
      wrapperStyle={{ flex: 1 }}
      style={{
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        opacity: active ? 1 : 0.75,
      }}
    >
      {icon}
      <LText variant="label" color={active ? palette.ink : ink.soft} numberOfLines={1}>
        {label}
      </LText>
    </ClayTile>
  );
}

/** One of the picture blocks under the button. Two per row, square-ish. */
function Activity({
  tone,
  icon,
  label,
  onPress,
}: {
  tone: ToneName;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const palette = tones[tone];
  return (
    <ClayTile
      tone={tone}
      accessibilityLabel={label}
      onPress={onPress}
      wrapperStyle={{ flexBasis: '47%', flexGrow: 1 }}
      style={{ padding: space.lg, gap: space.sm, minHeight: 132, justifyContent: 'space-between' }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: round.md,
          backgroundColor: 'rgba(255,255,255,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <LText variant="label" color={palette.ink} numberOfLines={2}>
        {label}
      </LText>
    </ClayTile>
  );
}
