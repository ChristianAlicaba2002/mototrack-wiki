import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
  updateDoc,
} from 'firebase/firestore';

import { bikesCollection, type WithId, withIds } from './collections';
import type { Bike } from './types';

/** The fields a user edits in the garage form. */
export type BikeInput = Pick<
  Bike,
  'make' | 'model' | 'engineCc' | 'year' | 'odometerKm' | 'nickname' | 'plateNumber'
>;

const bikeDoc = (uid: string, bikeId: string) => doc(bikesCollection(uid), bikeId);

/** Live list of the user's bikes, oldest first. Returns the unsubscribe function. */
export function subscribeToBikes(
  uid: string,
  onChange: (bikes: WithId<Bike>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(bikesCollection(uid), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function getBike(uid: string, bikeId: string): Promise<WithId<Bike> | null> {
  const snapshot = await getDoc(bikeDoc(uid, bikeId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
}

export async function createBike(uid: string, input: BikeInput): Promise<string> {
  const ref = await addDoc(bikesCollection(uid), {
    ...input,
    photoPath: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Updates the editable fields; photoPath and createdAt are left as they are. */
export function updateBike(uid: string, bikeId: string, input: BikeInput): Promise<void> {
  return updateDoc(bikeDoc(uid, bikeId), { ...input, updatedAt: serverTimestamp() });
}

export function deleteBike(uid: string, bikeId: string): Promise<void> {
  return deleteDoc(bikeDoc(uid, bikeId));
}
