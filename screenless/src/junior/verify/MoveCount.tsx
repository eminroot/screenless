import { useEffect, useRef } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { Button } from '../components/Button';
import { JText } from '../components/JText';
import { Bar } from '../components/Stat';
import { Card, IconTile, Stamp } from '../components/Surface';
import { BoltIcon, PlayIcon, ShoeIcon, TrophyIcon } from '../icons';
import { accents, ink, palette, radius, space } from '../theme';

type Kind = 'steps' | 'active';

function show(kind: Kind, value: number): string {
  if (kind === 'steps') return String(value);
  const safe = Math.max(0, Math.floor(value));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Steps or time spent moving, counted with the phone in a pocket.
 *
 * The count itself happens on a full screen of its own. A phone in a pocket
 * with the mission screen showing gets pressed against a leg, and one stray
 * press on "not this one" throws a child's whole ball game away, so the
 * counting screen ignores every touch except a deliberate hold.
 */
export function MoveCountCard({
  kind,
  value,
  target,
  supported,
  onStart,
}: {
  kind: Kind;
  /** Steps, or seconds of movement. */
  value: number;
  /** Steps, or seconds of movement. */
  target: number;
  supported: boolean | null;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const done = value >= target;

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="amber">{t('junior.countStamp')}</Stamp>
      <Card accent={done ? 'green' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile accent={done ? 'green' : 'amber'} size={52}>
            {kind === 'steps' ? <ShoeIcon size={26} /> : <BoltIcon size={26} />}
          </IconTile>
          <View style={{ flex: 1 }}>
            <JText variant="stat" color={done ? accents.green.base : ink.strong}>
              {show(kind, value)}
              <JText variant="heading" color={ink.muted}>
                {' / '}
                {show(kind, target)}
              </JText>
            </JText>
            <JText variant="small" color={ink.muted}>
              {supported === false
                ? t('verify.countNoSensor')
                : done
                  ? t('motion.done')
                  : t('verify.countPocket')}
            </JText>
          </View>
        </View>
        {supported !== false ? (
          <>
            <Bar value={value / target} accent={done ? 'green' : 'amber'} style={{ marginTop: space.md }} />
            {!done ? (
              <Button
                label={t('verify.countStart')}
                icon={<PlayIcon size={18} />}
                accent="amber"
                size="md"
                style={{ marginTop: space.lg }}
                onPress={onStart}
              />
            ) : null}
          </>
        ) : null}
      </Card>
    </View>
  );
}

/**
 * A week long team goal, which is only ever shown once the week has earned it.
 *
 * The missions behind it were done days ago; this card is where the child is
 * told the team managed it, so it reads as a result rather than a chore list.
 */
export function WeekGoalCard({ done, target }: { done: number; target: number }) {
  const { t } = useI18n();
  const reached = done >= target;
  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="violet">{t('verify.weekStamp')}</Stamp>
      <Card accent={reached ? 'green' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile accent={reached ? 'green' : 'violet'} size={52}>
            <TrophyIcon size={26} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <JText variant="heading" color={reached ? accents.green.base : ink.strong}>
              {t('verify.tallyCount', { count: done, total: target })}
            </JText>
            <JText variant="small" color={ink.muted}>
              {reached ? t('verify.tallyDone') : t('verify.tallyLeft')}
            </JText>
          </View>
        </View>
        <Bar value={done / target} accent={reached ? 'green' : 'violet'} style={{ marginTop: space.md }} />
      </Card>
    </View>
  );
}

export function CountingOverlay({
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
  /** 0 to 1, for the pulse. */
  level: number;
  onStop: () => void;
}) {
  const { t } = useI18n();
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
        // Touches do nothing until the count is full, then any tap finishes.
        onPress={done ? onStop : undefined}
        accessibilityRole={done ? 'button' : undefined}
        accessibilityLabel={done ? t('verify.countTapClose') : undefined}
        style={{
          flex: 1,
          backgroundColor: done ? accents.green.base : palette.ground,
          alignItems: 'center',
          justifyContent: 'center',
          padding: space.xl,
          gap: space.lg,
        }}
      >
        <JText variant="heading" color={ink.onGroundMuted} center>
          {kind === 'steps' ? t('verify.countSteps') : t('verify.countMoving')}
        </JText>
        <JText
          variant="statBig"
          color={ink.onGround}
          center
          style={{ fontSize: 96, lineHeight: 104 }}
        >
          {show(kind, value)}
        </JText>
        <JText variant="title" color={ink.onGroundMuted} center>
          / {show(kind, target)}
        </JText>

        <View style={{ width: '100%', maxWidth: 420 }}>
          <Bar value={value / target} accent={done ? 'amber' : 'green'} height={22} onCream={false} />
          <View
            style={{
              height: 6,
              marginTop: space.md,
              borderRadius: radius.pill,
              backgroundColor: accents.amber.solid,
              opacity: done ? 0 : 0.15 + Math.min(1, level) * 0.85,
            }}
          />
        </View>

        {done ? (
          <View style={{ alignItems: 'center', gap: space.xs }}>
            <JText variant="title" color={ink.onGround} center>
              {t('verify.countDone')}
            </JText>
            <JText variant="body" color={ink.onGround} center>
              {t('verify.countTapClose')}
            </JText>
          </View>
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
              marginTop: space.xl,
              paddingVertical: space.lg,
              paddingHorizontal: space.xxl,
              borderRadius: radius.pill,
              borderWidth: 3,
              borderColor: ink.onGroundMuted,
            }}
          >
            <JText variant="bodyStrong" color={ink.onGroundMuted}>
              {t('verify.countHold')}
            </JText>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}
