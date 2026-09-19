import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Screen, Sticker, TopBar, Txt } from '../components/ui';
import { itemsInSlot, type WardrobeItem } from '../data/wardrobe';
import { buyState, isWorn } from '../engine/wardrobe';
import { useExperience } from '../experience';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { JuniorWardrobe } from '../junior/screens/JuniorWardrobe';
import { LittleWardrobe } from '../little/screens/LittleWardrobe';
import { useApp } from '../state/app-state';
import { WEAR_SLOTS, type WearSlot } from '../state/types';
import { TeenWardrobe } from '../teen/screens/TeenWardrobe';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';

const SLOT_LABEL: Record<WearSlot, TKey> = {
  head: 'wardrobe.slotHead',
  face: 'wardrobe.slotFace',
  neck: 'wardrobe.slotNeck',
  back: 'wardrobe.slotBack',
  hand: 'wardrobe.slotHand',
};

export default function WardrobeRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleWardrobe />;
  if (experience === 'junior') return <JuniorWardrobe />;
  if (experience === 'teen') return <TeenWardrobe />;
  return <ClassicWardrobe />;
}

/** The fallback, for a stored profile whose age band cannot be read. */
function ClassicWardrobe() {
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
    } else if (state === 'affordable') {
      buyItem(item.id);
    }
  };

  return (
    <Screen>
      <TopBar title={t('wardrobe.title')} onBack={() => router.back()} />

      <Sticker background={colors.surfaceAlt} style={{ alignItems: 'center', padding: spacing.lg, gap: spacing.sm }}>
        <Buddy id={profile.buddyId} size={170} mood="happy" wearing={wardrobe.worn} />
        <Txt variant="bodyStrong">🪙 {coins}</Txt>
        {wardrobe.worn.length > 0 ? (
          <Button label={t('wardrobe.takeAllOff')} tone="neutral" size="md" onPress={clearOutfit} />
        ) : (
          <Txt variant="small" color={colors.textSoft}>
            {t('wardrobe.nothingOn')}
          </Txt>
        )}
      </Sticker>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.lg }}
      >
        {WEAR_SLOTS.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityState={{ selected: slot === s }}
            onPress={() => setSlot(s)}
            style={{
              backgroundColor: slot === s ? colors.info : colors.surface,
              borderRadius: radii.pill,
              borderWidth: borderWidth.thick,
              borderColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
          >
            <Txt variant="small" color={slot === s ? colors.surface : colors.text}>
              {t(SLOT_LABEL[s])}
            </Txt>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ gap: spacing.sm }}>
        {itemsInSlot(slot).map((item) => {
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
                : t('wardrobe.costs', { count: item.price });

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected: worn, disabled: !reachable }}
              accessibilityLabel={`${pick(item.name)}. ${note}`}
              onPress={() => onItem(item)}
            >
              <Sticker
                background={worn ? colors.success : colors.surface}
                offset={worn ? 5 : 3}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, opacity: reachable ? 1 : 0.6 }}
              >
                <Txt variant="subheading">{item.emoji}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" color={worn ? colors.surface : colors.text}>
                    {pick(item.name)}
                  </Txt>
                  <Txt variant="small" color={worn ? colors.surface : colors.textSoft}>
                    {note}
                  </Txt>
                </View>
              </Sticker>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
