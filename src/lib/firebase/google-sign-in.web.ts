import {
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { auth } from '.';

// Web: the native Google Sign-In library doesn't run here, so use Firebase's popup flow.

function isPopupCancelled(error: unknown): boolean {
  const code = (error as { code?: string }).code;
  return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
}

/** Resolves to `null` if the user closes the popup. */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return user;
  } catch (error) {
    if (isPopupCancelled(error)) return null;
    throw error;
  }
}

/** Same contract as the native version: false if the user closes the popup. */
export async function reauthenticateWithGoogle(user: User): Promise<boolean> {
  try {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return true;
  } catch (error) {
    if (isPopupCancelled(error)) return false;
    throw error;
  }
}

export async function deleteSignedInUser(user: User): Promise<void> {
  await deleteUser(user);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
