import { useContext, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_COLUMN, space } from '../theme';
import { useSkin } from '../skin';

/**
 * A page in the 10-13 interface.
 *
 * A near-black ground with nothing painted on it. The two tiers below both put
 * something behind the content — a sky, a scattering of marks — because at
 * those ages an empty background reads as an unfinished screen. Here it reads
 * as the app being sure of itself, which is the only thing this age is
 * actually judging.
 */
export function TScreen({
  children,
  header,
  scroll = true,
  padded = true,
  background,
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
  const { palette } = useSkin();
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext);
  const bottom = (tabBar ?? insets.bottom) + space.xl;
  // Resolved here rather than as a default parameter: defaults evaluate
  // before the body runs, so they cannot read the skin.
  const ground = background ?? palette.ground;

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
    <View style={{ flex: 1, backgroundColor: ground }}>
      {header ? (
        <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.md }}>
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
