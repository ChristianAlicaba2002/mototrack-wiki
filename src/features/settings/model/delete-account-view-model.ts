import { router } from 'expo-router';
import { useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { deleteSignedInUser, reauthenticateWithGoogle } from '@/lib/firebase/google-sign-in';
import { reauthenticateWithPassword, type SignInMethod, signInMethodOf } from '@/lib/firebase/sign-in-method';
import { deleteUserData } from '@/lib/firestore/account';

/** 'verifying' while the password or Google prompt is checked; 'deleting' while data is removed. */
export type DeletePhase = 'idle' | 'verifying' | 'deleting';

export function openDeleteAccount() {
  router.push('/delete-account');
}

function closeDeleteAccount() {
  if (router.canGoBack()) router.back();
  else router.replace('/settings');
}

/** Errors about the password belong under the field; everything else goes above the button. */
function toMessage(error: unknown, email: string | null): { field: 'password' | 'form'; message: string } {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return { field: 'password', message: 'That password isn’t right.' };
    case 'auth/missing-password':
      return { field: 'password', message: 'Enter your password.' };
    case 'auth/too-many-requests':
      return { field: 'password', message: 'Too many attempts. Wait a moment and try again.' };
    case 'auth/user-mismatch':
      return {
        field: 'form',
        message: `That’s a different Google account. Pick ${email ?? 'the account you signed in with'}.`,
      };
    case 'auth/requires-recent-login':
      return { field: 'form', message: 'For your security, confirm it’s you again and retry.' };
    case 'auth/network-request-failed':
    case 'unavailable':
      return { field: 'form', message: 'Can’t reach the server. Check your connection and try again.' };
    default:
      return { field: 'form', message: 'Could not delete your account. Please try again.' };
  }
}

/** /delete-account: confirm it's you (password or Google), then delete everything. */
export function useDeleteAccountViewModel() {
  const { user } = useAuth();
  const method: SignInMethod = user ? signInMethodOf(user) : 'password';
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<DeletePhase>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== 'idle';
  const canSubmit = !busy && (method === 'google' || password.length > 0);

  async function confirmDelete() {
    if (!user || !canSubmit) return;
    setPasswordError(null);
    setError(null);
    setPhase('verifying');
    try {
      // Firebase only deletes an account after a recent sign-in. Confirming
      // first means data is never wiped while the account itself survives.
      if (method === 'password') {
        await reauthenticateWithPassword(user, password);
      } else if (!(await reauthenticateWithGoogle(user))) {
        setPhase('idle'); // Closed the Google prompt.
        return;
      }
      setPhase('deleting');
      await deleteUserData(user.uid);
      // The app returns to the login screen once the user is gone.
      await deleteSignedInUser(user);
    } catch (e) {
      const { field, message } = toMessage(e, user.email);
      if (field === 'password') setPasswordError(message);
      else setError(message);
      setPhase('idle');
    }
  }

  return {
    method,
    email: user?.email ?? null,
    password,
    setPassword: (text: string) => {
      setPassword(text);
      setPasswordError(null);
    },
    passwordError,
    phase,
    busy,
    canSubmit,
    error,
    confirmDelete: () => void confirmDelete(),
    cancel: closeDeleteAccount,
  };
}

export type DeleteAccountViewModel = ReturnType<typeof useDeleteAccountViewModel>;
