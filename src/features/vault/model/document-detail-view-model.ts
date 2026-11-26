import { useEffect, useRef, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { showToast } from '@/components/toast';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { deleteDocument, subscribeToDocument, updateDocument } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

import { toDocumentInput } from './documents';
import { toVaultErrorMessage } from './errors';
import { closeVaultScreen, openDocumentForm, openDocumentViewer } from './navigation';
import { type PhotoSource, pickDocumentPhoto } from './pick-photo';
import { verifyDocumentPhoto } from './verify-document';
import { useDocumentUrl } from './use-document-url';

export type DocumentDetailLoadState = 'loading' | 'ready' | 'notFound' | 'error';

/** /document?id=…: one document with its photo, expiry, edit, photo replacement and delete. */
export function useDocumentDetailViewModel(documentId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes } = useGarageData();
  const [document, setDocument] = useState<WithId<VaultDocument> | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** null while idle; 0–1 while a replacement photo uploads. */
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  /** True while a replacement photo is checked against the document's type. */
  const [checkingPhoto, setCheckingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ignore the "deleted" snapshot our own delete causes, so the screen doesn't flash "not found". */
  const removing = useRef(false);
  const { url: photoUrl, failed: photoFailed } = useDocumentUrl(document);

  useEffect(() => {
    if (!uid || !documentId) return;
    return subscribeToDocument(
      uid,
      documentId,
      (next) => {
        if (next === null && removing.current) return;
        setDocument(next);
      },
      (e) => setLoadError(toVaultErrorMessage(e, 'load'))
    );
  }, [uid, documentId]);

  const loadState: DocumentDetailLoadState =
    !documentId || document === null
      ? 'notFound'
      : document === undefined
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  const bike = document?.bikeId ? bikes.find((b) => b.id === document.bikeId) : undefined;

  const replacing = checkingPhoto || replaceProgress !== null;
  const busy = deleting || replacing;

  /** Swaps the photo and keeps every other detail; the old file is removed after the new one is saved. */
  async function replacePhoto(source: PhotoSource) {
    if (!uid || !document || busy) return;
    setError(null);
    const picked = await pickDocumentPhoto(source);
    if (picked.kind === 'cancelled') return;
    if (picked.kind === 'error') {
      setError(picked.message);
      return;
    }
    setCheckingPhoto(true);
    const check = await verifyDocumentPhoto(document.type, picked.photo.base64);
    setCheckingPhoto(false);
    if (check.kind === 'mismatch') {
      setError(check.message);
      return;
    }
    setReplaceProgress(0);
    try {
      await updateDocument(
        uid,
        document,
        toDocumentInput(
          document,
          bikes.map((b) => b.id)
        ),
        picked.photo,
        setReplaceProgress
      );
      showToast('Photo replaced');
    } catch (e) {
      setError(toVaultErrorMessage(e, 'replace'));
    } finally {
      setReplaceProgress(null);
    }
  }

  async function remove() {
    if (!uid || !document || busy) return;
    removing.current = true;
    setDeleting(true);
    setError(null);
    try {
      await deleteDocument(uid, document);
      closeVaultScreen();
    } catch (e) {
      removing.current = false;
      setError(toVaultErrorMessage(e, 'delete'));
      setDeleting(false);
    }
  }

  return {
    loadState,
    document: document ?? null,
    bikeName: bike ? bikeDisplayName(bike) : null,
    photoUrl,
    photoFailed,
    deleting,
    replacing,
    replaceProgress,
    checkingPhoto,
    busy,
    error: error ?? loadError,
    edit: () => openDocumentForm(documentId),
    viewPhoto: () => {
      if (photoUrl) openDocumentViewer(documentId);
    },
    replacePhoto: (source: PhotoSource) => void replacePhoto(source),
    remove: () => void remove(),
    back: closeVaultScreen,
  };
}

export type DocumentDetailViewModel = ReturnType<typeof useDocumentDetailViewModel>;
