import { View } from 'react-native';

import { useI18n } from '../../i18n';
import { useInbox } from '../../inbox/useInbox';
import type { NoteReply } from '../../state/types';
import { ClayButton, ClayCard } from './Clay';
import { LText } from './LText';
import { ink, space } from '../theme';

const REPLIES: { reply: NoteReply; key: 'inbox.replyOk' | 'inbox.replyDone' | 'inbox.replyThanks' | 'inbox.replyLater' }[] = [
  { reply: 'ok', key: 'inbox.replyOk' },
  { reply: 'done', key: 'inbox.replyDone' },
  { reply: 'thanks', key: 'inbox.replyThanks' },
  { reply: 'later', key: 'inbox.replyLater' },
];

/**
 * What a grown up sent, on the 3-5 home screen.
 *
 * The four replies are full clay buttons rather than chips, because at this
 * age a chip is not obviously a thing you press, and they are stacked two to a
 * row so each one stays wide enough for a three year old's thumb.
 *
 * A note at this tier is almost always read aloud by the grown up who is
 * sitting there. It still gets the four buttons, because pressing one is the
 * part the child gets to do.
 */
export function InboxCard() {
  const { t, language } = useI18n();
  const { note, mission, answer, take } = useInbox();

  if (!note && !mission) return null;

  return (
    <View style={{ gap: space.md }}>
      {note ? (
        <ClayCard tone="sky" style={{ padding: space.lg }}>
          <LText variant="label" color={ink.soft}>
            {t('inbox.title')}
          </LText>
          <LText variant="body" color={ink.text} style={{ marginTop: space.xs }}>
            {note.text}
          </LText>
          {/* No text field, here or in any tier: a child's own words stay on
              this phone, and an answer has to reach a parent's. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
            {REPLIES.map(({ reply, key }) => (
              <ClayButton
                key={reply}
                label={t(key)}
                tone="white"
                size="sm"
                full={false}
                onPress={() => answer(reply)}
                style={{ flexGrow: 1, minWidth: '45%' }}
              />
            ))}
          </View>
        </ClayCard>
      ) : null}

      {mission ? (
        <ClayCard tone="grape" style={{ padding: space.lg }}>
          <LText variant="label" color={ink.soft}>
            {t('inbox.missionTitle')}
          </LText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
            <LText variant="title">{mission.emoji}</LText>
            <LText variant="body" color={ink.text} style={{ flex: 1 }}>
              {mission.title[language]}
            </LText>
          </View>
          <ClayButton
            label={t('inbox.take')}
            tone="sun"
            size="md"
            onPress={take}
            style={{ marginTop: space.md }}
          />
        </ClayCard>
      ) : null}
    </View>
  );
}
