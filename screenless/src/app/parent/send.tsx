import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Field, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { eligibleTasks } from '../../engine/task-engine';
import { useI18n } from '../../i18n';
import { useApp, MAX_NOTE_TEXT } from '../../state/app-state';
import type { TaskCategory, TaskContent } from '../../state/types';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/**
 * Leaving a mission or a line for the child, from this phone.
 *
 * The one-device path, and it is the main path rather than a fallback: most
 * families have one phone between them, and a parent standing in the same room
 * should not have to install a second app and make an account to hand their
 * child something to do.
 *
 * Everything here writes into the same inbox the hub writes into, so the child
 * sees the identical card in their own tier's language. Nothing here touches
 * the network, and none of it needs a link — a family that never signs up for
 * a dashboard gets the whole feature.
 *
 * ## Why this is not the mission library
 *
 * `library.tsx` lists every mission and is `__DEV__` only, because a child who
 * can browse the list picks the five star one every time and the variety
 * mechanism stops working. This screen is for a grown up and shows a short,
 * filtered shelf: it is a suggestion, not a catalogue, and the child still has
 * to accept it.
 */

const CATEGORIES: { id: TaskCategory | 'all'; key: string }[] = [
  { id: 'all', key: 'send.catAll' },
  { id: 'move', key: 'send.catMove' },
  { id: 'outdoor', key: 'send.catOutdoor' },
  { id: 'create', key: 'send.catCreate' },
  { id: 'social', key: 'send.catSocial' },
  { id: 'calm', key: 'send.catCalm' },
];

/** Enough to choose from, few enough to read. */
const SHELF = 8;

export default function SendToChild() {
  const { t, pick } = useI18n();
  const { data, profile, sendLocalMission, sendLocalNote, withdrawLocal } = useApp();
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<'mission' | 'note' | null>(null);

  const shelf = useMemo(() => {
    if (!profile) return [];
    const all = eligibleTasks(profile).filter(
      (task) => filter === 'all' || task.category === filter,
    );
    // Shortest first. A parent reaching for this is usually filling twenty
    // minutes before dinner, not planning an afternoon.
    return [...all].sort((a, b) => a.minutes - b.minutes).slice(0, SHELF);
  }, [profile, filter]);

  if (!profile) return null;

  const waiting = data.inbox.assignment;
  const noteWaiting = data.inbox.note;
  const name = profile.nickname;

  const send = (task: TaskContent) => {
    sendLocalMission(task.id);
    setSent('mission');
  };

  const leave = () => {
    sendLocalNote(note);
    setNote('');
    setSent('note');
  };

  return (
    <Screen avoidKeyboard>
      <TopBar title={t('send.title', { name })} />

      <Txt variant="small" color={colors.textSoft}>
        {t('send.subtitle', { name })}
      </Txt>

      {/* ------------------------------------------------- already waiting */}
      {waiting || noteWaiting ? (
        <Sticker
          background={colors.surfaceAlt}
          style={{ padding: spacing.lg, gap: spacing.sm, marginTop: spacing.lg }}
        >
          <Txt variant="bodyStrong">{t('send.waitingTitle')}</Txt>
          {waiting ? (
            <View style={{ gap: spacing.sm }}>
              <Txt variant="small" color={colors.textSoft}>
                {t('send.waitingMission')}
              </Txt>
              <Button
                label={t('send.takeBackMission')}
                tone="ghost"
                size="sm"
                onPress={() => withdrawLocal('mission')}
              />
            </View>
          ) : null}
          {noteWaiting ? (
            <View style={{ gap: spacing.sm }}>
              <Txt variant="small" color={colors.textSoft}>
                {noteWaiting.text}
              </Txt>
              <Button
                label={t('send.takeBackNote')}
                tone="ghost"
                size="sm"
                onPress={() => withdrawLocal('note')}
              />
            </View>
          ) : null}
        </Sticker>
      ) : null}

      {sent ? (
        <Sticker background={colors.info} style={{ padding: spacing.md, marginTop: spacing.lg }}>
          <Txt variant="small" color={colors.surface}>
            {t(sent === 'mission' ? 'send.sentMission' : 'send.sentNote', { name })}
          </Txt>
        </Sticker>
      ) : null}

      {/* ------------------------------------------------------------ a note */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('send.noteTitle')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('send.noteBody')}
      </Txt>
      <View style={{ marginTop: spacing.md, gap: spacing.md }}>
        <Field
          value={note}
          onChangeText={setNote}
          placeholder={t('send.notePlaceholder')}
          maxLength={MAX_NOTE_TEXT}
          multiline
        />
        <Button
          label={t('send.leaveNote')}
          tone="primary"
          size="md"
          disabled={note.trim().length === 0}
          onPress={leave}
        />
      </View>

      {/* --------------------------------------------------------- a mission */}
      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('send.missionTitle')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('send.missionBody', { name })}
      </Txt>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
        {CATEGORIES.map((category) => {
          const on = filter === category.id;
          return (
            <Pressable
              key={category.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(category.id)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radii.pill,
                // An unselected chip takes the page colour rather than a lower
                // opacity: fading it would put the background through the label.
                backgroundColor: on ? colors.primary : colors.surface,
                borderWidth: borderWidth.thick,
                borderColor: on ? colors.primary : colors.border,
              }}
            >
              <Txt variant="small" color={on ? colors.surface : colors.text}>
                {t(category.key as never)}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
        {shelf.map((task) => (
          <Pressable key={task.id} accessibilityRole="button" onPress={() => send(task)}>
            <Sticker background={colors.surface} style={{ padding: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Txt variant="heading">{task.emoji}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{pick(task.title)}</Txt>
                  <Txt variant="tiny" color={colors.textSoft}>
                    {t('send.minutes', { minutes: task.minutes })} ·{' '}
                    {t('send.stars', { stars: task.stars })}
                  </Txt>
                </View>
              </View>
            </Sticker>
          </Pressable>
        ))}
      </View>

      <Txt variant="tiny" color={colors.textSoft} style={{ marginTop: spacing.xl }}>
        {t('send.footnote', { name })}
      </Txt>
    </Screen>
  );
}
