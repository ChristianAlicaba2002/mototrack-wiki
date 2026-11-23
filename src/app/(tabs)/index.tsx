import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';
import { ActiveBikeCard } from '@/features/garage/ui/active-bike-card';
import { RecentServices } from '@/features/services/ui/recent-services';

export default function HomeScreen() {
  return (
    <TabScreen>
      <ActiveBikeCard />
      <RecentServices />
      <PlaceholderCard title="Upcoming maintenance" description="Reminders for what's due, by km or by date." />
      <PlaceholderCard title="Recent activity" description="Your latest logs and documents, in one feed." />
    </TabScreen>
  );
}
