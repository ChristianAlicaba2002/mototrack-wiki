import { useEffect, useMemo, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import {
  createDocument,
  type DocumentInput,
  getDocument,
  updateDocument,
} from '@/lib/firestore/documents';
import type { DocumentType, VaultDocument } from '@/lib/firestore/types';

import { BIKE_DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, EXPIRING_DOCUMENT_TYPES } from './documents';
import { toVaultErrorMessage } from './errors';
import { closeVaultScreen } from './navigation';
import { type PhotoSource, type PickedPhoto, pickDocumentPhoto } from './pick-photo';
import { verifyDocumentPhoto } from './verify-document';
import { useDocumentUrl } from './use-document-url';

export const DOCUMENT_TITLE_MAX = 120;

/** Expiry dates the picker allows: far enough back for an old receipt, ahead for a 10-year license. */
export const EXPIRY_MIN_DATE = new Date(2000, 0, 1);
export const EXPIRY_MAX_DATE = new Date(new Date().getFullYear() + 15, 11, 31);

export type DocumentFormValues = {
  type: DocumentType;
  title: string;
  bikeId: string | null;
  hasExpiry: boolean;
  expiresAt: Date;
};

export type DocumentFormLoadState = 'loading' | 'ready' | 'notFound' | 'error';

function oneYearFromToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
}

function toValues(document: VaultDocument): DocumentFormValues {
  return {
    type: document.type,
    // A title equal to the type's label was filled in for the user; show it empty again.
    title: document.title === DOCUMENT_TYPE_LABELS[document.type] ? '' : document.title,
    bikeId: document.bikeId,
    hasExpiry: document.expiresAt !== null,
    expiresAt: document.expiresAt?.toDate() ?? oneYearFromToday(),
  };
}

/** The base64 part of a `data:…;base64,` URI. */
function dataUriBase64(uri: string | null): string | null {
  const comma = uri?.indexOf(',') ?? -1;
  return uri && comma >= 0 ? uri.slice(comma + 1) : null;
}

/** Add a document to the vault (no id), or edit one. */
export function useDocumentFormViewModel(documentId: string | undefined) {
  const { user } = useAuth();
  const uid = user?.uid;
  const isEdit = documentId !== undefined;
  const { bikes, activeBike, loading: bikesLoading } = useGarageData();

  const [existing, setExisting] = useState<WithId<VaultDocument> | null | undefined>(isEdit ? undefined : null);
  const [values, setValues] = useState<DocumentFormValues | null>(null);
  /** Bike and expiry follow the type until the user sets them; then they stay put. */
  const [touched, setTouched] = useState({ bike: false, expiry: false });
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [submitted, setSubmitted] = useState(false);
  /** null while idle; 0–1 while uploading. */
  const [progress, setProgress] = useState<number | null>(null);
  /** True while the photo is being checked against the chosen type. */
  const [checking, setChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { url: existingPhotoUrl } = useDocumentUrl(existing);

  // Edit: load the document once.
  useEffect(() => {
    if (!uid || !documentId) return;
    let cancelled = false;
    getDocument(uid, documentId).then(
      (document) => {
        if (cancelled) return;
        setExisting(document);
        if (document) setValues(toValues(document));
      },
      (e) => {
        if (!cancelled) setLoadError(toVaultErrorMessage(e, 'load'));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [uid, documentId]);

  // New: start from an OR/CR for the active bike, expiring in a year.
  const defaults = useMemo<DocumentFormValues>(
    () => ({
      type: 'registration',
      title: '',
      bikeId: activeBike?.id ?? null,
      hasExpiry: true,
      expiresAt: oneYearFromToday(),
    }),
    [activeBike?.id]
  );
  const current = values ?? (isEdit ? null : defaults);

  const loadState: DocumentFormLoadState = !isEdit
    ? bikesLoading
      ? 'loading'
      : 'ready'
    : existing === null
      ? 'notFound'
      : existing === undefined
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  const busy = checking || progress !== null;
  const titleError =
    current && current.title.trim().length > DOCUMENT_TITLE_MAX
      ? `Keep the title under ${DOCUMENT_TITLE_MAX} characters.`
      : undefined;
  const photoError = submitted && !isEdit && !photo ? 'Add a photo of the document.' : undefined;

  function update(patch: Partial<DocumentFormValues>) {
    setValues({ ...(current ?? defaults), ...patch });
  }

  function setType(type: DocumentType) {
    // A "this isn't your OR/CR" message no longer applies once the type changes.
    setError(null);
    const patch: Partial<DocumentFormValues> = { type };
    if (!touched.bike) patch.bikeId = BIKE_DOCUMENT_TYPES.includes(type) ? (activeBike?.id ?? null) : null;
    if (!touched.expiry) patch.hasExpiry = EXPIRING_DOCUMENT_TYPES.includes(type);
    update(patch);
  }

  async function pick(source: PhotoSource) {
    setError(null);
    const result = await pickDocumentPhoto(source);
    if (result.kind === 'picked') setPhoto(result.photo);
    else if (result.kind === 'error') setError(result.message);
  }

  async function save() {
    setSubmitted(true);
    if (!uid || !current || busy || titleError) return;
    if (!isEdit && !photo) return;

    const input: DocumentInput = {
      type: current.type,
      title: current.title.trim() || DOCUMENT_TYPE_LABELS[current.type],
      // A bike that was deleted since can't be saved (firestore.rules); drop the link.
      bikeId: current.bikeId && bikes.some((b) => b.id === current.bikeId) ? current.bikeId : null,
      expiresAt: current.hasExpiry ? current.expiresAt : null,
    };

    setError(null);

    // Check the photo is the chosen paper: a new photo, or a saved one whose type just changed.
    const base64 = photo?.base64 ?? (existing && existing.type !== current.type ? dataUriBase64(existingPhotoUrl) : null);
    if (base64) {
      setChecking(true);
      const check = await verifyDocumentPhoto(current.type, base64);
      setChecking(false);
      if (check.kind === 'mismatch') {
        setError(check.message);
        return;
      }
    }

    setProgress(0);
    try {
      if (existing) await updateDocument(uid, existing, input, photo, setProgress);
      else await createDocument(uid, input, photo!, setProgress);
      closeVaultScreen();
    } catch (e) {
      setError(toVaultErrorMessage(e, 'save'));
    } finally {
      setProgress(null);
    }
  }

  return {
    isEdit,
    loadState,
    values: current,
    bikes: bikes.map((b) => ({ id: b.id, name: bikeDisplayName(b) })),
    /** The photo to show: the one just picked, or the saved one when editing. */
    photoUri: photo?.uri ?? existingPhotoUrl,
    titlePlaceholder: current ? DOCUMENT_TYPE_LABELS[current.type] : '',
    titleError,
    photoError,
    progress,
    checking,
    busy,
    error: error ?? loadError,
    setType,
    setTitle: (title: string) => update({ title }),
    setBike: (bikeId: string | null) => {
      setTouched((t) => ({ ...t, bike: true }));
      update({ bikeId });
    },
    setHasExpiry: (hasExpiry: boolean) => {
      setTouched((t) => ({ ...t, expiry: true }));
      update({ hasExpiry });
    },
    setExpiresAt: (expiresAt: Date) => {
      setTouched((t) => ({ ...t, expiry: true }));
      update({ expiresAt });
    },
    takePhoto: () => void pick('camera'),
    choosePhoto: () => void pick('library'),
    save: () => void save(),
    cancel: closeVaultScreen,
  };
}

export type DocumentFormViewModel = ReturnType<typeof useDocumentFormViewModel>;
