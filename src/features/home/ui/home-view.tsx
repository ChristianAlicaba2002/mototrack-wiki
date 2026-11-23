import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';
import { ActiveBikeCard } from '@/features/garage/ui/active-bike-card';
import { ErrorMessage } from '@/features/garage/ui/controls';
import { RecentServices, RecentServicesSkeleton } from '@/features/services/ui/recent-services';

import type { HomeViewModel } from '../model/home-view-model';

export function HomeView({
  bikes,
  activeBike,
  bikeLoading,
  bikeError,
  services,
  servicesLoading,
  servicesError,
  refreshing,
  refreshError,
  refresh,
}: HomeViewModel) {
  return (
    <TabScreen onRefresh={refresh} refreshing={refreshing}>
      {refreshError ? <ErrorMessage>{refreshError}</ErrorMessage> : null}
      <ActiveBikeCard bikes={bikes} activeBike={activeBike} loading={bikeLoading} error={bikeError} />
      {activeBike ? (
        <RecentServices
          bikeId={activeBike.id}
          services={services}
          loading={servicesLoading}
          error={servicesError}
        />
      ) : bikeLoading ? (
        <RecentServicesSkeleton />
      ) : null}
      <PlaceholderCard title="Upcoming maintenance" description="Reminders for what's due, by km or by date." />
      <PlaceholderCard title="Recent activity" description="Your latest logs and documents, in one feed." />
    </TabScreen>
  );
}
