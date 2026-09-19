import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { itemsInSlot, type WardrobeItem } from '../../data/wardrobe';
import { buyState, isWorn, nextAffordable } from '../../engine/wardrobe';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { WEAR_SLOTS, type WearSlot } from '../../state/types';
import { Button, Chip, IconButton } from '../components/Button';
import { JScreen } from '../components/JScreen';
import { JText } from '../components/JText';
import { Card, Shadow, Stamp } from '../components/Surface';
import { CloseIcon, CoinIcon } from '../icons';
import { accents, border, drop, ink, palette, radius, space } from '../theme';

const SLOT_LABEL: Record<WearSlot, TKey> = {
  head: 'wardrobe.slotHead',
  face: 'wardrobe.slotFace',
  neck: 'wardrobe.slotNeck',
  back: 'wardrobe.slotBack',
  hand: 'wardrobe.slotHand',
};

/**
 * The kit store, for ages 6 to 9.
 *
 * Laid out as a shop rather than a settings list: the buddy stands at the top
 * wearing whatever is currently on, the purse sits next to it, and the rack
 * below is one shelf per slot. Tapping an item you own puts it on immediately,
 * which is the whole reward — a nine year old spending two weeks of coins on
 * headphones wants to see the fox in the headphones, not a confirmation
 * dialogue.
 *
 * Prices are shown on everything, including what you cannot afford yet. A shop
 * that hides what you cannot buy gives a child nothing to aim at, and the
 * aiming is the point of the feature.
 */
export function JuniorWardrobe() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { profile, data, buyItem, toggleItem, clearOutfit } = useApp();
  const [slot, setSlot] = useState<WearSlot>('head');
  /** The id just bought, so the card can say so for a moment. */
  const [justBought, setJustBought] = useState<string | null>(null);

  const coins = data.walk.coins;
  const wardrobe = data.wardrobe;

  const saving = useMemo(() => {
    const id = nextAffordable(wardrobe, coins);
    return id ? itemsInSlot(WEAR_SLOTS.find((s) => itemsInSlot(s).some((i) => i.id === id))!).find((i) => i.id === id) : null;
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
    if (state === 'affordable') {
      if (buyItem(item.id)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setJustBought(item.id);
        setTimeout(() => setJustBought(null), 2200);
      }
      return;
    }
    // Too dear or not reached. Nothing happens, and the card already says why.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <JScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconButton
            icon={<CloseIcon size={22} color={ink.strong} />}
            accessibilityLabel={t('common.close')}
            onPress={() => router.back()}
          />
          <JText variant="heading" color={ink.onGround} style={{ flex: 1 }}>
            {t('wardrobe.title')}
          </JText>
          <Purse coins={coins} />
        </View>
      }
    >
      {/* ------------------------------------------------- who is wearing it */}
      <Card accent="blue" style={{ alignItems: 'center', paddingVertical: space.lg, gap: space.sm }}>
        <Buddy id={profile.buddyId} size={180} mood="happy" wearing={wardrobe.worn} />
        <JText variant="bodyStrong">{profile.buddyName}</JText>
        {wardrobe.worn.length > 0 ? (
          <Button
            label={t('wardrobe.takeAllOff')}
            accent="blue"
            kind="cream"
            size="sm"
            full={false}
            onPress={() => {
              void Haptics.selectionAsync();
              clearOutfit();
            }}
          />
        ) : (
          <JText variant="small" color={ink.muted} center>
            {t('wardrobe.nothingOn')}
          </JText>
        )}
      </Card>

      {/* --------------------------------------------- what to save towards */}
      {saving ? (
        <View style={{ marginTop: space.xl }}>
          <Stamp>{t('wardrobe.savingFor')}</Stamp>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <JText variant="title">{saving.emoji}</JText>
            <View style={{ flex: 1 }}>
              <JText variant="bodyStrong">{pick(saving.name)}</JText>
              <JText variant="small" color={ink.muted}>
                {t('wardrobe.coinsToGo', { count: Math.max(0, saving.price - coins) })}
              </JText>
            </View>
          </Card>
        </View>
      ) : null}

      {/* --------------------------------------------------------- the rack */}
      <View style={{ marginTop: space.xl }}>
        <Stamp>{t('wardrobe.rack')}</Stamp>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: space.sm, paddingVertical: space.sm, paddingRight: space.lg }}
        >
          {WEAR_SLOTS.map((s) => (
            <Chip key={s} label={t(SLOT_LABEL[s])} selected={slot === s} accent="blue" onPress={() => setSlot(s)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: space.md, marginTop: space.sm }}>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            state={buyState(wardrobe, item.id, coins)}
            worn={isWorn(wardrobe, item.id)}
            bought={justBought === item.id}
            coins={coins}
            onPress={() => onItem(item)}
          />
        ))}
      </View>

      <JText variant="small" color={ink.onGroundMuted} center style={{ marginTop: space.xl }}>
        {t('wardrobe.howCoins')}
      </JText>
    </JScreen>
  );
}

