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
  /**
   * The bike the app is focused on: one of the owner's bikes, or null.
   * Missing on profiles created before this field existed; treat that as null.
   */
  activeBikeId?: string | null;
  /**
   * The rider's own service intervals. Missing on profiles that never changed
   * them; treat that as the defaults (DEFAULT_SERVICE_INTERVALS).
   */
  serviceIntervals?: ServiceIntervals;
  /**
   * Which reminders the rider wants. Missing on profiles that never changed
   * them; treat that as DEFAULT_NOTIFICATION_PREFS.
   */
  notificationPrefs?: NotificationPrefs;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Reminder types a rider can turn on or off. Keep in sync with firestore.rules. */
export type NotificationPrefs = {
  /** A service is due soon or overdue (see service intervals). */
  serviceDue: boolean;
  /** A vault document (registration, insurance, license) is about to expire. */
  documentExpiry: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  serviceDue: true,
  documentExpiry: true,
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

/**
 * users/{uid}/bikes/{bikeId}/odometerReadings/{readingId}: one entry in a bike's
 * mileage history. Append-only, and written in the same batch as the bike's
 * odometerKm (firestore.rules checks they match).
 */
export type OdometerReading = {
  /** Integer, km. */
  odometerKm: number;
  createdAt: Timestamp;
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

/**
 * Km between services of each type. null means no reminder for that type.
 * Each value is a whole number from SERVICE_INTERVAL_LIMITS.minKm to maxKm.
 */
export type ServiceIntervals = Record<ServiceType, number | null>;

/** Keep in sync with firestore.rules. */
export const SERVICE_INTERVAL_LIMITS = { minKm: 100, maxKm: 100_000 } as const;

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
  /**
   * Odometer reading when this kind of service is due again: odometerKm plus
   * the rider's interval for the type when it was saved. Null when the type has
   * no interval, or for services logged before intervals existed.
   */
  nextDueKm: number | null;
  /** Not used yet; reserved for time-based reminders. Always null. */
  nextDueDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export const DOCUMENT_TYPES = ['registration', 'insurance', 'license', 'receipt', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/**
 * Vault photo formats. Photos are stored in Firestore as base64 text (Cloud
 * Storage needs a paid plan), and these are the formats the image picker
 * returns that every platform can display. Keep in sync with firestore.rules.
 */
export const DOCUMENT_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number];

/** Base64 characters per photo chunk; a Firestore document holds at most 1 MiB. Keep in sync with firestore.rules. */
export const PHOTO_CHUNK_CHARS = 900_000;
/** A photo may span at most this many chunks (about 5 MB of image). Keep in sync with firestore.rules. */
export const MAX_PHOTO_CHUNKS = 8;
/** The largest photo, in bytes, that fits in MAX_PHOTO_CHUNKS once base64-encoded. */
export const MAX_DOCUMENT_BYTES = Math.floor((PHOTO_CHUNK_CHARS * MAX_PHOTO_CHUNKS * 3) / 4);
export const MAX_BIKE_PHOTO_BYTES = 5 * 1024 * 1024;

/** users/{uid}/documents/{documentId}: a paper in the vault. Its photo is in photoChunks. */
export type VaultDocument = {
  /** Id of one of the owner's bikes, or null for documents not tied to a bike (e.g. a license). */
  bikeId: string | null;
  type: DocumentType;
  title: string;
  /**
   * Names the current photo's chunks: `${photoId}_${index}` in photoChunks.
   * New for every photo, so replacing one never overwrites the old chunks
   * before the document points at the new ones.
   */
  photoId: string;
  /** How many chunks the photo is split into, 1 to MAX_PHOTO_CHUNKS. */
  photoChunks: number;
  contentType: DocumentContentType;
  /** Size of the image itself (not the base64 text), in bytes. */
  sizeBytes: number;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** users/{uid}/documents/{documentId}/photoChunks/{photoId}_{index}: one piece of a photo's base64 text. */
export type PhotoChunk = {
  data: string;
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
 * The app creates both 'user' messages and 'assistant' replies, since it calls Groq directly.
 */
export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  createdAt: Timestamp;
};

export const WIKI_CATEGORIES = ['specs', 'fluids', 'tire_pressure', 'torque', 'diy'] as const;
export type WikiCategory = (typeof WIKI_CATEGORIES)[number];

export type WikiModelRef = {
  key: string;
  yearFrom: number | null;
  yearTo: number | null;
};

type WikiDocBase = {
  title: string;
  category: WikiCategory;
  models: WikiModelRef[];
  searchText: string;
  updatedAt: Timestamp;
};

export type WikiFluid = {
  grade: string;
  capacityL: number;
};

export type WikiTirePressure = {
  soloPsi: number;
  passengerPsi: number;
};

export type WikiTorqueSpec = {
  item: string;
  nm: number;
};

export type WikiServiceInterval = {
  item: string;
  everyKm: number | null;
  everyMonths: number | null;
};

export type WikiSpec = WikiDocBase & {
  kind: 'spec';
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  engineCc: number;
  fluids: {
    engineOil: WikiFluid;
    gearOil: WikiFluid | null;
    coolant: WikiFluid | null;
    brakeFluid: string;
  };
  tirePressure: {
    front: WikiTirePressure;
    rear: WikiTirePressure;
  };
  torque: WikiTorqueSpec[];
  intervals: WikiServiceInterval[];
};

export const WIKI_DIFFICULTIES = ['easy', 'moderate', 'advanced'] as const;
export type WikiDifficulty = (typeof WIKI_DIFFICULTIES)[number];

export type WikiGuideStep = {
  text: string;
  caution: string | null;
};

export type WikiGuide = WikiDocBase & {
  kind: 'guide';
  summary: string;
  difficulty: WikiDifficulty;
  minutes: number;
  tools: string[];
  parts: string[];
  steps: WikiGuideStep[];
};

export type WikiDoc = WikiSpec | WikiGuide;
