import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { Day, Weekday } from '../api/types';
import { useI18n } from '../i18n';
import {
  dayOfMonth,
  describeChange,
  formatSpan,
  niceMax,
  splitSpan,
  weekdayShort,
} from '../lib/format';
import { colors, radii, spacing, type } from '../theme/tokens';
import { Txt } from './ui';

/**
 * The charts.
 *
 * Hand-drawn in `react-native-svg` rather than pulled from a library, for the
 * same reason the child app draws its own buddies: a charting library gives
 * you gridlines, tooltips, legends and animation, and every one of those is a
 * thing to switch off before this reads properly. What is actually needed is
 * about sixty lines of rectangles.
 *
 * ## The rule every chart here obeys
 *
 * **A day the phone did not report is not a zero.** It is drawn as a faint
 * tick on the baseline, visibly different from a bar of no height. This is the
 * single most important thing in the file. A parent whose child's phone was
 * off for three days must not see three excellent days, and an app that draws
 * absence as success cannot be trusted about anything else.
 */

/** Bars are rounded by this much. Small enough to still read as a bar. */
const BAR_RADIUS = 3;

/* ----------------------------------------------------------- the big tiles */

/**
 * One headline figure with its trend.
 *
 * `lowerIsBetter` is not cosmetic: screen time falling is good news and active
 * minutes falling is not, and the same green arrow for both would be a lie
 * told in colour.
 */
