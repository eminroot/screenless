import { View } from 'react-native';

import { useI18n } from '../../i18n';
import { useInbox } from '../../inbox/useInbox';
import type { NoteReply } from '../../state/types';
import { Button, Chip } from './Button';
import { Label, Panel } from './Surface';
import { TText } from './TText';
import { space } from '../theme';
import { useSkin } from '../skin';

const REPLIES: { reply: NoteReply; key: 'inbox.replyOk' | 'inbox.replyDone' | 'inbox.replyThanks' | 'inbox.replyLater' }[] = [
  { reply: 'ok', key: 'inbox.replyOk' },
  { reply: 'done', key: 'inbox.replyDone' },
  { reply: 'thanks', key: 'inbox.replyThanks' },
  { reply: 'later', key: 'inbox.replyLater' },
];

/**
 * What a grown up sent, on the 10-13 Today screen.
 *
 * Deliberately not styled like the buddy. The buddy is a cartoon with an
 * opinion; this is a person, and at this age the difference matters more than
 * anywhere else in the app — a note from a parent dressed up as a talking fox
 * reads as the app pretending, which is the fastest way to lose a twelve year
 * old's trust in both of them.
 *
 * Renders nothing at all when there is nothing waiting, so an unlinked phone
 * and a quiet day look the same: no empty state, no "no messages" card.
 */
export function InboxCard() {
  const { t, language } = useI18n();
  const { note, mission, answer, take } = useInbox();
  const { ink } = useSkin();

  if (!note && !mission) return null;

  return (
    <View style={{ marginTop: space.xxl, gap: space.md }}>
      <Label accent="sky">{t('inbox.title')}</Label>

      {note ? (
        <Panel accent="sky">
          <TText variant="body" color={ink.strong}>
            {note.text}
          </TText>
          {/* Four fixed answers. There is no text field here on purpose: what
              a child types would have to travel to a server to reach the
              parent, and nothing a child types leaves this phone. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
            {REPLIES.map(({ reply, key }) => (
              <Chip key={reply} label={t(key)} accent="sky" onPress={() => answer(reply)} />
            ))}
          </View>
        </Panel>
      ) : null}

      {mission ? (
        <Panel accent="violet">
          <TText variant="label" color={ink.muted}>
            {t('inbox.missionTitle')}
          </TText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
            <TText variant="title">{mission.emoji}</TText>
            <View style={{ flex: 1 }}>
              <TText variant="heading" color={ink.strong}>
                {mission.title[language]}
              </TText>
              <TText variant="caption" color={ink.muted}>
                {t('inbox.minutes', { minutes: mission.minutes })} ·{' '}
                {t('inbox.stars', { stars: mission.stars })}
              </TText>
            </View>
          </View>
          <Button
            label={t('inbox.take')}
            accent="violet"
            size="md"
            onPress={take}
            style={{ marginTop: space.lg }}
          />
        </Panel>
      ) : null}
    </View>
  );
}
