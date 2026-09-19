import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { Buddy } from '../../components/buddy/Buddy';
import { zones } from '../../data/zones';
import { LEVEL_THRESHOLDS } from '../../engine/progress';
import { useI18n } from '../../i18n';
import { useNarrator } from '../../lib/voice';
import { useApp } from '../../state/app-state';
import { ClayCard, ClayIconButton } from '../components/Clay';
import { LText } from '../components/LText';
import { StatStrip } from '../components/StatStrip';
import { CloseIcon, SpeakerIcon, StarIcon, TargetIcon } from '../icons';
import { MapSection } from '../map/Scenery';
import {
  isStoneLit,
  MAP_W,
  NODES,
  SECTION_H,
  SECTIONS,
  STONES,
  trailProgress,
  walkedDistance,
} from '../map/trail';
import { ZoneArt, ZoneBadge, ZONE_TONES, type ZoneState } from '../map/ZoneBadge';
import { useCycle, useLiveMotion } from '../motion';
import { ink, round, space, tones, world } from '../theme';

/** A map wider than this on a tablet would make the places tiny dots in a field. */
const MAX_MAP_WIDTH = 640;

/**
 * The journey, for ages 3 to 5.
 *
 * One long illustrated world the child scrolls up through, camp at the bottom
 * and the stars at the top. The buddy stands where the child has got to,
 * stones light up on the way to the next place, and every place can be tapped
 * to hear its name. Nothing here can be earned by using the map: it only draws
 * the stars that parent-confirmed missions already gave.
 */
