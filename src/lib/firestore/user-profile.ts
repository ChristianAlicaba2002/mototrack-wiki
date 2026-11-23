import type { User } from 'firebase/auth';
import { getDoc, getDocFromServer, onSnapshot, serverTimestamp, setDoc, type Unsubscribe, updateDoc } from 'firebase/firestore';

import { userDoc } from './collections';
import type { UserProfile } from './types';

/** Creates users/{uid} the first time a user signs in. Does nothing if it already exists. */
export async function ensureUserProfile(user: User): Promise<void> {
  const ref = userDoc(user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    activeBikeId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Live profile; null while it doesn't exist. Returns the unsubscribe function. */
export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(userDoc(uid), (snapshot) => onChange(snapshot.data() ?? null), onError);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  return (await getDocFromServer(userDoc(uid))).data() ?? null;
}

/** Makes bikeId the bike the app is focused on (null clears it). */
export async function setActiveBike(user: User, bikeId: string | null): Promise<void> {
  // The profile is created in the background at sign-in and may not exist yet.
  await ensureUserProfile(user);
  await updateDoc(userDoc(user.uid), { activeBikeId: bikeId, updatedAt: serverTimestamp() });
}
