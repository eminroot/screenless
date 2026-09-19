import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { itemById, itemsInSlot, type WardrobeItem } from '../../data/wardrobe';
import { buyState, isWorn, nextAffordable } from '../../engine/wardrobe';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { WEAR_SLOTS, type WearSlot } from '../../state/types';
import { Button, Chip, IconButton } from '../components/Button';
import { Label, Panel, Rule } from '../components/Surface';
import { TScreen } from '../components/TScreen';
import { TText } from '../components/TText';
import { CloseIcon } from '../icons';
import { useSkin } from '../skin';
import { border, radius, space } from '../theme';

const SLOT_LABEL: Record<WearSlot, TKey> = {
  head: 'wardrobe.slotHead',
  face: 'wardrobe.slotFace',
  neck: 'wardrobe.slotNeck',
  back: 'wardrobe.slotBack',
  hand: 'wardrobe.slotHand',
};

/**
 * The locker, for ages 10 to 13.
 *
 * The same economy as the tier below, framed as an inventory rather than a toy
 * shop: a flat grid, the balance as a plain number at the top, prices in a
 * mono-ish column, and no celebration when something is bought beyond the item
 * appearing on the avatar. At this age the reward for saving up is having the
 * thing, and being congratulated for it is the fastest way to make it feel
 * like an app for younger children.
 *
 * Everything out of reach is still shown with its price, because a locker you
 * can see the whole of is what makes a number worth accumulating.
 */
export function TeenWardrobe() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { palette, ink, accents } = useSkin();
  const { profile, data, buyItem, toggleItem, clearOutfit } = useApp();
  const [slot, setSlot] = useState<WearSlot>('head');

  const coins = data.walk.coins;
  const wardrobe = data.wardrobe;

  const saving = useMemo(() => {
    const id = nextAffordable(wardrobe, coins);
    return id ? (itemById.get(id) ?? null) : null;
  }, [wardrobe, coins]);

  if (!profile) return null;

  const items = itemsInSlot(slot);

  const onItem = (item: WardrobeItem) => {
    const state = buyState(wardrobe, item.id, coins);
    if (state === 'owned') {
      void Haptics.selectionAsync();
      toggleItem(item.id);
      return;
    }
    if (state === 'affordable' && buyItem(item.id)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <TScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconButton
            icon={<CloseIcon size={20} />}
            accessibilityLabel={t('common.close')}
            onPress={() => router.back()}
          />
          <TText variant="heading" style={{ flex: 1 }}>
            {t('wardrobe.title')}
          </TText>
          <TText variant="stat" color={accents.amber.bright}>
            {coins}
          </TText>
        </View>
      }
    >
      {/* ----------------------------------------------------- the avatar */}
      <Panel style={{ alignItems: 'center', gap: space.sm }}>
        <Buddy id={profile.buddyId} size={168} mood="idle" wearing={wardrobe.worn} />
        <TText variant="small" color={ink.muted}>
          {wardrobe.worn.length > 0 ? profile.buddyName : t('wardrobe.nothingOn')}
        </TText>
        {wardrobe.worn.length > 0 ? (
          <Button
            label={t('wardrobe.takeAllOff')}
            kind="ghost"
            size="sm"
            full={false}
            onPress={clearOutfit}
          />
        ) : null}
      </Panel>

      {saving ? (
        <View style={{ marginTop: space.lg }}>
          <Label trailing={<TText variant="small" color={ink.muted}>{saving.emoji}</TText>}>
            {t('wardrobe.savingFor')}
          </Label>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
            <TText variant="bodyStrong">{pick(saving.name)}</TText>
            <TText variant="small" color={ink.muted}>
              {t('wardrobe.coinsToGo', { count: Math.max(0, saving.price - coins) })}
            </TText>
          </View>
        </View>
      ) : null}

      <Rule style={{ marginVertical: space.lg }} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingRight: space.lg }}
      >
        {WEAR_SLOTS.map((s) => (
          <Chip key={s} label={t(SLOT_LABEL[s])} selected={slot === s} onPress={() => setSlot(s)} />
        ))}
      </ScrollView>

      <View style={{ marginTop: space.lg }}>
        {items.map((item, index) => {
          const state = buyState(wardrobe, item.id, coins);
          const worn = isWorn(wardrobe, item.id);
          const reachable = state === 'owned' || state === 'affordable';

          const note =
            state === 'owned'
              ? worn
                ? t('wardrobe.wearingIt')
                : t('wardrobe.owned')
              : state === 'locked'
                ? t('wardrobe.reachLevel', { count: item.level ?? 0 })
                : state === 'affordable'
                  ? t('wardrobe.tapToBuy')
                  : t('wardrobe.coinsToGo', { count: item.price - coins });

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: worn, disabled: !reachable }}
              accessibilityLabel={`${pick(item.name)}. ${note}`}
              onPress={() => onItem(item)}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingVertical: space.md,
                  borderTopWidth: index === 0 ? 0 : border.hair,
                  borderColor: palette.line,
                  opacity: reachable ? 1 : 0.5,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.chip,
                    backgroundColor: worn ? accents.acid.wash : palette.sunken,
                    borderWidth: border.hair,
                    borderColor: worn ? accents.acid.solid : palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TText variant="body">{item.emoji}</TText>
                </View>

                <View style={{ flex: 1, gap: 1 }}>
                  <TText variant="bodyStrong" numberOfLines={1}>
                    {pick(item.name)}
                  </TText>
                  <TText
                    variant="small"
                    color={worn ? accents.acid.bright : ink.muted}
                  >
                    {note}
                  </TText>
                </View>

                {state === 'affordable' || state === 'tooDear' ? (
                  <TText
                    variant="stat"
                    color={state === 'affordable' ? accents.amber.bright : ink.muted}
                  >
                    {item.price}
                  </TText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <TText variant="small" color={ink.muted} style={{ marginTop: space.xl }}>
        {t('wardrobe.howCoins')}
      </TText>
    </TScreen>
  );
}
