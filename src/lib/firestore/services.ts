import {
  deleteDoc,
  doc,
  getDoc,
  getDocsFromServer,
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
export type ServiceInput = Pick<
  ServiceRecord,
  'bikeId' | 'type' | 'title' | 'odometerKm' | 'cost' | 'notes' | 'nextDueKm'
> & {
  /** The day the service was done (local midnight). */
  date: Date;
};

const serviceDoc = (uid: string, serviceId: string) => doc(servicesCollection(uid), serviceId);

const bikeServicesQuery = (uid: string, bikeId: string, max: number) =>
  query(servicesCollection(uid), where('bikeId', '==', bikeId), orderBy('date', 'desc'), limit(max));

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
  return onSnapshot(bikeServicesQuery(uid, bikeId, max), (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function fetchServices(uid: string, bikeId: string, max: number): Promise<WithId<ServiceRecord>[]> {
  return withIds(await getDocsFromServer(bikeServicesQuery(uid, bikeId, max)));
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

const servicesSinceQuery = (uid: string, since: Date) =>
  query(servicesCollection(uid), where('date', '>=', Timestamp.fromDate(since)), orderBy('date', 'desc'));

/**
 * Live services across all bikes dated on or after `since`, most recent first.
 * A range and order on the same single field need no composite index.
 */
export function subscribeToServicesSince(
  uid: string,
  since: Date,
  onChange: (services: WithId<ServiceRecord>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(servicesSinceQuery(uid, since), (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function fetchServicesSince(uid: string, since: Date): Promise<WithId<ServiceRecord>[]> {
  return withIds(await getDocsFromServer(servicesSinceQuery(uid, since)));
}

export function subscribeToService(
  uid: string,
  serviceId: string,
  onChange: (service: WithId<ServiceRecord> | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    serviceDoc(uid, serviceId),
    (snapshot) => onChange(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null),
    onError
  );
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
    // Time-based reminders aren't built yet.
    nextDueDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (input.odometerKm > bikeOdometerKm) addOdometerReading(batch, uid, input.bikeId, input.odometerKm);
  await batch.commit();
  return ref.id;
}

/** Updates the editable fields, including nextDueKm; nextDueDate and createdAt are left as they are. */
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
