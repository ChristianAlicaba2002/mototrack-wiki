import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';

export default function AiMechanicScreen() {
  return (
    <TabScreen title="AI Mechanic" subtitle="Describe a problem and get troubleshooting help.">
      <PlaceholderCard title="Coming soon" description="Chat with an AI assistant about your bike's symptoms here." />
    </TabScreen>
  );
}
