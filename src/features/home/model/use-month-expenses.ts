import { useEffect, useMemo, useState } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { fetchServicesSince, subscribeToServicesSince } from '@/lib/firestore/services';
import type { ServiceRecord } from '@/lib/firestore/types';

import { startOfLastMonth, summarizeMonth } from './month-expenses';

/**
 * This month's spending across all bikes, compared with last month. Reads only
 * services dated from the 1st of last month, not the whole log.
 */
export function useMonthExpenses() {
  const { user } = useAuth();
  const uid = user?.uid;
  /** null until the first snapshot arrives. */
  const [services, setServices] = useState<WithId<ServiceRecord>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Fixed while the screen is open; a new month starts on the next visit or refresh.
  const [since, setSince] = useState(() => startOfLastMonth());

  useEffect(() => {
    if (!uid) return;
    return subscribeToServicesSince(
      uid,
      since,
      (next) => {
        setServices(next);
        setError(null);
      },
      (e) => setError(toGarageErrorMessage(e))
    );
  }, [uid, since]);

  const summary = useMemo(() => summarizeMonth(services ?? []), [services]);

  async function refresh() {
    if (!uid) return;
    const fresh = startOfLastMonth();
    if (fresh.getTime() !== since.getTime()) {
      // The month rolled over while the app was open: resubscribe from the new start.
      setSince(fresh);
      return;
    }
    setServices(await fetchServicesSince(uid, since));
  }

  return {
    summary,
    loading: services === null && error === null,
    error,
    refresh,
  };
}
