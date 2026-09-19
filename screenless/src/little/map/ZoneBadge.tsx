import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { ZoneId } from '../../data/zones';
import { LText } from '../components/LText';
import { CheckIcon, LockIcon, StarIcon } from '../icons';
import { useOscillator } from '../motion';
import { ink, motionLittle, round, tones } from '../theme';

/** Each place has a colour of its own, so the map reads as seven worlds. */
export const ZONE_TONES: Record<ZoneId, { face: string; lip: string }> = {
  camp: { face: '#FFC42E', lip: '#E09A0C' },
  forest: { face: '#3CA82F', lip: '#2A7D20' },
  mountain: { face: '#12A8A0', lip: '#08807A' },
  ocean: { face: '#2189E0', lip: '#1567B1' },
  desert: { face: '#F2912E', lip: '#CC7118' },
  castle: { face: '#E2519B', lip: '#B8357B' },
  space: { face: '#8257F5', lip: '#6139D4' },
};

/** A place not reached yet shows a faded preview, so there is something to look forward to. */
const LOCKED = { face: '#E4EFD8', lip: '#C6D6B6' };

/** The picture inside each badge, drawn in a 64 unit box. */
export function ZoneArt({ id, size }: { id: ZoneId; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {id === 'camp' ? (
        <>
          <Rect x={6} y={49} width={52} height={7} rx={3.5} fill="#8FD66E" />
          <Path d="M32 12 L54 51 H10 Z" fill="#EC5B3F" />
          <Path d="M32 12 L54 51 H32 Z" fill="#C4432B" />
          <Path d="M32 27 L41 51 H23 Z" fill="#6E2A1C" />
          <Path d="M32 13 V4" stroke="#8F5A2C" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M32.5 3.5 L43 6.8 L32.5 10 Z" fill="#FFFFFF" />
        </>
      ) : id === 'forest' ? (
        <>
          <Rect x={21} y={42} width={6} height={12} rx={2} fill="#8F5A2C" />
          <Path d="M24 6 L38 26 H32 L42 42 H6 L16 26 H10 Z" fill="#B8F09A" />
          <Path d="M24 6 L38 26 H32 L42 42 H24 Z" fill="#8FDB6E" />
          <Rect x={43} y={46} width={5} height={9} rx={2} fill="#8F5A2C" />
          <Path d="M45.5 20 L56 35 H51.5 L58 47 H33 L39.5 35 H35 Z" fill="#E2F8D4" />
          <Path d="M45.5 20 L56 35 H51.5 L58 47 H45.5 Z" fill="#C4EDAE" />
        </>
      ) : id === 'mountain' ? (
        <>
          <Path d="M2 54 L24 16 L36 34 L44 24 L62 54 Z" fill="#E4F7F6" />
          <Path d="M24 16 L36 34 L40 54 H24 Z" fill="#C4E9E7" />
          <Path d="M44 24 L62 54 H48 Z" fill="#C4E9E7" />
          <Path d="M24 16 L31.5 27.5 L28 30 L24 26.5 L19.5 30.5 L16.8 28.5 Z" fill="#FFFFFF" />
          <Circle cx={50} cy={12} r={5} fill="#FFE89A" />
        </>
      ) : id === 'ocean' ? (
        <>
          <Path d="M32 8 V41" stroke="#8F5A2C" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M34.5 10 L52 37 H34.5 Z" fill="#FFFFFF" />
          <Path d="M29.5 16 L17 37 H29.5 Z" fill="#FFE3DB" />
          <Path d="M13 40 H51 L45 50 H19 Z" fill="#FFC83D" />
          <Path d="M32 40 H51 L45 50 H32 Z" fill="#E0A21B" />
          <Path d="M4 53 Q 12 47 20 53 T 36 53 T 52 53 T 60 52 V60 H4 Z" fill="#DDF0FD" />
        </>
      ) : id === 'desert' ? (
        <>
          <Circle cx={48} cy={15} r={7} fill="#FFE89A" />
          <Path d="M4 56 Q 30 42 60 56 Z" fill="#FFE9AA" />
          <Path d="M27 52 V21 A5.5 5.5 0 0 1 38 21 V52 Z" fill="#6CC24A" />
          <Path d="M32.5 15.5 A5.5 5.5 0 0 1 38 21 V52 H32.5 Z" fill="#58B33B" />
          <Path d="M27 37 H19.5 A5 5 0 0 1 14.5 32 V26 A3.8 3.8 0 0 1 22 26 V30 H27 Z" fill="#6CC24A" />
          <Path d="M38 33 H43 V25 A3.8 3.8 0 0 1 50.5 25 V30 A7 7 0 0 1 43.5 37 H38 Z" fill="#58B33B" />
        </>
      ) : id === 'castle' ? (
        <>
          <Rect x={15} y={27} width={34} height={27} fill="#FFE2F0" />
          <Rect x={15} y={22} width={6} height={7} fill="#FFE2F0" />
          <Rect x={29} y={22} width={6} height={7} fill="#FFE2F0" />
          <Rect x={43} y={22} width={6} height={7} fill="#FFE2F0" />
          <Rect x={9} y={17} width={12} height={37} rx={2} fill="#FFFFFF" />
          <Rect x={43} y={17} width={12} height={37} rx={2} fill="#F6EEF8" />
          <Path d="M8 18 L15 5 L22 18 Z" fill="#8467F7" />
          <Path d="M42 18 L49 5 L56 18 Z" fill="#6446D9" />
          <Path d="M26.5 54 V43 A5.5 5.5 0 0 1 37.5 43 V54 Z" fill="#B84080" />
        </>
      ) : (
        <>
          <Circle cx={12} cy={14} r={2} fill="#FFFFFF" />
          <Circle cx={53} cy={22} r={1.6} fill="#FFFFFF" />
          <Path d="M26 41 H38 L35.5 51 Q32 58 28.5 51 Z" fill="#FFC83D" />
          <Path d="M28.5 41 H35.5 L34 47 Q32 51 30 47 Z" fill="#EC5B3F" />
          <Path d="M21 31 L12 44 L22 42 Z" fill="#EC5B3F" />
          <Path d="M43 31 L52 44 L42 42 Z" fill="#C4432B" />
          <Path d="M32 5 C 43 13, 45.5 28, 43 42 H21 C 18.5 28, 21 13, 32 5 Z" fill="#FFFFFF" />
          <Path d="M32 5 C 43 13, 45.5 28, 43 42 H32 Z" fill="#E6DAC4" />
          <Circle cx={32} cy={23} r={6} fill="#238FDD" />
          <Circle cx={30} cy={21} r={1.8} fill="#FFFFFF" />
        </>
      )}
    </Svg>
  );
}

