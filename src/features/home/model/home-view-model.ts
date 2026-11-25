import { useMemo, useState } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { upcomingServices } from '@/features/services/model/intervals';
import { SERVICE_LOG_LIMIT } from '@/features/services/model/service-log-view-model';
import { RECENT_SERVICES_COUNT, useBikeServices } from '@/features/services/model/use-bike-services';
import { useServiceIntervals } from '@/features/services/model/use-service-intervals';

import { useMonthExpenses } from './use-month-expenses';

const MIN_REFRESH_MS = 600;
/** How many due items Home shows; the service log has the full list. */
export const DUE_NEXT_COUNT = 3;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The Home dashboard: the active bike, what's due next on it, its latest
 * services, and this month's spending across all bikes.
 */
export function useHomeViewModel() {
  const garage = useGarageData();
  const bike = garage.activeBike;
  // One query feeds both "Due next" (latest of each type) and the logbook (first few).
  // Same query as the service log screen, so opening it later is instant.
  const logbook = useBikeServices(bike?.id, SERVICE_LOG_LIMIT);
  const { intervals } = useServiceIntervals();
  const expenses = useMonthExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const bikeOdometerKm = bike?.odometerKm;
  const upcoming = useMemo(
    () => (bikeOdometerKm === undefined ? [] : upcomingServices(logbook.services, bikeOdometerKm, intervals)),
    [logbook.services, bikeOdometerKm, intervals]
  );

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([garage.refresh(), logbook.refresh(), expenses.refresh(), wait(MIN_REFRESH_MS)]);
      setRefreshError(null);
    } catch (e) {
      setRefreshError(toGarageErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }

  const servicesLoading = garage.loading || logbook.loading;

  return {
    bikes: garage.bikes,
    activeBike: bike,
    bikeLoading: garage.loading,
    bikeError: garage.error,
    services: logbook.services.slice(0, RECENT_SERVICES_COUNT),
    hasServices: logbook.services.length > 0,
    servicesLoading,
    servicesError: logbook.error,
    upcoming: upcoming.slice(0, DUE_NEXT_COUNT),
    /** Due items left out of Home's short list. */
    moreUpcoming: Math.max(0, upcoming.length - DUE_NEXT_COUNT),
    overdueCount: upcoming.filter((u) => u.status === 'overdue').length,
    expenses: expenses.summary,
    expensesLoading: expenses.loading,
    expensesError: expenses.error,
    refreshing,
    refreshError,
    refresh,
  };
}

export type HomeViewModel = ReturnType<typeof useHomeViewModel>;
