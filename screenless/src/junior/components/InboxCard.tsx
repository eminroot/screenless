import { View } from 'react-native';

import { useI18n } from '../../i18n';
import { useInbox } from '../../inbox/useInbox';
import type { NoteReply } from '../../state/types';
import { Button, Chip } from './Button';
import { Card, IconTile } from './Surface';
import { JText } from './JText';
import { accents, ink, space } from '../theme';

const REPLIES: { reply: NoteReply; key: 'inbox.replyOk' | 'inbox.replyDone' | 'inbox.replyThanks' | 'inbox.replyLater' }[] = [
  { reply: 'ok', key: 'inbox.replyOk' },
  { reply: 'done', key: 'inbox.replyDone' },
  { reply: 'thanks', key: 'inbox.replyThanks' },
  { reply: 'later', key: 'inbox.replyLater' },
];

/**
 * What a grown up sent, on the 6-9 camp screen.
 *
 * The same two cards as the other tiers in this tier's language: a comic block
 * on a hard shadow rather than a hairline panel. It is drawn in blue, which is
 * not a colour the expedition uses for anything else, so a note from a real
 * person never gets mistaken for one more thing the app is saying.
 *
 * Nothing renders when nothing is waiting.
 */
export function InboxCard() {
  const { t, language } = useI18n();
  const { note, mission, answer, take } = useInbox();

  if (!note && !mission) return null;

  return (
    <View style={{ marginTop: space.lg, gap: space.md }}>
      {note ? (
        <Card accent="blue">
          <JText variant="heading" color={accents.blue.base}>
            {t('inbox.title')}
          </JText>
          <JText variant="read" color={ink.body} style={{ marginTop: space.xs }}>
            {note.text}
          </JText>
          {/* Four fixed answers, never a text field: what a child types has
              to stay on this phone, and a reply has to cross to a parent. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
            {REPLIES.map(({ reply, key }) => (
              <Chip key={reply} label={t(key)} accent="blue" onPress={() => answer(reply)} />
            ))}
          </View>
        </Card>
      ) : null}

      {mission ? (
        <Card accent="violet">
          <JText variant="heading" color={accents.violet.base}>
            {t('inbox.missionTitle')}
          </JText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
            <IconTile accent="violet">
              <JText variant="title">{mission.emoji}</JText>
            </IconTile>
            <View style={{ flex: 1 }}>
              <JText variant="heading" color={ink.strong}>
                {mission.title[language]}
              </JText>
              <JText variant="small" color={ink.body}>
                {t('inbox.minutes', { minutes: mission.minutes })} ·{' '}
                {t('inbox.stars', { stars: mission.stars })}
              </JText>
            </View>
          </View>
          <Button
            label={t('inbox.take')}
            accent="violet"
            size="md"
            onPress={take}
            style={{ marginTop: space.md }}
          />
        </Card>
      ) : null}
    </View>
  );
}
