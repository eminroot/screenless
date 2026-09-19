import { View } from 'react-native';

import { facetEmoji, facetName } from '../../data/facet-names';
import { useForYou } from '../../lib/for-you';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import type { SparkIdea } from '../../engine/spark';
import { Button, Chip } from '../components/Button';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { Card, CardButton, Divider, IconTile, Stamp } from '../components/Surface';
import { ClockIcon, PlayIcon, RefreshIcon, SparkIcon, StarFilledIcon } from '../icons';
import { accents, ink, space } from '../theme';

/**
 * Yours, for ages 6 to 9.
 *
 * The one screen in the app whose contents exist nowhere else. Three
 * missions built on this phone out of what this child has liked, the things
 * they go for written out in words they can read, and the ones they gave a
 * thumb up to, kept so they can do them again.
 *
 * It says out loud that these are not in the app and that nobody else has
 * them, because at seven that is the whole appeal, and because it is true.
 */
export function JuniorForYou() {
  const { t, pick } = useI18n();
  const { profile } = useApp();
  const forYou = useForYou();

  if (!profile) return null;

  return (
    <JScreen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <IconTile accent="violet" size={44} round>
          <SparkIcon size={24} />
        </IconTile>
        <View style={{ flex: 1 }}>
          <JText variant="title" color={ink.onGround}>
            {t('forYou.title')}
          </JText>
          <JText variant="caption" color={ink.onGroundMuted}>
            {t('forYou.lead')}
          </JText>
        </View>
      </View>

      {/* ------------------------------------------------ what they go for */}
      <View style={{ marginTop: space.xl }}>
        <Stamp accent="amber">{t('forYou.tasteTitle')}</Stamp>
        <Card accent="amber">
          {forYou.readable && forYou.liked.length > 0 ? (
            <View style={{ gap: space.md }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {forYou.liked.map((read) => {
                  const key = facetName(read.facet);
                  if (!key) return null;
                  return (
                    <View
                      key={read.facet}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.xs,
                        backgroundColor: accents.amber.tint,
                        borderColor: accents.amber.edge,
                        borderWidth: 2,
                        borderRadius: 999,
                        paddingVertical: 6,
                        paddingHorizontal: space.md,
                      }}
                    >
                      <JText variant="body">{facetEmoji(read.facet)}</JText>
                      <JText variant="caption">{t(key)}</JText>
                    </View>
                  );
                })}
              </View>

              {forYou.cool.length > 0 ? (
                <JText variant="caption" color={ink.muted}>
                  {t('forYou.coolTitle')}:{' '}
                  {forYou.cool
                    .map((read) => facetName(read.facet))
                    .filter((key): key is NonNullable<typeof key> => Boolean(key))
                    .map((key) => t(key))
                    .join(', ')}
                </JText>
              ) : null}
            </View>
          ) : (
            <JText variant="read" color={ink.body}>
              {t('forYou.tasteEmpty')}
            </JText>
          )}
        </Card>
      </View>

      {/* ------------------------------------------------------ made for you */}
      <View style={{ marginTop: space.xl }}>
        <Stamp accent="violet">{t('forYou.madeTitle')}</Stamp>
        <JText variant="caption" color={ink.onGroundMuted} style={{ marginBottom: space.md }}>
          {t('forYou.madeLead')}
        </JText>

        {forYou.ideas.length === 0 ? (
          <Card>
            <JText variant="read" color={ink.body}>
              {t('forYou.noIdeas')}
            </JText>
          </Card>
        ) : (
          <View style={{ gap: space.md }}>
            {forYou.ideas.map((idea) => (
              <IdeaCard key={idea.task.id} idea={idea} forYou={forYou} />
            ))}
          </View>
        )}

        <Button
          label={t('forYou.more')}
          icon={<RefreshIcon size={20} />}
          accent="blue"
          kind="cream"
          onPress={forYou.more}
          style={{ marginTop: space.md }}
        />
      </View>

      {/* -------------------------------------------------------- favourites */}
      <View style={{ marginTop: space.xl }}>
        <Stamp accent="green">{t('forYou.favTitle')}</Stamp>
        {forYou.favourites.length === 0 ? (
          <Card>
            <JText variant="read" color={ink.body}>
              {t('forYou.favEmpty')}
            </JText>
          </Card>
        ) : (
          <View style={{ gap: space.sm }}>
            {forYou.favourites.map((mission) => (
              <CardButton
                key={mission.id}
                accent="green"
                onPress={() => forYou.start(mission.task)}
                accessibilityLabel={t('forYou.favAgain')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <JText variant="title">{mission.task.emoji}</JText>
                  <View style={{ flex: 1 }}>
                    <JText variant="bodyStrong" numberOfLines={2}>
                      {pick(mission.task.title)}
                    </JText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                      <StarFilledIcon size={14} />
                      <JText variant="caption" color={ink.muted}>
                        {mission.task.stars}
                      </JText>
                    </View>
                  </View>
                  <PlayIcon size={20} />
                </View>
              </CardButton>
            ))}
          </View>
        )}
      </View>

      <JText
        variant="caption"
        color={ink.onGroundMuted}
        style={{ marginTop: space.xl }}
      >
        {t('forYou.privateNote')}
      </JText>
    </JScreen>
  );
}

function IdeaCard({ idea, forYou }: { idea: SparkIdea; forYou: ReturnType<typeof useForYou> }) {
  const { t, pick } = useI18n();
  const whyKey = idea.why ? facetName(idea.why) : null;

  return (
    <Card accent="violet">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <JText variant="banner">{idea.task.emoji}</JText>
        <View style={{ flex: 1, gap: space.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View
              style={{
                backgroundColor: accents.violet.solid,
                borderRadius: 999,
                paddingHorizontal: space.sm,
                paddingVertical: 2,
              }}
            >
              <JText variant="caption" color={accents.violet.on}>
                {t('forYou.newOne')}
              </JText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ClockIcon size={14} />
              <JText variant="caption" color={ink.muted}>
                {t('task.howLong', { count: idea.task.minutes })}
              </JText>
            </View>
          </View>

          <JText variant="heading">{pick(idea.task.title)}</JText>
          <JText variant="read" color={ink.body}>
            {pick(idea.task.body)}
          </JText>

          {whyKey ? (
            <JText variant="caption" color={ink.muted}>
              {t('forYou.because', { what: t(whyKey) })}
            </JText>
          ) : null}
        </View>
      </View>

      <Divider style={{ marginVertical: space.md }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Button
          label={t('forYou.start')}
          icon={<PlayIcon size={18} />}
          accent="green"
          size="md"
          full={false}
          disabled={forYou.busy}
          onPress={() => forYou.start(idea.task)}
          style={{ flex: 1 }}
        />
        <Chip
          label={t('forYou.notThis')}
          icon={<JText variant="body">👎</JText>}
          accent="flame"
          onPress={() => forYou.refuse(idea)}
        />
      </View>

      {forYou.busy ? (
        <JText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {t('forYou.busy')}
        </JText>
      ) : null}
    </Card>
  );
}
