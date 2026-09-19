import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { PinDots, PinPad } from '../../components/PinPad';
import { Screen, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { colors, spacing } from '../../theme/tokens';

export default function ChangePin() {
  const router = useRouter();
  const { t } = useI18n();
  const { setParentPin } = useApp();

  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [stage, setStage] = useState<'first' | 'repeat'>('first');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stage === 'first' && first.length === 4) {
      setStage('repeat');
      return;
    }
    if (stage === 'repeat' && second.length === 4) {
      if (second === first) {
        setParentPin(second);
        router.back();
      } else {
        setError(t('pin.mismatch'));
        setFirst('');
        setSecond('');
        setStage('first');
      }
    }
  }, [first, second, stage, setParentPin, router, t]);

  const value = stage === 'first' ? first : second;
  const setValue = stage === 'first' ? setFirst : setSecond;

  return (
    <Screen scroll={false}>
      <TopBar title={t('parent.settingPin')} />

      <View style={{ alignItems: 'center', marginTop: spacing.xl, gap: spacing.lg }}>
        <Txt variant="subheading">{stage === 'first' ? t('pin.enter') : t('pin.repeat')}</Txt>
        <PinDots filled={value.length} />
        {error ? (
          <Txt variant="small" color={colors.primaryDeep}>
            {error}
          </Txt>
        ) : null}
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <PinPad
          value={value}
          onChange={(next) => {
            setError(null);
            setValue(next);
          }}
        />
      </View>
    </Screen>
  );
}
