import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import type { BuddyId } from '../../state/types';
import type { BuddyMood } from './Buddy';
import { palette } from '../../theme/tokens';
import { INK, type BuddySpec } from './specs';

export const STROKE = 5;

/**
 * What the robot's face is drawn in.
 *
 * Its features sit on a dark screen rather than on a light head, so they are
 * the one face in the set drawn in light on dark. Slightly cool and not quite
 * white, which reads as a lit panel instead of paint.
 */
export const SCREEN_GLOW = '#EAFFF8';

/**
 * The acid the 10-13 robot answers in.
 *
 * The same value as the teen tier's default accent in `src/teen/skin.ts`,
 * repeated rather than imported: this file is the character set, and it should
 * not start depending on one tier's theme to draw a buddy any age can pick.
 */
export const TEEN_ACID = '#CDFF47';

/** A soft light patch on the head, placed by hand so it never lands on a hat. */
export type Highlight = { cx: number; cy: number; rx: number; ry: number };

/** Where the shared face sits on each species. */
export type FaceLayout = {
  /** Centre of the left eye. The right eye mirrors around x = 100. */
  eyeX: number;
  eyeY: number;
  mouthY: number;
  brows: boolean;
  cheeks: boolean;
  cheekX: number;
  cheekY: number;
  highlight: Highlight | null;
};

const defaultFace: FaceLayout = {
  eyeX: 79,
  eyeY: 84,
  mouthY: 114,
  brows: true,
  cheeks: true,
  cheekX: 54,
  cheekY: 106,
  highlight: { cx: 78, cy: 58, rx: 19, ry: 12 },
};

export const faceLayouts: Record<BuddyId, FaceLayout> = {
  fox: defaultFace,
  cat: defaultFace,
  dino: { ...defaultFace, cheekY: 108 },
  owl: { ...defaultFace, highlight: { cx: 62, cy: 54, rx: 15, ry: 10 } },
  // The three robots carry their expression on a screen, so the shared face
  // parts are all switched off for them and `ScreenFace` draws instead.
  robot: { ...defaultFace, brows: false, cheeks: false, highlight: null },
  scout: { ...defaultFace, brows: false, cheeks: false, highlight: null },
  byte: { ...defaultFace, brows: false, cheeks: false, highlight: null },
  star: {
    eyeX: 84,
    eyeY: 78,
    mouthY: 100,
    brows: false,
    cheeks: false,
    cheekX: 70,
    cheekY: 94,
    highlight: null,
  },

  bear: {
    ...defaultFace,
    eyeY: 82,
    mouthY: 112,
    cheekX: 56,
    cheekY: 100,
    highlight: { cx: 72, cy: 64, rx: 16, ry: 10 },
  },
  // Stripes and the headband already break up the tiger's face.
  tiger: { ...defaultFace, eyeY: 82, mouthY: 112, cheekX: 56, cheekY: 104, highlight: null },
  bunny: {
    ...defaultFace,
    mouthY: 118,
    cheekX: 56,
    cheekY: 108,
    highlight: { cx: 68, cy: 78, rx: 14, ry: 9 },
  },
  // Eye patches do the expressing, brows would vanish into them.
  panda: {
    ...defaultFace,
    mouthY: 120,
    brows: false,
    cheeks: false,
    cheekX: 56,
    cheekY: 106,
    highlight: null,
  },
  turtle: {
    ...defaultFace,
    eyeY: 82,
    mouthY: 112,
    cheekX: 58,
    cheekY: 102,
    highlight: { cx: 74, cy: 58, rx: 16, ry: 10 },
  },
  // The porthole ring carries its own shine, and rockets have no eyebrows.
  rocket: {
    eyeX: 82,
    eyeY: 88,
    mouthY: 110,
    brows: false,
    cheeks: true,
    cheekX: 72,
    cheekY: 106,
    highlight: null,
  },
};

/** A panda has to have black arms and legs, everyone else uses the body colour. */
export function limbColor(spec: BuddySpec): string {
  return spec.id === 'panda' ? spec.accent : spec.body;
}

/* ------------------------------------------------------------------- back */

