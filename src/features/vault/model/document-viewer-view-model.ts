import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { subscribeToDocument } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

import { DOCUMENT_TYPE_LABELS, formatExpiry } from './documents';
import { toVaultErrorMessage } from './errors';
import { closeVaultScreen } from './navigation';
import { useDocumentUrl } from './use-document-url';

export type DocumentViewerLoadState = 'loading' | 'ready' | 'notFound' | 'error';

/** /document-viewer?id=…: the document's photo, full screen. */
export function useDocumentViewerViewModel(documentId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [document, setDocument] = useState<WithId<VaultDocument> | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { url: photoUrl, failed: photoFailed } = useDocumentUrl(document);

  useEffect(() => {
    if (!uid || !documentId) return;
    // Live, so a photo replaced on another device shows here too.
    return subscribeToDocument(uid, documentId, setDocument, (e) => setLoadError(toVaultErrorMessage(e, 'load')));
  }, [uid, documentId]);

  const loadState: DocumentViewerLoadState =
    !documentId || document === null
      ? 'notFound'
      : document === undefined
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  return {
    loadState,
    title: document?.title ?? 'Document',
    subtitle: document ? `${DOCUMENT_TYPE_LABELS[document.type]} · ${formatExpiry(document.expiresAt)}` : null,
    photoUrl,
    photoFailed,
    error: loadError,
    close: closeVaultScreen,
  };
}

export type DocumentViewerViewModel = ReturnType<typeof useDocumentViewerViewModel>;
