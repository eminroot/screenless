import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useI18n } from '../../i18n';
import { IconButton } from '../components/Button';
import { JText } from '../components/JText';
import { Shadow } from '../components/Surface';
import { CloseIcon } from '../icons';
import { accents, border, drop, ink, MAX_COLUMN, palette, radius, space } from '../theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/**
 * A few digits on a pad of big keys, rising from the bottom of the screen.
 *
 * Used for the three numbers under a treasure badge and for a grown up's four
 * digit code. Never the system keyboard: it covers half the screen, offers
 * letters nobody needs, and on some phones remembers what was typed.
 */
export function DigitSheet({
  open,
  title,
  body,
  length,
  masked = false,
  message,
  onClose,
  onCode,
}: {
  open: boolean;
  title: string;
  body?: string;
  length: number;
  /** Dots instead of digits, for a parent code. */
  masked?: boolean;
  message?: string | null;
  onClose: () => void;
  onCode: (code: string) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  const press = (key: string) => {
    void Haptics.selectionAsync();
    if (key === 'del') {
      setValue((v) => v.slice(0, -1));
      return;
    }
    const next = (value + key).slice(0, length);
    setValue(next);
    if (next.length === length) {
      onCode(next);
      setValue('');
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.55)' }} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable>
            <View
              style={{
                backgroundColor: palette.surface,
                borderTopLeftRadius: radius.panel,
                borderTopRightRadius: radius.panel,
                padding: space.xl,
                paddingBottom: space.xxxl,
              }}
            >
              <View style={{ width: '100%', maxWidth: MAX_COLUMN, alignSelf: 'center', gap: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <JText variant="title">{title}</JText>
                    {body ? (
                      <JText variant="body" color={ink.body}>
                        {body}
                      </JText>
                    ) : null}
                  </View>
                  <IconButton
                    icon={<CloseIcon size={22} />}
                    kind="cream"
                    size={44}
                    accessibilityLabel={t('common.close')}
                    onPress={onClose}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.md }}>
                  {Array.from({ length }, (_, i) => (
                    <View
                      key={i}
                      style={{
                        width: length > 3 ? 54 : 62,
                        height: 68,
                        borderRadius: radius.chip,
                        borderWidth: border.ink,
                        borderColor: palette.ink,
                        backgroundColor: i < value.length ? accents.amber.tint : palette.sunken,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <JText variant="stat">{i < value.length ? (masked ? '•' : value[i]) : ''}</JText>
                    </View>
                  ))}
                </View>
                {message ? (
                  <JText variant="bodyStrong" color={accents.flame.base} center>
                    {message}
                  </JText>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.sm }}>
                  {KEYS.map((key, index) =>
                    key === '' ? (
                      <View key={index} style={{ width: '30%' }} />
                    ) : (
                      <Pressable
                        key={index}
                        accessibilityRole="button"
                        accessibilityLabel={key === 'del' ? t('common.back') : key}
                        onPress={() => press(key)}
                        style={{ width: '30%' }}
                      >
                        <View style={{ paddingRight: drop.sm, paddingBottom: drop.sm }}>
                          <Shadow depth={drop.sm} radius={radius.chip} />
                          <View
                            style={{
                              height: 56,
                              borderRadius: radius.chip,
                              borderWidth: border.ink,
                              borderColor: palette.ink,
                              backgroundColor: palette.surface,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <JText variant="title">{key === 'del' ? '⌫' : key}</JText>
                          </View>
                        </View>
                      </Pressable>
                    ),
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
