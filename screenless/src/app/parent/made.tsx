import { useMemo } from 'react';
import { View } from 'react-native';

import { Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { slotBanks, sparkTemplates, type SlotKind } from '../../data/spark-templates';
import { previewIdea } from '../../engine/spark';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { colors, spacing } from '../../theme/tokens';

/**
 * What the app can make up, for the parent.
 *
 * The library was always this app's answer to "what might it ask my child to
 * do": a parent can open it and read every mission. Building missions on the
 * phone would quietly break that promise, so this screen puts it back. It
 * shows one filled in example of every sentence pattern for their child's
 * age, and then every word each blank can be filled with.
 *
 * It is the whole vocabulary. Nothing here is fetched and nothing is written
 * by a model, so this list is not a sample: it is the complete set of things
 * the app is able to say.
 */
const BANK_LABELS: Record<SlotKind, TKey> = {
  thing: 'forYou.parentBankThing',
  place: 'forYou.parentBankPlace',
  move: 'forYou.parentBankMove',
  twist: 'forYou.parentBankTwist',
  theme: 'forYou.parentBankTheme',
  person: 'forYou.parentBankPerson',
  subject: 'forYou.parentBankSubject',
};

const BANK_ORDER: SlotKind[] = ['thing', 'place', 'move', 'twist', 'theme', 'person', 'subject'];

export default function ParentMadeScreen() {
  const { t, pick } = useI18n();
  const { profile } = useApp();

  const band = profile?.ageBand;

  // One of each pattern, drawn with an empty taste so the examples are the
  // neutral ones rather than the ones this child happens to be getting.
  const examples = useMemo(() => {
    if (!profile) return [];
    return sparkTemplates
      .filter((template) => template.band === profile.ageBand)
      .map((template) => previewIdea(template.id, profile, `preview-${template.id}`))
      .filter((idea): idea is NonNullable<typeof idea> => idea !== null);
  }, [profile]);

  if (!profile || !band) return null;

  const patterns = sparkTemplates.filter((template) => template.band === band).length;

  return (
    <Screen>
      <TopBar title={t('forYou.parentTitle')} />

      <Txt variant="body" color={colors.textSoft}>
        {t('forYou.parentLead')}
      </Txt>

      <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.md, marginTop: spacing.lg }}>
        <Txt variant="body">{t('forYou.parentHow')}</Txt>
        <Txt variant="small" color={colors.textSoft}>
          {t('forYou.parentSeen')}
        </Txt>
      </Sticker>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('forYou.parentExamples')}
      </Txt>
      <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.xs }}>
        {t('forYou.parentCount', { count: patterns })} · {t('forYou.parentExamplesNote')}
      </Txt>

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {examples.map((idea) => (
          <Sticker
            key={idea.task.id}
            background={colors.surface}
            offset={4}
            style={{ padding: spacing.lg, gap: 2 }}
          >
            <Txt variant="bodyStrong">
              {idea.task.emoji} {pick(idea.task.title)}
            </Txt>
            <Txt variant="body" color={colors.textSoft}>
              {pick(idea.task.body)}
            </Txt>
          </Sticker>
        ))}
      </View>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('forYou.parentPieces')}
      </Txt>

      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {BANK_ORDER.map((kind) => {
          const words = slotBanks[kind]
            .filter((filler) => !filler.bands || filler.bands.includes(band))
            .map((filler) => pick(filler.text));
          if (words.length === 0) return null;
          return (
            <Sticker key={kind} background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
              <Txt variant="small" color={colors.textFaint}>
                {t(BANK_LABELS[kind])}
              </Txt>
              <Txt variant="body">{words.join(' · ')}</Txt>
            </Sticker>
          );
        })}
      </View>
    </Screen>
  );
}
