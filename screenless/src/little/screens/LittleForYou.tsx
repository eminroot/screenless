import { View } from 'react-native';

import { useForYou } from '../../lib/for-you';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { Bubble } from '../components/Bubble';
import { ClayButton, ClayCard, ClayTile } from '../components/Clay';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { Mascot } from '../components/Mascot';
import { CloseIcon, PlayIcon } from '../icons';
import { ink, round, space, tones, type ToneName } from '../theme';

/**
 * Mine, for ages 3 to 5.
 *
 * The same engine as the tiers above, drawn for somebody who cannot read.
 * There is no preference report and no explanation: a four year old does not
 * want to be told what the phone has worked out about them, and could not
 * read it anyway. There are two big picture cards and a buddy asking which
 * one, which is the only form this idea takes at this age.
 *
 * Two, not three. A choice between two is a choice; a choice between three
 * is a menu, and a menu is how a small child ends up choosing nothing.
 */
const TONE_ORDER: ToneName[] = ['grape', 'aqua', 'bubble'];

export function LittleForYou() {
  const { t, pick } = useI18n();
  const { profile } = useApp();
  const forYou = useForYou();

  if (!profile) return null;

  const ideas = forYou.ideas.slice(0, 2);

  return (
    <LittleScreen>
      <View style={{ alignItems: 'center', gap: space.md }}>
        <Mascot id={profile.buddyId} name={profile.buddyName} size={150} mood="idle" />
        {/* Three words, because nobody here reads a paragraph. What these
            missions are and where they came from is a thing for the parent
            area, not for a four year old's home screen. */}
        <Bubble text={t('forYou.littleAsk')} tail="none" />
      </View>

      {ideas.length === 0 ? (
        <ClayCard style={{ padding: space.xl, marginTop: space.lg }}>
          <LText variant="body" center>
            {t('forYou.noIdeas')}
          </LText>
        </ClayCard>
      ) : (
        <View style={{ gap: space.lg, marginTop: space.lg }}>
          {ideas.map((idea, index) => {
            const tone = TONE_ORDER[index % TONE_ORDER.length];
            return (
              <View key={idea.task.id}>
                <ClayTile
                  tone={tone}
                  onPress={() => forYou.start(idea.task)}
                  accessibilityLabel={pick(idea.task.title)}
                  style={{ padding: space.xl, gap: space.sm, alignItems: 'center' }}
                >
                  <LText variant="giant">{idea.task.emoji}</LText>
                  <LText variant="heading" color={tones[tone].ink} center>
                    {pick(idea.task.title)}
                  </LText>
                  <LText variant="body" color={tones[tone].ink} center>
                    {pick(idea.task.body)}
                  </LText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.sm,
                      backgroundColor: tones.white.face,
                      borderRadius: round.pill,
                      paddingVertical: space.sm,
                      paddingHorizontal: space.lg,
                      marginTop: space.sm,
                    }}
                  >
                    <PlayIcon size={22} color={ink.text} />
                    <LText variant="label">{t('forYou.start')}</LText>
                  </View>
                </ClayTile>

                {/* Small and quiet: saying no to an idea is allowed, but
                    it is not what the screen is for. */}
                <ClayButton
                  label={t('forYou.notThis')}
                  icon={<CloseIcon size={20} />}
                  tone="white"
                  size="sm"
                  full={false}
                  onPress={() => forYou.refuse(idea)}
                  style={{ alignSelf: 'center', marginTop: space.xs }}
                />
              </View>
            );
          })}
        </View>
      )}

      <ClayButton
        label={t('forYou.more')}
        tone="sun"
        size="md"
        onPress={forYou.more}
        style={{ marginTop: space.xl }}
      />
    </LittleScreen>
  );
}