/** Tails, wings and anything else that sits behind the body. */
export function BackParts({ id, spec }: { id: BuddyId; spec: BuddySpec }) {
  switch (id) {
    case 'fox':
      return (
        <G>
          <Ellipse
            cx={166}
            cy={156}
            rx={22}
            ry={42}
            fill={spec.body}
            stroke={INK}
            strokeWidth={STROKE}
            transform="rotate(40, 166, 156)"
          />
          <Ellipse cx={192} cy={126} rx={16} ry={16} fill={spec.light} stroke={INK} strokeWidth={STROKE} />
        </G>
      );

    case 'cat':
      return (
        <G>
          <Path d="M142,176 C184,178 194,140 172,120" stroke={INK} strokeWidth={26} strokeLinecap="round" fill="none" />
          <Path d="M142,176 C184,178 194,140 172,120" stroke={spec.body} strokeWidth={16} strokeLinecap="round" fill="none" />
        </G>
      );

    case 'dino':
      return (
        <G>
          <Path
            d="M150,150 L158,132 L166,152 Z M172,158 L182,142 L190,164 Z"
            fill={spec.accent}
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
          <Ellipse
            cx={166}
            cy={174}
            rx={40}
            ry={19}
            fill={spec.body}
            stroke={INK}
            strokeWidth={STROKE}
            transform="rotate(-16, 166, 174)"
          />
        </G>
      );

    case 'owl':
      return (
        <G>
          <Ellipse
            cx={52}
            cy={158}
            rx={16}
            ry={34}
            fill={spec.accent}
            stroke={INK}
            strokeWidth={STROKE}
            transform="rotate(16, 52, 158)"
          />
          <Ellipse
            cx={148}
            cy={158}
            rx={16}
            ry={34}
            fill={spec.accent}
            stroke={INK}
            strokeWidth={STROKE}
            transform="rotate(-16, 148, 158)"
          />
        </G>
      );

    // The robot used to carry a vented box out to one side here. With the ear
    // cups, bolts, chest plate and jointed limbs it now has, that box was one
    // shape too many and only broke the silhouette. The other two never had
    // one: everything that makes them read is on the head and the chest.
    case 'robot':
    case 'scout':
    case 'byte':
      return null;

    case 'star':
      return (
        <G>
          <Path
            d="M32,52 L36,64 L48,68 L36,72 L32,84 L28,72 L16,68 L28,64 Z"
            fill={palette.sun}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path
            d="M176,96 L179,105 L188,108 L179,111 L176,120 L173,111 L164,108 L173,105 Z"
            fill={palette.sun}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </G>
      );

    case 'bear':
      return <Circle cx={158} cy={176} r={15} fill={spec.shade} stroke={INK} strokeWidth={STROKE} />;

    case 'tiger':
      return (
        <G>
          <Path d="M144,178 C184,180 196,146 178,116" stroke={INK} strokeWidth={26} strokeLinecap="round" fill="none" />
          <Path d="M144,178 C184,180 196,146 178,116" stroke={spec.body} strokeWidth={16} strokeLinecap="round" fill="none" />
          <Path
            d="M161,166 L169,182 M174,154 L190,160 M172,130 L188,134"
            stroke={spec.accent}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </G>
      );

    case 'bunny':
      return <Circle cx={154} cy={176} r={16} fill={spec.light} stroke={INK} strokeWidth={STROKE} />;

    case 'panda':
      // The black arms and legs already carry the silhouette.
      return null;

    case 'turtle':
      // The shell sits behind and wider than the body, so it reads as a shell
      // on the back rather than a bib on the front.
      return (
        <G>
          {/* Drawn before the shell so the shell hides where it joins. */}
          <Path d="M142,180 L178,174 L160,200 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Ellipse cx={100} cy={150} rx={64} ry={56} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={150} rx={46} ry={40} fill="none" stroke={INK} strokeWidth={3.5} opacity={0.4} />
          <Path
            d="M54,150 L38,150 M146,150 L162,150 M62,120 L50,108 M138,120 L150,108 M62,180 L50,192 M138,180 L150,192"
            stroke={INK}
            strokeWidth={3.5}
            opacity={0.4}
            strokeLinecap="round"
          />
        </G>
      );

    case 'rocket':
      return (
        <G>
          <Path d="M64,146 L34,196 L70,184 Z" fill={spec.accent} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M136,146 L166,196 L130,184 Z" fill={spec.accent} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        </G>
      );
  }
}