export type ZoneState = 'done' | 'here' | 'locked';

/**
 * A place on the map: a round button with its picture, a lip, and under it
 * either its name, a tick, or the stars still to go.
 */
export function ZoneBadge({
  id,
  state,
  size,
  name,
  starsNeeded,
  selected,
  live,
  onPress,
}: {
  id: ZoneId;
  state: ZoneState;
  size: number;
  name: string;
  starsNeeded: number;
  selected: boolean;
  live: boolean;
  onPress: () => void;
}) {
  const palette = state === 'locked' ? LOCKED : ZONE_TONES[id];
  const depth = Math.round(size * 0.075);
  const pressed = useSharedValue(0);
  const chosen = useSharedValue(selected ? 1 : 0);
  const glow = useOscillator(1400, live && state === 'here');

  useEffect(() => {
    chosen.value = withSpring(selected ? 1 : 0, motionLittle.spring);
  }, [selected, chosen]);

  const face = useAnimatedStyle(() => ({
    transform: [
      { translateY: pressed.value * depth },
      { scale: 1 + chosen.value * 0.06 - pressed.value * 0.03 },
    ],
  }));

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 - glow.value * 0.45,
    transform: [{ scale: 1.08 + glow.value * 0.22 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={state === 'locked' ? `${name}, ${starsNeeded}` : name}
      accessibilityState={{ selected, disabled: state === 'locked' }}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withSpring(1, motionLittle.spring);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, motionLittle.spring);
      }}
      hitSlop={10}
      style={{ width: size + 40, alignItems: 'center' }}
    >
      <View style={{ width: size, height: size + depth }}>
        {state === 'here' ? (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: '#FFFFFF',
              },
              ring,
            ]}
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            top: depth,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.lip,
          }}
        />
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: palette.face,
              alignItems: 'center',
              justifyContent: 'center',
              // Every place wears a white rim, like a stone set in the water.
              // The one the child is standing on wears a thicker one.
              borderWidth: state === 'here' ? Math.max(5, size * 0.075) : Math.max(3, size * 0.04),
              borderColor: '#FFFFFF',
              overflow: 'hidden',
            },
            face,
          ]}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '48%',
              backgroundColor: 'rgba(255,255,255,0.14)',
            }}
          />
          <View style={{ opacity: state === 'locked' ? 0.4 : 1 }}>
            <ZoneArt id={id} size={size * 0.74} />
          </View>
        </Animated.View>
        {state === 'locked' ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -size * 0.04,
              bottom: depth - size * 0.02,
              width: size * 0.4,
              height: size * 0.4,
              borderRadius: size * 0.2,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 3,
              borderBottomColor: tones.white.lip,
            }}
          >
            <LockIcon size={size * 0.28} />
          </View>
        ) : null}
      </View>

      <View style={{ marginTop: 6 }}>
        {state === 'locked' ? (
          <Plate>
            <StarIcon size={18} />
            <LText variant="tiny" color={ink.soft}>
              {starsNeeded}
            </LText>
          </Plate>
        ) : (
          <Plate highlight={state === 'here'}>
            {state === 'done' ? <CheckIcon size={16} color={tones.mint.face} /> : null}
            <LText variant="tiny" color={ink.text} numberOfLines={1}>
              {name}
            </LText>
          </Plate>
        )}
      </View>
    </Pressable>
  );
}

function Plate({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: highlight ? tones.sun.face : '#FFFFFF',
        borderRadius: round.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderBottomWidth: 3,
        borderBottomColor: highlight ? tones.sun.lip : tones.white.lip,
      }}
    >
      {children}
    </View>
  );
}
