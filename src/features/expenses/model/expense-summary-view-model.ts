import { useEffect, useMemo, useState } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { subscribeToAllServices } from '@/lib/firestore/services';
import type { ServiceRecord } from '@/lib/firestore/types';

import { summarizeExpenses } from './expense-summary';
import { closeExpenseSummary } from './navigation';

/** The summary reads at most this many entries; older ones are left out. */
export const EXPENSE_SERVICE_LIMIT = 1000;

type ServicesState = {
  /** null until the first snapshot arrives. */
  services: WithId<ServiceRecord>[] | null;
  error: string | null;
};

/** Spending across the owner's bikes, filterable to one bike. */
export function useExpenseSummaryViewModel(initialBikeId: string | null) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes, loading: bikesLoading, error: bikesError } = useGarageData();
  const [state, setState] = useState<ServicesState>({ services: null, error: null });
  const [selected, setSelected] = useState<string | null>(initialBikeId);

  useEffect(() => {
    if (!uid) return;
    return subscribeToAllServices(
      uid,
      EXPENSE_SERVICE_LIMIT,
      (services) => setState({ services, error: null }),
      (e) => setState({ services: null, error: toGarageErrorMessage(e) })
    );
  }, [uid]);

  const services = state.services;
  // A filter for a bike that's gone (deleted, bad link) falls back to all bikes.
  const bikeId = selected && bikes.some((b) => b.id === selected) ? selected : null;
  const summary = useMemo(() => summarizeExpenses(services ?? [], bikes, bikeId), [services, bikes, bikeId]);

  const error = state.error ?? bikesError;
  const loading = (state.services === null || bikesLoading) && error === null;

  return {
    loading,
    error,
    bikes,
    selectedBikeId: bikeId,
    selectBike: setSelected,
    summary,
    isTruncated: (services?.length ?? 0) >= EXPENSE_SERVICE_LIMIT,
    back: closeExpenseSummary,
  };
}

export type ExpenseSummaryViewModel = ReturnType<typeof useExpenseSummaryViewModel>;