/* ------------------------------------------------------------------ props */

/**
 * The thing that makes each new buddy recognisable at a glance: the bear's
 * book, the tiger's ball. Drawn over the body and under the head.
 */
export function HeldProp({ id, spec }: { id: BuddyId; spec: BuddySpec }) {
  switch (id) {
    case 'bear':
      return (
        <G>
          <Path
            d="M118,196 L118,158 Q144,148 172,158 L172,196 Q144,186 118,196 Z"
            fill="#FFFDF7"
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
          <Path d="M145,153 L145,191" stroke={INK} strokeWidth={4} />
          <Path
            d="M124,166 L139,163 M124,176 L139,173 M151,163 L166,166 M151,173 L166,176"
            stroke={INK}
            strokeWidth={3}
            opacity={0.4}
            strokeLinecap="round"
          />
        </G>
      );

    case 'tiger':
      return (
        <G>
          <Circle cx={164} cy={190} r={19} fill="#FFFFFF" stroke={INK} strokeWidth={STROKE} />
          <Path d="M164,178 L172,184 L169,194 L159,194 L156,184 Z" fill={INK} />
        </G>
      );

    case 'bunny':
      return (
        <G transform="rotate(18, 150, 160)">
          <Rect x={144} y={140} width={12} height={48} rx={6} fill={palette.clay} stroke={INK} strokeWidth={4} />
          <Path
            d="M142,142 L158,142 L155,124 L145,124 Z"
            fill={palette.grape}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        </G>
      );

    case 'panda':
      return (
        <G transform="rotate(20, 152, 160)">
          <Rect x={148} y={142} width={10} height={46} rx={5} fill={palette.clay} stroke={INK} strokeWidth={4} />
          <Ellipse cx={153} cy={134} rx={14} ry={17} fill={palette.clay} stroke={INK} strokeWidth={4} />
        </G>
      );

    default:
      return null;
  }
}

/* ------------------------------------------------------------------- head */

