import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../../i18n';
import { Button, IconButton } from '../components/Button';
import { JText } from '../components/JText';
import { Card } from '../components/Surface';
import { CameraIcon, CloseIcon } from '../icons';
import { accents, ink, MAX_COLUMN, palette, radius, space } from '../theme';

/**
 * The camera, full screen, for the two things the 6-9 missions need it for:
 * reading a treasure badge and taking one picture.
 *
 * Nothing it sees is kept by this component. A scan hands back the text in the
 * code and the frame is gone; a photo hands back a file in the camera cache and
 * the caller decides whether it lives (a before photo waiting for a parent) or
 * is deleted straight away (the secret object, once the labeller has looked).
 */
export function CameraSheet({
  open,
  mode,
  title,
  message,
  busy = false,
  onClose,
  onScan,
  onPhoto,
}: {
  open: boolean;
  mode: 'scan' | 'photo';
  title: string;
  /** A line under the title, e.g. "That is badge 2". Changes as the child scans. */
  message?: string | null;
  busy?: boolean;
  onClose: () => void;
  onScan?: (data: string) => void;
  onPhoto?: (uri: string) => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [shooting, setShooting] = useState(false);
  /** The same code sits in front of the lens for many frames; read it once a second at most. */
  const lastScan = useRef<{ data: string; at: number } | null>(null);

  const scanned = useCallback(
    ({ data }: { data: string }) => {
      const now = Date.now();
      const last = lastScan.current;
      if (last && last.data === data && now - last.at < 1500) return;
      lastScan.current = { data, at: now };
      onScan?.(data);
    },
    [onScan],
  );

  const shoot = useCallback(async () => {
    if (shooting) return;
    setShooting(true);
    try {
      const picture = await camera.current?.takePictureAsync({ quality: 0.6, shutterSound: false });
      if (picture?.uri) onPhoto?.(picture.uri);
    } finally {
      setShooting(false);
    }
  }, [onPhoto, shooting]);

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: palette.ink }}>
        {open && permission?.granted ? (
          <CameraView
            ref={camera}
            style={{ flex: 1 }}
            facing="back"
            animateShutter={false}
            barcodeScannerSettings={mode === 'scan' ? { barcodeTypes: ['qr'] } : undefined}
            onBarcodeScanned={mode === 'scan' ? scanned : undefined}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', padding: space.xl }}>
            <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}>
              <Card>
                <JText variant="heading">{title}</JText>
                <JText variant="body" color={ink.body} style={{ marginTop: space.sm }}>
                  {t('verify.cameraWhy')}
                </JText>
                <Button
                  label={t('proof.allow')}
                  icon={<CameraIcon size={22} />}
                  accent="blue"
                  style={{ marginTop: space.lg }}
                  onPress={() => void requestPermission()}
                />
              </Card>
            </View>
          </View>
        )}

        {/* Title and way out, over the picture. */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + space.md,
            left: space.lg,
            right: space.lg,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: space.md,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: radius.chip,
              borderWidth: 3,
              borderColor: palette.ink,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
            }}
          >
            <JText variant="bodyStrong" numberOfLines={2}>
              {title}
            </JText>
            {message ? (
              <JText variant="small" color={accents.flame.base} style={{ marginTop: 2 }}>
                {message}
              </JText>
            ) : null}
          </View>
          <IconButton
            icon={<CloseIcon size={22} />}
            kind="cream"
            size={48}
            accessibilityLabel={t('common.close')}
            onPress={onClose}
          />
        </View>

        {mode === 'scan' && permission?.granted ? (
          // A frame to aim with. The scanner reads the whole picture anyway.
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={{
                width: 230,
                height: 230,
                borderRadius: radius.panel,
                borderWidth: 5,
                borderColor: accents.green.solid,
              }}
            />
          </View>
        ) : null}

        {mode === 'photo' && permission?.granted ? (
          <View style={{ position: 'absolute', left: space.xl, right: space.xl, bottom: insets.bottom + space.xl }}>
            <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center' }}>
              {busy ? (
                <View style={{ alignItems: 'center', padding: space.lg }}>
                  <ActivityIndicator color={palette.surface} size="large" />
                </View>
              ) : (
                <Button
                  label={t('proof.take')}
                  icon={<CameraIcon size={22} />}
                  busy={shooting}
                  onPress={() => void shoot()}
                />
              )}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
