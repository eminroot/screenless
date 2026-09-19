import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Buddy } from '../../components/buddy/Buddy';
import { buddyOrder, buddySpecs } from '../../components/buddy/specs';
import { Button, Chip, Field, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { interestList, MIN_INTERESTS } from '../../data/interests';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { useApp } from '../../state/app-state';
import { AGE_BANDS, type AgeBand, type BuddyId, type InterestId } from '../../state/types';
import { categoryColors, colors, spacing } from '../../theme/tokens';

const ageLabels: Record<AgeBand, TKey> = {
  '3-5': 'child.ageBand35',
  '6-9': 'child.ageBand69',
  '10-13': 'child.ageBand1013',
};

const tones = [
  categoryColors.move,
  categoryColors.outdoor,
  categoryColors.create,
  categoryColors.social,
  categoryColors.calm,
];

export default function EditProfile() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile, updateProfile } = useApp();

  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [ageBand, setAgeBand] = useState<AgeBand>(profile?.ageBand ?? '6-9');
  const [interests, setInterests] = useState<InterestId[]>(profile?.interests ?? []);
  const [buddyId, setBuddyId] = useState<BuddyId>(profile?.buddyId ?? 'fox');
  const [buddyName, setBuddyName] = useState(profile?.buddyName ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const save = () => {
    if (!nickname.trim() || interests.length < MIN_INTERESTS || !buddyName.trim()) {
      setError(t('interests.validation'));
      return;
    }
    updateProfile({
      nickname: nickname.trim(),
      ageBand,
      interests,
      buddyId,
      buddyName: buddyName.trim(),
    });
    router.back();
  };

  return (
    <Screen>
      <TopBar title={t('parent.settingProfile')} />

      <Field
        label={t('child.nicknameLabel')}
        hint={t('child.nicknameHint')}
        value={nickname}
        onChangeText={(v) => setNickname(v.slice(0, 16))}
        maxLength={16}
        autoCapitalize="words"
      />

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('child.ageLabel')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        {AGE_BANDS.map((band) => (
          <Pressable key={band} style={{ flex: 1 }} onPress={() => setAgeBand(band)}>
            <Sticker background={ageBand === band ? colors.info : colors.surface} offset={4}>
              <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <Txt
                  variant="small"
                  center
                  color={ageBand === band ? colors.surface : colors.text}
                >
                  {t(ageLabels[band])}
                </Txt>
              </View>
            </Sticker>
          </Pressable>
        ))}
      </View>

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('interests.title', { name: nickname || profile.nickname })}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }}>
        {interestList.map((interest, index) => (
          <View key={interest.id} style={{ width: '30%' }}>
            <Chip
              emoji={interest.emoji}
              label={t(interest.labelKey)}
              selected={interests.includes(interest.id)}
              tone={tones[index % tones.length]}
              onPress={() => {
                setError(null);
                setInterests((current) =>
                  current.includes(interest.id)
                    ? current.filter((i) => i !== interest.id)
                    : [...current, interest.id],
                );
              }}
            />
          </View>
        ))}
      </View>

      <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
        {t('buddy.title', { name: nickname || profile.nickname })}
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.md }}
      >
        {buddyOrder.map((id) => (
          <Pressable key={id} onPress={() => setBuddyId(id)}>
            <Sticker
              background={id === buddyId ? buddySpecs[id].light : colors.surface}
              offset={4}
              style={{ width: 88, alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Buddy id={id} size={58} mood="idle" />
              <Txt variant="tiny" center numberOfLines={1}>
                {t(`buddyNames.${id}` as TKey)}
              </Txt>
            </Sticker>
          </Pressable>
        ))}
      </ScrollView>

      <Field
        label={t('buddy.nameTitle')}
        value={buddyName}
        onChangeText={(v) => setBuddyName(v.slice(0, 14))}
        maxLength={14}
        autoCapitalize="words"
        error={error}
      />

      <View style={{ marginTop: spacing.xl }}>
        <Button label={t('common.save')} tone="success" onPress={save} />
      </View>
    </Screen>
  );
}
