import { AccountMenu } from '@/components/account-menu';
import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function HomeScreen() {
  return (
    <TabScreen title="MotoTrack" subtitle="Your motorcycle at a glance." headerAction={<AccountMenu />}>
      <PlaceholderCard
        title="Upcoming maintenance"
        description="Service reminders for your bikes will show up here."
      />
      <PlaceholderCard title="Recent activity" description="Your latest logs and documents will show up here." />
    </TabScreen>
  );
}
