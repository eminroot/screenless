import { TextInput, View } from 'react-native';

import { useI18n } from '../../i18n';
import type { NoteSpec } from '../../state/types';
import { Label, Panel } from '../components/Surface';
import { TText } from '../components/TText';
import { useSkin } from '../skin';
import { border, radius, space, typeTeen } from '../theme';

/**
 * Writing something in your own words.
 *
 * The one place in the whole app with a free text box, and it only exists from
 * ten, where the writing *is* the task: three goals, tomorrow's plan, the
 * habit that eats your time. Below that age a text box is a spelling test.
 *
 * What is written here is theirs. It never appears in the parent area, it is
 * stripped out of the data export, and it never leaves the phone. The screen
 * says so, because a reflection written for an audience is not a reflection.
 */
export function NoteCard({
  spec,
  value,
  onChange,
}: {
  spec: NoteSpec;
  value: string;
  onChange: (next: string) => void;
}) {
  const { t, pick } = useI18n();
  const { palette, ink, accents } = useSkin();

  const lines = value.split('\n').filter((line) => line.trim().length > 0).length;
  const wanted = spec.lines ?? 1;
  const enough = lines >= wanted && value.trim().length >= (spec.minChars ?? 12);

  return (
    <View>
      <Label
        accent={enough ? 'acid' : undefined}
        trailing={
          wanted > 1 ? (
            <TText variant="label" color={enough ? accents.acid.bright : ink.muted}>
              {`${Math.min(lines, wanted)}/${wanted}`}
            </TText>
          ) : undefined
        }
      >
        {t('teenVerify.noteLabel')}
      </Label>

      <Panel>
        <TText variant="bodyStrong">{pick(spec.prompt)}</TText>
        <TextInput
          value={value}
          onChangeText={onChange}
          multiline
          placeholder={spec.placeholder ? pick(spec.placeholder) : undefined}
          placeholderTextColor={ink.muted}
          textAlignVertical="top"
          accessibilityLabel={pick(spec.prompt)}
          style={{
            marginTop: space.md,
            minHeight: wanted > 1 ? 24 * (wanted + 1) : 72,
            borderRadius: radius.chip,
            borderWidth: border.hair,
            borderColor: palette.line,
            backgroundColor: palette.sunken,
            color: ink.strong,
            padding: space.md,
            ...typeTeen.body,
          }}
        />
        <TText variant="caption" color={ink.muted} style={{ marginTop: space.sm }}>
          {t('teenVerify.notePrivate')}
        </TText>
      </Panel>
    </View>
  );
}
