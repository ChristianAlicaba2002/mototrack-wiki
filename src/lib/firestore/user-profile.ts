import type { User } from 'firebase/auth';
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { userDoc } from './collections';

/** Creates users/{uid} the first time a user signs in. Does nothing if it already exists. */
export async function ensureUserProfile(user: User): Promise<void> {
  const ref = userDoc(user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
