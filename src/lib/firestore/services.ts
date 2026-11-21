import {
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { addOdometerReading } from './bikes';
import { servicesCollection, type WithId, withIds } from './collections';
import type { ServiceRecord } from './types';

/** The fields a user fills in when logging a service. */
export type ServiceInput = Pick<ServiceRecord, 'bikeId' | 'type' | 'title' | 'odometerKm' | 'cost' | 'notes'> & {
  /** The day the service was done (local midnight). */
  date: Date;
};

const serviceDoc = (uid: string, serviceId: string) => doc(servicesCollection(uid), serviceId);

function toFields(input: ServiceInput) {
  return { ...input, date: Timestamp.fromDate(input.date) };
}

/**
 * Live service log for one bike, most recent first. Uses the
 * (bikeId, date desc) index in firestore.indexes.json.
 */
export function subscribeToServices(
  uid: string,
  bikeId: string,
  max: number,
  onChange: (services: WithId<ServiceRecord>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(
    servicesCollection(uid),
    where('bikeId', '==', bikeId),
    orderBy('date', 'desc'),
    limit(max)
  );
  return onSnapshot(q, (snapshot) => onChange(withIds(snapshot)), onError);
}

/**
 * Live service log across all of the owner's bikes, most recent first. Used by
 * the expense summary. Ordering on one field needs no composite index.
 */
export function subscribeToAllServices(
  uid: string,
  max: number,
  onChange: (services: WithId<ServiceRecord>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(servicesCollection(uid), orderBy('date', 'desc'), limit(max));
  return onSnapshot(q, (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function getService(uid: string, serviceId: string): Promise<WithId<ServiceRecord> | null> {
  const snapshot = await getDoc(serviceDoc(uid, serviceId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
}

/**
 * Logs a service. If it was done at a higher reading than the bike's current
 * odometer, the bike's odometer moves up to it in the same batch.
 */
export async function createService(uid: string, input: ServiceInput, bikeOdometerKm: number): Promise<string> {
  const ref = doc(servicesCollection(uid));
  const batch = writeBatch(db);
  batch.set(ref, {
    ...toFields(input),
    // Reminders are a separate feature; nothing sets these yet.
    nextDueKm: null,
    nextDueDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (input.odometerKm > bikeOdometerKm) addOdometerReading(batch, uid, input.bikeId, input.odometerKm);
  await batch.commit();
  return ref.id;
}

/** Updates the editable fields; reminders and createdAt are left as they are. */
export function updateService(
  uid: string,
  serviceId: string,
  input: ServiceInput,
  bikeOdometerKm: number
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(serviceDoc(uid, serviceId), { ...toFields(input), updatedAt: serverTimestamp() });
  if (input.odometerKm > bikeOdometerKm) addOdometerReading(batch, uid, input.bikeId, input.odometerKm);
  return batch.commit();
}

export function deleteService(uid: string, serviceId: string): Promise<void> {
  return deleteDoc(serviceDoc(uid, serviceId));
}
