import {
  deleteDoc,
  doc,
  getDoc,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

import { storage } from '@/lib/firebase';

import { documentsCollection, type WithId, withIds } from './collections';
import { documentFilePath } from './storage-paths';
import {
  DOCUMENT_CONTENT_TYPES,
  type DocumentContentType,
  MAX_DOCUMENT_BYTES,
  type VaultDocument,
} from './types';

/** The fields a rider fills in for a document. */
export type DocumentInput = Pick<VaultDocument, 'bikeId' | 'type' | 'title'> & {
  /** Last valid day, or null if it doesn't expire. */
  expiresAt: Date | null;
};

/** A local photo to upload, e.g. from expo-image-picker. */
export type DocumentFile = {
  uri: string;
  /** From the picker; may be missing on some Android devices. */
  mimeType?: string | null;
};

/** Thrown before uploading when the file breaks a rule the server would reject anyway. */
export class DocumentFileError extends Error {
  constructor(
    public readonly reason: 'too-large' | 'unsupported-type' | 'empty',
    message: string
  ) {
    super(message);
    this.name = 'DocumentFileError';
  }
}

const EXTENSIONS: Record<DocumentContentType, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const documentDoc = (uid: string, documentId: string) => doc(documentsCollection(uid), documentId);

function toContentType(mimeType: string | null | undefined): DocumentContentType {
  // Camera photos are JPEG; the picker leaves mimeType empty on some Android devices.
  const type = (mimeType ?? 'image/jpeg').toLowerCase();
  if ((DOCUMENT_CONTENT_TYPES as readonly string[]).includes(type)) return type as DocumentContentType;
  throw new DocumentFileError('unsupported-type', 'Use a JPEG, PNG, WebP or HEIC photo.');
}

/**
 * Uploads a file to this document's Storage folder. The name is unique per
 * upload, so replacing a photo never overwrites the old one before the
 * Firestore document points at the new one.
 */
async function uploadFile(
  uid: string,
  documentId: string,
  file: DocumentFile,
  onProgress?: (fraction: number) => void
): Promise<{ storagePath: string; contentType: DocumentContentType; sizeBytes: number }> {
  const contentType = toContentType(file.mimeType);
  const blob = await (await fetch(file.uri)).blob();
  if (blob.size === 0) throw new DocumentFileError('empty', 'That photo is empty. Try taking it again.');
  if (blob.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentFileError('too-large', 'That photo is over 10 MB. Try a smaller one.');
  }

  const storagePath = documentFilePath(uid, documentId, `${Date.now()}.${EXTENSIONS[contentType]}`);
  const task = uploadBytesResumable(ref(storage, storagePath), blob, { contentType });
  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => onProgress?.(snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0),
      reject,
      () => resolve()
    );
  });
  return { storagePath, contentType, sizeBytes: blob.size };
}

/** Deletes a Storage file, ignoring one that's already gone. */
async function deleteFile(path: string): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    if ((e as { code?: string } | null)?.code !== 'storage/object-not-found') throw e;
  }
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

/** A short-lived URL to show the file. Only the owner can get one (storage.rules). */
export function getDocumentFileUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(storage, storagePath));
}

/**
 * Uploads the photo, then saves the document. If saving fails, the uploaded
 * file is removed so nothing is left behind without a document pointing at it.
 */
export async function createDocument(
  uid: string,
  input: DocumentInput,
  file: DocumentFile,
  onProgress?: (fraction: number) => void
): Promise<string> {
  const docRef = doc(documentsCollection(uid));
  const uploaded = await uploadFile(uid, docRef.id, file, onProgress);
  try {
    await setDoc(docRef, {
      ...toFields(input),
      ...uploaded,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    await deleteFile(uploaded.storagePath).catch(() => {});
    throw e;
  }
  return docRef.id;
}

/**
 * Saves edits. With a new photo, it's uploaded first, the document is pointed
 * at it, and only then is the old file deleted.
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
  const uploaded = await uploadFile(uid, current.id, file, onProgress);
  try {
    await updateDoc(documentDoc(uid, current.id), {
      ...toFields(input),
      ...uploaded,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    await deleteFile(uploaded.storagePath).catch(() => {});
    throw e;
  }
  // Best effort: the document already points at the new file.
  await deleteFile(current.storagePath).catch(() => {});
}

/** Deletes the file, then the document. */
export async function deleteDocument(uid: string, document: WithId<VaultDocument>): Promise<void> {
  await deleteFile(document.storagePath);
  await deleteDoc(documentDoc(uid, document.id));
}
