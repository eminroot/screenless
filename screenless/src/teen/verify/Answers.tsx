import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import type { CountAnswer, PickSpec, TaskCheck } from '../../state/types';
import { Button, Chip, IconButton } from '../components/Button';
import { Label, Panel } from '../components/Surface';
import { TText } from '../components/TText';
import { CheckIcon, CloseIcon } from '../icons';
import { useSkin } from '../skin';
import { border, MAX_COLUMN, radius, space } from '../theme';

/** One answer out of a few. Nothing here is marked right or wrong. */
export function ChoiceCard({
  check,
  value,
  onChange,
}: {
  check: TaskCheck;
  value: number | undefined;
  onChange: (index: number) => void;
}) {
  const { pick } = useI18n();
  return (
    <Panel>
      <TText variant="bodyStrong">{pick(check.question)}</TText>
      <View style={{ gap: space.sm, marginTop: space.md }}>
        {check.options.map((option, index) => (
          <Chip key={index} label={pick(option)} selected={value === index} onPress={() => onChange(index)} />
        ))}
      </View>
    </Panel>
  );
}

/** A list of what was actually done. */
export function PickCard({
  spec,
  value,
  onChange,
}: {
  spec: PickSpec;
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const { t, pick } = useI18n();
  const { ink, accents } = useSkin();
  const max = spec.max ?? spec.options.length;
  const enough = value.length >= spec.min;

  const toggle = (index: number) => {
    if (value.includes(index)) {
      onChange(value.filter((i) => i !== index));
      return;
    }
    if (value.length >= max) onChange(max === 1 ? [index] : [...value.slice(1), index]);
    else onChange([...value, index]);
  };

  return (
    <Panel>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <TText variant="bodyStrong" style={{ flex: 1 }}>
          {pick(spec.question)}
        </TText>
        <TText variant="label" color={enough ? accents.acid.bright : ink.muted}>
          {`${value.length}/${spec.min}`}
        </TText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
        {spec.options.map((option, index) => {
          const on = value.includes(index);
          return (
            <Chip
              key={index}
              label={pick(option)}
              selected={on}
              icon={on ? <CheckIcon size={14} color={accents.acid.on} /> : undefined}
              onPress={() => toggle(index)}
              style={{ flexGrow: 1, flexBasis: '45%' }}
            />
          );
        })}
      </View>
      <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
        {t('verify.pickAtLeast', { count: spec.min })}
      </TText>
    </Panel>
  );
}

/** A number they choose: minutes, a count, a target. */
export function CountCard({
  spec,
  value,
  onChange,
  step = 1,
}: {
  spec: CountAnswer;
  value: number | undefined;
  onChange: (next: number) => void;
  /** How much one press moves it. Minutes move in tens. */
  step?: number;
}) {
  const { pick } = useI18n();
  const { ink, palette } = useSkin();
  const shown = value ?? spec.min;

  return (
    <Panel>
      <TText variant="bodyStrong">{pick(spec.question)}</TText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: space.md,
        }}
      >
        <Step
          label="−"
          disabled={shown <= spec.min}
          onPress={() => onChange(Math.max(spec.min, shown - step))}
        />
        <TText variant="statBig" color={value === undefined ? ink.muted : ink.strong}>
          {value === undefined ? '–' : shown}
        </TText>
        <Step
          label="+"
          disabled={shown >= spec.max}
          onPress={() => onChange(value === undefined ? spec.min : Math.min(spec.max, shown + step))}
        />
      </View>
      <View style={{ height: border.hair, backgroundColor: palette.line, marginTop: space.md }} />
    </Panel>
  );
}

