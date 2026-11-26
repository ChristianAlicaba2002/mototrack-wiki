import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { documentsCollection, photoChunksCollection, type WithId, withIds } from './collections';
import {
  DOCUMENT_CONTENT_TYPES,
  type DocumentContentType,
  MAX_DOCUMENT_BYTES,
  MAX_PHOTO_CHUNKS,
  PHOTO_CHUNK_CHARS,
  type VaultDocument,
} from './types';

// The vault keeps each photo in Firestore, split into base64 chunks under the
// document (Cloud Storage isn't available on the free Spark plan).

/** The fields a rider fills in for a document. */
export type DocumentInput = Pick<VaultDocument, 'bikeId' | 'type' | 'title'> & {
  /** Last valid day, or null if it doesn't expire. */
  expiresAt: Date | null;
};

/** A photo to save, from expo-image-picker with `base64: true`. */
export type DocumentFile = {
  /** For showing the photo before it's saved. */
  uri: string;
  /** The image's bytes as base64 text, without a `data:` prefix. */
  base64: string;
  /** From the picker; may be missing on some Android devices. */
  mimeType?: string | null;
};

/** Thrown before saving when the photo breaks a rule the server would reject anyway. */
export class DocumentFileError extends Error {
  constructor(
    public readonly reason: 'too-large' | 'unsupported-type' | 'empty' | 'unreadable',
    message: string
  ) {
    super(message);
    this.name = 'DocumentFileError';
  }
}

const documentDoc = (uid: string, documentId: string) => doc(documentsCollection(uid), documentId);

const chunkDoc = (uid: string, documentId: string, photoId: string, index: number) =>
  doc(photoChunksCollection(uid, documentId), `${photoId}_${index}`);

function toContentType(mimeType: string | null | undefined): DocumentContentType {
  // The picker returns JPEG base64 for camera photos and leaves mimeType empty on some Android devices.
  const type = (mimeType ?? 'image/jpeg').toLowerCase();
  if ((DOCUMENT_CONTENT_TYPES as readonly string[]).includes(type)) return type as DocumentContentType;
  throw new DocumentFileError('unsupported-type', 'MotoTrack can’t use that kind of image. Take a photo instead.');
}

/** Bytes of the image a base64 string encodes. */
function decodedSize(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/** A unique name for a new photo's chunks. */
function newPhotoId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

type SavedPhoto = Pick<VaultDocument, 'photoId' | 'photoChunks' | 'contentType' | 'sizeBytes'>;

/**
 * Writes the photo's chunks one at a time, reporting progress after each.
 * One chunk per write keeps every request well under Firestore's 10 MiB limit.
 */
async function savePhoto(
  uid: string,
  documentId: string,
  file: DocumentFile,
  onProgress?: (fraction: number) => void
): Promise<SavedPhoto> {
  const contentType = toContentType(file.mimeType);
  const base64 = file.base64;
  if (!base64) {
    throw new DocumentFileError('unreadable', 'MotoTrack couldn’t open that photo. Take a new one or choose a different photo.');
  }
  const sizeBytes = decodedSize(base64);
  if (sizeBytes <= 0) throw new DocumentFileError('empty', 'That photo is empty. Try taking it again.');
  const chunkCount = Math.ceil(base64.length / PHOTO_CHUNK_CHARS);
  if (sizeBytes > MAX_DOCUMENT_BYTES || chunkCount > MAX_PHOTO_CHUNKS) {
    const limitMb = Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024));
    throw new DocumentFileError(
      'too-large',
      `That photo is too big to save (the limit is about ${limitMb} MB). Take the photo a little farther away, or choose a smaller one.`
    );
  }

  const photoId = newPhotoId();
  const saved: SavedPhoto = { photoId, photoChunks: chunkCount, contentType, sizeBytes };
  onProgress?.(0);
  try {
    for (let i = 0; i < chunkCount; i++) {
      const data = base64.slice(i * PHOTO_CHUNK_CHARS, (i + 1) * PHOTO_CHUNK_CHARS);
      await setDoc(chunkDoc(uid, documentId, photoId, i), { data });
      onProgress?.((i + 1) / chunkCount);
    }
  } catch (e) {
    await deletePhoto(uid, documentId, saved).catch(() => {});
    throw e;
  }
  return saved;
}

