import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="garage">
        <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="two_wheeler" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="vault">
        <NativeTabs.Trigger.Label>Vault</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="folder_shared" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="wiki">
        <NativeTabs.Trigger.Label>Wiki</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai-mechanic">
        <NativeTabs.Trigger.Label>AI Mechanic</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="build" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
