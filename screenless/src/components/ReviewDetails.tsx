import { Image, View } from 'react-native';

import { objectName } from '../data/room-objects';
import { checksFor, correctWays } from '../engine/verify';
import { useI18n } from '../i18n';
import type { TKey, TVars } from '../i18n/shape';
import type { CheckOutcome, EvidenceCheck, Mission, ReviewReason } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { Sticker, Txt } from './ui';

const REASON_KEYS: Record<ReviewReason, TKey> = {
  spotCheck: 'review.reasonSpotCheck',
  firstOnes: 'review.reasonFirstOnes',
  everyOne: 'review.reasonEveryOne',
  tooFast: 'review.reasonTooFast',
  missing: 'review.reasonMissing',
  odd: 'review.reasonOdd',
  repeated: 'review.reasonRepeated',
  burst: 'review.reasonBurst',
};

const CHECK_KEYS: Record<EvidenceCheck['kind'], TKey> = {
  clock: 'review.checkClock',
  away: 'review.checkAway',
  steps: 'review.checkSteps',
  reps: 'review.checkReps',
  active: 'review.checkActive',
  badges: 'review.checkBadges',
  secret: 'review.checkSecret',
  photo: 'review.checkPhoto',
  answer: 'review.checkAnswer',
  picked: 'review.checkPicked',
  grownup: 'review.checkGrownup',
  tally: 'review.checkTally',
  // Only that something was written, never a word of what it said.
  note: 'review.checkNote',
};

function checkLine(t: (key: TKey, vars?: TVars) => string, outcome: CheckOutcome): string {
  return t(CHECK_KEYS[outcome.kind], { value: outcome.value ?? 0, target: outcome.target ?? 0 });
}

/**
 * What the phone found about one finished mission, for the parent.
 *
 * Every check with a tick or a cross and the number behind it, grouped the way
 * the mission groups them, then what the child actually answered. It is shown
 * both when a mission waits for a parent and in the list of missions the phone
 * approved on its own, so a parent can always see why the phone said yes.
 */
export function ReviewDetails({ mission, showReasons = true }: { mission: Mission; showReasons?: boolean }) {
  const { t, pick } = useI18n();
  const review = mission.review;
  if (!review) return null;

  const task = mission.task;
  const rules = checksFor(task);
  let cursor = 0;
  const next = () => review.checks[cursor++];

  const answerLines: string[] = [];
  if (task.answer?.kind === 'count' && typeof mission.answerValue === 'number') {
    answerLines.push(t('review.answerCount', { value: mission.answerValue }));
  }
  if (task.answer?.kind === 'sums' && Array.isArray(mission.answerValue)) {
    const ways = mission.answerValue.map((way) => way.join(' + ')).join(', ');
    answerLines.push(t('review.answerSums', { ways }));
    answerLines.push(
      t('review.sumsRight', {
        count: correctWays(task.answer.target, mission.answerValue),
        target: task.answer.target,
      }),
    );
  }
  if (task.pick && mission.picked && mission.picked.length > 0) {
    answerLines.push(
      t('review.picked', {
        list: mission.picked
          .map((index) => task.pick?.options[index])
          .filter(Boolean)
          .map((option) => pick(option!))
          .join(', '),
      }),
    );
  }
  if (mission.plan?.secret) {
    answerLines.push(t('review.secret', { thing: pick(objectName(mission.plan.secret)) }));
  }

  return (
    <View style={{ gap: spacing.md }}>
      {showReasons && review.by === 'parent' && review.reasons.length > 0 ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, gap: spacing.xs }}>
          <Txt variant="bodyStrong">{t('review.whyTitle')}</Txt>
          {review.reasons.map((reason) => (
            <Txt key={reason} variant="small" color={colors.textSoft}>
              {'• '}
              {t(REASON_KEYS[reason])}
            </Txt>
          ))}
        </Sticker>
      ) : null}

      {review.checks.length > 0 ? (
        <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.sm }}>
          <Txt variant="bodyStrong">{t('review.checksTitle')}</Txt>
          {rules.map((rule, index) => {
            if (rule.kind === 'either') {
              const inner = rule.of.map(() => next()).filter(Boolean);
              return (
                <View key={index} style={{ gap: spacing.xs }}>
                  <Txt variant="small" color={colors.textFaint}>
                    {t('review.checkEither')}
                  </Txt>
                  {inner.map((outcome, j) => (
                    <CheckRow key={j} passed={outcome.passed} text={checkLine(t, outcome)} indent />
                  ))}
                </View>
              );
            }
            const outcome = next();
            return outcome ? <CheckRow key={index} passed={outcome.passed} text={checkLine(t, outcome)} /> : null;
          })}
          {answerLines.map((line) => (
            <Txt key={line} variant="small" color={colors.textSoft}>
              {line}
            </Txt>
          ))}
        </Sticker>
      ) : null}

      {mission.beforeUri ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Photo uri={mission.beforeUri} label={t('review.before')} />
          {mission.proofUri ? <Photo uri={mission.proofUri} label={t('review.after')} /> : <View style={{ flex: 1 }} />}
        </View>
      ) : null}
    </View>
  );
}

function CheckRow({ passed, text, indent = false }: { passed: boolean; text: string; indent?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: indent ? spacing.md : 0 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: borderWidth.hair,
          borderColor: colors.border,
          backgroundColor: passed ? colors.success : colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt variant="tiny" color={passed ? colors.surface : colors.textFaint}>
          {passed ? '✓' : '–'}
        </Txt>
      </View>
      <Txt variant="small" style={{ flex: 1 }} color={passed ? colors.text : colors.textSoft}>
        {text}
      </Txt>
    </View>
  );
}

function Photo({ uri, label }: { uri: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: spacing.xs }}>
      <Txt variant="tiny" color={colors.textFaint}>
        {label}
      </Txt>
      <View
        style={{
          borderRadius: radii.md,
          borderWidth: borderWidth.thick,
          borderColor: colors.border,
          overflow: 'hidden',
          aspectRatio: 3 / 4,
        }}
      >
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    </View>
  );
}

/** The line a child sees while their mission waits for a grown up. */
export function waitingLineKey(reasons: ReviewReason[]): TKey {
  if (reasons.includes('everyOne')) return 'verify.waitingEvery';
  if (reasons.includes('firstOnes')) return 'verify.waitingFirst';
  if (reasons.includes('tooFast')) return 'verify.waitingQuick';
  if (reasons.includes('missing')) return 'verify.waitingMissing';
  if (reasons.includes('spotCheck') && reasons.length === 1) return 'verify.waitingSpot';
  // Odd, repeated, burst: nothing a child should read as an accusation.
  return 'verify.waitingOther';
}
