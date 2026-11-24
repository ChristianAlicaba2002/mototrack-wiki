import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { ServiceIntervals } from '@/lib/firestore/types';
import { subscribeToUserProfile } from '@/lib/firestore/user-profile';

import { DEFAULT_SERVICE_INTERVALS, resolveIntervals } from './intervals';

/**
 * The rider's service intervals, live, with defaults for anything never set.
 * Falls back to the defaults while loading or if the profile can't be read,
 * so callers can always work out a next-due reading.
 */
export function useServiceIntervals(): { intervals: ServiceIntervals; loaded: boolean; customized: boolean } {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<{ saved: Partial<ServiceIntervals> | null; loaded: boolean }>({
    saved: null,
    loaded: false,
  });

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserProfile(
      uid,
      (profile) => setState({ saved: profile?.serviceIntervals ?? null, loaded: true }),
      () => setState({ saved: null, loaded: true })
    );
  }, [uid]);

  const intervals = useMemo(
    () => (state.saved ? resolveIntervals(state.saved) : DEFAULT_SERVICE_INTERVALS),
    [state.saved]
  );

  return {
    intervals,
    loaded: state.loaded,
    customized: state.saved !== null,
  };
}
