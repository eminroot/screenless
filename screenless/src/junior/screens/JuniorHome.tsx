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
import {
  LEVEL_TITLE_KEYS,
  levelFraction,
  levelForStars,
  MAX_LEVEL,
  starsToNextLevel,
} from '../../engine/progress';
import { buildRoomMission } from '../../engine/room-engine';
import { pickTask } from '../../engine/task-engine';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import { Button, Chip, IconButton } from '../components/Button';
import { BuddyLine } from '../components/BuddyLine';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { RewardGoalCard } from '../components/RewardGoalCard';
import { Card, CardButton, Divider, IconTile, Stamp } from '../components/Surface';
import { ProgressRow, StatCard } from '../components/Stat';
import {
  BookIcon,
  CameraIcon,
  ChevronIcon,
  CoinIcon,
  FlameIcon,
  HouseIcon,
  ShoeIcon,
  LeafIcon,
  LockIcon,
  PlayIcon,
  SearchIcon,
  SparkIcon,
  StarFilledIcon,
  TreeIcon,
} from '../icons';
import { accents, ink, space } from '../theme';

/**
 * Today, for ages 6 to 9.
 *
 * Built around a number the child can read: which level they are on and how
 * many stars are left until the next one. The tier below hides all of that
 * behind a picture of a map, because a three year old cannot use it. A seven
 * year old is motivated by precisely it, and hiding it would be the babyish
 * thing to do.
 *
 * Under the level: one mission, the things they can choose to do instead as a
 * list they can scan, and what a grown up promised. The grown up gets in
 * through the lock in the corner, not a tab.
 */
