import {
  collection,
  doc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import type {
  Bike,
  Chat,
  ChatMessage,
  OdometerReading,
  PhotoChunk,
  ServiceRecord,
  UserProfile,
  VaultDocument,
  WikiDoc,
} from './types';

/** A document's data plus its id. */
export type WithId<T> = T & { id: string };

// Types reads and writes. No runtime transformation: firestore.rules validates writes.
function converter<T extends DocumentData>(): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot: QueryDocumentSnapshot, options?: SnapshotOptions) => snapshot.data(options) as T,
  };
}

/** Maps a query result to plain objects with their ids. */
export function withIds<T>(snapshot: QuerySnapshot<T>): WithId<T>[] {
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export const userDoc = (uid: string) =>
  doc(db, 'users', uid).withConverter(converter<UserProfile>());

export const bikesCollection = (uid: string) =>
  collection(db, 'users', uid, 'bikes').withConverter(converter<Bike>());

export const odometerReadingsCollection = (uid: string, bikeId: string) =>
  collection(db, 'users', uid, 'bikes', bikeId, 'odometerReadings').withConverter(
    converter<OdometerReading>()
  );

export const servicesCollection = (uid: string) =>
  collection(db, 'users', uid, 'services').withConverter(converter<ServiceRecord>());

export const documentsCollection = (uid: string) =>
  collection(db, 'users', uid, 'documents').withConverter(converter<VaultDocument>());

export const photoChunksCollection = (uid: string, documentId: string) =>
  collection(db, 'users', uid, 'documents', documentId, 'photoChunks').withConverter(converter<PhotoChunk>());

export const chatsCollection = (uid: string) =>
  collection(db, 'users', uid, 'chats').withConverter(converter<Chat>());

export const messagesCollection = (uid: string, chatId: string) =>
  collection(db, 'users', uid, 'chats', chatId, 'messages').withConverter(converter<ChatMessage>());

export const wikiCollection = () => collection(db, 'wiki').withConverter(converter<WikiDoc>());
