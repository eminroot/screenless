import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import * as api from '../../../api/client';
import type { Assignment, Note, NoteReply, Reward } from '../../../api/types';
import catalogue from '../../../data/catalogue.json';
import {
  Button,
  Card,
  Eyebrow,
  Field,
  Loading,
  Notice,
  Rule,
  Screen,
  TopBar,
  Txt,
} from '../../../components/ui';
import { useI18n, type TKey } from '../../../i18n';
import { useSession } from '../../../state/session';
import { colors, spacing } from '../../../theme/tokens';

/**
 * The one screen where a parent sends something rather than reads something.
 *
 * Every other screen in this app is a report: here is what their week looked
 * like, here is the limit you set. This is the other direction, and the three
 * things on it are the three the hub will carry — a line, a promise, a
 * mission.
 *
 * ## What actually travels
 *
 * For the note and the reward, the parent's own words. For the mission, only
 * the key: both apps ship the same library, so `catalogue.json` here is a
 * generated copy of the titles and the child's phone looks the rest up in the
 * child's own language. That is why the search box below filters titles this
 * app already has rather than asking the server for anything.
 *
 * ## What does not travel
 *
 * A reply. A child answers a note with one of four buttons, and those four
 * words are the whole of what comes back. There is deliberately no way for a
 * child to type to a parent through this app: that text would have to sit on
 * a server, and nothing a child writes is allowed to.
 *
 * ## The delay
 *
 * None of it pushes. The hub cannot wake a phone, so everything sent here
 * waits for the child's next sync. The line at the top of the screen says so,
 * because a parent who thinks they sent an instant message and got silence
 * will conclude the app is broken.
 */

type Row = (typeof catalogue)[number];

/** Enough to choose from without turning the screen into a scroll of 209. */
const RESULT_LIMIT = 8;

const REPLY_KEYS: Record<NoteReply, TKey> = {
  ok: 'send.replyOk',
  done: 'send.replyDone',
  thanks: 'send.replyThanks',
  later: 'send.replyLater',
};

/**
 * The same four the child's app offers, and deliberately so.
 *
 * That app rounds any target onto a step of ten and refuses anything under
 * twenty, so a ten or a twenty-five chosen here would arrive as something
 * else. Offering values that survive the trip means the number the parent
 * picked is the number the child sees.
 */
const STAR_CHOICES = [50, 100, 150, 250];

