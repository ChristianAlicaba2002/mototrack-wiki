import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function GarageScreen() {
  return (
    <TabScreen title="Garage" subtitle="The motorcycles you own and ride.">
      <PlaceholderCard title="Coming soon" description="Add your bikes to track mileage, specs, and service history." />
    </TabScreen>
  );
}
