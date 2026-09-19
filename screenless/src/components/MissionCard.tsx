import { View } from 'react-native';

import { Sticker, Txt } from './ui';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import type { TaskContent } from '../state/types';
import { borderWidth, categoryColors, colors, radii, spacing } from '../theme/tokens';

const categoryLabelKeys: Record<TaskContent['category'], TKey> = {
  move: 'task.categoryMove',
  outdoor: 'task.categoryOutdoor',
  create: 'task.categoryCreate',
  social: 'task.categorySocial',
  calm: 'task.categoryCalm',
};

export function CategoryPill({ category }: { category: TaskContent['category'] }) {
  const { t } = useI18n();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: categoryColors[category],
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: 3,
      }}
    >
      <Txt variant="tiny" color={colors.surface}>
        {t(categoryLabelKeys[category])}
      </Txt>
    </View>
  );
}

export function MissionCard({
  task,
  compact,
  faded,
}: {
  task: TaskContent;
  compact?: boolean;
  faded?: boolean;
}) {
  const { t, pick } = useI18n();

  return (
    <Sticker
      background={faded ? colors.surfaceAlt : colors.surface}
      style={{ padding: spacing.lg, gap: spacing.md }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: radii.md,
            borderWidth: borderWidth.thick,
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Txt variant="title">{task.emoji}</Txt>
        </View>

        <View style={{ flex: 1, gap: spacing.xs }}>
          <CategoryPill category={task.category} />
          <Txt variant="heading">{pick(task.title)}</Txt>
        </View>
      </View>

      {!compact && <Txt variant="body">{pick(task.body)}</Txt>}

      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Badge text={t('task.howLong', { count: task.minutes })} />
        <Badge text={t('common.starsCount', { count: task.stars })} tone={colors.accent} />
      </View>

      {!compact && task.tip ? (
        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            borderRadius: radii.sm,
            padding: spacing.md,
            borderWidth: borderWidth.hair,
            borderColor: colors.border,
          }}
        >
          <Txt variant="tiny" color={colors.textSoft}>
            {t('task.tipTitle')}
          </Txt>
          <Txt variant="small">{pick(task.tip)}</Txt>
        </View>
      ) : null}
    </Sticker>
  );
}

function Badge({ text, tone = colors.surfaceAlt }: { text: string; tone?: string }) {
  return (
    <View
      style={{
        backgroundColor: tone,
        borderRadius: radii.pill,
        borderWidth: borderWidth.hair,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
      }}
    >
      <Txt variant="tiny">{text}</Txt>
    </View>
  );
}
