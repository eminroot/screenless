import { useCallback, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Buddy } from '../components/buddy/Buddy';
import { Button, Confetti, Field, Screen, SpeechBubble, Sticker, TopBar, Txt } from '../components/ui';
import { treeHeadline, treeStatus, treeStrip } from '../engine/find-engine';
import { useI18n } from '../i18n';
import type { TKey } from '../i18n/shape';
import { useApp } from '../state/app-state';
import { LEAF_STATES, type LeafState } from '../state/types';
import { borderWidth, colors, radii, spacing } from '../theme/tokens';
import { keepPhoto, remove } from '../vision/finder';

/**
 * One tree, watched for a year.
 *
 * There is no recognition anywhere in this screen and there does not need to
 * be: it is the same tree every time, and the child is the one who walks back
 * to it. What the app contributes is the reason to go, the record of what
 * changed, and a strip of photographs at the end that could not have been
 * faked, hurried or bought. A year is the one thing a screen cannot give you
 * in an afternoon.
 */

type Mode = 'view' | 'intro' | 'camera' | 'form';

const HUG_CHOICES = [1, 2, 3, 4, 5] as const;

export default function Tree() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile, data, adoptTree, addTreeCheckIn, renameTree, forgetTree } = useApp();
  const [permission, requestPermission] = useCameraPermissions();

  const camera = useRef<CameraView>(null);
  const tree = data.tree;

  const [mode, setMode] = useState<Mode>(tree ? 'view' : 'intro');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hugs, setHugs] = useState<number | null>(null);
  const [leafState, setLeafState] = useState<LeafState | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmForget, setConfirmForget] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const status = useMemo(() => treeStatus(tree), [tree]);
  const headline = treeHeadline(status);
  const strip = useMemo(() => (tree ? treeStrip(tree) : []), [tree]);

  const previousHugs = useMemo(() => {
    const withHugs = strip.filter((entry) => entry.hugs !== undefined);
    return withHugs.length >= 2 ? withHugs[withHugs.length - 2].hugs : undefined;
  }, [strip]);
  const latestHugs = useMemo(() => {
    const withHugs = strip.filter((entry) => entry.hugs !== undefined);
    return withHugs.length > 0 ? withHugs[withHugs.length - 1].hugs : undefined;
  }, [strip]);

  const leave = useCallback(() => {
    if (mode !== 'view') remove(photo);
    router.replace('/(tabs)/finds');
  }, [mode, photo, router]);

  const shoot = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const shot = await camera.current?.takePictureAsync({ quality: 0.6, shutterSound: false });
      if (!shot?.uri) return;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhoto(shot.uri);
      setMode('form');
    } catch (error) {
      if (__DEV__) console.warn('[tree] capture failed', error);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const openCamera = useCallback(() => {
    void (async () => {
      const granted = permission?.granted ? permission : await requestPermission();
      // A check in without a photo is still a visit, so this is never a dead end.
      setMode(granted.granted ? 'camera' : 'form');
    })();
  }, [permission, requestPermission]);

  const save = useCallback(() => {
    const kept = photo ? keepPhoto(photo, 'tree') : undefined;
    if (photo && kept !== photo) remove(photo);

    if (tree) {
      addTreeCheckIn({ photoUri: kept, hugs: hugs ?? undefined, leafState: leafState ?? undefined });
    } else {
      adoptTree({
        name: name.trim() || t('tree.namePlaceholder'),
        photoUri: kept,
        hugs: hugs ?? undefined,
        leafState: leafState ?? undefined,
      });
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhoto(null);
    setHugs(null);
    setLeafState(null);
    setName('');
    setJustSaved(true);
    setMode('view');
  }, [addTreeCheckIn, adoptTree, hugs, leafState, name, photo, t, tree]);

  if (!profile) return null;

  /* -------------------------------------------------------------- camera */

  if (mode === 'camera' && permission?.granted) {
    return (
      <Screen scroll={false} padded={false} background={colors.border}>
        <View style={{ flex: 1 }}>
          <CameraView ref={camera} style={{ flex: 1 }} facing="back" animateShutter={false} />
          <View style={overlay}>
            <Sticker background={colors.surface} style={{ padding: spacing.md, marginTop: spacing.xxl }}>
              <Txt variant="bodyStrong" center>
                {t('tree.photoPrompt')}
              </Txt>
            </Sticker>
            <View style={{ gap: spacing.md }}>
              <Button label={t('compare.take')} tone="primary" busy={busy} onPress={() => void shoot()} />
              <Button
                label={t('common.skip')}
                tone="neutral"
                size="md"
                onPress={() => setMode('form')}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- form */

  if (mode === 'form') {
    return (
      <Screen avoidKeyboard>
        <TopBar onBack={() => setMode(tree ? 'view' : 'intro')} />

        <Txt variant="title">
          {tree ? t('tree.checkInTitle', { name: tree.name }) : t('tree.adoptTitle')}
        </Txt>

        {photo ? (
          <View
            style={{
              marginTop: spacing.lg,
              borderRadius: radii.lg,
              borderWidth: borderWidth.chunky,
              borderColor: colors.border,
              overflow: 'hidden',
              aspectRatio: 3 / 4,
            }}
          >
            <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ) : null}

        {!tree ? (
          <View style={{ marginTop: spacing.xl }}>
            <Field
              label={t('tree.nameIt')}
              placeholder={t('tree.namePlaceholder')}
              value={name}
              onChangeText={setName}
              maxLength={24}
              returnKeyType="done"
            />
          </View>
        ) : null}

        <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
          {t('tree.hugsPrompt')}
        </Txt>
        <Txt variant="tiny" color={colors.textSoft} style={{ marginTop: 2 }}>
          {t('tree.hugsHint')}
        </Txt>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {HUG_CHOICES.map((value) => {
            const on = hugs === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={String(value)}
                style={{ flex: 1 }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setHugs(on ? null : value);
                }}
              >
                <Sticker
                  background={on ? colors.success : colors.surface}
                  offset={3}
                  style={{ alignItems: 'center', paddingVertical: spacing.md }}
                >
                  <Txt variant="heading" color={on ? colors.surface : colors.text}>
                    {value === 5 ? '5+' : value}
                  </Txt>
                </Sticker>
              </Pressable>
            );
          })}
        </View>

        <Txt variant="subheading" style={{ marginTop: spacing.xl }}>
          {t('tree.leafPrompt')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          {LEAF_STATES.map((state) => {
            const on = leafState === state;
            return (
              <Pressable
                key={state}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`leafStates.${state}` as TKey)}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setLeafState(on ? null : state);
                }}
              >
                <Sticker
                  background={on ? colors.success : colors.surface}
                  offset={3}
                  style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}
                >
                  <Txt variant="small" color={on ? colors.surface : colors.text}>
                    {t(`leafStates.${state}` as TKey)}
                  </Txt>
                </Sticker>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={tree ? t('common.save') : t('tree.save')}
          tone="success"
          style={{ marginTop: spacing.xxl }}
          onPress={save}
        />
      </Screen>
    );
  }

  /* --------------------------------------------------------------- intro */

  if (mode === 'intro' || !tree) {
    return (
      <Screen>
        <TopBar onBack={leave} />

        <Txt variant="title">{t('tree.adoptTitle')}</Txt>

        <View style={{ alignItems: 'center', marginVertical: spacing.xl, gap: spacing.lg }}>
          <SpeechBubble text={t('tree.adoptBody')} tailSide="left" />
          <Buddy id={profile.buddyId} size={170} mood="talking" label={profile.buddyName} />
        </View>

        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg }}>
          <Txt variant="small" color={colors.textSoft}>
            {t('tree.photoPrompt')}
          </Txt>
        </Sticker>

        <Button
          label={t('tree.adoptStart')}
          tone="primary"
          style={{ marginTop: spacing.xl }}
          onPress={openCamera}
        />
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- view */

  return (
    <Screen>
      {justSaved ? <Confetti /> : null}
      <TopBar onBack={leave} />

      <View style={{ alignItems: 'center', gap: spacing.md }}>
        <SpeechBubble
          text={
            justSaved
              ? t('tree.saved')
              : t(`tree.headline${cap(headline.key)}` as TKey, {
                  name: tree.name,
                  days: headline.days,
                })
          }
          tailSide="left"
        />
        <Buddy id={profile.buddyId} size={130} mood={status?.due ? 'talking' : 'happy'} />
      </View>

      {renaming ? (
        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          <Field
            label={t('tree.nameIt')}
            placeholder={tree.name}
            value={newName}
            onChangeText={setNewName}
            maxLength={24}
            returnKeyType="done"
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label={t('common.save')}
              tone="success"
              size="sm"
              full={false}
              onPress={() => {
                renameTree(newName);
                setNewName('');
                setRenaming(false);
              }}
            />
            <Button
              label={t('common.cancel')}
              tone="neutral"
              size="sm"
              full={false}
              onPress={() => setRenaming(false)}
            />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tree.rename')}
          onPress={() => setRenaming(true)}
          style={{ marginTop: spacing.lg }}
        >
          <Sticker background={colors.success} style={{ padding: spacing.lg, gap: 2 }}>
            <Txt variant="tiny" color={colors.surface}>
              {t('tree.title')}
            </Txt>
            <Txt variant="title" color={colors.surface}>
              {tree.name}
            </Txt>
            <Txt variant="small" color={colors.surface}>
              {status?.visits === 1
                ? t('tree.firstVisit')
                : t('tree.visits', { count: status?.visits ?? 0 })}
              {'  ·  '}
              {t('tree.seasonsSeen', { count: status?.seasons.length ?? 0 })}
            </Txt>
          </Sticker>
        </Pressable>
      )}

      {status?.fullYear ? (
        <Sticker background={colors.accent} style={{ padding: spacing.lg, marginTop: spacing.md }}>
          <Txt variant="bodyStrong">{t('tree.fullYear')}</Txt>
        </Sticker>
      ) : null}

      {previousHugs !== undefined && latestHugs !== undefined && previousHugs !== latestHugs ? (
        <Sticker background={colors.surfaceAlt} style={{ padding: spacing.lg, marginTop: spacing.md }}>
          <Txt variant="small">
            {t('tree.hugsChanged', { before: previousHugs, after: latestHugs })}
          </Txt>
        </Sticker>
      ) : null}

      {/* The strip. This is the whole point of the feature. */}
      <Txt variant="heading" style={{ marginTop: spacing.xl }}>
        {t('tree.strip', { name: tree.name })}
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: spacing.md, marginHorizontal: -spacing.xl }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md }}
      >
        {strip.map((entry) => (
          <View key={entry.id} style={{ width: 132, gap: spacing.xs }}>
            <View
              style={{
                aspectRatio: 3 / 4,
                borderRadius: radii.md,
                borderWidth: borderWidth.thick,
                borderColor: colors.border,
                backgroundColor: colors.surfaceAlt,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {entry.photoUri ? (
                <Image
                  source={{ uri: entry.photoUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              ) : (
                <Txt variant="display">🌳</Txt>
              )}
            </View>
            <Txt variant="tiny">{t(`seasons.${entry.season}` as TKey)}</Txt>
            <Txt variant="tiny" color={colors.textFaint}>
              {new Date(entry.at).toLocaleDateString()}
              {entry.leafState ? `  ·  ${t(`leafStates.${entry.leafState}` as TKey)}` : ''}
            </Txt>
          </View>
        ))}
      </ScrollView>

      <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
        <Button
          label={t('tree.checkIn')}
          tone="primary"
          onPress={() => {
            setJustSaved(false);
            openCamera();
          }}
        />

        {confirmForget ? (
          <Sticker background={colors.surface} style={{ padding: spacing.lg, gap: spacing.md }}>
            <Txt variant="small" color={colors.textSoft}>
              {t('tree.forgetWarn')}
            </Txt>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label={t('tree.forget')}
                tone="primary"
                size="sm"
                full={false}
                onPress={() => {
                  forgetTree();
                  setConfirmForget(false);
                  setMode('intro');
                }}
              />
              <Button
                label={t('common.cancel')}
                tone="neutral"
                size="sm"
                full={false}
                onPress={() => setConfirmForget(false)}
              />
            </View>
          </Sticker>
        ) : (
          <Button
            label={t('tree.forget')}
            tone="ghost"
            size="sm"
            onPress={() => setConfirmForget(true)}
          />
        )}
      </View>
    </Screen>
  );
}

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const overlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'space-between',
  padding: spacing.xl,
} as const;
