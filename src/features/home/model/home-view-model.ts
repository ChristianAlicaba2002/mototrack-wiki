import { useState } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { RECENT_SERVICES_COUNT, useBikeServices } from '@/features/services/model/use-bike-services';

const MIN_REFRESH_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useHomeViewModel() {
  const garage = useGarageData();
  const bikeId = garage.activeBike?.id;
  const logbook = useBikeServices(bikeId, RECENT_SERVICES_COUNT);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([garage.refresh(), logbook.refresh(), wait(MIN_REFRESH_MS)]);
      setRefreshError(null);
    } catch (e) {
      setRefreshError(toGarageErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }

  return {
    bikes: garage.bikes,
    activeBike: garage.activeBike,
    bikeLoading: garage.loading,
    bikeError: garage.error,
    services: logbook.services,
    servicesLoading: garage.loading || logbook.loading,
    servicesError: logbook.error,
    refreshing,
    refreshError,
    refresh,
  };
}

export type HomeViewModel = ReturnType<typeof useHomeViewModel>;
