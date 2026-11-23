import { useEffect, useRef, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToBike } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import { deleteService, subscribeToService } from '@/lib/firestore/services';
import type { Bike, ServiceRecord } from '@/lib/firestore/types';

import { closeServiceScreen, openServiceForm } from './navigation';

export type ServiceDetailLoadState = 'loading' | 'ready' | 'notFound' | 'error';

export function useServiceDetailViewModel(bikeId: string, serviceId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [bike, setBike] = useState<WithId<Bike> | null | undefined>(undefined);
  const [service, setService] = useState<WithId<ServiceRecord> | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const removing = useRef(false);

  useEffect(() => {
    if (!uid || !bikeId) return;
    return subscribeToBike(uid, bikeId, setBike, (e) => setLoadError(toGarageErrorMessage(e)));
  }, [uid, bikeId]);

  useEffect(() => {
    if (!uid || !serviceId) return;
    return subscribeToService(
      uid,
      serviceId,
      (next) => {
        if (next === null && removing.current) return;
        setService(next);
      },
      (e) => setLoadError(toGarageErrorMessage(e))
    );
  }, [uid, serviceId]);

  const belongsToBike = service ? service.bikeId === bikeId : true;

  const loadState: ServiceDetailLoadState =
    !bikeId || !serviceId || bike === null || service === null || !belongsToBike
      ? 'notFound'
      : bike === undefined || service === undefined
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  async function remove() {
    if (!uid || !serviceId || deleting) return;
    removing.current = true;
    setDeleting(true);
    setError(null);
    try {
      await deleteService(uid, serviceId);
      closeServiceScreen();
    } catch (e) {
      removing.current = false;
      setError(toGarageErrorMessage(e));
      setDeleting(false);
    }
  }

  return {
    loadState,
    bikeName: bike ? bikeDisplayName(bike) : undefined,
    service: loadState === 'ready' ? (service ?? null) : null,
    deleting,
    error: error ?? loadError,
    edit: () => openServiceForm(bikeId, serviceId),
    remove,
    back: closeServiceScreen,
  };
}

export type ServiceDetailViewModel = ReturnType<typeof useServiceDetailViewModel>;
