import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { isGeminiConfigured } from '../../ai/config';
import { generateSurpriseTask } from '../../ai/gemini';
import { currentZone } from '../../data/zones';
import { currentContext, TIME_CHOICES, type TimeChoice } from '../../engine/context';
import { treeHeadline, treeStatus } from '../../engine/find-engine';
import { learnFromMissions } from '../../engine/learning';
import { screenFreeThisWeek } from '../../engine/verify';
import type { TKey } from '../../i18n/shape';
import { Bar, Stat, StatRow, WeekStrip } from '../components/Stat';
import { BuddyNote } from '../components/BuddyNote';
import { Button, Chip, IconButton } from '../components/Button';
import { Dot, Label, Panel, PanelButton, Rule } from '../components/Surface';
import { InboxCard } from '../components/InboxCard';
import { RewardGoalPanel } from '../components/RewardGoalPanel';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { buildRoomMission } from '../../engine/room-engine';
import { goalFor } from '../../engine/walk';
import { pickTask } from '../../engine/task-engine';
import { recentDays, todayWalk } from '../../engine/walk';
import { useApp } from '../../state/app-state';
import { useI18n } from '../../i18n';
import { useNarrator } from '../../lib/voice';
import {
  LEVEL_TITLE_KEYS,
  MAX_LEVEL,
  dayKey,
  levelForStars,
  levelFraction,
  starsToNextLevel,
} from '../../engine/progress';
import {
  BookIcon,
  CameraIcon,
  ChevronIcon,
  CoinIcon,
  FlameIcon,
  LeafIcon,
  LockIcon,
  MoonIcon,
  PlayIcon,
  SearchIcon,
  SparkIcon,
  StepsIcon,
  SunIcon,
  TreeIcon,
} from '../icons';
import { space } from '../theme';
import { useSkin } from '../skin';

/**
 * Today, for ages 10 to 13.
 *
 * Opens on the child's own number, not on a greeting from a mascot. Level,
 * stars, how far to the next one — the way a running app opens on your week
 * rather than on a coach waving.
 *
 * Below that: one challenge, the week as a chart, and the rest as a list. The
 * two younger tiers lead with the buddy telling the child what to do; here the
 * buddy is a note further down the page, because at this age an interface that
 * instructs gets closed and an interface that reports gets checked.
 */
