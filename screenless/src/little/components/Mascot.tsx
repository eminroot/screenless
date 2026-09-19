import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { Buddy, type BuddyMood } from '../../components/buddy/Buddy';
import type { BuddyId, ItemId } from '../../state/types';
import { useLiveMotion, useOscillator } from '../motion';
import { motionLittle, tones, world, type ToneName } from '../theme';
import { Tile } from './Tile';

/**
 * The buddy, presented.
 *
 * It stands on a little green mound with a soft halo behind it and bobs on the
 * spot, and tapping it makes it hop and say something. That tap is the one
 * piece of this interface with no purpose beyond delight, which is exactly why
 * it is here: a three year old needs a reason to look at the buddy before they
 * will do anything the buddy asks.
 *
 * Blocks can be scattered around it, tipped and bobbing at different speeds,
 * the way the toys of a picture book cover are arranged.
 */
export function Mascot({
  id,
  name,
  size = 200,
  mood = 'idle',
  wearing,
  onTap,
  props: blocks = [],
  halo = 'mint',
}: {
  id: BuddyId;
  name?: string;
  size?: number;
  mood?: BuddyMood;
  wearing?: ItemId[];
  onTap?: () => void;
  /** Blocks floating around the buddy: a letter, a number, an emoji. */
  props?: { label: string; tone: ToneName }[];
  halo?: ToneName;
}) {
  const live = useLiveMotion();
  const breathe = useOscillator(3000, live);
  const hop = useSharedValue(0);

  const body = useAnimatedStyle(() => ({
    transform: [{ translateY: -breathe.value * 5 - hop.value * 20 }],
  }));

  const shadow = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - hop.value * 0.18 - breathe.value * 0.03 }],
    opacity: 1 - hop.value * 0.35,
  }));

  const tap = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hop.value = withTiming(1, { duration: 150 }, () => {
      hop.value = withSpring(0, motionLittle.bouncy);
    });
    onTap?.();
  };

  const stage = size * 1.34;
  const height = size * 1.2;

  return (
    <View style={{ width: stage, height, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Halo and mound are sized off the buddy and pinned to the bottom of the
          stage rather than drawn in one big square, so nothing washes over the
          card that comes after it. */}
      <Halo size={size * 1.16} bottom={size * 0.04} color={tones[halo].glow} opacity={0.3} />
      <Halo size={size * 0.92} bottom={size * 0.1} color="#FFFFFF" opacity={0.38} />

      <Svg
        width={stage}
        height={size * 0.42}
        viewBox="0 0 100 32"
        style={{ position: 'absolute', bottom: 0 }}
      >
        <Ellipse cx={50} cy={30} rx={34} ry={26} fill={world.grass} />
        <Path d="M23 20 Q 30 10 37 20 Z" fill={world.grassDark} opacity={0.6} />
        <Path d="M63 18 Q 70 7 77 18 Z" fill={world.grassDark} opacity={0.6} />
      </Svg>

      {blocks.map((block, index) => {
        const angle = index === 0 ? -1 : 1;
        return (
          <Tile
            key={`${block.label}-${index}`}
            label={block.label}
            tone={block.tone}
            size={Math.round(size * 0.25)}
            tilt={angle * 10}
            float
            delay={index * 320}
            style={{
              position: 'absolute',
              top: size * (index === 0 ? 0.06 : 0.3),
              left: angle < 0 ? 0 : undefined,
              right: angle > 0 ? 0 : undefined,
            }}
          />
        );
      })}

      <Animated.View style={[{ position: 'absolute', bottom: 2 }, shadow]}>
        <View
          style={{
            width: size * 0.48,
            height: size * 0.1,
            borderRadius: size,
            backgroundColor: world.shadow,
          }}
        />
      </Animated.View>

      <Animated.View style={body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name}
          disabled={!onTap}
          onPress={tap}
        >
          <Buddy id={id} size={size} mood={mood} wearing={wearing} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** A soft disc behind the buddy. Two of them stacked read as light on grass. */
function Halo({
  size,
  bottom,
  color,
  opacity,
}: {
  size: number;
  bottom: number;
  color: string;
  opacity: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}
