import { Pressable, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { Txt } from './ui';
import { zones, type Zone } from '../data/zones';
import { useI18n } from '../i18n';
import { borderWidth, colors, palette, radii, spacing } from '../theme/tokens';

const INK = palette.ink;
const W = 320;
const H = 420;

/** Pixel position of a zone inside the drawing's own coordinates. */
const at = (zone: Zone) => ({ x: zone.x * W, y: zone.y * H });

/** The dashed trail, drawn through the zone markers in order. */
const trail = (() => {
  const points = zones.map(at);
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    // A control point pushed sideways turns the straight hops into a wandering
    // path, which is what makes it read as a map rather than a progress bar.
    const bend = i % 2 === 0 ? -46 : 46;
    d += ` Q${(from.x + to.x) / 2 + bend},${(from.y + to.y) / 2} ${to.x},${to.y}`;
  }
  return d;
})();

export type AdventureMapProps = {
  /** Everything up to and including this level is open. */
  level: number;
  onSelect?: (zone: Zone) => void;
  selected?: Zone['id'];
};

export function AdventureMap({ level, onSelect, selected }: AdventureMapProps) {
  const { t } = useI18n();

  return (
    <View style={{ width: '100%', aspectRatio: W / H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* sea */}
        <Rect x={0} y={0} width={W} height={H} rx={26} fill="#BFE6FF" />
        <Path
          d="M0,300 Q40,292 80,300 T160,300 T240,300 T320,300"
          stroke="#8FD2F5"
          strokeWidth={4}
          fill="none"
        />
        <Path
          d="M0,120 Q40,112 80,120 T160,120 T240,120 T320,120"
          stroke="#8FD2F5"
          strokeWidth={4}
          fill="none"
        />

        {/* island */}
        <Path
          d="M38,398 C8,346 34,296 26,242 C16,174 62,92 136,56 C208,20 290,56 286,136 C283,196 266,244 280,300 C292,350 248,408 178,406 C120,404 66,414 38,398 Z"
          fill="#F3E3BE"
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <Path
          d="M48,384 C22,338 46,292 38,240 C28,178 70,102 140,68 C206,34 276,68 272,140 C269,196 254,242 266,294 C276,340 238,394 178,392 C126,390 74,398 48,384 Z"
          fill="#E7F3D2"
        />

        {/* the trail between places */}
        <Path
          d={trail}
          stroke={INK}
          strokeWidth={5}
          strokeDasharray="2 13"
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />

        <Scenery />
      </Svg>

      {zones.map((zone) => {
        const open = level >= zone.level;
        const here = level === zone.level;
        const point = at(zone);

        return (
          <Pressable
            key={zone.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !open, selected: selected === zone.id }}
            accessibilityLabel={open ? t(zone.nameKey) : t('map.lockedZone')}
            onPress={() => onSelect?.(zone)}
            style={{
              position: 'absolute',
              left: `${zone.x * 100}%`,
              top: `${zone.y * 100}%`,
              width: 62,
              alignItems: 'center',
              transform: [{ translateX: -31 }, { translateY: -30 }],
            }}
          >
            <View
              style={{
                width: here ? 54 : 46,
                height: here ? 54 : 46,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: open ? zone.color : '#D8D2C4',
                borderWidth: here ? borderWidth.chunky : borderWidth.thick,
                borderColor: INK,
                opacity: open ? 1 : 0.85,
              }}
            >
              <Txt variant={here ? 'title' : 'heading'} style={{ opacity: open ? 1 : 0.45 }}>
                {open ? zone.emoji : '🔒'}
              </Txt>
            </View>

            {here ? (
              <View
                style={{
                  marginTop: 3,
                  backgroundColor: colors.surface,
                  borderRadius: radii.pill,
                  borderWidth: borderWidth.hair,
                  borderColor: INK,
                  paddingHorizontal: spacing.sm,
                }}
              >
                <Txt variant="tiny" numberOfLines={1}>
                  {t(zone.nameKey)}
                </Txt>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Fixed island decoration. Nothing here reacts to progress. */
function Scenery() {
  return (
    <G opacity={0.9}>
      {/* forest */}
      <G>
        <Path d="M118,346 L130,318 L142,346 Z" fill="#5FBF7A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M170,352 L182,322 L194,352 Z" fill="#4FAE6B" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M144,364 L154,340 L164,364 Z" fill="#6FCB8A" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </G>

      {/* mountain */}
      <G>
        <Path d="M186,300 L222,238 L258,300 Z" fill="#C6B49A" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <Path d="M210,262 L222,238 L234,262 L222,256 Z" fill="#FFFDF7" />
      </G>

      {/* a lake by the ocean stop */}
      <G>
        <Ellipse cx={82} cy={244} rx={44} ry={24} fill="#7FC9EE" stroke={INK} strokeWidth={3.5} />
        <Path d="M62,242 Q72,236 82,242 T102,242" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.7} />
      </G>

      {/* desert dunes */}
      <G>
        <Path d="M150,206 Q178,184 210,206 Z" fill="#EFD79B" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <Path d="M188,214 Q210,198 232,214 Z" fill="#E6C97F" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      </G>

      {/* castle */}
      <G>
        <Rect x={210} y={96} width={44} height={34} fill="#E4D9F5" stroke={INK} strokeWidth={3.5} />
        <Rect x={204} y={82} width={14} height={48} fill="#EFE7FB" stroke={INK} strokeWidth={3.5} />
        <Rect x={246} y={82} width={14} height={48} fill="#EFE7FB" stroke={INK} strokeWidth={3.5} />
        <Path d="M204,82 L211,68 L218,82 Z" fill={palette.bubble} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <Path d="M246,82 L253,68 L260,82 Z" fill={palette.bubble} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </G>

      {/* stars around the launch pad */}
      <G>
        <Circle cx={96} cy={52} r={4} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
        <Circle cx={196} cy={44} r={5} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
        <Circle cx={158} cy={104} r={3.5} fill="#FFFFFF" stroke={INK} strokeWidth={2} />
      </G>
    </G>
  );
}
