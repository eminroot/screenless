import { View } from 'react-native';

import { MissionCard } from '../../components/MissionCard';
import { Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import type { Mission } from '../../state/types';
import { colors, spacing } from '../../theme/tokens';

export default function History() {
  const { t } = useI18n();
  const { doneMissions, skippedMissions } = useApp();

  return (
    <Screen>
      <TopBar title={t('parent.historyTitle')} />

      {doneMissions.length === 0 ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
          <Txt variant="body" color={colors.textSoft}>
            {t('parent.historyEmpty')}
          </Txt>
        </Sticker>
      ) : (
        <View style={{ gap: spacing.lg }}>
          {doneMissions.map((mission) => (
            <View key={mission.id} style={{ gap: spacing.xs }}>
              <Txt variant="tiny" color={colors.textFaint}>
                {formatDate(mission)}
              </Txt>
              <MissionCard task={mission.task} compact />
            </View>
          ))}
        </View>
      )}

      {skippedMissions.length > 0 ? (
        <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
          <Txt variant="heading">{t('parent.refusedTitle')}</Txt>
          <Txt variant="small" color={colors.textSoft}>
            {t('parent.refusedBody')}
          </Txt>
          {skippedMissions.slice(0, 12).map((mission) => (
            <MissionCard key={mission.id} task={mission.task} compact faded />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function formatDate(mission: Mission): string {
  const iso = mission.confirmedAt ?? mission.assignedAt;
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