export default function SendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useSession();
  const { t, language } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);

  const [draft, setDraft] = useState('');
  const [rewardLabel, setRewardLabel] = useState('');
  const [rewardStars, setRewardStars] = useState(STAR_CHOICES[1]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    const [n, r, a] = await Promise.all([
      api.fetchNotes(token, id),
      api.fetchRewards(token, id),
      api.fetchAssignment(token, id),
    ]);
    if (n.ok) setNotes(n.value.notes);
    if (r.ok) setRewards(r.value.rewards);
    if (a.ok) setAssignment(a.value.assignment);
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  /* --------------------------------------------------------------- actions */

  const run = useCallback(
    async (action: () => Promise<{ ok: boolean; error?: string }>, onOk: () => void) => {
      setBusy(true);
      setError(null);
      const result = await action();
      if (result.ok) onOk();
      else setError(result.error === 'taken' ? t('send.rewardFull') : t('error.server'));
      setBusy(false);
    },
    [t],
  );

  const onSendNote = useCallback(() => {
    if (!token || !id || !draft.trim()) return;
    void run(
      () => api.sendNote(token, id, draft.trim()),
      () => {
        setDraft('');
        void load();
      },
    );
  }, [token, id, draft, run, load]);

  const onPromise = useCallback(() => {
    if (!token || !id || !rewardLabel.trim()) return;
    void run(
      () => api.promiseReward(token, id, { stars: rewardStars, label: rewardLabel.trim(), emoji: '🎁' }),
      () => {
        setRewardLabel('');
        void load();
      },
    );
  }, [token, id, rewardLabel, rewardStars, run, load]);

  /**
   * Dropping a promise.
   *
   * Here because the cap is on rows, not on outstanding promises: twenty
   * rewards is twenty rewards whether or not they have been handed over, so
   * without this a parent who used the feature for a term reached a wall that
   * ticking things off did not move.
   */
  const onDropReward = useCallback(
    (rewardId: string) => {
      if (!token || !id) return;
      void run(() => api.deleteReward(token, id, rewardId), load);
    },
    [token, id, run, load],
  );

  const onAssign = useCallback(
    (taskId: string | null) => {
      if (!token || !id) return;
      void run(
        () => api.assignMission(token, id, taskId),
        () => {
          setSearch('');
          void load();
        },
      );
    },
    [token, id, run, load],
  );

  /* ---------------------------------------------------------------- lists */

  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language === 'tr' ? 'tr' : language);
    if (!query) return [] as Row[];
    return (catalogue as Row[])
      .filter((row) => (row.title[language as keyof typeof row.title] ?? '').toLocaleLowerCase().includes(query))
      .slice(0, RESULT_LIMIT);
  }, [search, language]);

  const assigned = useMemo(
    () => (assignment ? (catalogue as Row[]).find((row) => row.id === assignment.taskId) ?? null : null),
    [assignment],
  );

  const lastNote = notes[0] ?? null;

  if (loading) return <Loading />;

  return (
    <Screen>
      <TopBar title={t('send.title')} />

      {/* The one thing a parent has to know before they send anything. */}
      <Txt variant="body" color={colors.inkSoft} style={{ marginBottom: spacing.lg }}>
        {t('send.delay')}
      </Txt>

      {error ? <Notice text={error} /> : null}

      {/* ----------------------------------------------------------- a note */}

      <Eyebrow>{t('send.noteLabel')}</Eyebrow>
      <Card>
        <Field
          value={draft}
          onChangeText={setDraft}
          placeholder={t('send.notePlaceholder')}
          hint={t('send.noteHint')}
          maxLength={200}
          multiline
        />
        <Button
          label={t('send.noteSend')}
          onPress={onSendNote}
          disabled={!draft.trim() || busy}
          style={{ marginTop: spacing.md }}
        />

        {lastNote ? (
          <>
            <Rule style={{ marginVertical: spacing.lg }} />
            <Txt variant="body">{lastNote.text}</Txt>
            <Txt
              variant="tiny"
              color={lastNote.reply ? colors.good : colors.inkFaint}
              style={{ marginTop: spacing.xs }}
            >
              {lastNote.reply ? t(REPLY_KEYS[lastNote.reply]) : t('send.noteWaiting')}
            </Txt>
          </>
        ) : null}
      </Card>

      {/* --------------------------------------------------------- a reward */}

      <Eyebrow style={{ marginTop: spacing.xl }}>{t('send.rewardLabel')}</Eyebrow>
      <Card>
        <Field
          value={rewardLabel}
          onChangeText={setRewardLabel}
          placeholder={t('send.rewardPlaceholder')}
          maxLength={60}
        />
        <Txt variant="label" color={colors.inkSoft} style={{ marginTop: spacing.md }}>
          {t('send.rewardStars')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          {STAR_CHOICES.map((stars) => (
            <Button
              key={stars}
              label={String(stars)}
              size="sm"
              tone={stars === rewardStars ? 'primary' : 'quiet'}
              onPress={() => setRewardStars(stars)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        <Button
          label={t('send.rewardAdd')}
          onPress={onPromise}
          disabled={!rewardLabel.trim() || busy}
          style={{ marginTop: spacing.md }}
        />

        <Rule style={{ marginVertical: spacing.lg }} />
        {rewards.length === 0 ? (
          <Txt variant="body" color={colors.inkFaint}>
            {t('send.rewardNone')}
          </Txt>
        ) : (
          <View style={{ gap: spacing.md }}>
            {/* The promise reads on one line and its two actions sit under it,
                rather than all three sharing a row. Side by side there is no
                width left for the label at phone size: "Mark as given" is
                "Verildi olarak işaretle" in Turkish, and next to a delete
                control it squeezes the thing the parent is actually reading
                down to a couple of characters a line. */}
            {rewards.map((reward) => (
              <View key={reward.id} style={{ gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Txt variant="body">{reward.emoji}</Txt>
                  <View style={{ flex: 1 }}>
                    <Txt variant="body">{reward.label}</Txt>
                    <Txt variant="tiny" color={colors.inkFaint}>
                      {reward.stars}
                    </Txt>
                  </View>
                  {reward.givenAt ? (
                    <Txt variant="tiny" color={colors.good}>
                      {t('send.rewardGiven')}
                    </Txt>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {reward.givenAt ? null : (
                    <Button
                      label={t('send.rewardMarkGiven')}
                      size="sm"
                      tone="quiet"
                      disabled={busy}
                      style={{ flex: 1 }}
                      onPress={() =>
                        token && id
                          ? void run(() => api.markRewardGiven(token, id, reward.id, true), load)
                          : undefined
                      }
                    />
                  )}
                  {/* Offered on every row, including one already handed over:
                      the ceiling counts rows, so a given reward still holds a
                      slot and this is the only way to free it. */}
                  <Button
                    label={t('common.delete')}
                    size="sm"
                    tone="danger"
                    disabled={busy}
                    style={{ flex: reward.givenAt ? 1 : 0 }}
                    onPress={() => onDropReward(reward.id)}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* -------------------------------------------------------- a mission */}

      <Eyebrow style={{ marginTop: spacing.xl }}>{t('send.missionLabel')}</Eyebrow>
      <Card>
        {assigned ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Txt variant="body">{assigned.emoji}</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="body">{assigned.title[language as keyof typeof assigned.title]}</Txt>
                <Txt
                  variant="tiny"
                  color={assignment?.takenAt ? colors.good : colors.inkFaint}
                  style={{ marginTop: spacing.xs }}
                >
                  {assignment?.takenAt ? t('send.missionTaken') : t('send.missionWaiting')}
                </Txt>
              </View>
            </View>
            {/* Only offered while it is still in flight. Taking back something
                already sitting on a child's list would be a change they see
                happen for no reason. */}
            {assignment?.takenAt ? null : (
              <Button
                label={t('send.missionClear')}
                tone="quiet"
                disabled={busy}
                onPress={() => onAssign(null)}
                style={{ marginTop: spacing.md }}
              />
            )}
            <Rule style={{ marginVertical: spacing.lg }} />
          </>
        ) : null}

        <Field value={search} onChangeText={setSearch} placeholder={t('send.missionSearch')} />

        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          {results.map((row) => (
            <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Txt variant="body">{row.emoji}</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="body">{row.title[language as keyof typeof row.title]}</Txt>
                {row.duo ? (
                  <Txt variant="tiny" color={colors.inkFaint}>
                    {t('send.missionDuo')}
                  </Txt>
                ) : null}
              </View>
              <Button
                label={String(row.minutes)}
                size="sm"
                tone="quiet"
                disabled={busy}
                onPress={() => onAssign(row.id)}
              />
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
