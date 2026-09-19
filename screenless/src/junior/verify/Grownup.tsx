import { useState } from 'react';
import { Image, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { useApp } from '../../state/app-state';
import { discard } from '../../vision/detector';
import { Button } from '../components/Button';
import { JText } from '../components/JText';
import { Card, IconTile, Stamp } from '../components/Surface';
import { CameraIcon, CheckIcon, LockIcon } from '../icons';
import { accents, border, ink, palette, radius, space } from '../theme';
import { CameraSheet } from './CameraSheet';
import { DigitSheet } from './DigitSheet';

/**
 * A grown up saying yes on the spot, with the same code that guards the
 * parent area.
 *
 * For the missions a grown up is part of anyway: the riddle they had to guess,
 * the dance they danced, the table they sat down at. When they are standing
 * right there, sending the mission to a queue for them to find later would be
 * silly; this is the parent's approval, just given in the moment.
 */
export function GrownupCard({
  done,
  primary,
  onApproved,
}: {
  done: boolean;
  /** The grown up is the only check, so this is the main thing on the screen. */
  primary: boolean;
  onApproved: () => void;
}) {
  const { t } = useI18n();
  const { data } = useApp();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="blue">{t('verify.grownupStamp')}</Stamp>
      <Card accent={done ? 'green' : primary ? 'blue' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconTile accent={done ? 'green' : 'blue'} size={52}>
            {done ? <CheckIcon size={26} /> : <LockIcon size={26} />}
          </IconTile>
          <JText variant="bodyStrong" style={{ flex: 1 }} color={done ? accents.green.base : ink.strong}>
            {done ? t('verify.grownupDone') : t('verify.grownupAsk')}
          </JText>
        </View>
        {!done ? (
          <Button
            label={t('verify.grownupButton')}
            accent="blue"
            kind={primary ? 'solid' : 'cream'}
            size="md"
            style={{ marginTop: space.lg }}
            onPress={() => {
              setMessage(null);
              setOpen(true);
            }}
          />
        ) : null}
      </Card>

      <DigitSheet
        open={open}
        title={t('verify.grownupTitle')}
        body={t('pin.unlockSubtitle')}
        length={4}
        masked
        message={message}
        onClose={() => setOpen(false)}
        onCode={(code) => {
          if (code === data.settings.parentPin) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setOpen(false);
            onApproved();
          } else {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setMessage(t('pin.wrong'));
          }
        }}
      />
    </View>
  );
}

/**
 * An optional photo before a tidy-up starts, so a parent who looks later sees
 * the difference and not just a tidy shelf that might always have been tidy.
 * Like every proof photo it lives in the camera cache and is deleted when the
 * mission is decided.
 */
export function BeforePhotoCard({
  uri,
  onTaken,
  onFirstUse,
}: {
  uri: string | undefined;
  onTaken: (uri: string | undefined) => void;
  onFirstUse: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="violet">{t('verify.beforeStamp')}</Stamp>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.chip,
                borderWidth: border.ink,
                borderColor: palette.ink,
              }}
            />
          ) : (
            <IconTile accent="violet" size={52}>
              <CameraIcon size={26} />
            </IconTile>
          )}
          <JText variant="body" color={ink.body} style={{ flex: 1 }}>
            {t('verify.beforeAsk')}
          </JText>
        </View>
        <Button
          label={uri ? t('verify.beforeRetake') : t('verify.beforeTake')}
          icon={<CameraIcon size={20} />}
          kind="cream"
          size="md"
          style={{ marginTop: space.lg }}
          onPress={() => {
            onFirstUse();
            setOpen(true);
          }}
        />
      </Card>

      <CameraSheet
        open={open}
        mode="photo"
        title={t('verify.beforeTake')}
        onClose={() => setOpen(false)}
        onPhoto={(taken) => {
          discard(uri);
          onTaken(taken);
          setOpen(false);
        }}
      />
    </View>
  );
}
