import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { PinDots, PinPad } from './PinPad';
import { Sticker, Txt } from './ui';
import { useI18n } from '../i18n';
import { useApp } from '../state/app-state';
import { colors, spacing } from '../theme/tokens';

/** Everything a parent decides sits behind this. */
export function ParentGate({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useI18n();
  const { data } = useApp();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (value.length < 4) return;
    if (value === data.settings.parentPin) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUnlock();
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('pin.wrong'));
      setValue('');
    }
  }, [value, data.settings.parentPin, onUnlock, t]);

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Txt variant="title">🔒</Txt>
        <Txt variant="heading">{t('pin.unlockTitle')}</Txt>
        <Txt variant="small" color={colors.textSoft} center>
          {t('pin.unlockSubtitle')}
        </Txt>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <PinDots filled={value.length} />
        {error ? (
          <Txt variant="small" color={colors.primaryDeep}>
            {error}
          </Txt>
        ) : null}
      </View>

      <PinPad
        value={value}
        onChange={(next) => {
          setError(null);
          setValue(next);
        }}
      />

      <Pressable onPress={() => setShowHelp((v) => !v)} hitSlop={8}>
        <Txt variant="small" color={colors.textFaint} center style={{ textDecorationLine: 'underline' }}>
          {t('pin.forgot')}
        </Txt>
      </Pressable>

      {showHelp ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
          <Txt variant="small" color={colors.textSoft}>
            {t('pin.forgotBody')}
          </Txt>
        </Sticker>
      ) : null}
    </View>
  );
}
