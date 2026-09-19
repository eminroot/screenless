import { useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { useCycle, useLiveMotion, useOscillator } from '../motion';
import { SKY_GRADIENT, world } from '../theme';

/**
 * The world every 3-5 screen is painted on.
 *
 * One mint-to-grass gradient with a sun in the corner, clouds drifting across
 * it and leaves turning over in the air. It sits behind the content and never
 * scrolls, so the child gets the feeling of standing in one place outdoors
 * rather than of paging through a document.
 *
 * All of the motion is slow and none of it is on the path of a tap. It also
 * stops the moment the screen loses focus or the phone asks for less motion,
 * because tab screens stay mounted and a cloud drifting on a hidden tab would
 * cost frames on the visible one.
 */
export function Sky({ dim = false }: { dim?: boolean }) {
  const { width, height } = useWindowDimensions();
  const live = useLiveMotion();

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <LinearGradient
        colors={[...SKY_GRADIENT]}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <Sun live={live} />

      <Cloud top={height * 0.08} width={width} size={1.15} duration={64_000} start={0.15} live={live} />
      <Cloud top={height * 0.3} width={width} size={0.8} duration={82_000} start={0.62} live={live} />
      <Cloud top={height * 0.62} width={width} size={1} duration={74_000} start={0.35} live={live} />

      <Leaf left={width * 0.08} top={height * 0.22} size={34} tilt={-18} duration={5200} live={live} />
      <Leaf left={width * 0.86} top={height * 0.45} size={28} tilt={24} duration={6400} live={live} />
      <Leaf left={width * 0.14} top={height * 0.72} size={30} tilt={12} duration={5800} live={live} />
      <Leaf left={width * 0.8} top={height * 0.83} size={24} tilt={-30} duration={7000} live={live} />

      {/* Used behind sheets and dialogs, so the content in front of them reads. */}
      {dim ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(24,40,16,0.38)' }} />
      ) : null}
    </View>
  );
}

/** A sun that breathes, tucked into the top right where nothing is ever placed. */
function Sun({ live }: { live: boolean }) {
  const breath = useOscillator(4200, live);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.96 + breath.value * 0.08 }] }));

  return (
    <Animated.View style={[{ position: 'absolute', right: -34, top: -34 }, style]}>
      <Svg width={190} height={190} viewBox="0 0 190 190">
        <Circle cx={95} cy={95} r={92} fill={world.sunGlow} opacity={0.28} />
        <Circle cx={95} cy={95} r={68} fill={world.sunGlow} opacity={0.4} />
        <Circle cx={95} cy={95} r={46} fill={world.sunCore} />
      </Svg>
    </Animated.View>
  );
}

function Cloud({
  top,
  width,
  size,
  duration,
  start,
  live,
}: {
  top: number;
  width: number;
  size: number;
  duration: number;
  start: number;
  live: boolean;
}) {
  const travel = useCycle(duration, live, start);
  const cloudWidth = 150 * size;

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloudWidth + travel.value * (width + cloudWidth * 2) }],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top, left: 0, opacity: 0.9 }, style]}>
      <Svg width={cloudWidth} height={cloudWidth * 0.46} viewBox="0 0 150 69">
        <G>
          <Ellipse cx={75} cy={46} rx={64} ry={17} fill={world.cloud} />
          <Circle cx={48} cy={31} r={22} fill={world.cloud} />
          <Circle cx={86} cy={26} r={27} fill={world.cloud} />
          <Circle cx={113} cy={36} r={18} fill={world.cloud} />
          <Ellipse cx={75} cy={57} rx={58} ry={8} fill={world.cloudShade} opacity={0.55} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** One leaf turning over on the spot. Cheaper than a falling one and less busy. */
function Leaf({
  left,
  top,
  size,
  tilt,
  duration,
  live,
}: {
  left: number;
  top: number;
  size: number;
  tilt: number;
  duration: number;
  live: boolean;
}) {
  const sway = useOscillator(duration, live, duration * 0.3);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 + sway.value * 12 },
      { rotate: `${tilt - 10 + sway.value * 20}deg` },
    ],
    opacity: 0.5 + sway.value * 0.2,
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left, top }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Path d="M8 40 C 8 20, 22 6, 42 6 C 42 26, 28 40, 8 40 Z" fill={world.leaf} />
        <Path d="M10 38 L 38 10" stroke={world.leafDeep} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
      </Svg>
    </Animated.View>
  );
}
