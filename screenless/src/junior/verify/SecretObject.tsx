import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { clueObjectMap } from '../../data/object-clues';
import { objectEmoji, objectName } from '../../data/room-objects';
import { MAX_SECRET_MISSES, secretChoices } from '../../engine/verify';
import { useI18n } from '../../i18n';
import type { RoomObjectId } from '../../state/types';
import { discard, onDeviceVisionAvailable, readPhoto } from '../../vision/detector';
import { Button } from '../components/Button';
import { JText } from '../components/JText';
import { Card, Shadow, Stamp } from '../components/Surface';
import { CameraIcon, CheckIcon, ClueIcon } from '../icons';
import { accents, border, drop, ink, palette, radius, space } from '../theme';
import { CameraSheet } from './CameraSheet';

/**
 * Three clues, one secret thing in the home.
 *
 * Clues come one at a time, from vague to nearly giving it away. When the
 * child thinks they have it, they hold the real thing up to the camera and the
 * labeller on this phone checks it; the photo is deleted the moment it has
 * looked. On a phone without the labeller, or when it will not see it, the
 * child picks from a board of nine pictures instead, with two wrong guesses
 * allowed. Nine rather than four so that guessing blind is a poor bet.
 */
export function SecretCard({
  missionId,
  secret,
  found,
  misses,
  onFirstUse,
  onFound,
  onMiss,
}: {
  missionId: string;
  secret: RoomObjectId;
  found: 'camera' | 'picked' | undefined;
  misses: number;
  onFirstUse: () => void;
  onFound: (how: 'camera' | 'picked') => void;
  onMiss: () => void;
}) {
  const { t, pick } = useI18n();
  const [shown, setShown] = useState(1);
  const [camera, setCamera] = useState(false);
  const [looking, setLooking] = useState(false);
  const [board, setBoard] = useState(!onDeviceVisionAvailable);
  const [message, setMessage] = useState<string | null>(null);
  const [wrong, setWrong] = useState<RoomObjectId[]>([]);

  const clues = clueObjectMap.get(secret)?.clues ?? [];
  const choices = useMemo(() => secretChoices(secret, missionId), [secret, missionId]);
  const thing = pick(objectName(secret));
  const outOfGuesses = !found && misses > MAX_SECRET_MISSES;
  const settled = Boolean(found) || outOfGuesses;

  const guess = (id: RoomObjectId) => {
    onFirstUse();
    if (id === secret) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessage(null);
      onFound('picked');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setWrong((list) => [...list, id]);
    setMessage(t('verify.clueWrong'));
    onMiss();
  };

  const photo = async (uri: string) => {
    setLooking(true);
    try {
      const read = await readPhoto(uri);
      if (read.tags.includes(secret)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCamera(false);
        setMessage(null);
        onFound('camera');
      } else {
        setMessage(t('verify.clueNotSeen'));
        setCamera(false);
        setBoard(true);
      }
    } finally {
      // Nothing about the secret object is worth keeping.
      discard(uri);
      setLooking(false);
    }
  };

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="teal">{t('verify.cluesStamp')}</Stamp>
      <Card accent={found ? 'green' : undefined}>
        <View style={{ gap: space.sm }}>
          {clues.slice(0, settled ? 3 : shown).map((clue, index) => (
            <Animated.View
              key={index}
              entering={index === 0 ? undefined : FadeInDown.duration(220)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                padding: space.md,
                borderRadius: radius.chip,
                backgroundColor: palette.sunken,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: accents.teal.solid,
                  borderWidth: 2.5,
                  borderColor: palette.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <JText variant="bodyStrong" color={accents.teal.on}>
                  {index + 1}
                </JText>
              </View>
              <JText variant="read" style={{ flex: 1 }}>
                {pick(clue)}
              </JText>
            </Animated.View>
          ))}
        </View>

        {found || outOfGuesses ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg }}>
            <JText variant="title">{objectEmoji(secret)}</JText>
            <JText variant="heading" color={found ? accents.green.base : ink.strong} style={{ flex: 1 }}>
              {found ? t('verify.clueRight', { thing }) : t('verify.clueReveal', { thing })}
            </JText>
          </View>
        ) : (
          <>
            {message ? (
              <JText variant="bodyStrong" color={accents.flame.base} style={{ marginTop: space.md }}>
                {message}
              </JText>
            ) : null}

            <View style={{ gap: space.sm, marginTop: space.lg }}>
              {shown < 3 ? (
                <Button
                  label={t('verify.clueNext')}
                  icon={<ClueIcon size={22} />}
                  kind="cream"
                  size="md"
                  onPress={() => {
                    onFirstUse();
                    setShown((n) => Math.min(3, n + 1));
                  }}
                />
              ) : null}
              {onDeviceVisionAvailable ? (
                <Button
                  label={t('verify.clueShow')}
                  icon={<CameraIcon size={22} />}
                  accent="teal"
                  size="md"
                  onPress={() => {
                    onFirstUse();
                    setMessage(null);
                    setCamera(true);
                  }}
                />
              ) : null}
              {!board ? (
                <Button
                  label={t('verify.cluePick')}
                  kind="ghost"
                  size="sm"
                  onPress={() => setBoard(true)}
                />
              ) : null}
            </View>

            {board ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
                {choices.map((id) => {
                  const crossed = wrong.includes(id);
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={pick(objectName(id))}
                      accessibilityState={{ disabled: crossed }}
                      disabled={crossed}
                      onPress={() => guess(id)}
                      style={{ width: '31%' }}
                    >
                      <View style={{ paddingRight: drop.sm, paddingBottom: drop.sm, opacity: crossed ? 0.35 : 1 }}>
                        <Shadow depth={drop.sm} radius={radius.chip} />
                        <View
                          style={{
                            minHeight: 86,
                            borderRadius: radius.chip,
                            borderWidth: border.ink,
                            borderColor: palette.ink,
                            backgroundColor: palette.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            padding: space.xs,
                          }}
                        >
                          <JText variant="title">{objectEmoji(id)}</JText>
                          <JText variant="caption" center numberOfLines={2}>
                            {pick(objectName(id))}
                          </JText>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
        {found ? (
          <View style={{ position: 'absolute', top: space.md, right: space.md }}>
            <CheckIcon size={24} color={accents.green.base} />
          </View>
        ) : null}
      </Card>

      <CameraSheet
        open={camera}
        mode="photo"
        title={t('verify.clueShow')}
        message={looking ? t('verify.clueLooking') : null}
        busy={looking}
        onClose={() => setCamera(false)}
        onPhoto={(uri) => void photo(uri)}
      />
    </View>
  );
}
