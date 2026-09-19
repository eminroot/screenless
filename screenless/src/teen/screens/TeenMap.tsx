import { View } from 'react-native';

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
import { Bar, Stat, StatRow } from '../components/Stat';
import { Label, Panel, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { CheckIcon, LockIcon, StarIcon } from '../icons';
import { border, radius, space } from '../theme';
import { useSkin } from '../skin';

/**
 * Progress, for ages 10 to 13.
 *
 * A ladder of ranks read top to bottom, with the cost of each one and what it
 * unlocks. The three to five year olds get this as an illustrated island they
 * scroll through and the six to nines get it as a rail of cards; here it is
 * closer to a season pass, which is the format this age already understands
 * better than any of us.
 *
 * Nothing on this screen can be earned by using the app. It only draws the
 * stars that parent-confirmed challenges already gave.
 */
export function TeenMap() {
  const { palette, ink, accents } = useSkin();
  const { t } = useI18n();
  const { profile, data } = useApp();

  if (!profile) return null;

  const stars = data.progress.stars;
  const level = levelForStars(stars);

  return (
    <TScreen
      header={
        <View>
          <TText variant="label" color={ink.muted}>
            {t('teen.tabProgress')}
          </TText>
          <TText variant="display">{t(LEVEL_TITLE_KEYS[level - 1] as TKey)}</TText>
        </View>
      }
    >
      <Panel>
        <StatRow>
          <Stat value={stars} label={t('teen.starsLabel')} accent="amber" />
          <Stat value={data.progress.totalMissions} label={t('teen.doneLabel')} />
          <Stat value={data.progress.totalMinutes} label={t('teen.minutesLabel')} />
        </StatRow>
        {level < MAX_LEVEL ? (
          <>
            <Bar value={levelFraction(stars)} style={{ marginTop: space.lg }} />
            <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
              {t('teen.toNext', { count: LEVEL_THRESHOLDS[level] - stars, level: level + 1 })}
            </TText>
          </>
        ) : null}
      </Panel>

      <Label accent="acid" style={{ marginTop: space.xxl }}>
        {t('teen.ranksLabel')}
      </Label>

      <Panel padded={false}>
        {zones.map((zone, index) => {
          const zoneLevel = index + 1;
          const state = zoneLevel < level ? 'done' : zoneLevel === level ? 'here' : 'locked';
          const needed = Math.max(0, LEVEL_THRESHOLDS[index] - stars);
          const unlocks = LEVEL_REWARDS[zoneLevel] ?? [];

          return (
            <View key={zone.id}>
              {index > 0 ? <Rule /> : null}
              <View
                style={{
                  flexDirection: 'row',
                  gap: space.md,
                  padding: space.lg,
                  backgroundColor: state === 'here' ? accents.acid.wash : 'transparent',
                }}
              >
                {/* The rank marker: ticked, current, or shut. */}
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: border.strong,
                    borderColor:
                      state === 'locked' ? palette.lineBright : accents.acid.solid,
                    backgroundColor: state === 'done' ? accents.acid.solid : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {state === 'done' ? (
                    <CheckIcon size={15} color={accents.acid.on} strokeWidth={2.6} />
                  ) : state === 'here' ? (
                    <View
                      style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accents.acid.solid }}
                    />
                  ) : (
                    <LockIcon size={14} color={ink.muted} />
                  )}
                </View>

                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <TText
                      variant="bodyStrong"
                      color={state === 'locked' ? ink.muted : ink.strong}
                      style={{ flex: 1 }}
                      numberOfLines={1}
                    >
                      {t(zone.nameKey)}
                    </TText>
                    <TText variant="label" color={state === 'here' ? accents.acid.bright : ink.muted}>
                      {t('common.levelLabel', { level: zoneLevel })}
                    </TText>
                  </View>

                  <TText variant="caption" color={ink.muted} numberOfLines={2}>
                    {state === 'locked' ? t('teen.starsToGo', { count: needed }) : t(zone.blurbKey)}
                  </TText>

                  {unlocks.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs }}>
                      {unlocks.map((reward) => (
                        <View
                          key={reward}
                          style={{
                            paddingHorizontal: space.sm,
                            paddingVertical: 3,
                            borderRadius: radius.pill,
                            borderWidth: border.hair,
                            borderColor: palette.line,
                          }}
                        >
                          <TText variant="label" color={state === 'locked' ? ink.muted : ink.body}>
                            {t(`rewards.${reward}` as TKey)}
                          </TText>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {state === 'here' && level < MAX_LEVEL ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
                      <StarIcon size={14} color={accents.amber.bright} />
                      <TText variant="label" color={accents.amber.bright}>
                        {t('teen.toNext', { count: LEVEL_THRESHOLDS[zoneLevel] - stars, level: zoneLevel + 1 })}
                      </TText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </Panel>
    </TScreen>
  );
}
