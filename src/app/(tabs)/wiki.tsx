import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function WikiScreen() {
  return (
    <TabScreen title="Wiki" subtitle="Motorcycle reference and how-to guides.">
      <PlaceholderCard title="Coming soon" description="Browse parts, specs, and maintenance guides here." />
    </TabScreen>
  );
}
