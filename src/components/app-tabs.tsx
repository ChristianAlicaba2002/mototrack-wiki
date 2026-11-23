import { NativeTabs } from 'expo-router/native-tabs';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Tabs } from '@/constants/tabs';
import { Colors, Fonts } from '@/constants/theme';
import { useActiveTab } from '@/hooks/use-active-tab';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const activeTab = useActiveTab();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader title={activeTab.label} />
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundSelected}
        tintColor={colors.text}
        labelVisibilityMode="labeled"
        labelStyle={{
          default: { fontFamily: Fonts.sansMedium },
          selected: { fontFamily: Fonts.sansSemiBold, color: colors.text },
        }}>
        {Tabs.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={tab.sf} md={tab.md} />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