/** Ears, head silhouette, muzzle and anything species specific on the face. */
export function HeadShape({ id, spec }: { id: BuddyId; spec: BuddySpec }) {
  switch (id) {
    case 'fox':
      return (
        <G>
          <Path d="M56,54 L48,4 L92,32 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M144,54 L152,4 L108,32 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M63,46 L59,20 L81,34 Z" fill={spec.accent} />
          <Path d="M137,46 L141,20 L119,34 Z" fill={spec.accent} />
          <Circle cx={100} cy={84} r={54} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={108} rx={30} ry={22} fill={spec.light} />
          <Path d="M94,102 L106,102 L100,110 Z" fill={INK} />
        </G>
      );

    case 'cat':
      return (
        <G>
          <Path d="M60,48 L56,10 L94,30 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M140,48 L144,10 L106,30 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M67,42 L65,24 L83,33 Z" fill={spec.accent} />
          <Path d="M133,42 L135,24 L117,33 Z" fill={spec.accent} />
          <Circle cx={100} cy={84} r={54} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={110} rx={26} ry={18} fill={spec.light} />
          <Path d="M94,102 L106,102 L100,110 Z" fill={INK} />
          <Path
            d="M40,104 L18,100 M40,114 L18,118 M160,104 L182,100 M160,114 L182,118"
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </G>
      );

    case 'dino':
      return (
        <G>
          <Path
            d="M62,36 L72,14 L82,34 Z M96,28 L106,6 L116,26 Z"
            fill={spec.accent}
            stroke={INK}
            strokeWidth={STROKE}
            strokeLinejoin="round"
          />
          <Ellipse cx={100} cy={86} rx={56} ry={52} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={110} rx={32} ry={22} fill={spec.light} />
          <Circle cx={90} cy={106} r={4} fill={INK} />
          <Circle cx={110} cy={106} r={4} fill={INK} />
        </G>
      );

    case 'owl':
      return (
        <G>
          <Path d="M58,44 L52,8 L84,30 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Path d="M142,44 L148,8 L116,30 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Circle cx={100} cy={84} r={54} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={78} cy={82} r={26} fill={spec.light} stroke={INK} strokeWidth={4} />
          <Circle cx={122} cy={82} r={26} fill={spec.light} stroke={INK} strokeWidth={4} />
          <Path d="M92,100 L108,100 L100,120 Z" fill={palette.sun} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </G>
      );

    case 'robot':
      return (
        <G>
          {/* Antenna. The bulb is the one warm colour on a cool character, so
              the eye goes to the top of the head first. */}
          <Path d="M100,36 L100,10" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <Circle cx={100} cy={2} r={11.5} fill={palette.coral} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={96} cy={-2} r={3.6} fill="#FFFFFF" opacity={0.75} />

          {/* Ear cups, set outside the shell so the head reads wide rather
              than tall. They also give a hat somewhere to sit. */}
          <Circle cx={30} cy={86} r={17} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={30} cy={86} r={7} fill={spec.shade} />
          <Circle cx={170} cy={86} r={17} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={170} cy={86} r={7} fill={spec.shade} />

          <Rect x={40} y={30} width={120} height={106} rx={34} fill={spec.body} stroke={INK} strokeWidth={STROKE} />

          {/* Four bolts. The one detail that still says machine at the size the
              friends board draws these. */}
          <Circle cx={54} cy={46} r={3.4} fill={spec.shade} />
          <Circle cx={146} cy={46} r={3.4} fill={spec.shade} />
          <Circle cx={54} cy={124} r={3.4} fill={spec.shade} />
          <Circle cx={146} cy={124} r={3.4} fill={spec.shade} />

          {/* The screen. Dark, so the face on it reads as emitted light rather
              than as drawn-on features: it is the whole reason this one is a
              robot and not a blue animal with a square head. */}
          <Rect x={56} y={54} width={88} height={62} rx={22} fill={palette.night} stroke={INK} strokeWidth={4} />
          {/* Glass, as a hairline along the top inside edge. A diagonal wedge
              was tried here first and read as a smudge on the screen. */}
          <Path
            d="M70,60 Q100,55 130,60"
            stroke="#FFFFFF"
            strokeWidth={3}
            opacity={0.18}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );

    case 'scout':
      return (
        <G>
          {/* A headlamp rather than an antenna: this one is kitted out for
              going somewhere, which is the junior tier's whole frame. */}
          <Path d="M86,32 L114,32 L110,8 L90,8 Z" fill={spec.shade} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Ellipse cx={100} cy={8} rx={13} ry={7} fill={palette.sun} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={96} cy={6} rx={4} ry={2.4} fill="#FFFFFF" opacity={0.8} />

          {/* One aerial, on one side, so the head is not a mirror of itself. */}
          <Path d="M152,40 L168,16" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={169} cy={13} r={6} fill={palette.coral} stroke={INK} strokeWidth={4} />

          <Circle cx={30} cy={92} r={16} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Rect x={23} y={86} width={14} height={4} rx={2} fill={spec.shade} />
          <Rect x={23} y={94} width={14} height={4} rx={2} fill={spec.shade} />
          <Circle cx={170} cy={92} r={16} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Rect x={163} y={86} width={14} height={4} rx={2} fill={spec.shade} />
          <Rect x={163} y={94} width={14} height={4} rx={2} fill={spec.shade} />

          <Rect x={40} y={32} width={120} height={104} rx={26} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          {/* A brow plate. It is the single thing that makes this one read as
              older than the round one, before any other detail lands. */}
          <Path d="M40,62 L160,62 L160,50 Q100,36 40,50 Z" fill={spec.shade} opacity={0.45} />
          <Circle cx={52} cy={122} r={3.4} fill={spec.shade} />
          <Circle cx={148} cy={122} r={3.4} fill={spec.shade} />

          {/* Goggles: wider and shallower than the round one's screen. */}
          <Rect x={52} y={68} width={96} height={50} rx={18} fill={palette.night} stroke={INK} strokeWidth={4} />
          <Path d="M66,74 Q100,69 134,74" stroke="#FFFFFF" strokeWidth={3} opacity={0.16} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'byte':
      return (
        <G>
          {/* A stub, not a bobbing ball. Nothing on this one waves for
              attention: at ten to thirteen that is the fastest way to lose them. */}
          <Path d="M100,34 L100,18" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <Circle cx={100} cy={14} r={5.5} fill={TEEN_ACID} stroke={INK} strokeWidth={4} />

          <Rect x={26} y={78} width={16} height={26} rx={6} fill={spec.accent} stroke={INK} strokeWidth={4} />
          <Rect x={158} y={78} width={16} height={26} rx={6} fill={spec.accent} stroke={INK} strokeWidth={4} />

          {/* Squarer shell and a smaller radius. The teen tier is tight
              everywhere: hairline rules, small radii, no soft edges. */}
          <Rect x={42} y={34} width={116} height={100} rx={20} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          {/* Near-black loses its form against a near-black outline, so one
              hairline puts the curve back without adding decoration. */}
          <Path d="M56,44 Q100,38 144,44" stroke={spec.accent} strokeWidth={3} fill="none" opacity={0.7} strokeLinecap="round" />

          {/* One letterbox visor rather than a face-shaped screen. */}
          <Rect x={54} y={66} width={92} height={44} rx={14} fill={palette.night} stroke={INK} strokeWidth={4} />
          <Path d="M66,72 Q100,68 134,72" stroke="#FFFFFF" strokeWidth={2.5} opacity={0.14} fill="none" strokeLinecap="round" />
        </G>
      );

    case 'star':
      return (
        <Path
          d="M100,20 L116.5,60.4 L159,63.8 L126.6,92.7 L136.4,134.2 L100,112 L63.6,134.2 L73.4,92.7 L41,63.8 L83.5,60.4 Z"
          fill={spec.body}
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      );

    case 'bear':
      return (
        <G>
          <Circle cx={57} cy={42} r={23} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={143} cy={42} r={23} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={57} cy={42} r={12} fill={spec.accent} />
          <Circle cx={143} cy={42} r={12} fill={spec.accent} />
          <Circle cx={100} cy={84} r={55} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={107} rx={34} ry={25} fill={spec.light} />
          <Ellipse cx={100} cy={98} rx={10} ry={7.5} fill={INK} />
        </G>
      );

    case 'tiger':
      return (
        <G>
          <Circle cx={59} cy={40} r={20} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={141} cy={40} r={20} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={59} cy={40} r={10} fill={spec.light} />
          <Circle cx={141} cy={40} r={10} fill={spec.light} />
          <Circle cx={100} cy={84} r={55} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Path
            d="M52,94 L70,91 M56,110 L72,105 M148,94 L130,91 M144,110 L128,105"
            stroke={spec.accent}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <Ellipse cx={100} cy={110} rx={30} ry={21} fill={spec.light} />
          <Path d="M92,102 L108,102 L100,111 Z" fill={INK} />
          <Path
            d="M48,62 Q100,42 152,62 L152,76 Q100,56 48,76 Z"
            fill={palette.coral}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path d="M88,55 L112,52" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
        </G>
      );

    case 'bunny':
      return (
        <G>
          <G transform="rotate(-11, 79, 18)">
            <Rect x={68} y={-14} width={23} height={64} rx={11.5} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
            <Rect x={74} y={-5} width={11} height={46} rx={5.5} fill={spec.accent} />
          </G>
          <G transform="rotate(11, 121, 18)">
            <Rect x={109} y={-14} width={23} height={64} rx={11.5} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
            <Rect x={115} y={-5} width={11} height={46} rx={5.5} fill={spec.accent} />
            <Ellipse cx={124} cy={6} rx={7} ry={5} fill={palette.mint} />
          </G>
          <Circle cx={100} cy={86} r={53} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={112} rx={28} ry={19} fill={spec.light} />
          <Path d="M93,104 L107,104 L100,112 Z" fill={INK} />
          <Path
            d="M44,108 L22,104 M44,118 L22,122 M156,108 L178,104 M156,118 L178,122"
            stroke={INK}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <Ellipse
            cx={88}
            cy={44}
            rx={41}
            ry={20}
            fill={palette.grape}
            stroke={INK}
            strokeWidth={STROKE}
            transform="rotate(-12, 88, 44)"
          />
          <Circle cx={116} cy={28} r={8} fill={palette.grape} stroke={INK} strokeWidth={4} />
        </G>
      );

    case 'panda':
      return (
        <G>
          <Circle cx={55} cy={40} r={21} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={145} cy={40} r={21} fill={spec.accent} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={100} cy={86} r={55} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={78} cy={84} rx={20} ry={25} fill={spec.accent} transform="rotate(-16, 78, 84)" />
          <Ellipse cx={122} cy={84} rx={20} ry={25} fill={spec.accent} transform="rotate(16, 122, 84)" />
          <Ellipse cx={100} cy={114} rx={27} ry={19} fill={spec.light} />
          <Ellipse cx={100} cy={105} rx={9} ry={7} fill={INK} />
          <G>
            <Circle cx={70} cy={14} r={21} fill="#FFFDF7" stroke={INK} strokeWidth={STROKE} />
            <Circle cx={130} cy={14} r={21} fill="#FFFDF7" stroke={INK} strokeWidth={STROKE} />
            <Circle cx={100} cy={2} r={24} fill="#FFFDF7" stroke={INK} strokeWidth={STROKE} />
            <Rect x={64} y={20} width={72} height={27} rx={9} fill="#FFFDF7" stroke={INK} strokeWidth={STROKE} />
          </G>
        </G>
      );

    case 'turtle':
      return (
        <G>
          <Ellipse cx={100} cy={86} rx={50} ry={48} fill={spec.body} stroke={INK} strokeWidth={STROKE} />
          <Ellipse cx={100} cy={110} rx={30} ry={20} fill={spec.light} />
          <Circle cx={92} cy={103} r={3.5} fill={INK} />
          <Circle cx={108} cy={103} r={3.5} fill={INK} />
          <Path
            d="M100,42 C112,20 138,18 141,21 C140,38 122,48 100,42 Z"
            fill={palette.leaf}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path d="M102,41 C114,35 128,27 138,23" stroke={INK} strokeWidth={3} fill="none" />
        </G>
      );

    case 'rocket':
      return (
        <G>
          {/* Red nose cone over a pale hull, so it reads as a rocket and not a hood. */}
          <Path d="M100,-14 L56,50 L144,50 Z" fill={spec.body} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
          <Rect x={50} y={40} width={100} height={98} rx={26} fill="#F4F1EA" stroke={INK} strokeWidth={STROKE} />
          {/* Hull stripe, kept below the cone so it is not swallowed by it. */}
          <Rect x={52} y={52} width={96} height={12} fill={spec.body} />
          <Rect x={50} y={40} width={100} height={98} rx={26} fill="none" stroke={INK} strokeWidth={STROKE} />
          <Circle cx={100} cy={91} r={38} fill={spec.light} stroke={INK} strokeWidth={STROKE} />
          <Circle cx={100} cy={91} r={31} fill="none" stroke={INK} strokeWidth={2.5} opacity={0.3} />
          <Path d="M78,70 A32,32 0 0 1 96,58" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.75} />
        </G>
      );
  }
}

