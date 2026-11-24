import {
  deleteDoc,
  type DocumentReference,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { db, storage } from '@/lib/firebase';

import {
  bikesCollection,
  chatsCollection,
  documentsCollection,
  messagesCollection,
  odometerReadingsCollection,
  servicesCollection,
  userDoc,
} from './collections';

/** Firestore allows 500 writes per batch; stay under it. */
const DELETE_CHUNK = 450;

async function deleteInChunks(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += DELETE_CHUNK) {
    const batch = writeBatch(db);
    for (const docRef of refs.slice(i, i + DELETE_CHUNK)) batch.delete(docRef);
    await batch.commit();
  }
}

/** Deletes a Storage file, ignoring one that's already gone. */
async function deleteFile(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    if ((e as { code?: string } | null)?.code !== 'storage/object-not-found') throw e;
  }
}

/**
 * Deletes everything a rider has stored: bike photos and vault files in
 * Storage, then every Firestore document under users/{uid}, then the profile.
 * Does not delete the Auth user; the caller does that last.
 *
 * Safe to run again after a failure part-way: whatever is left is found and
 * deleted on the next run. The profile goes last so a half-finished run still
 * leaves the user signed in with a working (if emptier) app.
 */
export async function deleteUserData(uid: string): Promise<void> {
  const [bikes, services, documents, chats] = await Promise.all([
    getDocs(bikesCollection(uid)),
    getDocs(servicesCollection(uid)),
    getDocs(documentsCollection(uid)),
    getDocs(chatsCollection(uid)),
  ]);

  // Files first: once the documents pointing at them are gone, nothing records their paths.
  const filePaths = [
    ...bikes.docs.map((d) => d.data().photoPath),
    ...documents.docs.map((d) => d.data().storagePath),
  ].filter((path): path is string => Boolean(path));
  await Promise.all(filePaths.map(deleteFile));

  const [readings, messages] = await Promise.all([
    Promise.all(bikes.docs.map((bike) => getDocs(odometerReadingsCollection(uid, bike.id)))),
    Promise.all(chats.docs.map((chat) => getDocs(messagesCollection(uid, chat.id)))),
  ]);

  // Children before parents, so a failure never leaves a child whose parent is gone.
  await deleteInChunks([
    ...readings.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)),
    ...messages.flatMap((snapshot) => snapshot.docs.map((d) => d.ref)),
    ...services.docs.map((d) => d.ref),
    ...documents.docs.map((d) => d.ref),
  ]);
  await deleteInChunks([...bikes.docs.map((d) => d.ref), ...chats.docs.map((d) => d.ref)]);
  await deleteDoc(userDoc(uid));
}
