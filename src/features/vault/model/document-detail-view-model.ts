import { useEffect, useRef, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { deleteDocument, subscribeToDocument } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

import { toVaultErrorMessage } from './errors';
import { closeVaultScreen, openDocumentForm } from './navigation';
import { useDocumentUrl } from './use-document-url';

export type DocumentDetailLoadState = 'loading' | 'ready' | 'notFound' | 'error';

/** /document?id=…: one document with its photo, expiry, edit and delete. */
export function useDocumentDetailViewModel(documentId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes } = useGarageData();
  const [document, setDocument] = useState<WithId<VaultDocument> | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ignore the "deleted" snapshot our own delete causes, so the screen doesn't flash "not found". */
  const removing = useRef(false);
  const { url: photoUrl, failed: photoFailed } = useDocumentUrl(document?.storagePath);

  useEffect(() => {
    if (!uid || !documentId) return;
    return subscribeToDocument(
      uid,
      documentId,
      (next) => {
        if (next === null && removing.current) return;
        setDocument(next);
      },
      (e) => setLoadError(toVaultErrorMessage(e))
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

  async function remove() {
    if (!uid || !document || deleting) return;
    removing.current = true;
    setDeleting(true);
    setError(null);
    try {
      await deleteDocument(uid, document);
      closeVaultScreen();
    } catch (e) {
      removing.current = false;
      setError(toVaultErrorMessage(e));
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
    error: error ?? loadError,
    edit: () => openDocumentForm(documentId),
    remove: () => void remove(),
    back: closeVaultScreen,
  };
}

export type DocumentDetailViewModel = ReturnType<typeof useDocumentDetailViewModel>;
