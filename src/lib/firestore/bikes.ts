import {
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
  where,
  type WriteBatch,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import {
  bikesCollection,
  odometerReadingsCollection,
  servicesCollection,
  userDoc,
  type WithId,
  withIds,
} from './collections';
import type { Bike, OdometerReading } from './types';

/** The fields a user edits in the garage form. */
export type BikeInput = Pick<
  Bike,
  'make' | 'model' | 'engineCc' | 'year' | 'odometerKm' | 'nickname' | 'plateNumber'
>;

/** Firestore allows 500 writes per batch; leave room for the bike and profile writes. */
const DELETE_CHUNK = 450;

const bikeDoc = (uid: string, bikeId: string) => doc(bikesCollection(uid), bikeId);

const bikesQuery = (uid: string) => query(bikesCollection(uid), orderBy('createdAt', 'asc'));

/** Live list of the user's bikes, oldest first. Returns the unsubscribe function. */
export function subscribeToBikes(
  uid: string,
  onChange: (bikes: WithId<Bike>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(bikesQuery(uid), (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function fetchBikes(uid: string): Promise<WithId<Bike>[]> {
  return withIds(await getDocsFromServer(bikesQuery(uid)));
}

/** Live single bike; null once it doesn't exist. Returns the unsubscribe function. */
export function subscribeToBike(
  uid: string,
  bikeId: string,
  onChange: (bike: WithId<Bike> | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    bikeDoc(uid, bikeId),
    (snapshot) => onChange(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null),
    onError
  );
}

export async function getBike(uid: string, bikeId: string): Promise<WithId<Bike> | null> {
  const snapshot = await getDoc(bikeDoc(uid, bikeId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
}

/** Creates the bike and logs its starting odometer reading. */
export async function createBike(uid: string, input: BikeInput): Promise<string> {
  const ref = doc(bikesCollection(uid));
  const batch = writeBatch(db);
  batch.set(ref, {
    ...input,
    photoPath: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(odometerReadingsCollection(uid, ref.id)), {
    odometerKm: input.odometerKm,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
  return ref.id;
}

/**
 * Updates the editable fields; photoPath and createdAt are left as they are.
 * Logs an odometer reading when the odometer differs from previousOdometerKm.
 */
export function updateBike(
  uid: string,
  bikeId: string,
  input: BikeInput,
  previousOdometerKm: number
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(bikeDoc(uid, bikeId), { ...input, updatedAt: serverTimestamp() });
  if (input.odometerKm !== previousOdometerKm) {
    batch.set(doc(odometerReadingsCollection(uid, bikeId)), {
      odometerKm: input.odometerKm,
      createdAt: serverTimestamp(),
    });
  }
  return batch.commit();
}

/**
 * Deletes the bike, its odometer history and its service log. If it was the
 * active bike, clears activeBikeId on the profile in the same batch.
 */
export async function deleteBike(uid: string, bikeId: string): Promise<void> {
  const [profile, readings, services] = await Promise.all([
    getDoc(userDoc(uid)),
    getDocs(odometerReadingsCollection(uid, bikeId)),
    getDocs(query(servicesCollection(uid), where('bikeId', '==', bikeId))),
  ]);
  const wasActive = profile.data()?.activeBikeId === bikeId;
  const refs = [...readings.docs, ...services.docs].map((d) => d.ref);

  // Delete the history in chunks first; the last batch removes the bike itself.
  while (refs.length > DELETE_CHUNK) {
    const batch = writeBatch(db);
    for (const ref of refs.splice(0, DELETE_CHUNK)) batch.delete(ref);
    await batch.commit();
  }

  const batch = writeBatch(db);
  for (const ref of refs) batch.delete(ref);
  batch.delete(bikeDoc(uid, bikeId));
  if (wasActive) {
    batch.update(userDoc(uid), { activeBikeId: null, updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

// ---------- Odometer ----------

/**
 * Adds "set the bike's odometer and log the reading" to a batch. The two
 * writes must go together: firestore.rules checks the reading matches the bike.
 */
export function addOdometerReading(batch: WriteBatch, uid: string, bikeId: string, odometerKm: number): void {
  batch.update(bikeDoc(uid, bikeId), { odometerKm, updatedAt: serverTimestamp() });
  batch.set(doc(odometerReadingsCollection(uid, bikeId)), {
    odometerKm,
    createdAt: serverTimestamp(),
  });
}

/** Sets the bike's odometer and logs the reading in its history, atomically. */
export function recordOdometerReading(uid: string, bikeId: string, odometerKm: number): Promise<void> {
  const batch = writeBatch(db);
  addOdometerReading(batch, uid, bikeId, odometerKm);
  return batch.commit();
}

/** Live odometer history, newest first. Returns the unsubscribe function. */
export function subscribeToOdometerReadings(
  uid: string,
  bikeId: string,
  max: number,
  onChange: (readings: WithId<OdometerReading>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(odometerReadingsCollection(uid, bikeId), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(q, (snapshot) => onChange(withIds(snapshot)), onError);
}
