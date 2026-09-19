import { useCallback, useState } from 'react';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { BadgeArt } from '../../components/BadgeArt';
import { looksLikeBadge, matchCode, readBadge } from '../../engine/badges';
import { useI18n } from '../../i18n';
import type { TKey } from '../../i18n/shape';
import { Button } from '../components/Button';
import { JText } from '../components/JText';
import { Card, Stamp } from '../components/Surface';
import { CheckIcon, ScanIcon } from '../icons';
import { accents, border, ink, palette, space } from '../theme';
import { CameraSheet } from './CameraSheet';
import { DigitSheet } from './DigitSheet';

export function badgeName(n: number): TKey {
  return `badges.name${n}` as TKey;
}

/**
 * Finding treasure badges: one a grown up hid, or three in a set order.
 *
 * Scanning the printed code is the proof, and typing the three digits printed
 * under it counts the same, for a family that copied the codes onto sticky
 * notes or a phone whose camera will not focus. The wrong badge is never a
 * failure, only a pointer to the right one; a wrong typed code is counted,
 * because a run of them is what guessing looks like.
 */
export function BadgeHuntCard({
  mode,
  plan,
  found,
  badgeKey,
  onHit,
  onMiss,
}: {
  mode: 'hunt' | 'route';
  /** Badge numbers in the order they have to be found. */
  plan: number[];
  /** How many of the plan are found so far. */
  found: number;
  badgeKey: string | null;
  onHit: (badge: number) => void;
  onMiss: () => void;
}) {
  const { t } = useI18n();
  const [camera, setCamera] = useState(false);
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const wanted = plan[found];
  const done = found >= plan.length;

  /** One reading, from either the camera or the keypad. */
  const take = useCallback(
    (badge: number | null, source: 'scan' | 'code', raw: string): boolean => {
      if (badge === null) {
        if (source === 'code') {
          onMiss();
          setMessage(t('verify.codeWrong'));
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Another family's sheet or a retired one buzzes; a cereal box does not.
          setMessage(t('verify.scanNotBadge'));
          if (looksLikeBadge(raw)) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return false;
      }
      if (badge === wanted) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessage(null);
        onHit(badge);
        return true;
      }
      if (plan.slice(0, found).includes(badge)) {
        setMessage(t('verify.scanAlready'));
      } else {
        setMessage(t('verify.scanWrongBadge', { found: badge, wanted }));
      }
      void Haptics.selectionAsync();
      return false;
    },
    [found, onHit, onMiss, plan, t, wanted],
  );

  if (!badgeKey) {
    return (
      <View style={{ marginTop: space.xxl }}>
        <Card accent="amber">
          <JText variant="bodyStrong">{t('verify.badgesMissing')}</JText>
        </Card>
      </View>
    );
  }

  return (
    <View style={{ marginTop: space.xxl }}>
      <Stamp accent="flame">{mode === 'hunt' ? t('verify.huntStamp') : t('verify.routeStamp')}</Stamp>
      <Card accent={done ? 'green' : undefined}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg, flexWrap: 'wrap' }}>
          {plan.map((badge, index) => {
            const got = index < found;
            const next = index === found;
            return (
              <View key={`${badge}-${index}`} style={{ alignItems: 'center', gap: space.xs, width: 84 }}>
                <View
                  style={{
                    padding: 4,
                    borderRadius: 999,
                    borderWidth: next ? border.strong : 0,
                    borderColor: accents.flame.solid,
                    opacity: got || next || mode === 'hunt' ? 1 : 0.55,
                  }}
                >
                  <BadgeArt number={badge} size={next ? 66 : 58} />
                  {got ? (
                    <View
                      style={{
                        position: 'absolute',
                        right: -2,
                        bottom: -2,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: accents.green.solid,
                        borderWidth: 2.5,
                        borderColor: palette.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckIcon size={16} />
                    </View>
                  ) : null}
                </View>
                <JText variant="caption" color={ink.muted} center numberOfLines={1}>
                  {mode === 'route' ? `${index + 1}. ` : ''}
                  {t(badgeName(badge))}
                </JText>
              </View>
            );
          })}
        </View>

        <JText variant="heading" center style={{ marginTop: space.md }}>
          {done
            ? mode === 'hunt'
              ? t('verify.huntDone')
              : t('verify.routeDone')
            : mode === 'hunt'
              ? t('verify.huntFind', { number: wanted })
              : t('verify.routeNext', { number: wanted })}
        </JText>
        {message && !done ? (
          <JText variant="small" color={accents.flame.base} center style={{ marginTop: space.xs }}>
            {message}
          </JText>
        ) : null}

        {!done ? (
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button
              label={t('verify.scan')}
              icon={<ScanIcon size={22} color={accents.green.on} />}
              size="md"
              style={{ flex: 1 }}
              onPress={() => {
                setMessage(null);
                setCamera(true);
              }}
            />
            <Button
              label={t('verify.typeCode')}
              kind="cream"
              size="md"
              style={{ flex: 1 }}
              onPress={() => {
                setMessage(null);
                setTyping(true);
              }}
            />
          </View>
        ) : null}
      </Card>

      <CameraSheet
        open={camera && !done}
        mode="scan"
        title={
          mode === 'hunt'
            ? t('verify.huntFind', { number: wanted ?? plan[0] })
            : t('verify.routeNext', { number: wanted ?? plan[0] })
        }
        message={message ?? t('verify.scanHint')}
        onClose={() => setCamera(false)}
        onScan={(data) => {
          if (take(readBadge(badgeKey, data), 'scan', data)) setCamera(false);
        }}
      />

      <DigitSheet
        open={typing && !done}
        title={t('verify.codeTitle')}
        length={3}
        message={message}
        onClose={() => setTyping(false)}
        onCode={(code) => {
          if (take(matchCode(badgeKey, code), 'code', code)) setTyping(false);
        }}
      />
    </View>
  );
}