/** Deletes a photo's chunks; ones that are already gone are fine. */
async function deletePhoto(
  uid: string,
  documentId: string,
  photo: Pick<VaultDocument, 'photoId' | 'photoChunks'>
): Promise<void> {
  const batch = writeBatch(db);
  for (let i = 0; i < photo.photoChunks; i++) batch.delete(chunkDoc(uid, documentId, photo.photoId, i));
  await batch.commit();
}

/** The photo as a `data:` URI that expo-image can show. Only the owner can read it (firestore.rules). */
export async function getDocumentPhoto(
  uid: string,
  documentId: string,
  photo: Pick<VaultDocument, 'photoId' | 'photoChunks' | 'contentType'>
): Promise<string> {
  const chunks = await Promise.all(
    Array.from({ length: photo.photoChunks }, (_, i) => getDoc(chunkDoc(uid, documentId, photo.photoId, i)))
  );
  if (chunks.some((c) => !c.exists())) {
    throw new DocumentFileError('unreadable', 'This document’s photo is missing. Use “Replace photo” to add it again.');
  }
  return `data:${photo.contentType};base64,${chunks.map((c) => c.data()!.data).join('')}`;
}

const toFields = (input: DocumentInput) => ({
  bikeId: input.bikeId,
  type: input.type,
  title: input.title,
  expiresAt: input.expiresAt ? Timestamp.fromDate(input.expiresAt) : null,
});

/** The whole vault, live, newest first. The vault screen sorts by expiry itself. */
export function subscribeToDocuments(
  uid: string,
  onChange: (documents: WithId<VaultDocument>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(documentsCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => onChange(withIds(snapshot)), onError);
}

export async function fetchDocuments(uid: string): Promise<WithId<VaultDocument>[]> {
  return withIds(await getDocsFromServer(query(documentsCollection(uid), orderBy('createdAt', 'desc'))));
}

export function subscribeToDocument(
  uid: string,
  documentId: string,
  onChange: (document: WithId<VaultDocument> | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    documentDoc(uid, documentId),
    (snapshot) => onChange(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null),
    onError
  );
}

export async function getDocument(uid: string, documentId: string): Promise<WithId<VaultDocument> | null> {
  const snapshot = await getDoc(documentDoc(uid, documentId));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
}

/**
 * Saves the photo's chunks, then the document. If saving the document fails,
 * the chunks are removed so nothing is left behind.
 */
export async function createDocument(
  uid: string,
  input: DocumentInput,
  file: DocumentFile,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const docRef = doc(documentsCollection(uid));
  const photo = await savePhoto(uid, docRef.id, file, onProgress);
  try {
    await setDoc(docRef, {
      ...toFields(input),
      ...photo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    await deletePhoto(uid, docRef.id, photo).catch(() => {});
    throw e;
  }
  return docRef.id;
}

/**
 * Saves edits. With a new photo, its chunks are saved first, the document is
 * pointed at them, and only then are the old chunks deleted.
 */
export async function updateDocument(
  uid: string,
  current: WithId<VaultDocument>,
  input: DocumentInput,
  file: DocumentFile | null,
  onProgress?: (fraction: number) => void
): Promise<void> {
  if (!file) {
    await updateDoc(documentDoc(uid, current.id), { ...toFields(input), updatedAt: serverTimestamp() });
    return;
  }
  const photo = await savePhoto(uid, current.id, file, onProgress);
  try {
    await updateDoc(documentDoc(uid, current.id), {
      ...toFields(input),
      ...photo,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    await deletePhoto(uid, current.id, photo).catch(() => {});
    throw e;
  }
  // Best effort: the document already points at the new photo.
  await deletePhoto(uid, current.id, current).catch(() => {});
}

/**
 * Deletes every photo chunk under the document (including any left over from
 * an interrupted replace), then the document.
 */
export async function deleteDocument(uid: string, document: WithId<VaultDocument>): Promise<void> {
  const chunks = await getDocs(photoChunksCollection(uid, document.id));
  if (!chunks.empty) {
    const batch = writeBatch(db);
    for (const chunk of chunks.docs) batch.delete(chunk.ref);
    await batch.commit();
  }
  await deleteDoc(documentDoc(uid, document.id));
}
