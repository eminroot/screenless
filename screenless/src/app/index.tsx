import { Redirect } from 'expo-router';

import { useApp } from '../state/app-state';

/** Sends a returning family straight to Today and a new one into setup. */
export default function Entry() {
  const { isOnboarded } = useApp();
  return <Redirect href={isOnboarded ? '/(tabs)' : '/onboarding/language'} />;
}