export function TeenHome() {
  const skin = useSkin();
  const { ink, accents } = skin;
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, pendingMissions, assignMission, setTeenSkin } = useApp();

  const [busy, setBusy] = useState(false);
  const [minutes, setMinutes] = useState<TimeChoice>(null);
  const [indoors, setIndoors] = useState(false);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);

  const waiting = pendingMissions.length > 0;
  const tree = useMemo(() => treeStatus(data.tree), [data.tree]);
  const room = data.room;

  const stars = data.progress.stars;
  const level = levelForStars(stars);
  const toNext = starsToNextLevel(stars);
  const zone = currentZone(level);

  const week = useMemo(() => recentDays(data.walk), [data.walk]);
  const today = useMemo(() => todayWalk(data.walk), [data.walk]);
  // Screen free minutes the phone measured this week, for the target they set.
  const screenFree = useMemo(() => screenFreeThisWeek(data.missions), [data.missions]);
  const stepGoal = profile ? goalFor(profile.ageBand) : 0;

  const newMission = useCallback(
    async (surprise: boolean) => {
      if (!profile || busy) return;
      setBusy(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const context = currentContext({ maxMinutes: minutes, indoorOnly: indoors });
      const learned = learnFromMissions(data.missions, data.ideaVotes);

      let task = null;
      if (surprise && isGeminiConfigured) {
        const recent = data.missions.slice(-6).map((m) => pick(m.task.title));
        const result = await generateSurpriseTask({ profile, language, avoidTitles: recent });
        if (result.ok) task = result.value;
      }
      // A generated challenge is a bonus. If anything goes wrong there is still
      // a real one from the curated library.
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
    [profile, busy, minutes, indoors, data.missions, data.ideaVotes, data.settings.duoEnabled, assignMission, language, pick, router],
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

  const line = waiting
    ? t('home.waitingBody')
    : activeMission
      ? pick(activeMission.task.body)
      : t('teen.buddyIdle');

  return (
    <TScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <TText variant="label" color={ink.muted}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
            </TText>
            <TText variant="display" numberOfLines={1}>
              {profile.nickname}
            </TText>
          </View>
          {/* The child's own switch. Not buried in the parent area: at this
              age the look of the thing is theirs to decide. */}
          <IconButton
            icon={
              skin.name === 'dark' ? (
                <SunIcon size={18} color={ink.muted} />
              ) : (
                <MoonIcon size={18} color={ink.muted} />
              )
            }
            kind="outline"
            size={42}
            accessibilityLabel={t(skin.name === 'dark' ? 'teen.switchLight' : 'teen.switchDark')}
            onPress={() => setTeenSkin(skin.name === 'dark' ? 'light' : 'dark')}
          />
          <IconButton
            icon={<LockIcon size={18} />}
            kind="outline"
            size={42}
            accessibilityLabel={t('tabs.parent')}
            onPress={() => router.push('/(tabs)/parent')}
          />
        </View>
      }
    >
      {/* ------------------------------------------------ the number that matters */}
      <Panel>
        <TText variant="label" color={accents.acid.bright}>
          {`${t('common.levelLabel', { level })} · ${t(LEVEL_TITLE_KEYS[level - 1] as TKey)}`}
        </TText>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginTop: space.sm }}>
          <TText variant="statBig">{stars}</TText>
          <TText variant="label" color={ink.muted} style={{ paddingBottom: 10 }}>
            {t('teen.starsLabel')}
          </TText>
        </View>
        <Bar
          value={levelFraction(stars)}
          style={{ marginTop: space.md }}
          accessibilityLabel={t('teen.toNext', { count: toNext, level: level + 1 })}
        />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {level >= MAX_LEVEL ? t('teen.topRank') : t('teen.toNext', { count: toNext, level: level + 1 })}
          {' · '}
          {t(zone.nameKey)}
        </TText>
      </Panel>

      {/* ------------------------------------------ what a grown up sent down */}
      <InboxCard />

      {/* --------------------------------------------------------- the challenge */}
      <Label accent="acid" style={{ marginTop: space.xxl }}>
        {t('teen.challengeLabel')}
      </Label>

      {waiting ? (
        <Panel accent="amber">
          <TText variant="title" color={accents.amber.bright}>
            {t('home.waitingTitle')}
          </TText>
          <TText variant="body" color={ink.body} style={{ marginTop: space.xs }}>
            {t('home.waitingBody')}
          </TText>
        </Panel>
      ) : activeMission ? (
        <Panel accent="acid" padded={false}>
          <View style={{ padding: space.lg, gap: space.xs }}>
            <TText variant="title" numberOfLines={2}>
              {pick(activeMission.task.title)}
            </TText>
            <TText variant="label" color={ink.muted}>
              {`${t('task.howLong', { count: activeMission.task.minutes })} · ${t('common.starsCount', {
                count: activeMission.task.stars,
              })}`}
            </TText>
          </View>
          <Rule />
          <View style={{ padding: space.lg }}>
            <Button
              label={t('teen.start')}
              icon={<PlayIcon size={18} color={accents.acid.on} />}
              onPress={() => router.push('/mission')}
            />
          </View>
        </Panel>
      ) : (
        <View style={{ gap: space.lg }}>
          <Panel>
            <TText variant="label">{t('teen.howLong')}</TText>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
              {TIME_CHOICES.map((choice) => (
                <Chip
                  key={String(choice)}
                  label={choice === null ? t('teen.anyTime') : t('common.minutesShort', { count: choice })}
                  selected={minutes === choice}
                  onPress={() => setMinutes(choice)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>

            <TText variant="label" style={{ marginTop: space.lg }}>
              {t('teen.where')}
            </TText>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
              <Chip
                label={t('teen.outside')}
                icon={<LeafIcon size={17} color={indoors ? ink.muted : accents.acid.on} />}
                selected={!indoors}
                onPress={() => setIndoors(false)}
                style={{ flex: 1 }}
              />
              <Chip
                label={t('teen.inside')}
                selected={indoors}
                onPress={() => setIndoors(true)}
                style={{ flex: 1 }}
              />
            </View>
          </Panel>

          <View style={{ gap: space.md }}>
            <Button label={t('teen.getChallenge')} busy={busy} onPress={() => void newMission(false)} />
            {isGeminiConfigured ? (
              <Button
                label={t('teen.surprise')}
                kind="outline"
                size="md"
                icon={<SparkIcon size={17} color={accents.violet.bright} />}
                disabled={busy}
                onPress={() => void newMission(true)}
              />
            ) : null}
          </View>
        </View>
      )}

      <BuddyNote
        id={profile.buddyId}
        name={profile.buddyName}
        text={line}
        mood={activeMission ? 'talking' : 'idle'}
        wearing={data.wardrobe.worn}
        speakLabel={t('task.readAloud')}
        onSpeak={data.settings.voiceEnabled ? () => narrator.say(line) : undefined}
        style={{ marginTop: space.lg }}
      />

      {/* --------------------------------------------------------------- the week */}
      <Label style={{ marginTop: space.xxl }}>{t('teen.weekLabel')}</Label>
      <Panel>
        <WeekStrip days={week} goal={stepGoal} today={dayKey()} />
        <Rule style={{ marginVertical: space.lg }} />
        <StatRow>
          <Stat
            value={data.progress.streak}
            label={t('teen.streakLabel')}
            accent="coral"
            icon={<FlameIcon size={16} color={accents.coral.bright} />}
          />
          <Stat value={data.progress.totalMissions} label={t('teen.doneLabel')} />
          <Stat value={today.steps.toLocaleString()} label={t('teen.stepsToday')} />
        </StatRow>
      </Panel>

      {/* Their own target, next to the minutes the phone actually counted.
          Nobody sets this but them, and nothing scolds them about it. */}
      {data.weekGoal ? (
        <Panel style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <TText variant="label" color={ink.muted} style={{ flex: 1 }}>
              {t('teenVerify.weekGoalLabel')}
            </TText>
            <TText variant="label" color={ink.muted}>
              {t('teenVerify.weekGoalSet', { count: data.weekGoal.minutes })}
            </TText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginTop: space.sm }}>
            <TText variant="stat" color={screenFree >= data.weekGoal.minutes ? accents.acid.bright : ink.strong}>
              {screenFree}
            </TText>
            <TText variant="caption" color={ink.muted} style={{ paddingBottom: 4 }}>
              {t('teenVerify.weekGoalSoFar')}
            </TText>
          </View>
          <Bar
            value={screenFree / data.weekGoal.minutes}
            accent={screenFree >= data.weekGoal.minutes ? 'acid' : 'sky'}
            style={{ marginTop: space.md }}
          />
          {screenFree >= data.weekGoal.minutes ? (
            <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
              {t('teenVerify.weekGoalOver')}
            </TText>
          ) : null}
        </Panel>
      ) : null}

      <RewardGoalPanel style={{ marginTop: space.lg }} />

      {/* ---------------------------------------------------------------- the rest */}
      <Label style={{ marginTop: space.xxl }}>{t('teen.moreLabel')}</Label>

      <Panel padded={false}>
        {data.tree && tree && (tree.due || tree.grew || tree.changed) ? (
          <>
            <Row
              icon={<TreeIcon size={18} color={accents.mint.bright} />}
              accent="mint"
              title={data.tree.name}
              detail={t(`tree.headline${capitalise(treeHeadline(tree).key)}` as TKey, {
                name: data.tree.name,
                days: Math.max(1, tree.daysUntil),
              })}
              onPress={() => router.push('/tree')}
            />
            <Rule />
          </>
        ) : null}

        <Row
          icon={<CoinIcon size={18} color={accents.acid.bright} />}
          accent="acid"
          title={t('wardrobe.open')}
          detail={t('wardrobe.coinsShort', { count: data.walk.coins })}
          onPress={() => router.push('/wardrobe')}
        />
        <Rule />
        <Row
          icon={<SearchIcon size={18} color={accents.mint.bright} />}
          accent="mint"
          title={t('collect.title')}
          detail={t('teen.findDetail')}
          onPress={() => router.push('/collect')}
        />
        <Rule />
        <Row
          icon={<CameraIcon size={18} color={accents.violet.bright} />}
          accent="violet"
          title={t('home.scanTitle')}
          detail={room ? t('home.useRoom') : t('teen.scanDetail')}
          onPress={missionFromRoom}
        />
        <Rule />
        <Row
          icon={<BookIcon size={18} color={accents.sky.bright} />}
          accent="sky"
          title={t('home.storyCta')}
          detail={t('teen.storyDetail')}
          onPress={() => router.push('/story')}
        />
        <Rule />
        <Row
          icon={<StepsIcon size={18} color={accents.acid.bright} />}
          accent="acid"
          title={t('walk.title')}
          detail={t('teen.stepsDetail')}
          onPress={() => router.push('/(tabs)/walk')}
        />
      </Panel>
    </TScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** One line of the list: swatch, two lines of text, a chevron. */
function Row({
  icon,
  accent,
  title,
  detail,
  onPress,
}: {
  icon: React.ReactNode;
  accent: 'mint' | 'violet' | 'sky' | 'acid';
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const { ink } = useSkin();
  return (
    <PanelButton accessibilityLabel={title} onPress={onPress} padded={false} style={{ borderWidth: 0, borderRadius: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
        <Dot accent={accent}>{icon}</Dot>
        <View style={{ flex: 1, gap: 1 }}>
          <TText variant="bodyStrong" numberOfLines={1}>
            {title}
          </TText>
          <TText variant="caption" color={ink.muted} numberOfLines={2}>
            {detail}
          </TText>
        </View>
        <ChevronIcon size={16} />
      </View>
    </PanelButton>
  );
}
