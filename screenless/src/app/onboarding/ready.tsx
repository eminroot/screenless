import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { Buddy } from '../../components/buddy/Buddy';
import { Button, Confetti, Screen, SpeechBubble, StepDots, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { spacing } from '../../theme/tokens';
import { useDraft } from './_layout';

export default function Ready() {
  const router = useRouter();
  const { t } = useI18n();
  const { draft } = useDraft();
  const { saveProfile } = useApp();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved || !draft.ageBand || !draft.buddyId) return;
    saveProfile({
      nickname: draft.nickname.trim(),
      ageBand: draft.ageBand,
      interests: draft.interests,
      buddyId: draft.buddyId,
      buddyName: draft.buddyName.trim(),
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  }, [draft, saved, saveProfile]);

  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'space-between' }}>
      <Confetti />

      <View>
        <StepDots step={6} total={6} />
        <Txt variant="display">{t('ready.title')}</Txt>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        <SpeechBubble
          text={t('ready.body', { buddy: draft.buddyName, name: draft.nickname })}
          tailSide="left"
        />
        {draft.buddyId ? (
          <Buddy id={draft.buddyId} size={220} mood="cheer" label={draft.buddyName} />
        ) : null}
      </View>

      <Button
        label={t('ready.go')}
        tone="success"
        onPress={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
