import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function WikiScreen() {
  return (
    <TabScreen summary="Motorcycle reference and how-to guides.">
      <PlaceholderCard title="Coming soon" description="Browse parts, specs, and maintenance guides here." />
    </TabScreen>
  );
}
