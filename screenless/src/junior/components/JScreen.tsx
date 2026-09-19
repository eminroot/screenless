import { useContext, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { MAX_COLUMN, palette, space } from '../theme';

/**
 * A page in the 6-8 interface.
 *
 * The ground is deep indigo, and everything on it is a cut-out card. That is
 * the reverse of the tier below, where the world is bright and the cards are
 * white, and it is the fastest way to signal that this is not the little
 * version of the app: the same content, played in a lower key.
 *
 * Nothing animates back here. The ground is scattered with a few faint marks
 * so it reads as a surface rather than as emptiness, and that is all it does —
 * a moving background behind a mission would be competing with the mission.
 */
export function JScreen({
  children,
  header,
  scroll = true,
  padded = true,
  background = palette.ground,
  contentStyle,
}: {
  children: ReactNode;
  /** Pinned above the scroll, under the status bar. */
  header?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: string;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext);
  const bottom = (tabBar ?? insets.bottom) + space.xl;

  const column = (
    <View style={[{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }, contentStyle]}>
      {children}
    </View>
  );

  const padding = {
    paddingTop: header ? space.md : insets.top + space.lg,
    paddingBottom: bottom,
    paddingHorizontal: padded ? space.lg : 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <GroundMarks />

      {header ? (
        <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}>{header}</View>
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1 }, padding]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {column}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padding]}>{column}</View>
      )}
    </View>
  );
}

/**
 * Faint marks on the ground: a few dots and two compass ticks. Fixed
 * positions rather than random, so the page looks the same every time it is
 * opened — a background that reshuffles itself is a background you notice.
 */
function GroundMarks() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 200">
        <Circle cx={12} cy={18} r={0.9} fill={palette.groundLine} />
        <Circle cx={84} cy={34} r={1.2} fill={palette.groundLine} />
        <Circle cx={30} cy={62} r={0.8} fill={palette.groundLine} />
        <Circle cx={70} cy={88} r={1} fill={palette.groundLine} />
        <Circle cx={16} cy={112} r={1.1} fill={palette.groundLine} />
        <Circle cx={88} cy={140} r={0.9} fill={palette.groundLine} />
        <Circle cx={42} cy={158} r={1} fill={palette.groundLine} />
        <Circle cx={64} cy={182} r={0.8} fill={palette.groundLine} />
        <Path d="M6 48h5M8.5 45.5v5" stroke={palette.groundLine} strokeWidth={0.7} strokeLinecap="round" />
        <Path d="M90 106h5M92.5 103.5v5" stroke={palette.groundLine} strokeWidth={0.7} strokeLinecap="round" />
      </Svg>
    </View>
  );
}
