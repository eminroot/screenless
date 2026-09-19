import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { border, motionTeen, radius, space, type AccentName } from '../theme';
import { TText } from './TText';
import { useSkin } from '../skin';

/**
 * A figure with a label under it.
 *
 * No card, no border, no icon disc — just the number and the word, separated
 * by a rule from whatever sits beside it. The six to nine year olds get these
 * as badges with the object breaking the top edge, because at that age a
 * number needs a picture to be worth looking at. By twelve the number is the
 * point and the decoration is in the way.
 */
export function Stat({
  value,
  label,
  accent,
  icon,
  style,
}: {
  value: string | number;
  label: string;
  accent?: AccentName;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { ink, accents } = useSkin();
  return (
    <View accessible accessibilityLabel={`${value} ${label}`} style={[{ flex: 1, gap: 2 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon}
        <TText variant="stat" color={accent ? accents[accent].bright : ink.strong} numberOfLines={1}>
          {value}
        </TText>
      </View>
      <TText variant="label" color={ink.muted} numberOfLines={2}>
        {label}
      </TText>
    </View>
  );
}

/** Three stats in a row, with hairlines between them. */
export function StatRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'stretch', gap: space.lg }, style]}>
      {children}
    </View>
  );
}

/**
 * A progress bar. Two pixels of acid on a dark well — enough to read across a
 * room, thin enough that it never becomes the subject of the screen.
 */
export function Bar({
  value,
  accent = 'acid',
  height = 6,
  style,
  accessibilityLabel,
}: {
  /** 0 to 1. */
  value: number;
  accent?: AccentName;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { palette, accents } = useSkin();
  const filled = Math.max(0, Math.min(1, value));
  const width = useSharedValue(filled);

  useEffect(() => {
    width.value = withSpring(filled, motionTeen.soft);
  }, [filled, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: palette.sunken,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: radius.pill, backgroundColor: accents[accent].solid }, fill]}
      />
    </View>
  );
}

/**
 * The week as seven columns.
 *
 * A real chart rather than a row of coloured blocks: this age reads one, and
 * seeing a bad Tuesday next to a good Saturday is the whole argument the
 * screen is making.
 */
export function WeekStrip({
  days,
  goal,
  today,
  accent = 'acid',
  height = 108,
}: {
  days: { date: string; steps: number }[];
  goal: number;
  today: string;
  accent?: AccentName;
  height?: number;
}) {
  const { palette, ink, accents } = useSkin();
  const peak = Math.max(goal, ...days.map((d) => d.steps), 1);
  const tone = accents[accent];

  return (
    <View>
      {/* The goal, as a dashed line the columns are measured against. */}
      <View style={{ height, justifyContent: 'flex-end' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: (goal / peak) * height,
            height: border.hair,
            backgroundColor: palette.lineBright,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height }}>
          {days.map((day) => {
            const isToday = day.date === today;
            const hit = goal > 0 && day.steps >= goal;
            return (
              <View key={day.date} style={{ flex: 1, justifyContent: 'flex-end' }}>
                <View
                  style={{
                    // Always a sliver, so a blank day still reads as a day.
                    height: Math.max(3, (day.steps / peak) * height),
                    borderRadius: 3,
                    backgroundColor: hit ? tone.solid : isToday ? tone.wash : palette.sunken,
                    borderWidth: isToday && !hit ? border.hair : 0,
                    borderColor: tone.solid,
                  }}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
        {days.map((day) => (
          <TText
            key={day.date}
            variant="label"
            center
            color={day.date === today ? ink.strong : ink.muted}
            style={{ flex: 1 }}
          >
            {new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
          </TText>
        ))}
      </View>
    </View>
  );
}
