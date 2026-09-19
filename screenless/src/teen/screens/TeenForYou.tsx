import { View } from 'react-native';

import { facetName } from '../../data/facet-names';
import type { SparkIdea } from '../../engine/spark';
import { useForYou } from '../../lib/for-you';
import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { Button, Chip } from '../components/Button';
import { Label, Panel, PanelButton, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { ChevronIcon, RefreshIcon } from '../icons';
import { useSkin } from '../skin';
import { border, radius, space } from '../theme';

/**
 * For you, ages 10 to 13.
 *
 * Same three parts as the tier below, in the register this one expects: the
 * read is a list of measured preferences with a bar next to each rather than
 * a row of stickers, the made missions carry the reason they were made, and
 * the line about where the arithmetic happens is at the top rather than
 * buried at the bottom, because this is the age that asks.
 */
export function TeenForYou() {
  const { t, pick } = useI18n();
  const { profile } = useApp();
  const { palette, ink, accents } = useSkin();
  const forYou = useForYou();

  if (!profile) return null;

  return (
    <TScreen>
      <TText variant="display">{t('forYou.title')}</TText>
      <TText variant="caption" color={ink.muted} style={{ marginTop: space.xs }}>
        {t('forYou.privateNote')}
      </TText>

      {/* ------------------------------------------------ what they go for */}
      <View style={{ marginTop: space.xxl }}>
        <Label accent="amber">{t('forYou.tasteTitle')}</Label>
        {forYou.readable && forYou.liked.length > 0 ? (
          <Panel>
            <View style={{ gap: space.md }}>
              {forYou.liked.map((read) => {
                const key = facetName(read.facet);
                if (!key) return null;
                return (
                  <View key={read.facet} style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TText variant="bodyStrong" style={{ flex: 1 }}>
                        {t(key)}
                      </TText>
                      <TText variant="label" color={ink.muted}>
                        {Math.round(read.score * 100)}
                      </TText>
                    </View>
                    {/* The bar is the number again, for the glance rather
                        than the read. Nothing is ranked against anybody. */}
                    <View
                      style={{
                        height: 4,
                        borderRadius: radius.pill,
                        backgroundColor: palette.sunken,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${Math.min(100, Math.round(read.score * 100))}%`,
                          height: '100%',
                          backgroundColor: accents.acid.solid,
                        }}
                      />
                    </View>
                  </View>
                );
              })}

              {forYou.cool.length > 0 ? (
                <>
                  <Rule style={{ marginTop: space.xs }} />
                  <TText variant="caption" color={ink.muted}>
                    {t('forYou.coolTitle')}:{' '}
                    {forYou.cool
                      .map((read) => facetName(read.facet))
                      .filter((key): key is NonNullable<typeof key> => Boolean(key))
                      .map((key) => t(key))
                      .join(', ')}
                  </TText>
                </>
              ) : null}
            </View>
          </Panel>
        ) : (
          <Panel>
            <TText variant="body" color={ink.muted}>
              {t('forYou.tasteEmpty')}
            </TText>
          </Panel>
        )}
      </View>

      {/* ------------------------------------------------------ made for you */}
      <View style={{ marginTop: space.xxl }}>
        <Label accent="violet">{t('forYou.madeTitle')}</Label>
        <TText variant="caption" color={ink.muted} style={{ marginBottom: space.md }}>
          {t('forYou.madeLead')}
        </TText>

        {forYou.ideas.length === 0 ? (
          <Panel>
            <TText variant="body" color={ink.muted}>
              {t('forYou.noIdeas')}
            </TText>
          </Panel>
        ) : (
          <View style={{ gap: space.md }}>
            {forYou.ideas.map((idea) => (
              <IdeaPanel key={idea.task.id} idea={idea} forYou={forYou} />
            ))}
          </View>
        )}

        <Button
          label={t('forYou.more')}
          icon={<RefreshIcon size={18} color={ink.body} />}
          kind="outline"
          onPress={forYou.more}
          style={{ marginTop: space.md }}
        />
      </View>

      {/* -------------------------------------------------------- favourites */}
      <View style={{ marginTop: space.xxl }}>
        <Label accent="mint">{t('forYou.favTitle')}</Label>
        {forYou.favourites.length === 0 ? (
          <Panel>
            <TText variant="body" color={ink.muted}>
              {t('forYou.favEmpty')}
            </TText>
          </Panel>
        ) : (
          <View style={{ gap: space.sm }}>
            {forYou.favourites.map((mission) => (
              <PanelButton
                key={mission.id}
                onPress={() => forYou.start(mission.task)}
                accessibilityLabel={t('forYou.favAgain')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <TText variant="title">{mission.task.emoji}</TText>
                  <View style={{ flex: 1 }}>
                    <TText variant="bodyStrong" numberOfLines={2}>
                      {pick(mission.task.title)}
                    </TText>
                    <TText variant="caption" color={ink.muted}>
                      {t('task.howLong', { count: mission.task.minutes })}
                    </TText>
                  </View>
                  <ChevronIcon size={18} color={ink.muted} />
                </View>
              </PanelButton>
            ))}
          </View>
        )}
      </View>
    </TScreen>
  );
}

function IdeaPanel({ idea, forYou }: { idea: SparkIdea; forYou: ReturnType<typeof useForYou> }) {
  const { t, pick } = useI18n();
  const { ink, accents } = useSkin();
  const whyKey = idea.why ? facetName(idea.why) : null;

  return (
    <Panel>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View
          style={{
            borderWidth: border.hair,
            borderColor: accents.violet.solid,
            borderRadius: radius.pill,
            paddingHorizontal: space.sm,
            paddingVertical: 2,
          }}
        >
          <TText variant="label" color={accents.violet.bright}>
            {t('forYou.newOne')}
          </TText>
        </View>
        <TText variant="label" color={ink.muted}>
          {t('task.howLong', { count: idea.task.minutes })}
        </TText>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginTop: space.md }}>
        <TText variant="title">{idea.task.emoji}</TText>
        <View style={{ flex: 1, gap: space.xs }}>
          <TText variant="title">{pick(idea.task.title)}</TText>
          <TText variant="body" color={ink.body}>
            {pick(idea.task.body)}
          </TText>
          {whyKey ? (
            <TText variant="caption" color={ink.muted}>
              {t('forYou.because', { what: t(whyKey) })}
            </TText>
          ) : null}
        </View>
      </View>

      <Rule style={{ marginVertical: space.md }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Button
          label={t('forYou.start')}
          size="md"
          full={false}
          disabled={forYou.busy}
          onPress={() => forYou.start(idea.task)}
          style={{ flex: 1 }}
        />
        <Chip label={t('forYou.notThis')} accent="coral" onPress={() => forYou.refuse(idea)} />
      </View>

      {forYou.busy ? (
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {t('forYou.busy')}
        </TText>
      ) : null}
    </Panel>
  );
}
