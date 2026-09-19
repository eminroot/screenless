import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { colors, radii, shadow, spacing, tabular, type } from '../theme/tokens';

/**
 * The mark: four falling bars, the leading one coral.
 *
 * The same shape as the launcher icon, drawn rather than shipped as an image
 * so it takes the accent colour from the tokens and stays sharp at any size.
 * It earns its place on the sign-in screen: a wordmark sitting alone above a
 * sentence of grey explanation is the house style of software nobody designed.
 */
export function Mark({ height = 30 }: { height?: number }) {
  const unit = height / 30;
  const barWidth = 7 * unit;
  const gap = 4 * unit;
  const heights = [30, 23, 18, 11].map((value) => value * unit);
  const width = barWidth * 4 + gap * 3;

  return (
    <Svg width={width} height={height}>
      {heights.map((barHeight, index) => (
        <Rect
          key={index}
          x={index * (barWidth + gap)}
          y={height - barHeight}
          width={barWidth}
          height={barHeight}
          rx={barWidth / 2.6}
          fill={index === 0 ? colors.accent : colors.screen}
        />
      ))}
    </Svg>
  );
}

/**
 * The parts every screen is built from.
 *
 * One file rather than a folder, because there are eleven of them and none is
 * more than forty lines. The child app's kit is split up because it has
 * thirty components with real internals; this one does not.
 *
 * The house style in three rules:
 *
 * - Separate things with a hairline, not a border. One colour, one pixel.
 * - Colour means something. Coral is "look here", green is "this moved the
 *   right way", amber is "it did not". Nothing is tinted for decoration.
 * - Figures are tabular and set large. The whole app is read at arm's length
 *   by somebody who is doing something else.
 */

/* -------------------------------------------------------------------- text */

type TxtVariant = keyof typeof type;

export function Txt({
  variant = 'body',
  color = colors.ink,
  center,
  numbers,
  style,
  children,
  ...rest
}: {
  variant?: TxtVariant;
  color?: string;
  center?: boolean;
  /** Tabular figures, so a column of numbers does not jitter. */
  numbers?: boolean;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Text>, 'style' | 'children'>) {
  return (
    <Text
      {...rest}
      style={[
        type[variant],
        { color },
        center ? { textAlign: 'center' } : null,
        numbers ? tabular : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ screen */

export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: React.ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.xxl,
    paddingHorizontal: padded ? spacing.gutter : 0,
  };

  if (!scroll) {
    return <View style={[{ flex: 1, backgroundColor: colors.paper }, padding]}>{children}</View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={padding}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
}

/** A back chevron and a title. Omitted on the roots, which have no back. */
export function TopBar({ title, action }: { title?: string; action?: ReactNode }) {
  const router = useRouter();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 36,
        marginBottom: spacing.lg,
      }}
    >
      {router.canGoBack() ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          hitSlop={12}
          style={{ marginLeft: -4 }}
        >
          <Txt variant="title" color={colors.inkSoft}>
            {'‹'}
          </Txt>
        </Pressable>
      ) : null}
      {title ? (
        <Txt variant="heading" style={{ flex: 1 }}>
          {title}
        </Txt>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {action}
    </View>
  );
}

/* ------------------------------------------------------------------- cards */

export function Card({
  children,
  style,
  onPress,
  tone = 'card',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'card' | 'well';
}) {
  const body = (
    <View
      style={[
        {
          backgroundColor: tone === 'well' ? colors.well : colors.card,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.ruleSoft,
        },
        tone === 'card' ? shadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}

/** A small upper-case header above a group. */
export function Eyebrow({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt variant="eyebrow" color={colors.inkFaint} style={[{ marginBottom: spacing.sm }, style]}>
      {children}
    </Txt>
  );
}

export function Rule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.rule }, style]} />;
}

/* ----------------------------------------------------------------- buttons */

export function Button({
  label,
  onPress,
  tone = 'primary',
  size = 'lg',
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'quiet' | 'ghost' | 'danger';
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const height = size === 'lg' ? 52 : size === 'md' ? 44 : 36;
  const palette = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
    quiet: { bg: colors.card, fg: colors.ink, border: colors.rule },
    ghost: { bg: 'transparent', fg: colors.inkSoft, border: 'transparent' },
    danger: { bg: colors.card, fg: colors.bad, border: colors.rule },
  }[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radii.md,
          backgroundColor: palette.bg,
          borderWidth: 1,
          borderColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          // A disabled button fades, but only to the point where it is still
          // legible: a control nobody can read is a control nobody can fix.
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Txt
          variant={size === 'sm' ? 'label' : 'bodyStrong'}
          color={palette.fg}
          style={{ fontFamily: type.heading.fontFamily }}
        >
          {label}
        </Txt>
      )}
    </Pressable>
  );
}

/** A row of mutually exclusive choices. Used for ranges, ages and budgets. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: colors.well,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.ruleSoft,
          padding: 3,
          gap: 3,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 34,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.sm,
              // An unselected segment gets the page colour rather than a lower
              // opacity: fading it would put the well through the label.
              backgroundColor: on ? colors.card : 'transparent',
              borderWidth: 1,
              borderColor: on ? colors.rule : 'transparent',
            }}
          >
            <Txt
              variant="label"
              color={on ? colors.ink : colors.inkFaint}
              numbers
              numberOfLines={1}
            >
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A stack of choices, each with a line of explanation. */
export function OptionRow({
  title,
  body,
  selected,
  onPress,
}: {
  title: string;
  body?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radii.md,
        backgroundColor: selected ? colors.accentSoft : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.ruleSoft,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: selected ? 5 : 1.5,
          borderColor: selected ? colors.accent : colors.rule,
          backgroundColor: colors.card,
          marginTop: 2,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{title}</Txt>
        {body ? (
          <Txt variant="tiny" color={colors.inkSoft}>
            {body}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

export function Switch({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
    >
      <View
        style={{
          width: 46,
          height: 28,
          borderRadius: radii.pill,
          backgroundColor: value ? colors.accent : colors.rule,
          padding: 3,
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View
          style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.card }}
        />
      </View>
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ inputs */

export function Field({
  label,
  hint,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; hint?: string; error?: string | null }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Txt variant="label" color={colors.inkSoft}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor={colors.inkFaint}
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: error ? colors.bad : colors.rule,
            paddingHorizontal: spacing.lg,
            paddingVertical: Platform.OS === 'ios' ? 14 : 11,
            fontFamily: type.body.fontFamily,
            fontSize: 16,
            color: colors.ink,
          },
          style,
        ]}
      />
      {error ? (
        <Txt variant="tiny" color={colors.bad}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="tiny" color={colors.inkFaint}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ states */

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md }}>
      <ActivityIndicator color={colors.accent} />
      {label ? (
        <Txt variant="tiny" color={colors.inkFaint}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Card tone="well" style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <Txt variant="heading" center>
        {title}
      </Txt>
      {body ? (
        <Txt variant="body" color={colors.inkSoft} center>
          {body}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: spacing.md, alignSelf: 'stretch' }}>{action}</View> : null}
    </Card>
  );
}

/** A problem with what just happened, said once and not dwelt on. */
export function Notice({ text, tone = 'bad' }: { text: string; tone?: 'bad' | 'good' }) {
  return (
    <View
      style={{
        backgroundColor: tone === 'bad' ? colors.accentSoft : colors.goodSoft,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: tone === 'bad' ? colors.accent : colors.good,
        padding: spacing.md,
        marginBottom: spacing.lg,
      }}
    >
      <Txt variant="label" color={tone === 'bad' ? colors.accentInk : colors.good}>
        {text}
      </Txt>
    </View>
  );
}
