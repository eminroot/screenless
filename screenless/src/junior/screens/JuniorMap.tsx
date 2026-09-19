import { View } from 'react-native';

import { Buddy } from '../../components/buddy/Buddy';
import { zones } from '../../data/zones';
import {
  LEVEL_REWARDS,
  LEVEL_THRESHOLDS,
  LEVEL_TITLE_KEYS,
  levelFraction,
  levelForStars,
  MAX_LEVEL,
} from '../../engine/progress';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import type { RewardId } from '../../state/types';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { Bar, StatCard } from '../components/Stat';
import { Card, IconTile, Stamp } from '../components/Surface';
import { CheckIcon, ClockIcon, LockIcon, StarFilledIcon, TargetIcon, TrophyIcon } from '../icons';
import { accents, border, ink, palette, radius, space } from '../theme';

const REWARD_EMOJI: Record<RewardId, string> = {
  hat: '🎉',
  balloon: '🎈',
  scarf: '🧣',
  glasses: '🕶️',
  ball: '⚽',
  cape: '🦸',
  crown: '👑',
  medal: '🏅',
};

/**
 * The journey, for ages 6 to 9.
 *
 * Seven places on one rail, first at the top, read straight down. The tier
 * below draws this as an illustrated world the child scrolls through, because
 * at three the only way to answer "how far have I got" is to show it. Here it
 * is a list with the numbers on it — what each place costs, what it hands over
 * when it opens, and exactly how many stars are left — which is a thing a
 * seven year old can plan against rather than only look at.
 *
 * Nothing on this screen can be earned by using the app. It only draws the
 * stars that parent-confirmed missions already gave.
 */
export function JuniorMap() {
  const { t } = useI18n();
  const { profile, data } = useApp();

  if (!profile) return null;

  const stars = data.progress.stars;
  const level = levelForStars(stars);

  return (
    <JScreen
      header={
        <View>
          <JText variant="title" color={ink.onGround}>{t('map.title')}</JText>
          <JText variant="small" color={ink.onGroundMuted}>
            {t('common.levelLabel', { level })} · {t(LEVEL_TITLE_KEYS[level - 1] as TKey)}
          </JText>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard
          icon={<StarFilledIcon size={24} />}
          value={stars}
          label={t('junior.starsLabel')}
          accent="amber"
        />
        <StatCard
          icon={<TargetIcon size={24} color={accents.green.base} />}
          value={data.progress.totalMissions}
          label={t('junior.missionsLabel')}
          accent="green"
        />
        <StatCard
          icon={<ClockIcon size={24} />}
          value={data.progress.totalMinutes}
          label={t('junior.minutesLabel')}
          accent="blue"
        />
      </View>

      <Stamp accent="blue" style={{ marginTop: space.xxl }}>{t('junior.trailStamp')}</Stamp>

      <View>
        {zones.map((zone, index) => {
          const zoneLevel = index + 1;
          const state = zoneLevel < level ? 'done' : zoneLevel === level ? 'here' : 'locked';
          const needed = Math.max(0, LEVEL_THRESHOLDS[index] - stars);
          const unlocks = LEVEL_REWARDS[zoneLevel] ?? [];

          return (
            <View key={zone.id} style={{ flexDirection: 'row', gap: space.md }}>
              {/* The rail: a node per place, joined by a line that is solid as
                  far as the child has got and faint after that. */}
              <View style={{ width: 34, alignItems: 'center' }}>
                <Node state={state} />
                {index < zones.length - 1 ? (
                  <View
                    style={{
                      flex: 1,
                      width: 3,
                      borderRadius: radius.pill,
                      backgroundColor: state === 'done' ? accents.green.solid : palette.groundLine,
                    }}
                  />
                ) : null}
              </View>

              <View style={{ flex: 1, paddingBottom: space.lg }}>
                <Card accent={state === 'here' ? 'green' : undefined}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <JText variant="caption" color={ink.muted}>
                        {t('common.levelLabel', { level: zoneLevel }).toUpperCase()}
                      </JText>
                      <JText variant="heading" color={state === 'locked' ? ink.muted : ink.strong}>
                        {t(zone.nameKey)}
                      </JText>
                    </View>
                    {state === 'here' && profile ? (
                      <Buddy id={profile.buddyId} size={44} still wearing={data.wardrobe.worn} />
                    ) : null}
                  </View>

                  <JText
                    variant="body"
                    color={ink.body}
                    style={{ marginTop: space.sm }}
                    numberOfLines={3}
                  >
                    {state === 'locked' ? t('map.lockedZone') : t(zone.blurbKey)}
                  </JText>

                  {state === 'here' && level < MAX_LEVEL ? (
                    <View style={{ gap: space.sm, marginTop: space.md }}>
                      <Bar value={levelFraction(stars)} accent="green" />
                      <JText variant="small" color={accents.green.base}>
                        {t('map.toNextLevel', { count: Math.max(0, LEVEL_THRESHOLDS[zoneLevel] - stars) })}
                      </JText>
                    </View>
                  ) : null}

                  {state === 'locked' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md }}>
                      <StarFilledIcon size={18} />
                      <JText variant="small" color={ink.muted}>
                        {t('junior.starsToGo', { count: needed })}
                      </JText>
                    </View>
                  ) : null}

                  {/* What this place hands over. The reason to want the next one. */}
                  {unlocks.length > 0 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: space.sm,
                        marginTop: space.md,
                        paddingTop: space.md,
                        borderTopWidth: border.hair,
                        borderTopColor: state === 'here' ? accents.green.edge : palette.line,
                      }}
                    >
                      <TrophyIcon size={18} color={ink.muted} />
                      {unlocks.map((reward) => (
                        <View
                          key={reward}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: space.sm,
                            paddingVertical: 4,
                            borderRadius: radius.pill,
                            backgroundColor: palette.sunken,
                          }}
                        >
                          <JText variant="small">{REWARD_EMOJI[reward]}</JText>
                          <JText variant="caption" color={state === 'locked' ? ink.muted : ink.body}>
                            {t(`rewards.${reward}` as TKey)}
                          </JText>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              </View>
            </View>
          );
        })}
      </View>
    </JScreen>
  );
}

/** One stop on the rail: ticked, standing on it, or still shut. */
function Node({ state }: { state: 'done' | 'here' | 'locked' }) {
  if (state === 'done') {
    return (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: accents.green.solid,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckIcon size={18} />
      </View>
    );
  }

  if (state === 'here') {
    return (
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          borderWidth: 3,
          borderColor: accents.green.solid,
          backgroundColor: palette.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: accents.green.solid }}
        />
      </View>
    );
  }

  return (
    <IconTile accent="blue" size={34} round>
      <LockIcon size={17} />
    </IconTile>
  );
}
