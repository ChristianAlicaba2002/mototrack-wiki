import { router } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/google-sign-in';

export type SettingsViewModel = {
  name: string;
  email: string | null;
  initial: string;
  signingOut: boolean;
  error: string | null;
  signOut: () => void;
  back: () => void;
};

export function closeSettings() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function useSettingsViewModel(): SettingsViewModel {
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.email ?? null;
  const name = user?.displayName?.trim() || email?.split('@')[0] || 'Rider';

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  };

  return {
    name,
    email,
    initial: name.charAt(0).toUpperCase(),
    signingOut,
    error,
    signOut: () => void handleSignOut(),
    back: closeSettings,
  };
}
