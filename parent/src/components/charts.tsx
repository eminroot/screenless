import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import type { Day, Weekday } from '../api/types';
import { useI18n } from '../i18n';
import {
  dayOfMonth,
  describeChange,
  formatSpan,
  monthShort,
  niceMax,
  splitSpan,
  startsMonth,
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

/**
 * Corner radius that cannot eat the bar.
 *
 * A flat 3px radius on a 5px bar is a lozenge, not a bar, and ninety days in
 * a phone-width card gives bars about that wide. The radius has to be capped
 * at half the width or the whole chart turns into a row of pills.
 */
function barRadius(barWidth: number): number {
  return Math.min(BAR_RADIUS, barWidth / 2);
}

/**
 * Room at the left and right edge for the labels that sit there.
 *
 * Without it the first axis label is centred on the first bar and loses its
 * leading digit off the edge of the canvas, and the limit label anchored to
 * the right edge loses its last letter. Both were clipped.
 */
const EDGE = 12;

/** The width one bar gets, given how many of them have to fit. */
function barWidthFor(dayCount: number, width: number): number {
  const slot = Math.max(1, width - EDGE * 2) / Math.max(1, dayCount);
  return Math.max(2, Math.min(22, slot * 0.62));
}

/**
 * Whether `DayBars` will have room to mark missions at this size.
 *
 * Exported so the legend beside the chart can agree with it. A legend naming a
 * series the chart decided not to draw is its own small lie.
 */
export function dayBarsMarkMissions(dayCount: number, width: number): boolean {
  return barWidthFor(dayCount, width) >= 8;
}

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

  // The plot is inset so the labels pinned to either edge have somewhere to go.
  const plotWidth = Math.max(1, width - EDGE * 2);
  const slot = plotWidth / Math.max(1, days.length);
  const barWidth = barWidthFor(days.length, width);
  const every = days.length <= 8 ? 1 : days.length <= 16 ? 2 : 5;

  // Past a month the axis names months rather than repeating day numbers that
  // belong to three different ones.
  const byMonth = days.length > 31;

  // A mission marker only earns its place on a bar wide enough to hold it.
  // Below that it is a smudge sitting above a 4px bar, and ninety of them read
  // as a scatter plot of a quantity that was never drawn.
  const showMissions = dayBarsMarkMissions(days.length, width);

  const limitY = budgetMin > 0 ? plot - (budgetMin / top) * plot : null;

  return (
    <Svg width={width} height={height}>
      {/* The limit, behind everything, as a hairline rather than a warning. */}
      {limitY !== null ? (
        <G>
          <Line
            x1={EDGE}
            y1={limitY}
            x2={width - EDGE}
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

      <Line x1={EDGE} y1={plot} x2={width - EDGE} y2={plot} stroke={colors.rule} strokeWidth={1} />

      {days.map((day, index) => {
        const x = EDGE + index * slot + (slot - barWidth) / 2;

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
              rx={barRadius(barWidth)}
              fill={day.overLimit ? colors.accent : colors.screen}
              opacity={day.overLimit ? 0.9 : 0.85}
            />
            {/* A mission that day, marked *on* its own bar rather than floating
                above it. Hovering the mark in open space put it inside the plot,
                where its height reads as a value — and its height is nothing but
                "six pixels clear of this bar". Sitting it just inside the cap
                says what it means: something happened on this day. */}
            {showMissions && day.missionsDone > 0 && barHeight > 12 ? (
              <Circle
                cx={x + barWidth / 2}
                cy={plot - barHeight + 6}
                r={2.5}
                fill={colors.paper}
                opacity={0.95}
              />
            ) : null}
          </G>
        );
      })}

      {days.map((day, index) => {
        // Months are labelled where they start; days on a fixed stride.
        const show = byMonth ? startsMonth(day.date) : index % every === 0;
        if (!show) return null;
        return (
          <SvgText
            key={`label-${day.date}`}
            x={EDGE + index * slot + slot / 2}
            y={height - 5}
            fill={colors.inkFaint}
            fontSize={10}
            fontFamily={type.tiny.fontFamily}
            textAnchor="middle"
          >
            {byMonth
              ? monthShort(day.date, language)
              : days.length <= 8
                ? weekdayShort(weekdayIndex(day.date), language)
                : dayOfMonth(day.date)}
          </SvgText>
        );
      })}
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
        {/* Started at twelve o'clock. `rotation` + `origin` would be the
            react-native-svg way and it emits an invalid `transform-origin`
            DOM attribute on web; a plain SVG transform works on both. */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
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

/**
 * A key for whatever a chart above it just drew.
 *
 * `dot` draws a smaller disc inside the swatch, for a series the chart marks
 * *on* something else rather than drawing in its own right — the mission mark
 * sits inside the cap of a screen-time bar, and a plain swatch would name a
 * colour that appears nowhere on the chart.
 */
export function Legend({
  items,
}: {
  items: { color: string; label: string; dot?: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 9,
              height: 9,
              borderRadius: radii.pill,
              backgroundColor: item.color,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.dot ? (
              <View
                style={{ width: 4, height: 4, borderRadius: radii.pill, backgroundColor: item.dot }}
              />
            ) : null}
          </View>
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
