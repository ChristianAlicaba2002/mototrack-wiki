import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';

import { auth } from '.';

// Web: the native Google Sign-In library doesn't run here, so use Firebase's popup flow.

/** Resolves to `null` if the user closes the popup. */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return user;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}
