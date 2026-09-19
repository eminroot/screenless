import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

import type { Language } from '../i18n/types';
import type { BuddyId } from '../state/types';

/**
 * The buddy's voice.
 *
 * Everything runs through the phone's own text to speech, so a story or a
 * mission brief is read out without a single byte leaving the device, and it
 * still works with no connection at all. A four year old who cannot read yet
 * gets exactly the same app as an eight year old who can.
 */

export type VoiceProfile = { pitch: number; rate: number };

/** Each buddy sounds like itself: the tiger booms, the bunny chirps. */
export const buddyVoices: Record<BuddyId, VoiceProfile> = {
  fox: { pitch: 1.25, rate: 1.0 },
  robot: { pitch: 0.85, rate: 0.92 },
  scout: { pitch: 1.1, rate: 1.06 },
  byte: { pitch: 0.7, rate: 0.95 },
  cat: { pitch: 1.35, rate: 1.02 },
  dino: { pitch: 0.8, rate: 0.88 },
  owl: { pitch: 1.05, rate: 0.9 },
  star: { pitch: 1.45, rate: 1.05 },
  bear: { pitch: 0.82, rate: 0.86 },
  tiger: { pitch: 0.95, rate: 1.08 },
  bunny: { pitch: 1.5, rate: 1.06 },
  panda: { pitch: 1.0, rate: 0.9 },
  turtle: { pitch: 0.9, rate: 0.8 },
  rocket: { pitch: 1.2, rate: 1.12 },
};

const localeFor: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  az: 'az-AZ',
};

/**
 * Azerbaijani text to speech ships on very few phones. Turkish is close enough
 * to be understood and is almost always installed, so it stands in rather than
 * leaving an Azerbaijani speaking child with silence.
 */
let resolvedAz: string | null = null;

async function localeToUse(language: Language): Promise<string> {
  if (language !== 'az') return localeFor[language];
  if (resolvedAz) return resolvedAz;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const azerbaijani = voices.some((voice) => voice.language?.toLowerCase().startsWith('az'));
    resolvedAz = azerbaijani ? 'az-AZ' : 'tr-TR';
  } catch {
    resolvedAz = 'tr-TR';
  }
  return resolvedAz;
}

/** Emoji read aloud as "grinning face" ruins the line, so they come out first. */
export function speakable(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function stopSpeaking(): void {
  void Speech.stop();
}

export type Narrator = {
  say: (text: string) => void;
  stop: () => void;
  speaking: boolean;
};

/**
 * Speaks in one buddy's voice and reports when it is talking, so the character
 * on screen can move its mouth in time.
 */
export function useNarrator(buddyId: BuddyId, language: Language, enabled: boolean): Narrator {
  const [speaking, setSpeaking] = useState(false);
  // Guards against a reply that finishes after the screen has gone.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      void Speech.stop();
    };
  }, []);

  const stop = useCallback(() => {
    void Speech.stop();
    setSpeaking(false);
  }, []);

  const say = useCallback(
    (text: string) => {
      if (!enabled) return;
      const clean = speakable(text);
      if (!clean) return;

      void (async () => {
        const locale = await localeToUse(language);
        if (!alive.current) return;
        // One voice at a time, or two missions talk over each other.
        void Speech.stop();
        const voice = buddyVoices[buddyId];
        const finished = () => {
          if (alive.current) setSpeaking(false);
        };

        setSpeaking(true);
        Speech.speak(clean, {
          language: locale,
          pitch: voice.pitch,
          rate: voice.rate,
          onDone: finished,
          onStopped: finished,
          onError: finished,
        });
      })();
    },
    [buddyId, enabled, language],
  );

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  return { say, stop, speaking };
}
