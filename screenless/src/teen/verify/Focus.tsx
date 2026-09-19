import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { Bar } from '../components/Stat';
import { Label, Panel } from '../components/Surface';
import { TText } from '../components/TText';
import { useSkin } from '../skin';
import { space } from '../theme';

function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

/**
 * Screen free time, the 10-14 version.
 *
 * Same measurement as the tiers below (the phone flat and untouched), framed
 * as a focus block rather than as a buddy having a nap: the number is the
 * subject, there is no mascot, and nothing congratulates anybody halfway
 * through. What it buys is the difference between "I studied for twenty
 * minutes" and twenty minutes the phone can stand behind.
 */
export function FocusCard({
  seconds,
  targetMinutes,
  started,
  supported,
  label,
}: {
  seconds: number;
  targetMinutes: number;
  started: boolean;
  supported: boolean | null;
  /** Section heading: focus block, or plain screen free time. */
  label: string;
}) {
  const { t } = useI18n();
  const { ink, accents } = useSkin();
  const target = targetMinutes * 60;
  const done = seconds >= target;

  return (
    <View style={{ marginTop: space.xxl }}>
      <Label
        accent={done ? 'acid' : undefined}
        trailing={
          <TText variant="label" color={done ? accents.acid.bright : ink.muted}>
            {`${Math.floor(seconds / 60)}/${targetMinutes}`}
          </TText>
        }
      >
        {label}
      </Label>
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
          <TText variant="statBig" color={done ? accents.acid.bright : ink.strong}>
            {clock(seconds)}
          </TText>
          <TText variant="label" color={ink.muted} style={{ paddingBottom: space.sm }}>
            {t('verify.ofMinutes', { count: targetMinutes })}
          </TText>
        </View>
        <Bar value={seconds / target} accent={done ? 'acid' : 'sky'} style={{ marginTop: space.md }} />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {supported === false
            ? t('teenVerify.focusNoSensor')
            : done
              ? t('teenVerify.focusDone')
              : started
                ? t('teenVerify.focusAsk')
                : t('teenVerify.focusIdle')}
        </TText>
      </Panel>
    </View>
  );
}

/**
 * The screen while the phone is face down: the time, and nothing else.
 *
 * It has to stay lit for the sensor to keep reporting, so it is as close to
 * off as a lit screen gets. A tap ends it, because at this age being trapped
 * in a full screen countdown you did not ask for is its own annoyance.
 */
export function FocusOverlay({
  visible,
  seconds,
  targetMinutes,
  onWake,
}: {
  visible: boolean;
  seconds: number;
  targetMinutes: number;
  onWake: () => void;
}) {
  const { t } = useI18n();
  const { accents } = useSkin();
  const done = seconds >= targetMinutes * 60;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onWake} statusBarTranslucent>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('teenVerify.focusRunning')}
        onPress={() => {
          void Haptics.selectionAsync();
          onWake();
        }}
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
        }}
      >
        <TText variant="statBig" color={done ? accents.acid.bright : '#4C5764'} style={{ fontSize: 76 }}>
          {clock(seconds)}
        </TText>
        <TText variant="label" color="#39424E">
          {done ? t('teenVerify.focusDone') : t('teenVerify.focusRunning')}
        </TText>
      </Pressable>
    </Modal>
  );
}
