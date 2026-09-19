import { useContext, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_COLUMN, space } from '../theme';
import { Sky } from './Sky';

/**
 * A page in the 3-5 interface.
 *
 * The sky is painted once behind everything and does not move with the
 * content: what scrolls is the stickers laid on top of it. A `header` stays
 * pinned above that scroll, which is where the star and coin counts live, so
 * a child never has to scroll back up to find out how they are doing.
 */
export function LittleScreen({
  children,
  header,
  sky = true,
  background,
  scroll = true,
  padded = true,
  contentStyle,
}: {
  children: ReactNode;
  /** Pinned above the scroll, under the status bar. */
  header?: ReactNode;
  /** Off for screens that paint a world of their own, such as the journey. */
  sky?: boolean;
  /** A flat colour instead of the sky. */
  background?: string;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const tabBar = useContext(BottomTabBarHeightContext);
  const bottom = (tabBar ?? insets.bottom) + space.xl;

  const column = (
    <View style={[{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }, contentStyle]}>{children}</View>
  );

  const padding = {
    paddingTop: header ? space.md : insets.top + space.md,
    paddingBottom: bottom,
    paddingHorizontal: padded ? space.lg : 0,
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {sky && !background ? <Sky /> : null}

      {header ? (
        <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.xs }}>
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
