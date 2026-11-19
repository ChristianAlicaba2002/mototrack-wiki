import { useEffect, useState } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { subscribeToServices } from '@/lib/firestore/services';
import type { ServiceRecord } from '@/lib/firestore/types';

type State = {
  /** Which bike the services below belong to, so switching bikes never shows the old list. */
  bikeId: string | null;
  /** null until the first snapshot arrives. */
  services: WithId<ServiceRecord>[] | null;
  error: string | null;
};

/** Live service log of one bike, most recent first. Pass undefined while the bike isn't known. */
export function useBikeServices(bikeId: string | undefined, max: number) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<State>({ bikeId: null, services: null, error: null });

  useEffect(() => {
    if (!uid || !bikeId) return;
    return subscribeToServices(
      uid,
      bikeId,
      max,
      (services) => setState({ bikeId, services, error: null }),
      (e) => setState({ bikeId, services: null, error: toGarageErrorMessage(e) })
    );
  }, [uid, bikeId, max]);

  const current = state.bikeId === bikeId;
  const services = current ? state.services : null;
  const error = current ? state.error : null;

  return {
    services: services ?? [],
    loading: Boolean(bikeId) && services === null && error === null,
    error,
  };
}

/** Sum of the costs that were entered. */
export function totalCost(services: Pick<ServiceRecord, 'cost'>[]): number {
  return services.reduce((sum, s) => sum + (s.cost ?? 0), 0);
}
