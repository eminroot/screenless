import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { correctWays } from '../../engine/verify';
import { useI18n } from '../../i18n';
import type { CountAnswer, PickSpec, SumsAnswer, TaskCheck } from '../../state/types';
import { Chip } from '../components/Button';
import { JText } from '../components/JText';
import { Card, Shadow } from '../components/Surface';
import { CheckIcon, MinusIcon, PlusIcon } from '../icons';
import { accents, border, drop, ink, palette, radius, space } from '../theme';

/**
 * The questions at the end of a 6-9 mission.
 *
 * Every one is a small, fixed set of choices or a number, never a text box:
 * limited choice is the brief for this age, and a typed answer from a six year
 * old is a spelling test rather than a record of what they did. None of them
 * is marked wrong. A sum that does not make ten is shown as what it does make,
 * so the child can fix it if they want, and counts as a real attempt either way.
 */

/** One option out of a few, from `task.check`. */
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
    <Card>
      <JText variant="heading">{pick(check.question)}</JText>
      <View style={{ gap: space.sm, marginTop: space.md }}>
        {check.options.map((option, index) => (
          <Chip
            key={index}
            label={pick(option)}
            selected={value === index}
            accent="blue"
            onPress={() => onChange(index)}
          />
        ))}
      </View>
    </Card>
  );
}

/** A ticked list: what they did, which shapes they found, which moves. */
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
  const max = spec.max ?? spec.options.length;
  const full = value.length >= max;

  const toggle = (index: number) => {
    if (value.includes(index)) {
      onChange(value.filter((i) => i !== index));
      return;
    }
    // Exactly-three lists swap out the oldest pick rather than refusing a tap.
    if (full) onChange(max === 1 ? [index] : [...value.slice(1), index]);
    else onChange([...value, index]);
  };

  const hint =
    spec.max !== undefined && spec.max === spec.min
      ? t('verify.pickExactly', { count: spec.min })
      : t('verify.pickAtLeast', { count: spec.min });

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <JText variant="heading" style={{ flex: 1 }}>
          {pick(spec.question)}
        </JText>
        <JText variant="caption" color={value.length >= spec.min ? accents.green.base : ink.muted}>
          {t('verify.pickCount', { count: value.length })}
        </JText>
      </View>
      <JText variant="small" color={ink.muted} style={{ marginTop: 2 }}>
        {hint}
      </JText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
        {spec.options.map((option, index) => {
          const on = value.includes(index);
          return (
            <Chip
              key={index}
              label={pick(option)}
              selected={on}
              accent="green"
              icon={on ? <CheckIcon size={18} color={accents.green.on} /> : undefined}
              onPress={() => toggle(index)}
              style={{ flexGrow: 1, flexBasis: '45%' }}
            />
          );
        })}
      </View>
    </Card>
  );
}

/** A number, stepped with two fat buttons. Holding one runs it faster. */
export function CountCard({
  spec,
  value,
  onChange,
}: {
  spec: CountAnswer;
  value: number | undefined;
  onChange: (next: number) => void;
}) {
  const { pick } = useI18n();
  const shown = value ?? spec.min;
  const reachedGoal = spec.goal === undefined || shown >= spec.goal;

  return (
    <Card>
      <JText variant="heading">{pick(spec.question)}</JText>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl, marginTop: space.md }}>
        <Stepper sign="minus" disabled={shown <= spec.min} onStep={() => onChange(Math.max(spec.min, shown - 1))} />
        <View style={{ minWidth: 96, alignItems: 'center' }}>
          <JText
            variant="statBig"
            color={value === undefined ? ink.muted : reachedGoal ? ink.strong : accents.flame.base}
          >
            {value === undefined ? '?' : shown}
          </JText>
        </View>
        <Stepper
          sign="plus"
          disabled={shown >= spec.max}
          onStep={() => onChange(value === undefined ? Math.max(spec.min, 1) : Math.min(spec.max, shown + 1))}
        />
      </View>
    </Card>
  );
}

