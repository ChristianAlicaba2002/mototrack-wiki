import { useEffect, useMemo, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { fetchDocuments, subscribeToDocuments } from '@/lib/firestore/documents';
import type { VaultDocument } from '@/lib/firestore/types';

import {
  attentionCount,
  EXPIRY_STATUS_LABELS,
  filterDocuments,
  sortDocuments,
  STATUS_FILTER_ORDER,
  type StatusFilter,
  statusCounts,
} from './documents';
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
  const [filter, setFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!uid) return;
    return subscribeToDocuments(
      uid,
      (next) => {
        setDocuments(next);
        setError(null);
      },
      (e) => setError(toVaultErrorMessage(e, 'load'))
    );
  }, [uid]);

  const sorted = useMemo(() => sortDocuments(documents ?? []), [documents]);
  const attention = useMemo(() => attentionCount(documents ?? []), [documents]);
  const counts = useMemo(() => statusCounts(documents ?? []), [documents]);
  // A filter whose last document was deleted or renewed falls back to everything.
  const activeFilter: StatusFilter = filter !== 'all' && counts[filter] === 0 ? 'all' : filter;
  const visible = useMemo(() => filterDocuments(sorted, activeFilter), [sorted, activeFilter]);
  /** Only the statuses that have documents, so every pill leads somewhere. */
  const filterOptions = STATUS_FILTER_ORDER.filter((f) => f === 'all' || counts[f] > 0).map((f) => ({
    value: f,
    label: `${f === 'all' ? 'All' : EXPIRY_STATUS_LABELS[f]} ${counts[f]}`,
  }));
  const bikeNames = useMemo(() => new Map(bikes.map((b) => [b.id, bikeDisplayName(b)])), [bikes]);

  async function refresh() {
    if (!uid || refreshing) return;
    setRefreshing(true);
    try {
      const [fresh] = await Promise.all([fetchDocuments(uid), wait(MIN_REFRESH_MS)]);
      setDocuments(fresh);
      setError(null);
    } catch (e) {
      setError(toVaultErrorMessage(e, 'load'));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    loading: documents === null && error === null,
    documents: visible,
    hasDocuments: sorted.length > 0,
    filter: activeFilter,
    /** Hidden when every document has the same status: there's nothing to filter. */
    filterOptions: filterOptions.length > 2 ? filterOptions : [],
    setFilter,
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
