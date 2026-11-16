import type { Timestamp } from 'firebase/firestore';

// Firestore document shapes. firestore.rules enforces the same fields, so a
// change here needs a matching change there (and in tests/rules).
//
// Every field is always present: optional values are stored as null, never
// omitted. createdAt / updatedAt are always written with serverTimestamp().

/** users/{uid} */
export type UserProfile = {
  displayName: string | null;
  /** Must equal the signed-in account's email. */
  email: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** users/{uid}/bikes/{bikeId} */
export type Bike = {
  make: string;
  model: string;
  /** Engine displacement in cc. Integer, 1–3000. */
  engineCc: number;
  /** Integer, 1885–2100. */
  year: number;
  nickname: string | null;
  plateNumber: string | null;
  odometerKm: number;
  /** Storage path from bikePhotoPath(), or null. */
  photoPath: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export const SERVICE_TYPES = [
  'oil_change',
  'tires',
  'brakes',
  'chain',
  'battery',
  'inspection',
  'repair',
  'other',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** users/{uid}/services/{serviceId}: one maintenance log entry. */
export type ServiceRecord = {
  /** Id of one of the owner's bikes. */
  bikeId: string;
  type: ServiceType;
  title: string;
  /** When the service was done. */
  date: Timestamp;
  odometerKm: number;
  cost: number | null;
  notes: string | null;
  nextDueKm: number | null;
  nextDueDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export const DOCUMENT_TYPES = ['registration', 'insurance', 'license', 'receipt', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Allowed vault file types; also enforced by storage.rules. */
export const DOCUMENT_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;
export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number];

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_BIKE_PHOTO_BYTES = 5 * 1024 * 1024;

/** users/{uid}/documents/{documentId}: metadata for a file in the vault. */
export type VaultDocument = {
  /** Id of one of the owner's bikes, or null for documents not tied to a bike (e.g. a license). */
  bikeId: string | null;
  type: DocumentType;
  title: string;
  /** Storage path from documentFilePath() using this document's id. */
  storagePath: string;
  contentType: DocumentContentType;
  /** Integer, 1 byte to 10 MB. */
  sizeBytes: number;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** users/{uid}/chats/{chatId}: an AI mechanic conversation. */
export type Chat = {
  title: string;
  /** The bike the conversation is about, if any. */
  bikeId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * users/{uid}/chats/{chatId}/messages/{messageId}. Append-only.
 * The app may only create 'user' messages; 'assistant' messages are written by the backend.
 */
export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  createdAt: Timestamp;
};

/** wiki/{articleId}: read-only reference content, managed outside the app. */
export type WikiArticle = {
  title: string;
  category: string;
  summary: string;
  /** Markdown. */
  body: string;
  tags: string[];
  /** Storage path under wiki/, or null. */
  coverImagePath: string | null;
  updatedAt: Timestamp;
};
