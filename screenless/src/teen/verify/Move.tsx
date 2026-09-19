import { useEffect, useRef } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { Button } from '../components/Button';
import { Bar } from '../components/Stat';
import { Label, Panel } from '../components/Surface';
import { TText } from '../components/TText';
import { PlayIcon } from '../icons';
import { useSkin } from '../skin';
import { radius, space } from '../theme';

type Kind = 'steps' | 'active';

function show(kind: Kind, value: number): string {
  if (kind === 'steps') return value.toLocaleString();
  const safe = Math.max(0, Math.floor(value));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Steps or counted minutes of movement, for 10-14.
 *
 * Deliberately modest numbers and no history of them: this tier shows what
 * this challenge asked for and whether it happened, and nothing anywhere
 * ranks one person's movement against another's.
 */
export function MoveCard({
  kind,
  value,
  target,
  supported,
  onStart,
}: {
  kind: Kind;
  value: number;
  target: number;
  supported: boolean | null;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const { ink, accents } = useSkin();
  const done = value >= target;

  return (
    <View style={{ marginTop: space.xxl }}>
      <Label
        accent={done ? 'acid' : undefined}
        trailing={
          <TText variant="label" color={done ? accents.acid.bright : ink.muted}>
            {show(kind, target)}
          </TText>
        }
      >
        {kind === 'steps' ? t('teenVerify.stepsLabel') : t('teenVerify.movingLabel')}
      </Label>
      <Panel>
        <TText variant="statBig" color={done ? accents.acid.bright : ink.strong}>
          {show(kind, value)}
        </TText>
        <Bar value={value / target} accent={done ? 'acid' : 'sky'} style={{ marginTop: space.md }} />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {supported === false
            ? t('teenVerify.moveNoSensor')
            : done
              ? t('teenVerify.moveDone')
              : t('teenVerify.movePocket')}
        </TText>
        {supported !== false && !done ? (
          <Button
            label={t('verify.countStart')}
            icon={<PlayIcon size={16} />}
            size="md"
            style={{ marginTop: space.lg }}
            onPress={onStart}
          />
        ) : null}
      </Panel>
    </View>
  );
}

/**
 * The counting screen. A phone in a pocket presses its own buttons, so this
 * takes no touch except a deliberate hold.
 */
export function MoveOverlay({
  visible,
  kind,
  value,
  target,
  level,
  onStop,
}: {
  visible: boolean;
  kind: Kind;
  value: number;
  target: number;
  level: number;
  onStop: () => void;
}) {
  const { t } = useI18n();
  const { ink, accents, palette } = useSkin();
  const done = value >= target;
  const announced = useRef(false);

  useEffect(() => {
    if (!visible) {
      announced.current = false;
      return;
    }
    if (done && !announced.current) {
      announced.current = true;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [done, visible]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => undefined} statusBarTranslucent>
      <Pressable
        onPress={done ? onStop : undefined}
        accessibilityRole={done ? 'button' : undefined}
        accessibilityLabel={done ? t('verify.countTapClose') : undefined}
        style={{
          flex: 1,
          backgroundColor: palette.ground,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
          gap: space.md,
        }}
      >
        <TText variant="label" color={ink.muted}>
          {kind === 'steps' ? t('teenVerify.stepsLabel') : t('teenVerify.movingLabel')}
        </TText>
        <TText
          variant="statBig"
          color={done ? accents.acid.bright : ink.strong}
          style={{ fontSize: 88, lineHeight: 92 }}
        >
          {show(kind, value)}
        </TText>
        <TText variant="body" color={ink.muted}>
          {`/ ${show(kind, target)}`}
        </TText>

        <View style={{ width: '100%', maxWidth: 360, marginTop: space.lg }}>
          <Bar value={value / target} accent={done ? 'acid' : 'sky'} height={10} />
          <View
            style={{
              height: 3,
              marginTop: space.sm,
              borderRadius: radius.pill,
              backgroundColor: accents.sky.solid,
              opacity: done ? 0 : 0.15 + Math.min(1, level) * 0.85,
            }}
          />
        </View>

        {done ? (
          <TText variant="bodyStrong" color={ink.body} style={{ marginTop: space.lg }}>
            {t('verify.countTapClose')}
          </TText>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('verify.countHold')}
            delayLongPress={900}
            onLongPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onStop();
            }}
            style={{
              marginTop: space.xxl,
              paddingVertical: space.md,
              paddingHorizontal: space.xl,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <TText variant="label" color={ink.muted}>
              {t('verify.countHold')}
            </TText>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}
