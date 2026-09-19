import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { accents, border, drop, ink, motionJunior, palette, radius, space, type AccentName } from '../theme';
import { JText } from './JText';

/**
 * One figure on a badge of its own: stars, days in a row, coins, best day.
 *
 * A row of three of these is how a result gets reported at this age. The tier
 * below shows one enormous number because that is all a three year old can
 * take in; a seven year old wants the ledger, and a number they can watch go
 * up is most of why they come back.
 *
 * Built like a badge rather than a tile: the object sits in a coloured disc
 * that breaks the top edge of the card, the way a sticker sits proud of the
 * thing it is stuck to.
 */
export function StatCard({
  icon,
  value,
  label,
  accent = 'amber',
  style,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  accent?: AccentName;
  style?: StyleProp<ViewStyle>;
}) {
  const tone = accents[accent];
  const depth = drop.sm;

  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[{ flex: 1, paddingRight: depth, paddingBottom: depth, paddingTop: 14 }, style]}
    >
      <View
        style={{
          position: 'absolute',
          left: depth,
          top: 14 + depth,
          right: 0,
          bottom: 0,
          borderRadius: radius.card,
          backgroundColor: palette.ink,
        }}
      />
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: radius.card,
          borderWidth: border.ink,
          borderColor: palette.ink,
          paddingTop: 20,
          paddingBottom: space.md,
          paddingHorizontal: space.sm,
          alignItems: 'center',
          gap: 2,
        }}
      >
        <JText variant="stat" color={ink.strong} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </JText>
        <JText variant="caption" color={ink.muted} center numberOfLines={2}>
          {label}
        </JText>
      </View>

      {/* The disc, sitting over the top edge. */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: depth,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            borderWidth: border.ink,
            borderColor: palette.ink,
            backgroundColor: tone.solid,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      </View>
    </View>
  );
}

/**
 * A progress bar, built like everything else here: outlined in ink, filled
 * with a vivid block, standing on its own shadow. Fat enough to be a thing on
 * the screen rather than a hairline someone forgot to delete.
 */
export function Bar({
  value,
  accent = 'green',
  height = 18,
  onCream = true,
  style,
  accessibilityLabel,
}: {
  /** 0 to 1. */
  value: number;
  accent?: AccentName;
  height?: number;
  /** False when the bar sits straight on the dark ground. */
  onCream?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const tone = accents[accent];
  const filled = Math.max(0, Math.min(1, value));
  const width = useSharedValue(filled);

  useEffect(() => {
    width.value = withSpring(filled, motionJunior.soft);
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
          borderWidth: border.hair * 2,
          borderColor: palette.ink,
          // Never the same colour as the surface behind it: an empty bar has
          // to read as an empty bar and not as a missing one.
          backgroundColor: onCream ? palette.sunken : palette.groundRaised,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: radius.pill,
            backgroundColor: tone.solid,
          },
          fill,
        ]}
      />
    </View>
  );
}

/**
 * A labelled bar: what it is on the left, how far along on the right, the bar
 * underneath. The shape every "you are here" in this tier takes.
 */
export function ProgressRow({
  label,
  detail,
  value,
  accent = 'green',
  onCream = true,
  style,
}: {
  label: string;
  detail: string;
  value: number;
  accent?: AccentName;
  onCream?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const labelColour = onCream ? ink.strong : ink.onGround;
  const detailColour = onCream ? accents[accent].base : ink.onGroundMuted;

  return (
    <View style={[{ gap: space.sm }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
        <JText variant="heading" color={labelColour} style={{ flex: 1 }} numberOfLines={1}>
          {label}
        </JText>
        <JText variant="caption" color={detailColour}>
          {detail}
        </JText>
      </View>
      <Bar value={value} accent={accent} onCream={onCream} accessibilityLabel={`${label}. ${detail}`} />
    </View>
  );
}