export function LittleMap() {
  const { t, language } = useI18n();
  const { profile, data } = useApp();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const live = useLiveMotion();

  // Snapped to device pixels: the map is seven drawings stacked, and a band
  // that starts on a fraction of a pixel shows a faint line at its edge.
  const mapWidth = PixelRatio.roundToNearestPixel(Math.min(width, MAX_MAP_WIDTH));
  const k = mapWidth / MAP_W;
  const bandHeight = PixelRatio.roundToNearestPixel(SECTION_H * k);
  const ky = bandHeight / SECTION_H;
  const contentHeight = bandHeight * SECTIONS;
  const badge = Math.round(Math.min(96, 78 * Math.max(1, Math.sqrt(k))));

  const stars = data.progress.stars;
  const progress = useMemo(() => trailProgress(stars), [stars]);
  const walked = useMemo(() => walkedDistance(progress), [progress]);
  const litStones = useMemo(() => new Set(STONES.filter((stone) => isStoneLit(stone, progress))), [progress]);

  const narrator = useNarrator(profile?.buddyId ?? 'fox', language, data.settings.voiceEnabled);
  const [selected, setSelected] = useState<number | null>(null);

  const scroller = useRef<ScrollView>(null);
  const placed = useRef(false);
  const scrollY = useSharedValue(0);
  const [buddyOffScreen, setBuddyOffScreen] = useState(false);

  // The buddy sits a little above its spot when standing on a place, so the
  // badge stays tappable underneath it.
  const onPlace = progress.lit === 0;
  const buddySize = Math.round(76 * Math.max(1, Math.sqrt(k)));
  const buddyX = progress.at.x * k + (onPlace ? badge * 0.62 : 0);
  const buddyFootY = progress.at.y * ky - (onPlace ? badge * 0.12 : 4);

  const viewport = height;
  const targetOffset = Math.max(0, Math.min(contentHeight - viewport + tabBar, buddyFootY - viewport * 0.58));

  const scrollToBuddy = useCallback(
    (animated: boolean) => {
      scroller.current?.scrollTo({ y: targetOffset, animated });
    },
    [targetOffset],
  );

  // Every visit starts where the child is, not where they last scrolled to.
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => scrollToBuddy(true), 60);
      return () => clearTimeout(timer);
    }, [scrollToBuddy]),
  );

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => buddyFootY < scrollY.value + insets.top + 60 || buddyFootY > scrollY.value + viewport - tabBar,
    (away, before) => {
      if (away !== before) runOnJS(setBuddyOffScreen)(away);
    },
    [buddyFootY, viewport, tabBar, insets.top],
  );

  const choose = (index: number) => {
    void Haptics.selectionAsync();
    setSelected((current) => (current === index ? null : index));
    const zone = zones[index];
    narrator.say(t(zone.nameKey));
  };

  const hop = useSharedValue(0);
  const buddyStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -hop.value * 18 }] }));

  const tapBuddy = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hop.value = withTiming(1, { duration: 140 }, () => {
      hop.value = withSpring(0, { damping: 6, stiffness: 220 });
    });
    const next = zones[progress.place + 1];
    narrator.say(
      progress.starsToNext === null || !next
        ? t('little.mapAllDone')
        : t('little.mapToNext', { count: progress.starsToNext, place: t(next.nameKey) }),
    );
  };

  if (!profile) return null;

  const stateOf = (index: number): ZoneState =>
    index < progress.place ? 'done' : index === progress.place ? 'here' : 'locked';

  return (
    <View style={{ flex: 1, backgroundColor: world.skyBottom }}>
      <Animated.ScrollView
        ref={scroller as never}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', backgroundColor: world.grass }}
        onContentSizeChange={() => {
          // Only the first layout jumps straight to the buddy; after that the
          // child's own scrolling is left alone.
          if (placed.current) return;
          placed.current = true;
          scrollToBuddy(false);
        }}
      >
        <View style={{ width: mapWidth, height: contentHeight }}>
          {Array.from({ length: SECTIONS }, (_, row) => (
            <MapSection key={row} row={row} width={mapWidth} height={bandHeight} walked={walked} litStones={litStones} />
          ))}

          {DRIFT.map((cloud) => (
            <DriftingCloud key={cloud.row} top={cloud.row * bandHeight} width={mapWidth} size={cloud.size} duration={cloud.duration} start={cloud.start} live={live} />
          ))}

          {NODES.map((node, index) => {
            const zone = zones[index];
            const state = stateOf(index);
            return (
              <View
                key={zone.id}
                style={{
                  position: 'absolute',
                  left: node.x * k - (badge + 40) / 2,
                  top: node.y * ky - badge / 2,
                }}
              >
                <ZoneBadge
                  id={zone.id}
                  state={state}
                  size={badge}
                  name={t(zone.nameKey)}
                  starsNeeded={Math.max(0, zoneStars(index) - stars)}
                  selected={selected === index}
                  live={live}
                  onPress={() => choose(index)}
                />
              </View>
            );
          })}

          <Animated.View
            style={[
              {
                position: 'absolute',
                left: buddyX - buddySize / 2,
                top: buddyFootY - buddySize * 1.02,
                width: buddySize,
                alignItems: 'center',
              },
              buddyStyle,
            ]}
          >
            <View
              style={{
                position: 'absolute',
                bottom: -3,
                width: buddySize * 0.46,
                height: buddySize * 0.11,
                borderRadius: 99,
                backgroundColor: 'rgba(42,33,24,0.12)',
              }}
            />
            <Pressable onPress={tapBuddy} accessibilityRole="button" accessibilityLabel={profile.buddyName}>
              <Buddy id={profile.buddyId} size={buddySize} mood={live ? 'happy' : 'idle'} wearing={data.wardrobe.worn} />
            </Pressable>
          </Animated.View>
        </View>
        <View style={{ height: tabBar, width: mapWidth, backgroundColor: world.grass }} />
      </Animated.ScrollView>

      {/* Floating header: the same score strip as every other screen, legible
          over any band of the map. */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: insets.top + space.sm, left: space.lg, right: space.lg }}
      >
        <StatStrip />
      </View>

      {buddyOffScreen && selected === null ? (
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          exiting={FadeOutDown.duration(160)}
          style={{ position: 'absolute', right: space.lg, bottom: tabBar + space.md }}
        >
          <ClayIconButton
            icon={<TargetIcon size={30} color={tones.sky.ink} />}
            tone="sky"
            size={60}
            accessibilityLabel={t('little.mapFindBuddy')}
            onPress={() => scrollToBuddy(true)}
          />
        </Animated.View>
      ) : null}

      {selected !== null ? (
        <PlaceCard
          index={selected}
          state={stateOf(selected)}
          starsNeeded={Math.max(0, zoneStars(selected) - stars)}
          bottom={tabBar + space.sm}
          onClose={() => setSelected(null)}
          onSpeak={narrator.say}
        />
      ) : null}
    </View>
  );
}

