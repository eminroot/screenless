import { useMemo } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';

import { Buddy } from '../buddy/Buddy';
import { Sticker, Txt } from '../ui';
import { useI18n } from '../../i18n';
import { rankBoard, withLocalScore } from '../../online/rank';
import { scoreSnapshot } from '../../online/score';
import { useBoard } from '../../online/useBoard';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

/**
 * Where the child stands this week, on the Today screen.
 *
 * Renders nothing for a child without a username, and in that case the board
 * hook has no account to fetch with, so nothing is requested either.
 */
export function FriendsCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  const router = useRouter();
  const { data } = useApp();
  const { profile, progress, missions, walk, social } = data;
  const { board } = useBoard();

  const ranked = useMemo(() => {
    if (!board) return null;
    const local = scoreSnapshot({ profile, progress, missions, walk });
    return rankBoard(withLocalScore(board.entries, local), 'week');
  }, [board, profile, progress, missions, walk]);

  if (social.mode !== 'online') return null;

  const me = ranked?.find((entry) => entry.me) ?? null;
  const others = ranked?.filter((entry) => !entry.me) ?? [];
  const line = !ranked
    ? null
    : others.length === 0
      ? t('board.cardAlone')
      : t('board.cardRank', { rank: me?.rank ?? 1, count: ranked.length });

  return (
    <View style={style}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('board.title')} onPress={() => router.push('/board')}>
        <Sticker background={colors.info} style={{ padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: radii.pill,
                backgroundColor: colors.accent,
                borderWidth: borderWidth.thick,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt variant="heading">{me && others.length > 0 ? `#${me.rank}` : '🏆'}</Txt>
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="heading" color={colors.surface}>
                {t('board.title')}
              </Txt>
              {line ? (
                <Txt variant="small" color={colors.surface} numberOfLines={2}>
                  {line}
                </Txt>
              ) : null}
            </View>

            {others.length > 0 ? (
              <View style={{ flexDirection: 'row' }}>
                {others.slice(0, 3).map((entry, index) => (
                  <View key={entry.id} style={{ marginLeft: index === 0 ? 0 : -14 }}>
                    <Buddy id={entry.buddyId} size={38} still />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Sticker>
      </Pressable>
    </View>
  );
}
