import { useEffect, useMemo, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { fetchDocuments, subscribeToDocuments } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

import { attentionCount, sortDocuments } from './documents';
import { toVaultErrorMessage } from './errors';
import { openDocument, openDocumentForm } from './navigation';

const MIN_REFRESH_MS = 600;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Vault tab: every document, the ones needing renewal first. */
export function useVaultViewModel() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes } = useGarageData();
  /** null until the first snapshot arrives. */
  const [documents, setDocuments] = useState<WithId<VaultDocument>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return subscribeToDocuments(
      uid,
      (next) => {
        setDocuments(next);
        setError(null);
      },
      (e) => setError(toVaultErrorMessage(e))
    );
  }, [uid]);

  const sorted = useMemo(() => sortDocuments(documents ?? []), [documents]);
  const attention = useMemo(() => attentionCount(documents ?? []), [documents]);
  const bikeNames = useMemo(() => new Map(bikes.map((b) => [b.id, bikeDisplayName(b)])), [bikes]);

  async function refresh() {
    if (!uid || refreshing) return;
    setRefreshing(true);
    try {
      const [fresh] = await Promise.all([fetchDocuments(uid), wait(MIN_REFRESH_MS)]);
      setDocuments(fresh);
      setError(null);
    } catch (e) {
      setError(toVaultErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    loading: documents === null && error === null,
    documents: sorted,
    hasDocuments: sorted.length > 0,
    expiredCount: attention.expired,
    expiringSoonCount: attention.soon,
    /** e.g. "Honda Click 125i"; undefined for documents not tied to a bike, or a deleted one. */
    bikeName: (bikeId: string | null) => (bikeId ? bikeNames.get(bikeId) : undefined),
    error,
    refreshing,
    refresh,
    addDocument: () => openDocumentForm(),
    openDocument,
  };
}

export type VaultViewModel = ReturnType<typeof useVaultViewModel>;
