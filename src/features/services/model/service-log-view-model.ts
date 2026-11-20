import { useEffect, useMemo, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToBike } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import { deleteService } from '@/lib/firestore/services';
import type { Bike } from '@/lib/firestore/types';

import { closeServiceScreen, openServiceForm } from './navigation';
import { buildTimeline } from './service-timeline';
import { totalCost, useBikeServices } from './use-bike-services';

/** The log shows this many entries; older ones need a "load more" later. */
export const SERVICE_LOG_LIMIT = 200;

export type ServiceLogLoadState = 'loading' | 'ready' | 'notFound' | 'error';

/** One bike's maintenance history as a timeline, with totals, edit and delete. */
export function useServiceLogViewModel(bikeId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [bike, setBike] = useState<WithId<Bike> | null | undefined>(undefined);
  const [bikeError, setBikeError] = useState<string | null>(null);
  /** The entry being deleted, so only its row shows a spinner. */
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { services, loading: servicesLoading, error: servicesError } = useBikeServices(
    bikeId || undefined,
    SERVICE_LOG_LIMIT
  );

  useEffect(() => {
    if (!uid || !bikeId) return;
    return subscribeToBike(uid, bikeId, setBike, (e) => setBikeError(toGarageErrorMessage(e)));
  }, [uid, bikeId]);

  const timeline = useMemo(() => buildTimeline(services), [services]);

  const loadState: ServiceLogLoadState =
    !bikeId || bike === null
      ? 'notFound'
      : bike === undefined
        ? bikeError
          ? 'error'
          : 'loading'
        : 'ready';

  /** Deletes without asking; the view confirms first. The live query drops the row. */
  async function removeService(serviceId: string) {
    if (!uid || deletingId) return;
    setDeletingId(serviceId);
    setActionError(null);
    try {
      await deleteService(uid, serviceId);
    } catch (e) {
      setActionError(toGarageErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    loadState,
    title: bike ? bikeDisplayName(bike) : 'Service log',
    odometerKm: bike?.odometerKm ?? 0,
    services,
    timeline,
    servicesLoading,
    totalCost: totalCost(services),
    isTruncated: services.length >= SERVICE_LOG_LIMIT,
    deletingId,
    error: actionError ?? bikeError ?? servicesError,
    addService: () => openServiceForm(bikeId),
    editService: (serviceId: string) => openServiceForm(bikeId, serviceId),
    removeService,
    back: closeServiceScreen,
  };
}

export type ServiceLogViewModel = ReturnType<typeof useServiceLogViewModel>;
