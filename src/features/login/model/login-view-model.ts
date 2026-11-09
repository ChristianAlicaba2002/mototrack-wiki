import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';

import { auth } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/firebase/google-sign-in';

export type LoginMode = 'signIn' | 'signUp';
export type LoginPending = 'email' | 'google' | 'reset' | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/missing-password': 'Enter your password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a different sign-in method.',
};

function toMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}

export function useLoginViewModel() {
  const [mode, setMode] = useState<LoginMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState<LoginPending>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const trimmedEmail = email.trim();
  const canSubmit = EMAIL_PATTERN.test(trimmedEmail) && password.length > 0 && pending === null;

  async function run(kind: Exclude<LoginPending, null>, action: () => Promise<unknown>) {
    setPending(kind);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(toMessage(e));
    } finally {
      setPending(null);
    }
  }

  function submit() {
    if (!canSubmit) return;
    return run('email', () =>
      mode === 'signIn'
        ? signInWithEmailAndPassword(auth, trimmedEmail, password)
        : createUserWithEmailAndPassword(auth, trimmedEmail, password)
    );
  }

  function continueWithGoogle() {
    return run('google', signInWithGoogle);
  }

  function resetPassword() {
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setNotice(null);
      setError('Enter your email above, then tap “Forgot password?” again.');
      return;
    }
    return run('reset', async () => {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setNotice(`Password reset link sent to ${trimmedEmail}.`);
    });
  }

  function toggleMode() {
    setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setNotice(null);
  }

  function togglePasswordVisible() {
    setPasswordVisible((v) => !v);
  }

  return {
    mode,
    email,
    password,
    passwordVisible,
    togglePasswordVisible,
    pending,
    error,
    notice,
    canSubmit,
    setEmail,
    setPassword,
    submit,
    continueWithGoogle,
    resetPassword,
    toggleMode,
  };
}

export type LoginViewModel = ReturnType<typeof useLoginViewModel>;
