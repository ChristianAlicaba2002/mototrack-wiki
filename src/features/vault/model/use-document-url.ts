import { useEffect, useState } from 'react';

import { getDocumentFileUrl } from '@/lib/firestore/documents';

/**
 * Download URLs by Storage path. A path never changes its file (replacing a
 * photo uploads under a new name), so a URL can be reused for the session.
 */
const cache = new Map<string, string>();

/** The file's download URL; null while loading, or if it can't be fetched. */
export function useDocumentUrl(storagePath: string | null | undefined): { url: string | null; failed: boolean } {
  const cached = storagePath ? cache.get(storagePath) : undefined;
  const [state, setState] = useState<{ path: string; url: string | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (!storagePath || cache.has(storagePath)) return;
    let cancelled = false;
    getDocumentFileUrl(storagePath).then(
      (url) => {
        cache.set(storagePath, url);
        if (!cancelled) setState({ path: storagePath, url, failed: false });
      },
      () => {
        if (!cancelled) setState({ path: storagePath, url: null, failed: true });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (cached) return { url: cached, failed: false };
  if (state && state.path === storagePath) return { url: state.url, failed: state.failed };
  return { url: null, failed: false };
}
