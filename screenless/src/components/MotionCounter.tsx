import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Sticker, Txt } from './ui';
import { useI18n } from '../i18n';
import { useRepCounter } from '../lib/motion';
import type { MotionSpec } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

const labelKeys = {
  jump: 'motion.jump',
  shake: 'motion.shake',
  spin: 'motion.spin',
} as const;

export type MotionCounterProps = {
  spec: MotionSpec;
  running: boolean;
  onComplete: (reps: number) => void;
  /**
   * Fired when the phone has no usable sensor. The caller has to stop gating on
   * the count, or the mission becomes impossible to finish on that device.
   */
  onUnsupported: () => void;
};

/**
 * The phone counting the movement for itself.
 *
 * A number that only goes up when the child actually moves is the difference
 * between a mission and a button, so this is deliberately the loudest thing on
 * the screen while it is running.
 */
export function MotionCounter({ spec, running, onComplete, onUnsupported }: MotionCounterProps) {
  const { t } = useI18n();
  const { reps, intensity, supported } = useRepCounter(spec.kind, spec.count, running);
  const announced = useRef(false);
  const lastRep = useRef(0);

  useEffect(() => {
    if (!supported) onUnsupported();
  }, [supported, onUnsupported]);

  useEffect(() => {
    if (reps > lastRep.current) {
      lastRep.current = reps;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [reps]);

  useEffect(() => {
    if (reps >= spec.count && !announced.current) {
      announced.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(reps);
    }
  }, [reps, spec.count, onComplete]);

  const done = reps >= spec.count;

  if (!supported) {
    return (
      <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
        <Txt variant="small" color={colors.textSoft}>
          {t('motion.noSensor')}
        </Txt>
      </Sticker>
    );
  }

  return (
    <Sticker
      background={done ? colors.success : colors.surface}
      style={{ padding: spacing.lg, gap: spacing.md, alignItems: 'center' }}
    >
      <Txt variant="small" color={done ? colors.surface : colors.textSoft}>
        {t(labelKeys[spec.kind])}
      </Txt>

      <View
        style={{
          width: 132,
          height: 132,
          borderRadius: 66,
          borderWidth: 6,
          borderColor: colors.border,
          backgroundColor: done ? colors.successDeep : colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Fills from the bottom as the reps come in, plus a live pulse. */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: `${Math.round(Math.min(1, reps / spec.count) * 100)}%`,
            backgroundColor: colors.accent,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 132,
            height: 132,
            borderRadius: 66,
            backgroundColor: colors.primary,
            opacity: running && !done ? intensity * 0.35 : 0,
          }}
        />
        <Txt variant="display" color={done ? colors.surface : colors.text}>
          {reps}
        </Txt>
        <Txt variant="tiny" color={done ? colors.surface : colors.textSoft}>
          {t('motion.outOf', { count: spec.count })}
        </Txt>
      </View>

      {!running && !done ? (
        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            borderRadius: radii.pill,
            borderWidth: borderWidth.hair,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: 4,
          }}
        >
          <Txt variant="tiny">{t('motion.pressStart')}</Txt>
        </View>
      ) : null}

      {done ? (
        <Txt variant="bodyStrong" color={colors.surface}>
          {t('motion.done')}
        </Txt>
      ) : null}
    </Sticker>
  );
}
