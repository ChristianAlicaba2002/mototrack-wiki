import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { devicesCollection } from './collections';
import type { PushPlatform } from './types';

const deviceDoc = (uid: string, deviceId: string) => doc(devicesCollection(uid), deviceId);

/**
 * Saves this phone's FCM token so the backend can send it reminders. Writes
 * only when the token is new or changed, to spare the free Firestore quota.
 */
export async function saveDeviceToken(
  uid: string,
  deviceId: string,
  token: string,
  platform: PushPlatform
): Promise<void> {
  const ref = deviceDoc(uid, deviceId);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    await setDoc(ref, { token, platform, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } else if (existing.data().token !== token || existing.data().platform !== platform) {
    await updateDoc(ref, { token, platform, updatedAt: serverTimestamp() });
  }
}

/** Stops sending to this phone, e.g. before signing out. */
export async function removeDevice(uid: string, deviceId: string): Promise<void> {
  await deleteDoc(deviceDoc(uid, deviceId));
}
