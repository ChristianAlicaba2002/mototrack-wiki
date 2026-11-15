import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, type PropsWithChildren, use, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/firestore/user-profile';

type AuthState = {
  user: User | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  initializing: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, initializing: true });

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: auth.currentUser,
    initializing: true,
  });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setState({ user, initializing: false });
        if (user) {
          // Not awaited: the app works without the profile doc, and this retries on next sign-in.
          ensureUserProfile(user).catch((e) =>
            console.warn('[firestore] Could not create user profile:', e)
          );
        }
      }),
    []
  );

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  return use(AuthContext);
}
