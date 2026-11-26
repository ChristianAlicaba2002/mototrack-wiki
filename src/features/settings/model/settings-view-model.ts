import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { unregisterThisDevice, usePushPermission } from '@/features/notifications/model/push-registration';
import { openServiceIntervals } from '@/features/services/model/navigation';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/firebase/google-sign-in';
import { type SignInMethod, signInMethodOf } from '@/lib/firebase/sign-in-method';
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from '@/lib/firestore/types';
import type { PushPermission } from '@/lib/notifications/push';
import { setNotificationPrefs, subscribeToUserProfile } from '@/lib/firestore/user-profile';

import { openDeleteAccount } from './delete-account-view-model';

export type SettingsViewModel = {
  /** The rider's name, or the part of their email before the @ if Google gave no name. */
  name: string;
  /** Shown under the name; null if the account has no email. */
  email: string | null;
  photoURL: string | null;
  /** Up to two letters for the avatar when there's no photo. */
  initials: string;
  /** Google, or email + password. Decides the account badge. */
  signInMethod: SignInMethod;
  /** e.g. "1.0.0", from app.json. */
  appVersion: string | null;
  signingOut: boolean;
  notificationPrefs: NotificationPrefs;
  /** False until the saved preferences have loaded; the switches are disabled until then. */
  prefsLoaded: boolean;
  error: string | null;
  /** Whether this phone can get push notifications; null while checking. */
  pushPermission: PushPermission | null;
  enablingPush: boolean;
  /** Shows the system prompt, or opens the phone's settings if the rider said no before. */
  enablePush: () => void;
  signOut: () => void;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void;
  /** Opens the delete-account screen, which confirms it's you first. */
  openDeleteAccount: () => void;
  openServiceIntervals: () => void;
  back: () => void;
};

export function closeSettings() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function displayName(name: string | null | undefined, email: string | null | undefined): string {
  return name?.trim() || email?.split('@')[0] || 'Rider';
}

function initialsOf(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]);
  // First and last word: "Juan Dela Cruz" → "JC".
  const picked = letters.length > 1 ? [letters[0], letters[letters.length - 1]] : letters;
  return picked.join('').toUpperCase() || '?';
}

export function useSettingsViewModel(): SettingsViewModel {
  const { user } = useAuth();
  const uid = user?.uid;
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPrefs, setSavedPrefs] = useState<NotificationPrefs | null>(null);
  /** Shown right away while a toggle is being saved. */
  const [pendingPrefs, setPendingPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserProfile(
      uid,
      (profile) => setSavedPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...profile?.notificationPrefs }),
      // Settings still work without the profile; show the defaults.
      () => setSavedPrefs(DEFAULT_NOTIFICATION_PREFS)
    );
  }, [uid]);

  const notificationPrefs = pendingPrefs ?? savedPrefs ?? DEFAULT_NOTIFICATION_PREFS;
  const push = usePushPermission();

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      // While still signed in: the rules only let the owner remove the token.
      if (uid) await unregisterThisDevice(uid);
      await signOut();
    } catch {
      setError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  };

  const handleSetPref = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;
    const next = { ...notificationPrefs, [key]: value };
    setPendingPrefs(next);
    setError(null);
    try {
      await setNotificationPrefs(user, next);
    } catch {
      setError('Could not save your notification settings. Check your connection and try again.');
    } finally {
      // The live profile now has the saved value, or the old one if saving failed.
      setPendingPrefs(null);
    }
  };

  const name = displayName(user?.displayName, user?.email);

  return {
    name,
    email: user?.email ?? null,
    photoURL: user?.photoURL ?? null,
    initials: initialsOf(name),
    signInMethod: user ? signInMethodOf(user) : 'password',
    appVersion: Constants.expoConfig?.version ?? null,
    signingOut,
    notificationPrefs,
    prefsLoaded: savedPrefs !== null,
    error,
    pushPermission: push.permission,
    enablingPush: push.enabling,
    enablePush: () => void push.enable(),
    signOut: () => void handleSignOut(),
    setNotificationPref: (key, value) => void handleSetPref(key, value),
    openDeleteAccount,
    openServiceIntervals,
    back: closeSettings,
  };
}
