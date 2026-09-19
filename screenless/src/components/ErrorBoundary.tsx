import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button, Screen, Sticker, Txt } from './ui';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme/tokens';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Keeps a render crash from showing a child a blank white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <Fallback onReset={() => this.setState({ error: null })} />;
  }
}

function Fallback({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center' }}>
      <Sticker background={colors.surface} style={{ padding: spacing.xl, gap: spacing.md }}>
        <Txt variant="title">🙃</Txt>
        <Txt variant="heading">{t('errors.genericTitle')}</Txt>
        <Txt variant="body" color={colors.textSoft}>
          {t('errors.genericBody')}
        </Txt>
        <View style={{ height: spacing.sm }} />
        <Button label={t('errors.restart')} onPress={onReset} tone="primary" />
      </Sticker>
    </Screen>
  );
}
