import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Button, Screen, Sticker, TopBar, Txt } from '../../components/ui';
import { LANGUAGES, languageMeta, useI18n } from '../../i18n';
import { confirmAction } from '../../lib/confirm';
import { cancelReminders, remindersSupported, scheduleDailyReminder } from '../../lib/reminders';
import { allowReviewNotifications } from '../../lib/review-notify';
import { reviewPolicy } from '../../engine/verify';
import { deleteAccount } from '../../online/api';
import { forgetBoard } from '../../online/useBoard';
import { useApp } from '../../state/app-state';
import { borderWidth, colors, radii, spacing } from '../../theme/tokens';

const APP_VERSION = '1.0.0';

export default function Settings() {
  const router = useRouter();
  const { t, language } = useI18n();
  const {
    data,
    setLanguage,
    setReminder,
    setVoiceEnabled,
    setDuoEnabled,
    clearRoomScan,
    resetAll,
    exportPayload,
    setSpotChecks,
    setReviewNotify,
  } = useApp();
  const [exporting, setExporting] = useState(false);
  const [notifyDenied, setNotifyDenied] = useState(false);

  const toggleReviewNotify = async (enabled: boolean) => {
    if (!enabled) {
      setReviewNotify(false);
      return;
    }
    const allowed = await allowReviewNotifications();
    setNotifyDenied(!allowed);
    setReviewNotify(allowed);
  };

  const { remindersEnabled, reminderHour, reminderMinute, voiceEnabled, duoEnabled } = data.settings;

  const toggleReminder = async (enabled: boolean) => {
    if (!enabled) {
      await cancelReminders();
      setReminder(false);
      return;
    }
    const ok = await scheduleDailyReminder(language, reminderHour, reminderMinute);
    setReminder(ok);
  };

  const shiftHour = async (delta: number) => {
    const hour = (reminderHour + delta + 24) % 24;
    setReminder(remindersEnabled, hour, reminderMinute);
    if (remindersEnabled) await scheduleDailyReminder(language, hour, reminderMinute);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const file = new File(Paths.cache, 'screenless-data.json');
      if (file.exists) file.delete();
      file.create();
      file.write(exportPayload());
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      }
    } catch (error) {
      if (__DEV__) console.warn('[settings] export failed', error);
    } finally {
      setExporting(false);
    }
  };

  const confirmReset = async () => {
    const ok = await confirmAction({
      title: t('parent.resetConfirmTitle'),
      body: t('parent.resetConfirmBody'),
      action: t('parent.resetConfirmAction'),
      cancel: t('common.cancel'),
    });
    if (!ok) return;

    // A username lives on the server too. It goes first, while this phone still
    // holds the token that proves it owns it.
    const account = data.social.account;
    if (account) {
      const result = await deleteAccount(account);
      if (!result.ok && result.error !== 'unauthorized') {
        const anyway = await confirmAction({
          title: t('social.removeFailedTitle'),
          body: t('social.removeFailedBody'),
          action: t('social.removeLocalOnly'),
          cancel: t('common.cancel'),
        });
        if (!anyway) return;
      }
    }

    forgetBoard();
    await cancelReminders();
    await resetAll();
    router.replace('/onboarding/language');
  };

  return (
    <Screen>
      <TopBar title={t('parent.settingsTitle')} />

      <Txt variant="heading">{t('parent.settingLanguage')}</Txt>
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        {LANGUAGES.map((code) => {
          const active = code === language;
          return (
            <Pressable key={code} style={{ flex: 1 }} onPress={() => setLanguage(code)}>
              <Sticker background={active ? colors.accent : colors.surface} offset={4}>
                <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                  <Txt variant="small" center numberOfLines={1}>
                    {languageMeta[code].label}
                  </Txt>
                </View>
              </Sticker>
            </Pressable>
          );
        })}
      </View>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.settingMissions')}
      </Txt>
      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('parent.settingVoice')}</Txt>
            <Txt variant="small" color={colors.textSoft}>
              {t('parent.settingVoiceBody')}
            </Txt>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ true: colors.success, false: colors.surfaceAlt }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('parent.settingDuo')}</Txt>
            <Txt variant="small" color={colors.textSoft}>
              {t('parent.settingDuoBody')}
            </Txt>
          </View>
          <Switch
            value={duoEnabled}
            onValueChange={setDuoEnabled}
            trackColor={{ true: colors.success, false: colors.surfaceAlt }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('parent.settingRoom')}</Txt>
            <Txt variant="small" color={colors.textSoft}>
              {data.room
                ? t('parent.settingRoomBody', { count: data.room.objects.length })
                : t('parent.settingRoomEmpty')}
            </Txt>
          </View>
          <Button
            label={t('parent.settingRoomClear')}
            tone="neutral"
            size="sm"
            full={false}
            disabled={!data.room}
            onPress={clearRoomScan}
          />
        </View>
      </Sticker>

      {/* Ages 10-13: there is nothing to configure, because nothing waits for
          a parent. What there is instead is an explanation and the log. */}
      {reviewPolicy(data.profile?.ageBand) === 'self' ? (
        <>
          <Txt variant="heading" style={{ marginTop: spacing.xl }}>
            {t('review.selfTitle')}
          </Txt>
          <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.sm }}>
            <Txt variant="body" color={colors.textSoft}>
              {t('review.selfBody')}
            </Txt>
            <Txt variant="small" color={colors.textFaint}>
              {t('review.selfPrivate')}
            </Txt>
            <Button
              label={t('review.title')}
              tone="neutral"
              size="md"
              onPress={() => router.push('/parent/checked')}
            />
          </Sticker>
        </>
      ) : null}

      {/* Ages 6-9: the phone approves missions itself and the parent picks how
          many to look at. Hidden for the other ages, where every mission
          waits for a parent regardless. */}
      {reviewPolicy(data.profile?.ageBand) === 'sample' ? (
        <>
          <Txt variant="heading" style={{ marginTop: spacing.xl }}>
            {t('review.settingTitle')}
          </Txt>
          <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.md }}>
            {(['some', 'all'] as const).map((mode) => {
              const active = data.settings.spotChecks === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSpotChecks(mode)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: borderWidth.thick,
                        borderColor: colors.border,
                        backgroundColor: active ? colors.success : colors.surface,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong">{mode === 'some' ? t('review.spotSome') : t('review.spotAll')}</Txt>
                      <Txt variant="small" color={colors.textSoft}>
                        {mode === 'some' ? t('review.spotSomeBody') : t('review.spotAllBody')}
                      </Txt>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{t('review.notify')}</Txt>
                <Txt variant="small" color={colors.textSoft}>
                  {notifyDenied ? t('review.notifyDenied') : t('review.notifyBody')}
                </Txt>
              </View>
              <Switch
                value={data.settings.reviewNotify}
                onValueChange={(v) => void toggleReviewNotify(v)}
                trackColor={{ true: colors.success, false: colors.surfaceAlt }}
              />
            </View>
          </Sticker>
        </>
      ) : null}

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.settingReminder')}
      </Txt>
      <Sticker background={colors.surface} style={{ padding: spacing.lg, marginTop: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Txt variant="body" style={{ flex: 1 }}>
            {t('parent.settingReminderBody')}
          </Txt>
          <Switch
            value={remindersEnabled}
            onValueChange={(v) => void toggleReminder(v)}
            disabled={!remindersSupported}
            trackColor={{ true: colors.success, false: colors.surfaceAlt }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Txt variant="small" color={colors.textSoft} style={{ flex: 1 }}>
            {t('parent.settingReminderTime')}
          </Txt>
          <Stepper label="−" onPress={() => void shiftHour(-1)} />
          <View
            style={{
              minWidth: 76,
              alignItems: 'center',
              paddingVertical: spacing.sm,
              borderRadius: radii.sm,
              borderWidth: borderWidth.hair,
              borderColor: colors.border,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Txt variant="subheading">
              {String(reminderHour).padStart(2, '0')}:{String(reminderMinute).padStart(2, '0')}
            </Txt>
          </View>
          <Stepper label="+" onPress={() => void shiftHour(1)} />
        </View>
      </Sticker>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={t('parent.settingProfile')}
          tone="neutral"
          size="md"
          onPress={() => router.push('/parent/profile')}
        />
        <Button
          label={t('parent.settingPin')}
          tone="neutral"
          size="md"
          onPress={() => router.push('/parent/pin')}
        />
      </View>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.settingExport')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('parent.settingExportBody')}
      </Txt>
      <View style={{ marginTop: spacing.md }}>
        <Button
          label={t('parent.settingExport')}
          tone="info"
          size="md"
          busy={exporting}
          onPress={() => void exportData()}
        />
      </View>

      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('parent.settingReset')}
      </Txt>
      <Txt variant="small" color={colors.textSoft} style={{ marginTop: spacing.xs }}>
        {t('parent.settingResetBody')}
      </Txt>
      <View style={{ marginTop: spacing.md }}>
        <Button label={t('parent.settingReset')} tone="primary" size="md" onPress={() => void confirmReset()} />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Txt variant="tiny" color={colors.textFaint}>
          {t('parent.aboutVersion', { version: APP_VERSION })}
        </Txt>
        <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
          <Txt variant="small" color={colors.infoDeep} style={{ textDecorationLine: 'underline' }}>
            {t('parent.privacyLink')}
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.sm,
        borderWidth: borderWidth.thick,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt variant="subheading">{label}</Txt>
    </Pressable>
  );
}
