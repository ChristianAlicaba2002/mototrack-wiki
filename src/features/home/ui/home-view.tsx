import { TabScreen } from '@/components/screen/tab-screen';
import { ActiveBikeCard } from '@/features/garage/ui/active-bike-card';
import { ErrorMessage } from '@/features/garage/ui/controls';
import { RecentServices, RecentServicesSkeleton } from '@/features/services/ui/recent-services';

import type { HomeViewModel } from '../model/home-view-model';
import { DueNextPanel, DueNextPanelSkeleton } from './due-next-panel';
import { MonthExpensesPanel } from './month-expenses-panel';

/**
 * The Home dashboard, top to bottom: the bike you're riding, what's due on it,
 * what you did to it lately, and what you've spent this month.
 */
export function HomeView({
  bikes,
  activeBike,
  bikeLoading,
  bikeError,
  services,
  hasServices,
  servicesLoading,
  servicesError,
  upcoming,
  moreUpcoming,
  overdueCount,
  expenses,
  expensesLoading,
  expensesError,
  refreshing,
  refreshError,
  refresh,
}: HomeViewModel) {
  return (
    <TabScreen onRefresh={refresh} refreshing={refreshing}>
      {refreshError ? <ErrorMessage>{refreshError}</ErrorMessage> : null}
      <ActiveBikeCard bikes={bikes} activeBike={activeBike} loading={bikeLoading} error={bikeError} />

      {activeBike ? (
        <>
          <DueNextPanel
            bikeId={activeBike.id}
            odometerKm={activeBike.odometerKm}
            upcoming={upcoming}
            moreUpcoming={moreUpcoming}
            overdueCount={overdueCount}
            hasServices={hasServices}
            loading={servicesLoading}
            error={servicesError}
          />
          <RecentServices
            bikeId={activeBike.id}
            services={services}
            loading={servicesLoading}
            error={servicesError}
          />
        </>
      ) : bikeLoading ? (
        <>
          <DueNextPanelSkeleton />
          <RecentServicesSkeleton />
        </>
      ) : null}

      {/* Spending covers every bike, so it only makes sense once there is one. */}
      {bikes.length > 0 || bikeLoading ? (
        <MonthExpensesPanel expenses={expenses} loading={expensesLoading || bikeLoading} error={expensesError} />
      ) : null}
    </TabScreen>
  );
}
