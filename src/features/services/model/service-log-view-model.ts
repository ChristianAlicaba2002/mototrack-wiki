import { useEffect, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToBike } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { closeServiceScreen, openServiceForm } from './navigation';
import { totalCost, useBikeServices } from './use-bike-services';

/** The log shows this many entries; older ones need a "load more" later. */
export const SERVICE_LOG_LIMIT = 200;

export type ServiceLogLoadState = 'loading' | 'ready' | 'notFound' | 'error';

/** One bike's maintenance history, with totals. */
export function useServiceLogViewModel(bikeId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [bike, setBike] = useState<WithId<Bike> | null | undefined>(undefined);
  const [bikeError, setBikeError] = useState<string | null>(null);
  const { services, loading: servicesLoading, error: servicesError } = useBikeServices(
    bikeId || undefined,
    SERVICE_LOG_LIMIT
  );

  useEffect(() => {
    if (!uid || !bikeId) return;
    return subscribeToBike(uid, bikeId, setBike, (e) => setBikeError(toGarageErrorMessage(e)));
  }, [uid, bikeId]);

  const loadState: ServiceLogLoadState =
    !bikeId || bike === null
      ? 'notFound'
      : bike === undefined
        ? bikeError
          ? 'error'
          : 'loading'
        : 'ready';

  return {
    loadState,
    title: bike ? bikeDisplayName(bike) : 'Service log',
    odometerKm: bike?.odometerKm ?? 0,
    services,
    servicesLoading,
    totalCost: totalCost(services),
    isTruncated: services.length >= SERVICE_LOG_LIMIT,
    error: bikeError ?? servicesError,
    addService: () => openServiceForm(bikeId),
    openService: (serviceId: string) => openServiceForm(bikeId, serviceId),
    back: closeServiceScreen,
  };
}

export type ServiceLogViewModel = ReturnType<typeof useServiceLogViewModel>;
