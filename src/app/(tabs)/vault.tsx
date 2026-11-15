import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function VaultScreen() {
  return (
    <TabScreen title="Vault" subtitle="Registration, insurance, and receipts in one place.">
      <PlaceholderCard title="Coming soon" description="Store and organize your motorcycle documents here." />
    </TabScreen>
  );
}
