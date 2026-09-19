import { useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { BuddyId, ItemId } from '../../state/types';
import { palette } from '../../theme/tokens';
import { buddySpecs, INK, type BuddySpec } from './specs';
import {
  BackParts,
  faceLayouts,
  HeadShape,
  HeldProp,
  isScreenFaced,
  limbColor,
  ScreenFace,
  STROKE,
  TEEN_ACID,
} from './species';

export type BuddyMood = 'idle' | 'talking' | 'happy' | 'cheer' | 'sleepy';

export type BuddyProps = {
  id: BuddyId;
  size?: number;
  mood?: BuddyMood;
  /** Items the buddy has on. At most one per slot; see `engine/wardrobe`. */
  wearing?: ItemId[];
  label?: string;
  /**
   * No blinking, no bobbing, no timers. For small buddies drawn many times at
   * once, such as the rows of the friends board, where fifty animated rigs
   * would cost more than they add.
   */
  still?: boolean;
};

const VIEW_BOX = { x: -18, y: -30, w: 236, h: 254 };

/** Cartoon buddies animate on frames rather than continuously, like hand drawn TV animation. */
export function Buddy({ id, size = 200, mood = 'idle', wearing = [], label, still = false }: BuddyProps) {
  const spec = buddySpecs[id];
  const face = faceLayouts[id];
  const limb = limbColor(spec);
  const height = size * (VIEW_BOX.h / VIEW_BOX.w);

  const [blinking, setBlinking] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);
  const [armUp, setArmUp] = useState(false);

  const bob = useSharedValue(0);
  const squash = useSharedValue(1);
  const tilt = useSharedValue(0);

  // Blink on a loose schedule so it never looks metronomic.
  useEffect(() => {
    if (still || mood === 'sleepy') {
      setBlinking(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          setBlinking(true);
          timer = setTimeout(() => {
            setBlinking(false);
            schedule();
          }, 130);
        },
        2200 + Math.random() * 3200,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [mood, still]);

  useEffect(() => {
    if (still || mood !== 'talking') {
      setMouthFrame(0);
      return;
    }
    const timer = setInterval(() => setMouthFrame((f) => (f + 1) % 3), 190);
    return () => clearInterval(timer);
  }, [mood, still]);

  useEffect(() => {
    if (still || (mood !== 'cheer' && mood !== 'happy')) {
      setArmUp(false);
      return;
    }
    const timer = setInterval(() => setArmUp((a) => !a), 320);
    return () => clearInterval(timer);
  }, [mood, still]);

  useEffect(() => {
    const loop = (v: typeof bob, to: number, from: number, ms: number) =>
      withRepeat(
        withSequence(
          withTiming(to, { duration: ms, easing: Easing.inOut(Easing.quad) }),
          withTiming(from, { duration: ms, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      );

    if (still) {
      bob.value = 0;
      squash.value = 1;
      tilt.value = 0;
      return;
    }

    switch (mood) {
      case 'cheer':
        bob.value = loop(bob, -22, 0, 320);
        squash.value = loop(squash, 0.9, 1.06, 320);
        tilt.value = loop(tilt, -6, 6, 640);
        break;
      case 'happy':
        bob.value = loop(bob, -12, 0, 460);
        squash.value = loop(squash, 0.95, 1.03, 460);
        tilt.value = withTiming(0);
        break;
      case 'talking':
        bob.value = loop(bob, -4, 2, 520);
        squash.value = withTiming(1);
        tilt.value = loop(tilt, -2, 2, 1040);
        break;
      case 'sleepy':
        bob.value = loop(bob, 3, -3, 1900);
        squash.value = loop(squash, 1.02, 0.99, 1900);
        tilt.value = withTiming(4);
        break;
      default:
        bob.value = loop(bob, -6, 3, 1250);
        squash.value = loop(squash, 0.99, 1.01, 1250);
        tilt.value = loop(tilt, -1.5, 1.5, 2500);
    }
  }, [mood, still, bob, squash, tilt]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: bob.value },
      { scaleY: squash.value },
      { scaleX: 2 - squash.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const eyesClosed = blinking || mood === 'sleepy';
  const wears = useMemo(() => new Set(wearing), [wearing]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label ?? id}
      style={[{ width: size, height }, animated]}
    >
      <Svg width={size} height={height} viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.w} ${VIEW_BOX.h}`}>
        {wears.has('wings') && (
          <G>
            <Path
              d="M62,118 C22,96 8,134 24,164 C36,186 56,180 66,160 Z"
              fill={palette.sand}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M44,124 C34,140 34,156 42,170 M56,126 C48,142 48,158 54,170" stroke={INK} strokeWidth={2.5} fill="none" />
            <Path
              d="M138,118 C178,96 192,134 176,164 C164,186 144,180 134,160 Z"
              fill={palette.sand}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M156,124 C166,140 166,156 158,170 M144,126 C152,142 152,158 146,170" stroke={INK} strokeWidth={2.5} fill="none" />
          </G>
        )}

        {wears.has('backpack') && (
          <G>
            <Path
              d="M72,132 L128,132 L134,190 L66,190 Z"
              fill={palette.mint}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M70,162 L130,162" stroke={INK} strokeWidth={3} />
            <Path d="M88,140 L112,140 L112,156 L88,156 Z" fill={palette.sun} stroke={INK} strokeWidth={3} />
          </G>
        )}

        {wears.has('cape') && (
          <Path
            d="M64,122 L38,204 L162,204 L136,122 Z"
            fill={palette.grape}
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
        )}

        {wears.has('balloon') && (
          <G>
            <Path d="M170,10 C160,60 156,110 148,142" stroke={INK} strokeWidth={3} fill="none" />
            <Ellipse cx={172} cy={-4} rx={19} ry={23} fill={palette.coral} stroke={INK} strokeWidth={STROKE} />
            <Ellipse cx={165} cy={-12} rx={5} ry={7} fill="#FFFFFF" opacity={0.65} />
          </G>
        )}

        <BackParts id={id} spec={spec} />

        {wears.has('skateboard') && (
          <G>
            <Path
              d="M44,194 L156,194 A9,9 0 0 1 156,212 L44,212 A9,9 0 0 1 44,194 Z"
              fill={palette.grape}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Circle cx={66} cy={216} r={6} fill={palette.sun} stroke={INK} strokeWidth={3} />
            <Circle cx={134} cy={216} r={6} fill={palette.sun} stroke={INK} strokeWidth={3} />
          </G>
        )}

        {/* feet */}
        <Ellipse cx={78} cy={196} rx={18} ry={11} fill={limb} stroke={INK} strokeWidth={STROKE} />
        <Ellipse cx={122} cy={196} rx={18} ry={11} fill={limb} stroke={INK} strokeWidth={STROKE} />

        {/* Soles and toe caps. Only the white one has them: on every other
            buddy the foot is already a different colour from the ground. */}
        {id === 'sprout' && (
          <G>
            <Path d="M60,199 A18,11 0 0 0 96,199 Z" fill={spec.accent} />
            <Path d="M104,199 A18,11 0 0 0 140,199 Z" fill={spec.accent} />
            <Circle cx={78} cy={193} r={4} fill={SPROUT_AMBER} />
            <Circle cx={122} cy={193} r={4} fill={SPROUT_AMBER} />
          </G>
        )}

        {wears.has('ball') && (
          <G>
            <Circle cx={36} cy={188} r={19} fill="#FFFFFF" stroke={INK} strokeWidth={STROKE} />
            <Path d="M36,176 L44,183 L41,193 L31,193 L28,183 Z" fill={INK} />
          </G>
        )}

        {/* back arm */}
        <Ellipse
          cx={56}
          cy={150}
          rx={12}
          ry={21}
          fill={limb}
          stroke={INK}
          strokeWidth={STROKE}
          transform="rotate(20, 56, 150)"
        />

        {/* Mitts, carried on the same transform as the arm they belong to, so
            they still land at the wrist when the front arm swings up to cheer. */}
        {isScreenFaced(id) && (
          <Circle
            cx={56}
            cy={172}
            r={7.5}
            fill={mittColor(spec)}
            stroke={INK}
            strokeWidth={4}
            transform="rotate(20, 56, 150)"
          />
        )}

        <Body id={id} spec={spec} />

        {wears.has('medal') && (
          <G>
            <Path d="M92,134 L100,152 L108,134" stroke={palette.coral} strokeWidth={7} fill="none" />
            <Circle cx={100} cy={160} r={13} fill={palette.sun} stroke={INK} strokeWidth={4} />
            <Path
              d="M100,153 L102.5,158.5 L108,159 L104,163 L105,169 L100,166 L95,169 L96,163 L92,159 L97.5,158.5 Z"
              fill={INK}
            />
          </G>
        )}

        {/* front arm, raised while cheering */}
        <Ellipse
          cx={144}
          cy={150}
          rx={12}
          ry={21}
          fill={limb}
          stroke={INK}
          strokeWidth={STROKE}
          transform={armUp ? 'rotate(-58, 144, 158)' : 'rotate(-20, 144, 150)'}
        />

        {isScreenFaced(id) && (
          <Circle
            cx={144}
            cy={172}
            r={7.5}
            fill={mittColor(spec)}
            stroke={INK}
            strokeWidth={4}
            transform={armUp ? 'rotate(-58, 144, 158)' : 'rotate(-20, 144, 150)'}
          />
        )}

        {wears.has('flag') && (
          <G>
            <Path d="M158,64 L158,186" stroke={INK} strokeWidth={5} strokeLinecap="round" />
            <Path
              d="M158,66 L206,80 L158,96 Z"
              fill={palette.coral}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
          </G>
        )}

        <HeldProp id={id} spec={spec} />

        {wears.has('bandana') && (
          <G>
            <Path
              d="M68,120 Q100,138 132,120 L124,150 Q100,164 76,150 Z"
              fill={palette.coral}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Circle cx={86} cy={136} r={3.5} fill="#FFFFFF" />
            <Circle cx={104} cy={144} r={3.5} fill="#FFFFFF" />
            <Circle cx={116} cy={130} r={3.5} fill="#FFFFFF" />
          </G>
        )}

        {wears.has('bowtie') && (
          <G>
            <Path
              d="M100,130 L74,118 L74,144 Z"
              fill={palette.grape}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M100,130 L126,118 L126,144 Z"
              fill={palette.grape}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Circle cx={100} cy={131} r={7} fill={palette.grapeDeep} stroke={INK} strokeWidth={3} />
          </G>
        )}

        {wears.has('scarf') && (
          <G>
            <Path
              d="M64,124 Q100,146 136,124 L136,138 Q100,160 64,138 Z"
              fill={palette.coral}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M124,140 L136,178 L118,180 L112,144 Z"
              fill={palette.coral}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
          </G>
        )}

        <G>
          <HeadShape id={id} spec={spec} />

          {face.highlight && (
            <Ellipse
              cx={face.highlight.cx}
              cy={face.highlight.cy}
              rx={face.highlight.rx}
              ry={face.highlight.ry}
              fill="#FFFFFF"
              opacity={0.22}
              transform={`rotate(-24, ${face.highlight.cx}, ${face.highlight.cy})`}
            />
          )}

          {/* A robot's expression is on a screen and works nothing like a
              face on a head, so the three of them take a different path
              through rather than a pile of branches inside the shared parts. */}
          {isScreenFaced(id) ? (
            <ScreenFace id={id} mood={mood} closed={eyesClosed} frame={mouthFrame} />
          ) : (
            <>
              <Eyes eyeX={face.eyeX} eyeY={face.eyeY} closed={eyesClosed} />

              {face.brows && <Brows eyeX={face.eyeX} eyeY={face.eyeY} mood={mood} />}

              {face.cheeks && (
                <G>
                  <Ellipse cx={face.cheekX} cy={face.cheekY} rx={11} ry={7} fill="#FF8FA3" opacity={0.55} />
                  <Ellipse cx={200 - face.cheekX} cy={face.cheekY} rx={11} ry={7} fill="#FF8FA3" opacity={0.55} />
                </G>
              )}

              {/* The owl's beak replaces its mouth. */}
              {id !== 'owl' && <Mouth mood={mood} frame={mouthFrame} y={face.mouthY} />}
            </>
          )}

          {mood === 'sleepy' && (
            <G>
              <Path d="M150,24 L166,24 L150,44 L166,44" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
              <Path d="M172,-2 L184,-2 L172,12 L184,12" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
            </G>
          )}
        </G>

        {wears.has('shades') && (
          <G>
            <Path
              d="M56,72 L96,72 L94,94 Q80,102 68,94 Z"
              fill="#1C1A24"
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M104,72 L144,72 L132,94 Q120,102 106,94 Z"
              fill="#1C1A24"
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M96,74 L104,74" stroke={INK} strokeWidth={5} />
            <Path d="M62,78 L74,78" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
            <Path d="M110,78 L122,78" stroke="#FFFFFF" strokeWidth={4} opacity={0.5} strokeLinecap="round" />
          </G>
        )}

        {wears.has('glasses') && (
          <G>
            <Circle cx={78} cy={84} r={19} fill="#2A2118" opacity={0.82} stroke={INK} strokeWidth={STROKE} />
            <Circle cx={122} cy={84} r={19} fill="#2A2118" opacity={0.82} stroke={INK} strokeWidth={STROKE} />
            <Path d="M97,82 L103,82" stroke={INK} strokeWidth={6} />
            <Path d="M59,80 L44,74 M141,80 L156,74" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </G>
        )}

        {/* Head slot. `engine/wardrobe` allows one of these at a time, so they
            are independent blocks rather than the chain this used to be. */}
        {wears.has('crown') && (
          <Path
            d="M66,30 L78,4 L92,24 L100,-2 L108,24 L122,4 L134,30 Z"
            fill={palette.sun}
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
        )}

        {wears.has('hat') && (
          <G>
            <Path
              d="M112,36 L150,-14 L160,32 Z"
              fill={palette.bubble}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Circle cx={150} cy={-14} r={9} fill={palette.mint} stroke={INK} strokeWidth={4} />
          </G>
        )}

        {wears.has('cap') && (
          <G>
            {/* Worn backwards, which is the entire reason a nine year old wants it. */}
            <Path
              d="M54,38 Q100,-30 146,38 Z"
              fill={palette.sky}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M58,30 L22,34 Q10,40 22,47 L60,44 Z"
              fill={palette.skyDeep}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M100,8 L100,38" stroke={INK} strokeWidth={2.5} />
            <Circle cx={100} cy={8} r={6} fill={palette.sun} stroke={INK} strokeWidth={3} />
          </G>
        )}

        {wears.has('beanie') && (
          <G>
            <Path
              d="M56,36 Q100,-34 144,36 Z"
              fill={palette.coral}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M52,30 L148,30 L148,48 L52,48 Z"
              fill={palette.coralDeep}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Circle cx={100} cy={2} r={11} fill={palette.cream} stroke={INK} strokeWidth={4} />
          </G>
        )}

        {wears.has('headphones') && (
          <G>
            <Path
              d="M50,88 Q50,6 100,6 Q150,6 150,88"
              stroke={INK}
              strokeWidth={11}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M52,86 Q52,10 100,10 Q148,10 148,86"
              stroke={palette.grape}
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M38,70 L62,70 A8,8 0 0 1 70,78 L70,98 A8,8 0 0 1 62,106 L38,106 A8,8 0 0 1 30,98 L30,78 A8,8 0 0 1 38,70 Z"
              fill={palette.grape}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path
              d="M138,70 L162,70 A8,8 0 0 1 170,78 L170,98 A8,8 0 0 1 162,106 L138,106 A8,8 0 0 1 130,98 L130,78 A8,8 0 0 1 138,70 Z"
              fill={palette.grape}
              stroke={INK}
              strokeWidth={STROKE}
              strokeLinejoin="round"
            />
            <Path d="M40,80 L40,96 M160,80 L160,96" stroke={palette.grapeDeep} strokeWidth={4} strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

/* ---------------------------------------------------------------- pieces */

/** Body, the shadow that gives it volume, and the belly. */
/** The white robot's mitts read as nothing against its own pale shade. */
function mittColor(spec: BuddySpec): string {
  return spec.id === 'sprout' ? spec.accent : spec.shade;
}

/** Two tones the white robot needs that a `BuddySpec` has nowhere to put. */
const SPROUT_STEM = '#5A907A';
const SPROUT_AMBER = '#FFB338';

function ChestPlate({ id, spec }: { id: BuddyId; spec: BuddySpec }) {
  if (id === 'sprout') {
    return (
      <G>
        {/* Pack straps, from the reference's little rucksack. They also give a
            white body something to be read against. */}
        <Path d="M68,126 Q63,152 70,176" stroke={spec.accent} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d="M132,126 Q137,152 130,176" stroke={spec.accent} strokeWidth={7} fill="none" strokeLinecap="round" />
        {/* A seedling rather than a star or a bolt. It is the only badge in the
            set that says what the app actually promises: the buddy grows with
            every mission the child finishes. */}
        <Circle cx={100} cy={158} r={18} fill={spec.light} stroke={INK} strokeWidth={4} />
        <Path d="M100,170 L100,154" stroke={SPROUT_STEM} strokeWidth={3.5} strokeLinecap="round" />
        <Path
          d="M99,156 C90,156 85,150 86,143 C94,142 99,148 99,156 Z"
          fill={spec.accent}
          stroke={SPROUT_STEM}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path
          d="M101,152 C110,152 115,146 114,139 C106,138 101,144 101,152 Z"
          fill={spec.accent}
          stroke={SPROUT_STEM}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </G>
    );
  }

  if (id === 'byte') {
    return (
      <G>
        <Path
          d="M62,142 Q100,126 138,142"
          stroke={spec.accent}
          strokeWidth={3}
          fill="none"
          opacity={0.8}
          strokeLinecap="round"
        />
        <Rect x={78} y={152} width={44} height={7} rx={3.5} fill={TEEN_ACID} />
        <Rect x={78} y={165} width={26} height={5} rx={2.5} fill={spec.accent} />
      </G>
    );
  }

  return (
    <G>
      <Rect x={74} y={136} width={52} height={46} rx={16} fill={spec.light} stroke={INK} strokeWidth={4} />
      {id === 'scout' ? (
        <Path
          d="M104,142 L88,161 L98,161 L94,177 L112,157 L101,157 Z"
          fill={palette.sun}
          stroke={palette.sunDeep}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d="M100,143 L104.2,154.2 L116,154.7 L106.8,162.1 L109.8,173.5 L100,167 L90.2,173.5 L93.2,162.1 L84,154.7 L95.8,154.2 Z"
          fill={palette.sun}
          stroke={palette.sunDeep}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      )}
      <Ellipse cx={88} cy={145} rx={8} ry={5} fill="#FFFFFF" opacity={0.45} transform="rotate(-28, 88, 145)" />
    </G>
  );
}

function Body({ id, spec }: { id: BuddyId; spec: BuddySpec }) {
  return (
    <G>
      <Ellipse cx={100} cy={156} rx={44} ry={41} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
      {/* Lower half of the same ellipse, so the body reads as round rather than flat. */}
      <Path d="M56,156 A44,41 0 0 0 144,156 Z" fill={spec.shade} opacity={0.5} />

      {isScreenFaced(id) ? (
        // An outlined chest plate where the animals get a belly. Drawn instead
        // of the belly circle rather than over it: laying one outlined shape on
        // top of the other made the badge read as a sticker stuck to a tummy.
        //
        // Each robot carries its own mark. `byte` carries none at all: a lit
        // bar and a hairline, because a badge on the chest is exactly the kind
        // of thing the 10-13 tier strips out.
        <ChestPlate id={id} spec={spec} />
      ) : (
        <>
          <Ellipse cx={100} cy={163} rx={27} ry={27} fill={spec.light} />
          <Ellipse cx={90} cy={151} rx={10} ry={6} fill="#FFFFFF" opacity={0.5} transform="rotate(-28, 90, 151)" />
        </>
      )}
    </G>
  );
}

function Eyes({
  eyeX,
  eyeY,
  closed,
}: {
  eyeX: number;
  eyeY: number;
  closed: boolean;
}) {
  if (closed) {
    return (
      <Path
        d={`M${eyeX - 13},${eyeY} Q${eyeX},${eyeY + 10} ${eyeX + 13},${eyeY} M${200 - eyeX - 13},${eyeY} Q${200 - eyeX},${eyeY + 10} ${200 - eyeX + 13},${eyeY}`}
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  return (
    <G>
      <Ellipse cx={eyeX} cy={eyeY} rx={13} ry={15} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <Ellipse cx={200 - eyeX} cy={eyeY} rx={13} ry={15} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <Circle cx={eyeX + 2} cy={eyeY + 3} r={7} fill={INK} />
      <Circle cx={200 - eyeX + 2} cy={eyeY + 3} r={7} fill={INK} />
      <Circle cx={eyeX - 1} cy={eyeY - 1} r={3} fill="#FFFFFF" />
      <Circle cx={200 - eyeX - 1} cy={eyeY - 1} r={3} fill="#FFFFFF" />
    </G>
  );
}

/** Two ink strokes that carry most of the expression. */
function Brows({ eyeX, eyeY, mood }: { eyeX: number; eyeY: number; mood: BuddyMood }) {
  const y = eyeY - 23;
  const lift = mood === 'cheer' ? 9 : mood === 'happy' ? 7 : mood === 'sleepy' ? -3 : 3;
  const right = 200 - eyeX;

  return (
    <Path
      d={
        `M${eyeX - 14},${y + 3} Q${eyeX},${y - lift} ${eyeX + 13},${y + 2} ` +
        `M${right + 14},${y + 3} Q${right},${y - lift} ${right - 13},${y + 2}`
      }
      stroke={INK}
      strokeWidth={4.5}
      strokeLinecap="round"
      fill="none"
    />
  );
}

function Mouth({ mood, frame, y }: { mood: BuddyMood; frame: number; y: number }) {
  if (mood === 'sleepy') {
    return <Ellipse cx={100} cy={y + 4} rx={7} ry={9} fill={INK} opacity={0.85} />;
  }

  if (mood === 'talking') {
    if (frame === 0) return <Ellipse cx={100} cy={y + 2} rx={9} ry={11} fill={INK} />;
    if (frame === 1) return <Ellipse cx={100} cy={y + 2} rx={13} ry={6} fill={INK} />;
    return (
      <Path d={`M88,${y} Q100,${y + 12} 112,${y}`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
    );
  }

  if (mood === 'cheer' || mood === 'happy') {
    return (
      <G>
        <Path
          d={`M82,${y - 2} Q100,${y + 26} 118,${y - 2} Z`}
          fill={INK}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <Path d={`M92,${y + 12} Q100,${y + 22} 108,${y + 12} Z`} fill="#FF7A8A" />
      </G>
    );
  }

  return (
    <Path d={`M87,${y} Q100,${y + 13} 113,${y}`} stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
  );
}