export function StatTile({
  label,
  value,
  unit,
  change,
  lowerIsBetter = false,
  footnote,
}: {
  label: string;
  value: string;
  unit?: string;
  change?: number | null;
  lowerIsBetter?: boolean;
  footnote?: string;
}) {
  const { t } = useI18n();
  const moved = describeChange(change ?? null, lowerIsBetter);

  const tint =
    moved === null || moved.good === null
      ? colors.inkFaint
      : moved.good
        ? colors.good
        : colors.warn;

  const arrow = moved === null ? '' : moved.direction === 'up' ? '↑' : moved.direction === 'down' ? '↓' : '';

  return (
    <View style={{ flex: 1, minWidth: 140, gap: 2 }}>
      <Txt variant="eyebrow" color={colors.inkFaint} style={{ marginBottom: spacing.xs }}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
        <Txt variant="title" numbers>
          {value}
        </Txt>
        {unit ? (
          <Txt variant="label" color={colors.inkFaint}>
            {unit}
          </Txt>
        ) : null}
      </View>
      {moved ? (
        <Txt variant="tiny" color={tint} numbers>
          {arrow ? `${arrow} ` : ''}
          {moved.direction === 'flat'
            ? t('dash.flat')
            : moved.direction === 'up'
              ? t('dash.up', { percent: moved.percent })
              : t('dash.down', { percent: moved.percent })}
        </Txt>
      ) : footnote ? (
        <Txt variant="tiny" color={colors.inkFaint}>
          {footnote}
        </Txt>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------- daily chart */

/**
 * Screen time day by day, with the limit drawn behind it.
 *
 * Labels thin out as the range grows: every day for a week, every fifth for a
 * month. Crowded axis labels are worse than none, because a parent reads the
 * shape first and only then looks for a date.
 */
export function DayBars({
  days,
  budgetMin,
  width,
  height = 148,
}: {
  days: Day[];
  /** The daily limit, in minutes, or 0 when none is set. */
  budgetMin: number;
  width: number;
  height?: number;
}) {
  const { language } = useI18n();
  const axis = 18;
  const plot = height - axis;

  const minutes = days.map((day) => (day.reported ? day.screenSec / 60 : 0));
  // The limit is part of the scale, so a day that went over still fits under
  // the line rather than being clipped by it.
  const top = niceMax([...minutes, budgetMin > 0 ? budgetMin * 1.1 : 0], 30);

  const slot = width / Math.max(1, days.length);
  const barWidth = Math.max(3, Math.min(22, slot * 0.62));
  const every = days.length <= 8 ? 1 : days.length <= 16 ? 2 : 5;

  const limitY = budgetMin > 0 ? plot - (budgetMin / top) * plot : null;

  return (
    <Svg width={width} height={height}>
      {/* The limit, behind everything, as a hairline rather than a warning. */}
      {limitY !== null ? (
        <G>
          <Line
            x1={0}
            y1={limitY}
            x2={width}
            y2={limitY}
            stroke={colors.accent}
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.7}
          />
          <SvgText
            x={width}
            y={Math.max(9, limitY - 4)}
            fill={colors.accent}
            fontSize={10}
            fontFamily={type.label.fontFamily}
            textAnchor="end"
          >
            {formatSpan(budgetMin * 60)}
          </SvgText>
        </G>
      ) : null}

      <Line x1={0} y1={plot} x2={width} y2={plot} stroke={colors.rule} strokeWidth={1} />

      {days.map((day, index) => {
        const x = index * slot + (slot - barWidth) / 2;

        if (!day.reported) {
          // Absence, drawn as absence. A stub on the baseline, not a zero bar.
          return (
            <Rect
              key={day.date}
              x={x}
              y={plot - 3}
              width={barWidth}
              height={3}
              rx={1}
              fill={colors.gap}
            />
          );
        }

        const value = day.screenSec / 60;
        const barHeight = Math.max(2, (value / top) * plot);
        return (
          <G key={day.date}>
            <Rect
              x={x}
              y={plot - barHeight}
              width={barWidth}
              height={barHeight}
              rx={BAR_RADIUS}
              fill={day.overLimit ? colors.accent : colors.screen}
              opacity={day.overLimit ? 0.9 : 0.85}
            />
            {/* A mission that day, marked on top of its own bar. Nothing is
                drawn when there were none, so the row reads as a rhythm. */}
            {day.missionsDone > 0 ? (
              <Circle
                cx={x + barWidth / 2}
                cy={plot - barHeight - 6}
                r={2.5}
                fill={colors.active}
              />
            ) : null}
          </G>
        );
      })}

      {days.map((day, index) =>
        index % every === 0 ? (
          <SvgText
            key={`label-${day.date}`}
            x={index * slot + slot / 2}
            y={height - 5}
            fill={colors.inkFaint}
            fontSize={10}
            fontFamily={type.tiny.fontFamily}
            textAnchor="middle"
          >
            {days.length <= 8 ? weekdayShort(weekdayIndex(day.date), language) : dayOfMonth(day.date)}
          </SvgText>
        ) : null,
      )}
    </Svg>
  );
}

function weekdayIndex(dayKey: string): number {
  return (new Date(dayKey + 'T00:00:00Z').getUTCDay() + 6) % 7;
}

/* ----------------------------------------------------------- weekday chart */

/**
 * Average screen time by day of the week, Monday first.
 *
 * The most useful chart on the page. Almost every family finds one or two days
 * carrying most of the problem, and those are the days a rule can be set on.
 * The heaviest is picked out in coral; the rest stay quiet so it stands out.
 */
export function WeekdayBars({
  weekdays,
  width,
  height = 132,
}: {
  weekdays: Weekday[];
  width: number;
  height?: number;
}) {
  const { language } = useI18n();
  const axis = 18;
  const plot = height - axis;

  const minutes = weekdays.map((entry) => entry.screenSec / 60);
  const top = niceMax(minutes, 30);
  const heaviest = minutes.reduce(
    (best, value, index) => (value > minutes[best] ? index : best),
    0,
  );
  const anyData = minutes.some((value) => value > 0);

  const slot = width / 7;
  const barWidth = Math.min(30, slot * 0.6);

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={plot} x2={width} y2={plot} stroke={colors.rule} strokeWidth={1} />
      {weekdays.map((entry, index) => {
        const x = index * slot + (slot - barWidth) / 2;
        const value = entry.screenSec / 60;

        if (entry.days === 0) {
          return (
            <Rect key={index} x={x} y={plot - 3} width={barWidth} height={3} rx={1} fill={colors.gap} />
          );
        }

        const barHeight = Math.max(2, (value / top) * plot);
        const lead = anyData && index === heaviest;
        return (
          <G key={index}>
            <Rect
              x={x}
              y={plot - barHeight}
              width={barWidth}
              height={barHeight}
              rx={BAR_RADIUS}
              fill={lead ? colors.accent : colors.screen}
              opacity={lead ? 0.92 : 0.28}
            />
            <SvgText
              x={index * slot + slot / 2}
              y={Math.max(10, plot - barHeight - 5)}
              fill={lead ? colors.accent : colors.inkFaint}
              fontSize={10}
              fontFamily={type.label.fontFamily}
              textAnchor="middle"
            >
              {formatSpan(entry.screenSec)}
            </SvgText>
          </G>
        );
      })}
      {weekdays.map((_, index) => (
        <SvgText
          key={`d${index}`}
          x={index * slot + slot / 2}
          y={height - 5}
          fill={colors.inkFaint}
          fontSize={10}
          fontFamily={type.tiny.fontFamily}
          textAnchor="middle"
        >
          {weekdayShort(index, language)}
        </SvgText>
      ))}
    </Svg>
  );
}

/* ------------------------------------------------------------ the week strip */

/**
 * Seven days, thumbnail sized, for a child's card on the list.
 *
 * No axis, no numbers, no limit line. It answers one question from across a
 * room: is this week shaped like the last one.
 */
export function MiniWeek({ days, width, height = 34 }: { days: Day[]; width: number; height?: number }) {
  const minutes = days.map((day) => (day.reported ? day.screenSec / 60 : 0));
  const top = niceMax(minutes, 30);
  const slot = width / Math.max(1, days.length);
  const barWidth = Math.max(4, slot * 0.55);

  return (
    <Svg width={width} height={height}>
      {days.map((day, index) => {
        const x = index * slot + (slot - barWidth) / 2;
        if (!day.reported) {
          return (
            <Rect key={day.date} x={x} y={height - 2} width={barWidth} height={2} rx={1} fill={colors.gap} />
          );
        }
        const barHeight = Math.max(2, ((day.screenSec / 60) / top) * height);
        return (
          <Rect
            key={day.date}
            x={x}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={2}
            fill={day.overLimit ? colors.accent : colors.screen}
            opacity={day.overLimit ? 0.85 : 0.35}
          />
        );
      })}
    </Svg>
  );
}

/* -------------------------------------------------------------- categories */

/**
 * What the child actually chose, as one bar in five parts.
 *
 * A pie chart would be the obvious thing and it would be worse: five slices at
 * this size cannot be compared by eye, and the interesting fact is almost
 * always "three quarters of this is one category", which a single bar shows at
 * a glance.
 */
export function CategoryBar({
  counts,
  width,
  height = 14,
}: {
  counts: { key: string; value: number; color: string }[];
  width: number;
  height?: number;
}) {
  const total = counts.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) {
    return (
      <View
        style={{ height, borderRadius: height / 2, backgroundColor: colors.gap, width: '100%' }}
      />
    );
  }

  let x = 0;
  return (
    <Svg width={width} height={height}>
      {counts.map((entry) => {
        if (entry.value <= 0) return null;
        const segment = (entry.value / total) * width;
        const rect = (
          <Rect
            key={entry.key}
            x={x}
            y={0}
            width={Math.max(2, segment - 1.5)}
            height={height}
            rx={height / 2}
            fill={entry.color}
          />
        );
        x += segment;
        return rect;
      })}
    </Svg>
  );
}

/* ------------------------------------------------------------------- rings */

/**
 * One percentage as a ring.
 *
 * Used twice: the share of time spent off the screen, and the share of
 * reminders that led somewhere. Both are fractions of a whole with no useful
 * history, which is the only thing a ring is better at than a bar.
 */
export function Ring({
  percent,
  size = 84,
  stroke = 9,
  color = colors.good,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.max(0, Math.min(100, percent)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.ruleSoft}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * filled} ${circumference}`}
            fill="none"
          />
        </G>
      </Svg>
      <Txt variant="heading" numbers>
        {Math.round(percent)}%
      </Txt>
      {label ? (
        <Txt variant="tiny" color={colors.inkFaint}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

/** A key for whatever a chart above it just drew. */
export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{ width: 9, height: 9, borderRadius: radii.pill, backgroundColor: item.color }}
          />
          <Txt variant="tiny" color={colors.inkSoft}>
            {item.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/** Re-exported so a screen can size a number without importing the lib twice. */
export { splitSpan };
