import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Buddy } from '../components/buddy/Buddy';
import { ParentGate } from '../components/ParentGate';
import { AddFriendForm } from '../components/social/AddFriendForm';
import { Button, Screen, Sticker, TopBar, Txt } from '../components/ui';
import { useI18n } from '../i18n';
import { rankBoard, withLocalScore, type BoardPeriod, type RankedEntry } from '../online/rank';
import { scoreSnapshot } from '../online/score';
import { useBoard } from '../online/useBoard';
import { formatInviteCode } from '../online/username';
import { useApp } from '../state/app-state';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

/** Podium colours by place: sun, sky, coral. */
const PLACE_TONES = [colors.accent, colors.info, colors.primary];
const PLACE_HEIGHTS = [118, 92, 74];

/**
 * The child's friends board.
 *
 * Reached only from a child who has a username. Everything on it came from
 * the server except the child's own numbers, which are read off this phone so
 * a mission confirmed a second ago already counts.
 */
export default function BoardScreen() {
  const { t } = useI18n();
  const { data } = useApp();
  const { profile, progress, missions, walk, social } = data;
  const account = social.mode === 'online' ? social.account : null;
  const { board, loading, error, refresh } = useBoard();

  const [period, setPeriod] = useState<BoardPeriod>('week');
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<'closed' | 'gate' | 'form'>('closed');

  const local = useMemo(
    () => scoreSnapshot({ profile, progress, missions, walk }),
    [profile, progress, missions, walk],
  );
  const ranked = useMemo(
    () => (board ? rankBoard(withLocalScore(board.entries, local), period) : []),
    [board, local, period],
  );

  if (!account || !profile) return <Redirect href="/(tabs)" />;

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const picked = podium.find((entry) => entry.id === selected) ?? null;
  const alone = ranked.length === 1;

  return (
    <Screen>
      <TopBar title={t('board.title')} />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <PeriodToggle label={t('board.week')} active={period === 'week'} onPress={() => setPeriod('week')} />
        <PeriodToggle label={t('board.allTime')} active={period === 'all'} onPress={() => setPeriod('all')} />
      </View>

      {!board ? (
        <View style={{ alignItems: 'center', gap: spacing.lg, marginTop: spacing.xxl }}>
          <Buddy id={profile.buddyId} size={150} mood={error ? 'sleepy' : 'talking'} label={profile.buddyName} />
          <Txt variant="subheading" center color={colors.textSoft}>
            {error ? t('board.failed') : t('board.loading')}
          </Txt>
          {error && !loading ? (
            <Button label={t('board.retry')} tone="neutral" size="md" full={false} onPress={() => void refresh()} />
          ) : null}
        </View>
      ) : (
        <>
          {error ? (
            <Pressable onPress={() => void refresh()} accessibilityRole="button">
              <Txt variant="tiny" color={colors.textSoft} style={{ marginTop: spacing.md }}>
                {t('board.stale')} {t('board.retry')} ›
              </Txt>
            </Pressable>
          ) : null}

          <Podium
            entries={podium}
            selected={selected}
            onSelect={(id) => setSelected((current) => (current === id ? null : id))}
          />

          {picked ? <StatsLine entry={picked} /> : null}

          {alone ? (
            <Txt variant="subheading" center style={{ marginTop: spacing.lg }}>
              {t('board.justYou')}
            </Txt>
          ) : null}

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            {rest.map((entry) => (
              <Row
                key={entry.id}
                entry={entry}
                open={selected === entry.id}
                onPress={() => setSelected((current) => (current === entry.id ? null : entry.id))}
              />
            ))}
          </View>
        </>
      )}

      <Sticker
        background={colors.surface}
        style={{ padding: spacing.lg, gap: spacing.xs, alignItems: 'center', marginTop: spacing.xl }}
      >
        <Txt variant="tiny" color={colors.textSoft}>
          {t('board.myCode')}
        </Txt>
        <Txt variant="display" style={{ letterSpacing: 4 }} selectable>
          {formatInviteCode(account.inviteCode)}
        </Txt>
        <Txt variant="small" color={colors.textSoft} center>
          {t('board.codeHint')}
        </Txt>
      </Sticker>

      <View style={{ marginTop: spacing.lg }}>
        <Button label={t('board.addFriend')} tone="info" onPress={() => setAdding('gate')} />
      </View>

      <AddFriendSheet
        stage={adding}
        onUnlock={() => setAdding('form')}
        onClose={() => setAdding('closed')}
        onAdded={() => void refresh()}
      />
    </Screen>
  );
}

function PeriodToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={{
        backgroundColor: active ? colors.info : colors.surface,
        borderRadius: radii.pill,
        borderWidth: borderWidth.thick,
        borderColor: colors.border,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
      }}
    >
      <Txt variant="small" color={active ? colors.surface : colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Second, first, third, left to right, the way a real podium stands. */
function Podium({
  entries,
  selected,
  onSelect,
}: {
  entries: RankedEntry[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const order = entries.length === 1 ? [0] : entries.length === 2 ? [1, 0] : [1, 0, 2];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.xl,
      }}
    >
      {order.map((index) => {
        const entry = entries[index];
        return (
          <PodiumStep
            key={entry.id}
            entry={entry}
            place={index}
            active={selected === entry.id}
            onPress={() => onSelect(entry.id)}
          />
        );
      })}
    </View>
  );
}

function PodiumStep({
  entry,
  place,
  active,
  onPress,
}: {
  entry: RankedEntry;
  place: number;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const tone = PLACE_TONES[place];
  const light = place !== 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.rank}. ${entry.username}, ${entry.value} ★`}
      onPress={onPress}
      style={{ flex: 1, maxWidth: 150 }}
    >
      <View style={{ alignItems: 'center' }}>
        <Buddy id={entry.buddyId} size={place === 0 ? 92 : 70} mood={entry.me ? 'happy' : 'idle'} still={!entry.me} />
        <Txt variant="bodyStrong" numberOfLines={1} style={{ marginTop: spacing.xs }}>
          {entry.username}
        </Txt>
        {entry.me ? <YouTag label={t('board.you')} /> : <View style={{ height: 18 }} />}
      </View>
      <View style={{ marginTop: spacing.xs }}>
        <Sticker background={tone} offset={active ? 2 : 5} radius={radii.md}>
          <View style={{ height: PLACE_HEIGHTS[place], alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="display" color={light ? colors.surface : colors.text}>
              {entry.rank}
            </Txt>
            <Txt variant="subheading" color={light ? colors.surface : colors.text}>
              {entry.value} ★
            </Txt>
          </View>
        </Sticker>
      </View>
    </Pressable>
  );
}

function Row({ entry, open, onPress }: { entry: RankedEntry; open: boolean; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Sticker
        background={entry.me ? colors.accent : colors.surface}
        offset={3}
        border={borderWidth.hair}
        style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Txt variant="heading" style={{ width: 30, textAlign: 'center' }}>
            {entry.rank}
          </Txt>
          <Buddy id={entry.buddyId} size={40} still />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>
              {entry.username}
            </Txt>
            <Txt variant="tiny" color={colors.textSoft}>
              {entry.me ? `${t('board.you')} · ` : ''}
              {t('board.level', { level: entry.level })}
            </Txt>
          </View>
          <Txt variant="heading">{entry.value} ★</Txt>
        </View>
        {open ? <Stats entry={entry} /> : null}
      </Sticker>
    </Pressable>
  );
}

function StatsLine({ entry }: { entry: RankedEntry }) {
  return (
    <Sticker background={colors.surfaceAlt} offset={3} border={borderWidth.hair} style={{ padding: spacing.md, marginTop: spacing.md }}>
      <Txt variant="bodyStrong">{entry.username}</Txt>
      <Stats entry={entry} />
    </Sticker>
  );
}

/** What a friend can see about a child, written out rather than as icons. */
function Stats({ entry }: { entry: RankedEntry }) {
  const { t } = useI18n();
  const parts = [
    t('board.level', { level: entry.level }),
    t('board.missions', { count: entry.missions }),
    t('board.streak', { count: entry.streak }),
    t('board.steps', { count: entry.weekSteps.toLocaleString() }),
  ];
  return (
    <Txt variant="small" color={colors.textSoft}>
      {parts.join(' · ')}
    </Txt>
  );
}

function YouTag({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.success,
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        paddingHorizontal: spacing.sm,
        height: 18,
        justifyContent: 'center',
      }}
    >
      <Txt variant="tiny" color={colors.surface} style={{ lineHeight: 14 }}>
        {label}
      </Txt>
    </View>
  );
}

/**
 * Adding a friend sits behind the parent code, in a sheet over the board, so
 * a child can show their own code freely but cannot let anyone in.
 */
function AddFriendSheet({
  stage,
  onUnlock,
  onClose,
  onAdded,
}: {
  stage: 'closed' | 'gate' | 'form';
  onUnlock: () => void;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={stage !== 'closed'} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(42, 33, 24, 0.55)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            borderTopWidth: borderWidth.chunky,
            borderColor: colors.border,
            maxHeight: '92%',
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
              gap: spacing.lg,
            }}
          >
            {stage === 'gate' ? (
              <>
                <Txt variant="small" color={colors.textSoft} center>
                  {t('board.gateNote')}
                </Txt>
                <ParentGate onUnlock={onUnlock} />
              </>
            ) : (
              <AddFriendForm onAdded={onAdded} />
            )}
            <Button label={t('common.close')} tone="ghost" size="md" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