function Step({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { palette, ink } = useSkin();
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const latest = useRef(onPress);
  latest.current = onPress;

  const stop = () => {
    if (repeat.current) clearInterval(repeat.current);
    repeat.current = null;
  };
  useEffect(() => stop, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={10}
      onPress={() => {
        void Haptics.selectionAsync();
        latest.current();
      }}
      delayLongPress={350}
      onLongPress={() => {
        stop();
        repeat.current = setInterval(() => latest.current(), 80);
      }}
      onPressOut={stop}
      style={{
        width: 52,
        height: 52,
        borderRadius: radius.button,
        borderWidth: border.hair,
        borderColor: palette.line,
        backgroundColor: palette.sunken,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <TText variant="title" color={ink.strong}>
        {label}
      </TText>
    </Pressable>
  );
}

/**
 * The one place a grown up is asked for anything at this age: the challenges
 * that are genuinely risky, which in this library means a hot pan.
 */
export function GrownupCard({ done, onApproved }: { done: boolean; onApproved: () => void }) {
  const { t } = useI18n();
  const { ink, accents } = useSkin();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: space.xxl }}>
      <Label accent={done ? 'acid' : undefined}>{t('teenVerify.grownupLabel')}</Label>
      <Panel accent={done ? 'acid' : undefined}>
        <TText variant="body" color={done ? accents.acid.bright : ink.body}>
          {done ? t('verify.grownupDone') : t('teenVerify.grownupAsk')}
        </TText>
        {!done ? (
          <Button
            label={t('verify.grownupButton')}
            kind="outline"
            size="md"
            style={{ marginTop: space.lg }}
            onPress={() => setOpen(true)}
          />
        ) : null}
      </Panel>
      <CodeSheet open={open} onClose={() => setOpen(false)} onApproved={onApproved} />
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function CodeSheet({
  open,
  onClose,
  onApproved,
}: {
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}) {
  const { t } = useI18n();
  const { palette, ink, accents } = useSkin();
  const { data } = useApp();
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (!open) {
      setValue('');
      setWrong(false);
    }
  }, [open]);

  const press = (key: string) => {
    void Haptics.selectionAsync();
    if (key === 'del') {
      setValue((v) => v.slice(0, -1));
      return;
    }
    const next = (value + key).slice(0, 4);
    setValue(next);
    setWrong(false);
    if (next.length === 4) {
      if (next === data.settings.parentPin) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onApproved();
        onClose();
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setWrong(true);
      }
      setValue('');
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable>
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: radius.panel,
                borderTopRightRadius: radius.panel,
                borderTopWidth: border.hair,
                borderColor: palette.line,
                padding: space.xl,
                paddingBottom: space.xxxl,
              }}
            >
              <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <TText variant="title">{t('verify.grownupTitle')}</TText>
                    <TText variant="caption" color={ink.muted}>
                      {t('pin.unlockSubtitle')}
                    </TText>
                  </View>
                  <IconButton
                    icon={<CloseIcon size={18} />}
                    kind="outline"
                    size={40}
                    accessibilityLabel={t('common.close')}
                    onPress={onClose}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.md }}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        borderWidth: border.hair,
                        borderColor: palette.lineBright,
                        backgroundColor: i < value.length ? accents.acid.solid : 'transparent',
                      }}
                    />
                  ))}
                </View>
                {wrong ? (
                  <TText variant="caption" color={accents.coral.bright} center>
                    {t('pin.wrong')}
                  </TText>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
                  {KEYS.map((key, index) =>
                    key === '' ? (
                      <View key={index} style={{ width: '30%' }} />
                    ) : (
                      <Pressable
                        key={index}
                        accessibilityRole="button"
                        accessibilityLabel={key === 'del' ? t('common.back') : key}
                        onPress={() => press(key)}
                        style={{ width: '30%' }}
                      >
                        <View
                          style={{
                            height: 54,
                            borderRadius: radius.button,
                            borderWidth: border.hair,
                            borderColor: palette.line,
                            backgroundColor: palette.sunken,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <TText variant="title">{key === 'del' ? '⌫' : key}</TText>
                        </View>
                      </Pressable>
                    ),
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