/** Slow clouds over the map, where the scenery is quiet. Just enough to feel alive. */
const DRIFT = [
  { row: 0.72, size: 1, duration: 52_000, start: 0.1 },
  { row: 2.38, size: 0.8, duration: 44_000, start: 0.55 },
  { row: 4.62, size: 1.1, duration: 58_000, start: 0.3 },
  { row: 6.2, size: 0.85, duration: 48_000, start: 0.8 },
];

function DriftingCloud({
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
  const cloudWidth = 110 * size;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloudWidth + travel.value * (width + cloudWidth * 2) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top, left: 0, opacity: 0.85 }, style]}>
      <Svg width={cloudWidth} height={cloudWidth * 0.46} viewBox="0 0 110 50">
        <Ellipse cx={55} cy={40} rx={46} ry={9} fill="rgba(42,33,24,0.08)" />
        <Ellipse cx={55} cy={30} rx={50} ry={16} fill="#FFFFFF" />
        <Circle cx={38} cy={20} r={16} fill="#FFFFFF" />
        <Circle cx={64} cy={16} r={20} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

/** Stars that open a place: the level threshold it sits on. */
function zoneStars(index: number): number {
  return LEVEL_THRESHOLDS[index] ?? 0;
}

function PlaceCard({
  index,
  state,
  starsNeeded,
  bottom,
  onClose,
  onSpeak,
}: {
  index: number;
  state: ZoneState;
  starsNeeded: number;
  bottom: number;
  onClose: () => void;
  onSpeak: (text: string) => void;
}) {
  const { t } = useI18n();
  const zone = zones[index];
  const palette = ZONE_TONES[zone.id];
  const name = t(zone.nameKey);
  const blurb = t(zone.blurbKey);
  const status =
    state === 'here' ? t('little.mapHere') : state === 'done' ? t('little.mapVisited') : t('little.mapLocked', { count: starsNeeded });

  // Opening a place reads it out straight away, so a child who cannot read
  // the card still gets it.
  useEffect(() => {
    onSpeak(`${name}. ${blurb}`);
  }, [name, blurb, onSpeak]);

  return (
    <Animated.View
      key={index}
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutDown.duration(150)}
      style={{ position: 'absolute', left: space.lg, right: space.lg, bottom, alignItems: 'center' }}
    >
      <ClayCard wrapperStyle={{ width: '100%', maxWidth: 520 }} style={{ padding: space.lg, flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <View
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: state === 'locked' ? '#DCD2C0' : palette.face,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 5,
            borderBottomColor: state === 'locked' ? '#BFB39D' : palette.lip,
          }}
        >
          <ZoneArt id={zone.id} size={54} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <LText variant="heading" numberOfLines={1}>
            {name}
          </LText>
          <LText variant="small" color={ink.soft} numberOfLines={2}>
            {blurb}
          </LText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            {state === 'locked' ? <StarIcon size={18} /> : null}
            <LText variant="tiny" color={state === 'here' ? tones.mint.face : ink.soft}>
              {status}
            </LText>
          </View>
        </View>
        <View style={{ gap: space.sm }}>
          <ClayIconButton icon={<CloseIcon size={22} />} size={44} accessibilityLabel={t('common.close')} onPress={onClose} />
          <ClayIconButton
            icon={<SpeakerIcon size={24} color={tones.grape.ink} />}
            tone="grape"
            size={44}
            accessibilityLabel={t('task.readAloud')}
            onPress={() => onSpeak(`${name}. ${blurb}`)}
          />
        </View>
      </ClayCard>
    </Animated.View>
  );
}