/* ------------------------------------------------------------ screen faces */

/** The three buddies whose expression is drawn on a screen, not on a head. */
const SCREEN_FACED = new Set<BuddyId>(['robot', 'scout', 'byte']);

export function isScreenFaced(id: BuddyId): boolean {
  return SCREEN_FACED.has(id);
}

/**
 * The face on a robot's screen.
 *
 * Kept out of the shared `Eyes`/`Mouth` because it does not work the way an
 * animal face works. It is drawn in light on dark, its shapes change rather
 * than its lids, and each of the three screens is a different size, so the
 * features cannot come from one `FaceLayout` the way every other buddy's do.
 *
 * `byte` answers in bars rather than a face at all. That is not laziness with
 * the geometry: the 10-13 tier's whole brief is that it has to survive a
 * friend glancing at the screen, and a grinning cartoon is exactly what a
 * twelve year old does not want to be seen with.
 */
export function ScreenFace({
  id,
  mood,
  closed,
  frame,
}: {
  id: BuddyId;
  mood: BuddyMood;
  closed: boolean;
  frame: number;
}) {
  if (id === 'byte') {
    const lively = mood === 'happy' || mood === 'cheer';
    const thin = closed || mood === 'sleepy';
    const mouthWidth = mood === 'cheer' ? 38 : lively ? 34 : mood === 'talking' ? 20 + frame * 8 : 28;
    return (
      <G>
        <Rect x={70} y={thin ? 85 : 82} width={22} height={thin ? 3 : 9} rx={thin ? 1.5 : 4.5} fill={TEEN_ACID} />
        <Rect x={108} y={thin ? 85 : 82} width={22} height={thin ? 3 : 9} rx={thin ? 1.5 : 4.5} fill={TEEN_ACID} />
        <Rect
          x={100 - mouthWidth / 2}
          y={99}
          width={mouthWidth}
          height={4}
          rx={2}
          fill={TEEN_ACID}
          opacity={lively ? 1 : 0.55}
        />
      </G>
    );
  }

  // The round one and the kitted-out one share a face language and differ only
  // in where it sits: the goggles are lower and shallower than the screen.
  const eyeY = id === 'scout' ? 88 : 82;
  const eyeDx = id === 'scout' ? 21 : 20;
  const mouthY = id === 'scout' ? 103 : 98;
  const left = 100 - eyeDx;
  const right = 100 + eyeDx;

  const eyes = closed ? (
    <Path
      d={`M${left - 9},${eyeY} L${left + 9},${eyeY} M${right - 9},${eyeY} L${right + 9},${eyeY}`}
      stroke={SCREEN_GLOW}
      strokeWidth={6}
      strokeLinecap="round"
    />
  ) : mood === 'sleepy' ? (
    <Path
      d={`M${left - 9},${eyeY + 2} Q${left},${eyeY + 10} ${left + 9},${eyeY + 2} M${right - 9},${eyeY + 2} Q${right},${eyeY + 10} ${right + 9},${eyeY + 2}`}
      stroke={SCREEN_GLOW}
      strokeWidth={6}
      strokeLinecap="round"
      fill="none"
    />
  ) : mood === 'happy' || mood === 'cheer' ? (
    <G>
      <Path d={`M${left - 9},${eyeY + 3} Q${left},${eyeY + 3 - (mood === 'cheer' ? 18 : 14)} ${left + 9},${eyeY + 3} Z`} fill={SCREEN_GLOW} />
      <Path d={`M${right - 9},${eyeY + 3} Q${right},${eyeY + 3 - (mood === 'cheer' ? 18 : 14)} ${right + 9},${eyeY + 3} Z`} fill={SCREEN_GLOW} />
    </G>
  ) : (
    <G>
      <Circle cx={left} cy={eyeY} r={9} fill={SCREEN_GLOW} />
      <Circle cx={right} cy={eyeY} r={9} fill={SCREEN_GLOW} />
    </G>
  );

  let mouth;
  if (mood === 'sleepy') {
    mouth = <Ellipse cx={100} cy={mouthY + 4} rx={7} ry={9} fill={SCREEN_GLOW} opacity={0.85} />;
  } else if (mood === 'talking') {
    mouth =
      frame === 0 ? (
        <Ellipse cx={100} cy={mouthY + 2} rx={9} ry={10} fill={SCREEN_GLOW} />
      ) : frame === 1 ? (
        <Ellipse cx={100} cy={mouthY + 2} rx={13} ry={6} fill={SCREEN_GLOW} />
      ) : (
        <Path
          d={`M${100 - 13},${mouthY - 1} Q100,${mouthY + 10} ${100 + 13},${mouthY - 1}`}
          stroke={SCREEN_GLOW}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      );
  } else if (mood === 'happy' || mood === 'cheer') {
    // Kept inside the glass: the animals' happy mouth opens to y+26, which on
    // either of these runs off the bottom of the screen it is drawn on.
    const drop = mood === 'cheer' ? 20 : 16;
    mouth = (
      <G>
        <Path d={`M82,${mouthY - 4} Q100,${mouthY - 4 + drop} 118,${mouthY - 4} Z`} fill={SCREEN_GLOW} />
        {mood === 'cheer' && <Path d={`M91,${mouthY + 5} Q100,${mouthY + 14} 109,${mouthY + 5} Z`} fill="#FF7A8A" />}
      </G>
    );
  } else {
    mouth = (
      <Path
        d={`M86,${mouthY} Q100,${mouthY + 12} 114,${mouthY}`}
        stroke={SCREEN_GLOW}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  return (
    <G>
      {eyes}
      {mouth}
    </G>
  );
}
