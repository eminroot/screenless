import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { useI18n } from '../../i18n';
import type { BuddyId, ItemId } from '../../state/types';
import { JText } from '../components/JText';
import { Bar } from '../components/Stat';
import { Card, IconTile, Stamp } from '../components/Surface';
import { MoonIcon } from '../icons';
import { accents, ink, space } from '../theme';

function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Screen free time, as a card on the mission.
 *
 * The phone counts only while it lies flat and nobody touches it, which is the
 * one honest meaning "time away from the screen" can have on a phone with no
 * special permissions. The number goes up while the child is off doing the
 * mission; when they come back and pick it up, it is there waiting.
 */
export function PutDownCard({
  seconds,
  targetMinutes,
  started,
  supported,
  orPhoto,
}: {
  seconds: number;
  targetMinutes: number;
  started: boolean;
  supported: boolean | null;
  /** The mission also accepts a photo instead. */
  orPhoto: boolean;
}) {
  const { t } = useI18n();
  const target = targetMinutes * 60;
  const done = seconds >= target;

  const line =
    supported === false
      ? t('verify.phoneDownNoSensor')
      : done
        ? t('verify.phoneDownDone')
        : started
          ? t('verify.phoneDownAsk')
          : t('verify.phoneDownIdle');

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="violet">{t('verify.phoneDownStamp')}</Stamp>
      <Card accent={done ? 'green' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile accent={done ? 'green' : 'violet'} size={52}>
            <MoonIcon size={28} />
          </IconTile>
          <View style={{ flex: 1 }}>
            <JText variant="stat" color={done ? accents.green.base : ink.strong}>
              {clock(seconds)}
              <JText variant="heading" color={ink.muted}>
                {'  '}
                {t('verify.ofMinutes', { count: targetMinutes })}
              </JText>
            </JText>
            <JText variant="small" color={ink.muted}>
              {line}
            </JText>
          </View>
        </View>
        {supported !== false ? (
          <Bar value={seconds / target} accent={done ? 'green' : 'violet'} style={{ marginTop: space.md }} />
        ) : null}
        {orPhoto && !done ? (
          <JText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
            {t('verify.phoneDownOrPhoto')}
          </JText>
        ) : null}
      </Card>
    </View>
  );
}

/**
 * What the screen shows while the phone lies face down: the buddy asleep on a
 * black screen. Black because the screen has to stay on for the sensor to keep
 * reporting, and a black screen costs almost nothing. A touch wakes it.
 */
export function ParkedOverlay({
  visible,
  seconds,
  buddyId,
  wearing,
  onWake,
}: {
  visible: boolean;
  seconds: number;
  buddyId: BuddyId;
  wearing: ItemId[];
  onWake: () => void;
}) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (!visible || reduced) return;
    drift.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [visible, reduced, drift]);

  const zzz = useAnimatedStyle(() => ({
    opacity: 0.35 + drift.value * 0.5,
    transform: [{ translateY: -drift.value * 10 }],
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onWake} statusBarTranslucent>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('verify.sleeping')}
        onPress={() => {
          void Haptics.selectionAsync();
          onWake();
        }}
        style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center', gap: space.lg }}
      >
        <Animated.View style={zzz}>
          <JText variant="banner" color="#5E6699">
            z z z
          </JText>
        </Animated.View>
        <View style={{ opacity: 0.55 }}>
          <Buddy id={buddyId} size={150} mood="sleepy" wearing={wearing} still />
        </View>
        <JText variant="statBig" color="#8A93C8">
          {clock(seconds)}
        </JText>
        <View style={{ alignItems: 'center', gap: 2, paddingHorizontal: space.xl }}>
          <JText variant="heading" color="#8A93C8" center>
            {t('verify.sleeping')}
          </JText>
          <JText variant="body" color="#5E6699" center>
            {t('verify.sleepingBody')}
          </JText>
        </View>
      </Pressable>
    </Modal>
  );
}
