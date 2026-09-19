import { useContext, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Turn off for full height layouts. */
  scroll?: boolean;
  background?: string;
  padded?: boolean;
  /** Extra space under the content, only for a bar that floats over it. */
  bottomInset?: number;
  contentStyle?: StyleProp<ViewStyle>;
  avoidKeyboard?: boolean;
};

export function Screen({
  children,
  scroll = true,
  background = colors.bg,
  padded = true,
  bottomInset = 0,
  contentStyle,
  avoidKeyboard = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  // Inside the tab navigator the bar already sits on the gesture inset and the
  // scene stops above it. Counting the inset again here is what left a band of
  // dead space under every tab screen.
  const insideTabs = useContext(BottomTabBarHeightContext) != null;

  const padding = {
    paddingTop: insets.top + (padded ? spacing.lg : 0),
    paddingBottom: (insideTabs ? 0 : insets.bottom) + bottomInset + (padded ? spacing.lg : 0),
    paddingHorizontal: padded ? spacing.xl : 0,
  };

  const body = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.grow, padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      // Left on: without it a long page gives no sense of how much is left,
      // which reads as "nothing happened" when you swipe.
      showsVerticalScrollIndicator
      contentInsetAdjustmentBehavior="never"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padding, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: background }]}>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Short pages fill the viewport, so `justifyContent` in `contentStyle` works
  // and a page that nearly fits never scrolls by a few stray pixels.
  grow: { flexGrow: 1 },
});
