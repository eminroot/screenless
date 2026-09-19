import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../../components/buddy/Buddy';
import { itemsInSlot, type WardrobeItem } from '../../data/wardrobe';
import { buyState, isWorn } from '../../engine/wardrobe';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { WEAR_SLOTS, type WearSlot } from '../../state/types';
import { ClayButton, ClayCard, ClayIconButton, StatPill } from '../components/Clay';
import { LittleScreen } from '../components/LittleScreen';
import { LText } from '../components/LText';
import { CheckIcon, CloseIcon, CoinIcon, LockIcon } from '../icons';
import { usePress } from '../motion';
import { ink, lip, round, space, tones } from '../theme';

const SLOT_LABEL: Record<WearSlot, TKey> = {
  head: 'wardrobe.slotHead',
  face: 'wardrobe.slotFace',
  neck: 'wardrobe.slotNeck',
  back: 'wardrobe.slotBack',
  hand: 'wardrobe.slotHand',
};

/**
 * Dressing up, for ages 3 to 5.
 *
 * Nobody here reads a price, so the money is carried by the picture: an item
 * you can have is bright and an item you cannot is greyed with a padlock on
 * it. The number is still shown, because a four year old counting coins with a
 * parent is exactly the kind of thing this app wants to cause.
 *
 * The buddy is enormous and sits above everything, and it changes the instant
 * something is tapped. At this age the feedback *is* the feature.
 */
export function LittleWardrobe() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { profile, data, buyItem, toggleItem, clearOutfit } = useApp();
  const [slot, setSlot] = useState<WearSlot>('head');

  const coins = data.walk.coins;
  const wardrobe = data.wardrobe;

  if (!profile) return null;

  const onItem = (item: WardrobeItem) => {
    const state = buyState(wardrobe, item.id, coins);
    if (state === 'owned') {
      void Haptics.selectionAsync();
      toggleItem(item.id);
      return;
    }
    if (state === 'affordable' && buyItem(item.id)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <LittleScreen
      header={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <ClayIconButton
            icon={<CloseIcon size={24} />}
            size={46}
            accessibilityLabel={t('common.close')}
            onPress={() => router.back()}
          />
          <LText variant="heading" style={{ flex: 1 }}>
            {t('wardrobe.title')}
          </LText>
          <StatPill
            icon={<CoinIcon size={24} />}
            value={coins}
            tone="sun"
            accessibilityLabel={t('wardrobe.coinsShort', { count: coins })}
          />
        </View>
      }
    >
      {/* --------------------------------------------------- the big buddy */}
      <ClayCard tone="white" style={{ alignItems: 'center', padding: space.lg, gap: space.sm }}>
        <Buddy id={profile.buddyId} size={200} mood="cheer" wearing={wardrobe.worn} />
        <LText variant="heading">{profile.buddyName}</LText>
        {wardrobe.worn.length > 0 ? (
          <ClayButton
            label={t('wardrobe.takeAllOff')}
            tone="coral"
            size="md"
            full={false}
            onPress={() => {
              void Haptics.selectionAsync();
              clearOutfit();
            }}
          />
        ) : (
          <LText variant="small" color={ink.soft} center>
            {t('wardrobe.nothingOn')}
          </LText>
        )}
      </ClayCard>

      {/* ------------------------------------------------------- the slots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingVertical: space.lg, paddingRight: space.lg }}
      >
        {WEAR_SLOTS.map((s) => (
          <ClayButton
            key={s}
            label={t(SLOT_LABEL[s])}
            tone={slot === s ? 'grape' : 'white'}
            size="md"
            full={false}
            onPress={() => {
              void Haptics.selectionAsync();
              setSlot(s);
            }}
          />
        ))}
      </ScrollView>

      {/* ------------------------------------------------------- the items */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {itemsInSlot(slot).map((item) => (
          <ItemTile
            key={item.id}
            item={item}
            state={buyState(wardrobe, item.id, coins)}
            worn={isWorn(wardrobe, item.id)}
            onPress={() => onItem(item)}
          />
        ))}
      </View>

      <LText variant="small" color={ink.soft} center style={{ marginTop: space.xl }}>
        {t('wardrobe.howCoins')}
      </LText>
    </LittleScreen>
  );
}

/**
 * One item, as a fat square.
 *
 * Three states, all told by the picture first: worn is green with a tick,
 * available is white, and out of reach is faded with a padlock. The price is
 * underneath on anything not yet owned.
 */
function ItemTile({
  item,
  state,
  worn,
  onPress,
}: {
  item: WardrobeItem;
  state: ReturnType<typeof buyState>;
  worn: boolean;
  onPress: () => void;
}) {
  const { t, pick } = useI18n();
  const depth = lip.md;
  const { onPressIn, onPressOut, face } = usePress(depth);
  const reachable = state === 'owned' || state === 'affordable';
  const OFF = { face: '#E6E4DC', lip: '#C7C4B8', ink: '#6A6753' };
  const palette = worn
    ? tones.mint
    : state === 'affordable'
      ? tones.sun
      : reachable
        ? tones.white
        : OFF;

  const note =
    state === 'owned'
      ? worn
        ? t('wardrobe.wearingIt')
        : t('wardrobe.owned')
      : state === 'locked'
        ? t('wardrobe.reachLevel', { count: item.level ?? 0 })
        : t('wardrobe.coinsShort', { count: item.price });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: worn, disabled: !reachable }}
      accessibilityLabel={`${pick(item.name)}. ${note}`}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={{ width: '47%' }}
    >
      <View style={{ paddingBottom: depth }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: depth,
            bottom: 0,
            borderRadius: round.md,
            backgroundColor: palette.lip,
          }}
        />
        <Animated.View
          style={[
            {
              alignItems: 'center',
              gap: space.xs,
              paddingVertical: space.md,
              paddingHorizontal: space.sm,
              borderRadius: round.md,
              backgroundColor: palette.face,
            },
            face,
          ]}
        >
          <View style={{ height: 44, justifyContent: 'center' }}>
            <LText variant="title">{item.emoji}</LText>
          </View>
          <LText variant="small" center numberOfLines={2} color={palette.ink}>
            {pick(item.name)}
          </LText>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 26 }}>
            {worn ? (
              <CheckIcon size={22} color="#FFFFFF" />
            ) : state === 'locked' ? (
              <LockIcon size={20} />
            ) : state === 'owned' ? null : (
              <>
                <CoinIcon size={20} />
                <LText variant="label" color={palette.ink}>
                  {item.price}
                </LText>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}