export function JuniorHome() {
  const router = useRouter();
  const { t, pick, language } = useI18n();
  const { profile, data, activeMission, pendingMissions, assignMission } = useApp();

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
      // A generated mission is a bonus. If anything goes wrong the child still
      // gets a real mission from the curated library.
      assignMission(
        task ??
          pickTask(profile, data.missions, {
            favourVariety: surprise,
            context,
            learned,
            allowDuo: data.settings.duoEnabled,
            badgesReady: Boolean(data.badges),
          }),
      );
      setBusy(false);
      router.push('/mission');
    },
    [profile, busy, minutes, indoors, data.missions, data.ideaVotes, data.settings.duoEnabled, data.badges, assignMission, language, pick, router],
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'home.greetingMorning' : hour < 18 ? 'home.greetingDay' : 'home.greetingEvening';

  const line = waiting
    ? t('home.waitingBody')
    : activeMission
      ? pick(activeMission.task.body)
      : t('home.noMission');

  return (
    <JScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <JText variant="title" color={ink.onGround} numberOfLines={1}>
              {t(greeting, { name: profile.nickname })}
            </JText>
            <JText variant="small" color={ink.onGroundMuted} numberOfLines={1}>
              {t('common.levelLabel', { level })} · {t(LEVEL_TITLE_KEYS[level - 1] as TKey)}
            </JText>
          </View>
          <IconButton
            icon={<LockIcon size={22} />}
            kind="cream"
            size={46}
            accessibilityLabel={t('tabs.parent')}
            onPress={() => router.push('/(tabs)/parent')}
          />
        </View>
      }
    >
      {/* ------------------------------------------------------- where I am */}
      <Card>
        <ProgressRow
          label={t(zone.nameKey)}
          detail={level >= MAX_LEVEL ? t('junior.topLevel') : t('junior.starsToGo', { count: toNext })}
          value={levelFraction(stars)}
          accent="green"
        />
      </Card>

      {/* --------------------------------------------------- today's mission */}
      <Stamp accent="flame" style={{ marginTop: space.xxl }}>{t('junior.missionStamp')}</Stamp>

      {waiting ? (
        <Card accent="amber">
          <JText variant="heading" color={accents.amber.base}>
            {t('home.waitingTitle')}
          </JText>
          <JText variant="read" color={ink.body} style={{ marginTop: space.xs }}>
            {t('home.waitingBody')}
          </JText>
        </Card>
      ) : activeMission ? (
        <View style={{ gap: space.md }}>
          <BuddyLine
            id={profile.buddyId}
            name={profile.buddyName}
            text={line}
            mood="talking"
            wearing={data.wardrobe.worn}
            speakLabel={t('task.readAloud')}
            onSpeak={
              data.settings.voiceEnabled
                ? () => narrator.say(`${pick(activeMission.task.title)}. ${line}`)
                : undefined
            }
          />
          <Card padded={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
              <IconTile accent="green" size={52}>
                <JText variant="heading">{activeMission.task.emoji}</JText>
              </IconTile>
              <View style={{ flex: 1, gap: 2 }}>
                <JText variant="heading" numberOfLines={2}>
                  {pick(activeMission.task.title)}
                </JText>
                <JText variant="small" color={ink.muted}>
                  {t('task.howLong', { count: activeMission.task.minutes })} ·{' '}
                  {t('common.starsCount', { count: activeMission.task.stars })}
                </JText>
              </View>
            </View>
            <Divider />
            <View style={{ padding: space.lg }}>
              <Button
                label={t('home.startMission')}
                icon={<PlayIcon size={20} />}
                onPress={() => router.push('/mission')}
              />
            </View>
          </Card>
        </View>
      ) : (
        <View style={{ gap: space.lg }}>
          <BuddyLine
            id={profile.buddyId}
            name={profile.buddyName}
            text={t('junior.homeAsk')}
            wearing={data.wardrobe.worn}
            speakLabel={t('task.readAloud')}
            onSpeak={data.settings.voiceEnabled ? () => narrator.say(t('junior.homeAsk')) : undefined}
          />

          {/* Both questions the app cannot answer for itself. The tier below
              asks only where they are, because nobody that age can say how
              many minutes they have; by six they can. */}
          <Card>
            <JText variant="caption" color={ink.muted} style={{ letterSpacing: 0.6 }}>
              {t('home.howLong').toUpperCase()}
            </JText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
              {TIME_CHOICES.map((choice) => (
                <Chip
                  key={String(choice)}
                  label={choice === null ? t('home.timeAny') : t('common.minutesShort', { count: choice })}
                  selected={minutes === choice}
                  accent="blue"
                  onPress={() => setMinutes(choice)}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
              <Chip
                label={t('junior.outside')}
                icon={<LeafIcon size={22} />}
                selected={!indoors}
                accent="teal"
                onPress={() => setIndoors(false)}
                style={{ flex: 1 }}
              />
              <Chip
                label={t('junior.inside')}
                icon={<HouseIcon size={22} />}
                selected={indoors}
                accent="teal"
                onPress={() => setIndoors(true)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>

          <View style={{ gap: space.md }}>
            <Button
              label={t('home.newMission')}
              icon={<PlayIcon size={20} />}
              busy={busy}
              onPress={() => void newMission(false)}
            />
            {isGeminiConfigured ? (
              <Button
                label={t('home.surprise')}
                kind="cream"
                size="md"
                icon={<SparkIcon size={20} color={accents.violet.base} />}
                disabled={busy}
                onPress={() => void newMission(true)}
              />
            ) : null}
          </View>
        </View>
      )}

      {/* ------------------------------------------------------- the numbers */}
      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xxl }}>
        <StatCard
          icon={<StarFilledIcon size={24} />}
          value={stars}
          label={t('junior.starsLabel')}
          accent="amber"
        />
        <StatCard
          icon={<FlameIcon size={24} />}
          value={data.progress.streak}
          label={t('junior.inARow')}
          accent="rose"
        />
        <StatCard
          icon={<CoinIcon size={24} />}
          value={data.walk.coins}
          label={t('junior.coinsLabel')}
          accent="amber"
        />
      </View>

      <RewardGoalCard style={{ marginTop: space.lg }} />

      {/* ----------------------------------------------------- the rest of it */}
      <Stamp accent="teal" style={{ marginTop: space.xxl }}>{t('junior.otherWays')}</Stamp>

      <View style={{ gap: space.md }}>
        {data.tree && tree && (tree.due || tree.grew || tree.changed) ? (
          <Row
            icon={<TreeIcon size={24} />}
            accent="teal"
            title={data.tree.name}
            detail={t(`tree.headline${capitalise(treeHeadline(tree).key)}` as TKey, {
              name: data.tree.name,
              days: Math.max(1, tree.daysUntil),
            })}
            onPress={() => router.push('/tree')}
          />
        ) : null}

        <Row
          icon={<CoinIcon size={24} />}
          accent="amber"
          title={t('wardrobe.open')}
          detail={t('wardrobe.coinsShort', { count: data.walk.coins })}
          onPress={() => router.push('/wardrobe')}
        />
        <Row
          icon={<SearchIcon size={24} color={accents.teal.base} />}
          accent="teal"
          title={t('collect.title')}
          detail={t('collect.buddyLine')}
          onPress={() => router.push('/collect')}
        />
        <Row
          icon={<CameraIcon size={24} color={accents.violet.base} />}
          accent="violet"
          title={t('home.scanTitle')}
          detail={room ? t('home.useRoom') : t('home.scanBody')}
          onPress={missionFromRoom}
        />
        <Row
          icon={<BookIcon size={24} color={accents.blue.base} />}
          accent="blue"
          title={t('home.storyCta')}
          detail={t('junior.storyDetail')}
          onPress={() => router.push('/story')}
        />
        <Row
          icon={<ShoeIcon size={26} />}
          accent="violet"
          title={t('walk.title')}
          detail={t('junior.walkDetail')}
          onPress={() => router.push('/(tabs)/walk')}
        />
      </View>
    </JScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * One thing to do, as a row with a chevron rather than a tile. Rows scan far
 * quicker than a grid once a child can read, and they fit more on a screen.
 */
function Row({
  icon,
  accent,
  title,
  detail,
  onPress,
}: {
  icon: React.ReactNode;
  accent: 'teal' | 'violet' | 'blue' | 'amber';
  title: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <CardButton accessibilityLabel={title} onPress={onPress} padded={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
        <IconTile accent={accent} size={48}>
          {icon}
        </IconTile>
        <View style={{ flex: 1, gap: 1 }}>
          <JText variant="bodyStrong" numberOfLines={1}>
            {title}
          </JText>
          <JText variant="small" color={ink.muted} numberOfLines={2}>
            {detail}
          </JText>
        </View>
        <ChevronIcon size={20} />
      </View>
    </CardButton>
  );
}