/* -------------------------------------------------------------- components */

function Purse({ coins }: { coins: number }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        backgroundColor: accents.amber.solid,
        borderRadius: radius.pill,
        borderWidth: border.ink,
        borderColor: ink.strong,
        paddingHorizontal: space.md,
        paddingVertical: 6,
      }}
    >
      <CoinIcon size={20} />
      <JText variant="bodyStrong">{coins}</JText>
    </View>
  );
}

/**
 * One item on the shelf.
 *
 * Four states and they have to be tellable apart at a glance by someone who
 * reads slowly: on the buddy right now, owned, affordable, and out of reach.
 * Colour carries it — worn is the only green thing here — and the line under
 * the name says it in words as well, because colour alone is not a label.
 */
function ItemRow({
  item,
  state,
  worn,
  bought,
  coins,
  onPress,
}: {
  item: WardrobeItem;
  state: ReturnType<typeof buyState>;
  worn: boolean;
  bought: boolean;
  coins: number;
  onPress: () => void;
}) {
  const { t, pick } = useI18n();
  const reachable = state === 'owned' || state === 'affordable';

  const accent = worn ? accents.green : state === 'affordable' ? accents.amber : null;
  const face = worn ? accents.green.tint : palette.surface;

  const note = bought
    ? t('wardrobe.bought')
    : worn
      ? t('wardrobe.wearingIt')
      : state === 'owned'
        ? t('wardrobe.tapToWear')
        : state === 'affordable'
          ? t('wardrobe.tapToBuy')
          : state === 'locked'
            ? t('wardrobe.reachLevel', { count: item.level ?? 0 })
            : t('wardrobe.coinsToGo', { count: item.price - coins });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: worn, disabled: !reachable }}
      accessibilityLabel={`${pick(item.name)}. ${note}`}
      onPress={onPress}
    >
      <View style={{ paddingBottom: drop.md, paddingRight: drop.md }}>
        <Shadow depth={drop.md} radius={radius.card} />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            padding: space.md,
            borderRadius: radius.card,
            borderWidth: border.ink,
            borderColor: ink.strong,
            backgroundColor: face,
            // Out of reach is dimmed rather than hidden, so the shelf still
            // shows what there is to work towards.
            opacity: reachable ? 1 : 0.62,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.button,
              borderWidth: border.ink,
              borderColor: ink.strong,
              backgroundColor: accent ? accent.solid : palette.sunken,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <JText variant="heading">{item.emoji}</JText>
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <JText variant="bodyStrong" numberOfLines={1}>
              {pick(item.name)}
            </JText>
            <JText variant="small" color={ink.muted}>
              {note}
            </JText>
          </View>

          {state === 'affordable' || state === 'tooDear' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <CoinIcon size={18} />
              <JText variant="bodyStrong">{item.price}</JText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
