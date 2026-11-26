import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { getDocumentPhoto } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

type PhotoRef = Pick<WithId<VaultDocument>, 'id' | 'photoId' | 'photoChunks' | 'contentType'>;

/**
 * Photos as `data:` URIs, by document and photo id. A photo id never changes
 * its contents (replacing a photo saves it under a new id), so an entry stays
 * valid. The oldest entries are dropped to keep memory in check.
 */
const cache = new Map<string, string>();
const CACHE_LIMIT = 24;

function remember(key: string, url: string) {
  cache.delete(key);
  cache.set(key, url);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
}

/** The document's photo, ready for expo-image; null while loading, or if it can't be loaded. */
export function useDocumentUrl(document: PhotoRef | null | undefined): { url: string | null; failed: boolean } {
  const { user } = useAuth();
  const uid = user?.uid;
  const key = document ? `${document.id}/${document.photoId}` : null;
  const cached = key ? cache.get(key) : undefined;
  const [state, setState] = useState<{ key: string; url: string | null; failed: boolean } | null>(null);

  const photoChunks = document?.photoChunks;
  const contentType = document?.contentType;
  useEffect(() => {
    if (!uid || !key || !document || cache.has(key)) return;
    let cancelled = false;
    getDocumentPhoto(uid, document.id, document).then(
      (url) => {
        remember(key, url);
        if (!cancelled) setState({ key, url, failed: false });
      },
      () => {
        if (!cancelled) setState({ key, url: null, failed: true });
      }
    );
    return () => {
      cancelled = true;
    };
    // Reload only when the photo itself changes, not on every snapshot of the document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, key, photoChunks, contentType]);

  if (cached) return { url: cached, failed: false };
  if (state && state.key === key) return { url: state.url, failed: state.failed };
  return { url: null, failed: false };
}
