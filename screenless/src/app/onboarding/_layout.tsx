import { createContext, useContext, useMemo, useState } from 'react';
import { Stack } from 'expo-router';

import type { AgeBand, BuddyId, InterestId } from '../../state/types';
import { colors } from '../../theme/tokens';

type Draft = {
  nickname: string;
  ageBand: AgeBand | null;
  interests: InterestId[];
  buddyId: BuddyId | null;
  buddyName: string;
};

type DraftValue = {
  draft: Draft;
  patch: (next: Partial<Draft>) => void;
  toggleInterest: (id: InterestId) => void;
};

const emptyDraft: Draft = {
  nickname: '',
  ageBand: null,
  interests: [],
  buddyId: null,
  buddyName: '',
};

const DraftContext = createContext<DraftValue | null>(null);

/** Setup answers live here until the last step writes them to storage. */
export function useDraft(): DraftValue {
  const value = useContext(DraftContext);
  if (!value) throw new Error('useDraft must be used inside the onboarding layout');
  return value;
}

export default function OnboardingLayout() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const value = useMemo<DraftValue>(
    () => ({
      draft,
      patch: (next) => setDraft((d) => ({ ...d, ...next })),
      toggleInterest: (id) =>
        setDraft((d) => ({
          ...d,
          interests: d.interests.includes(id)
            ? d.interests.filter((i) => i !== id)
            : [...d.interests, id],
        })),
    }),
    [draft],
  );

  return (
    <DraftContext.Provider value={value}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </DraftContext.Provider>
  );
}