/** Ways of making a number, each as two piles. */
export function SumsCard({
  spec,
  value,
  onChange,
}: {
  spec: SumsAnswer;
  value: (number[] | null)[];
  onChange: (next: (number[] | null)[]) => void;
}) {
  const { t, pick } = useI18n();
  const rows = Array.from({ length: spec.ways }, (_, i) => value[i] ?? null);

  const setPart = (row: number, part: 0 | 1, delta: number) => {
    const next = rows.map((r) => (r ? [...r] : null));
    const current = next[row] ?? [0, 0];
    current[part] = Math.max(0, Math.min(spec.target, current[part] + delta));
    next[row] = current;
    onChange(next);
  };

  return (
    <Card>
      <JText variant="heading">{pick(spec.question)}</JText>
      <View style={{ gap: space.md, marginTop: space.md }}>
        {rows.map((row, index) => {
          const parts = row ?? [0, 0];
          const total = parts[0] + parts[1];
          const earlier = rows.slice(0, index).filter((r): r is number[] => Boolean(r));
          const repeat =
            row !== null &&
            total === spec.target &&
            correctWays(spec.target, [...earlier, parts]) === correctWays(spec.target, earlier);
          const right = row !== null && total === spec.target && !repeat;
          return (
            <View
              key={index}
              style={{
                padding: space.sm,
                borderRadius: radius.chip,
                backgroundColor: right ? accents.green.tint : palette.sunken,
                gap: space.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Part value={row ? parts[0] : null} onMinus={() => setPart(index, 0, -1)} onPlus={() => setPart(index, 0, 1)} />
                <JText variant="title" color={ink.muted}>
                  +
                </JText>
                <Part value={row ? parts[1] : null} onMinus={() => setPart(index, 1, -1)} onPlus={() => setPart(index, 1, 1)} />
              </View>
              {row ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs }}>
                  {right ? <CheckIcon size={18} color={accents.green.base} /> : null}
                  <JText variant="caption" color={right ? accents.green.base : ink.muted}>
                    {repeat ? t('verify.sumsSame') : t('verify.sumsMakes', { total })}
                  </JText>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function Part({ value, onMinus, onPlus }: { value: number | null; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <Stepper sign="minus" small disabled={value === null || value <= 0} onStep={onMinus} />
      <JText variant="stat" style={{ minWidth: 40, textAlign: 'center' }} color={value === null ? ink.muted : ink.strong}>
        {value === null ? '?' : value}
      </JText>
      <Stepper sign="plus" small onStep={onPlus} />
    </View>
  );
}

function Stepper({
  sign,
  onStep,
  disabled = false,
  small = false,
}: {
  sign: 'plus' | 'minus';
  onStep: () => void;
  disabled?: boolean;
  small?: boolean;
}) {
  const size = small ? 44 : 56;
  const repeat = useRef<ReturnType<typeof setInterval> | null>(null);
  const step = useRef(onStep);
  step.current = onStep;

  const stop = () => {
    if (repeat.current) clearInterval(repeat.current);
    repeat.current = null;
  };
  useEffect(() => stop, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sign === 'plus' ? '+' : '-'}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        void Haptics.selectionAsync();
        step.current();
      }}
      delayLongPress={350}
      onLongPress={() => {
        stop();
        repeat.current = setInterval(() => step.current(), 90);
      }}
      onPressOut={stop}
    >
      <View style={{ paddingRight: drop.sm, paddingBottom: drop.sm, opacity: disabled ? 0.4 : 1 }}>
        <Shadow depth={drop.sm} radius={size / 2} />
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: border.ink,
            borderColor: palette.ink,
            backgroundColor: sign === 'plus' ? accents.green.solid : palette.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {sign === 'plus' ? <PlusIcon size={small ? 18 : 24} /> : <MinusIcon size={small ? 18 : 24} />}
        </View>
      </View>
    </Pressable>
  );
}
