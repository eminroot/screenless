import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BackIcon } from '../icons';
import { accents, space } from '../theme';
import { IconButton } from './Button';
import { Bar } from './Stat';

/**
 * The top of a screen the child is working through: a way back on the left, a
 * bar showing how far in they are, and what it is worth on the right.
 *
 * It never scrolls away. A seven year old who is halfway through something and
 * wants out should not have to go looking for the exit, and the bar answers
 * "how much more" without anybody having to ask a grown up.
 */
export function LessonBar({
  progress,
  trailing,
  onBack,
  backLabel,
}: {
  /** 0 to 1. */
  progress: number;
  trailing?: ReactNode;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <IconButton
        icon={<BackIcon size={22} color={accents.amber.on} />}
        accent="amber"
        kind="solid"
        size={46}
        accessibilityLabel={backLabel}
        onPress={onBack}
      />
      <Bar value={progress} accent="green" height={18} onCream={false} style={{ flex: 1 }} />
      {trailing}
    </View>
  );
}
