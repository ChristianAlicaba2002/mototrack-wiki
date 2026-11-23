import { TabList, TabSlot, TabTrigger, Tabs as TabNavigator } from 'expo-router/ui';
import { useState } from 'react';
import { type LayoutRectangle, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { TabBarRuleWidth, TabButton, TabMarker } from '@/components/tab-bar';
import { Tabs, type TabName } from '@/constants/tabs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useActiveTab } from '@/hooks/use-active-tab';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const activeTab = useActiveTab();
  const [layouts, setLayouts] = useState<Partial<Record<TabName, LayoutRectangle>>>({});

  const gutter = Math.max((width - MaxContentWidth) / 2, Spacing.two);

  return (
    <TabNavigator style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader title={activeTab.label} />
      <TabSlot style={styles.slot} />
      <TabList
        accessibilityRole="tablist"
        style={[
          styles.bar,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.text,
            paddingHorizontal: gutter,
            paddingBottom: Math.max(insets.bottom, Spacing.three),
          },
        ]}>
        {Tabs.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton
              tab={tab}
              onLayout={(event) => {
                const { layout } = event.nativeEvent;
                setLayouts((current) => ({ ...current, [tab.name]: layout }));
              }}
            />
          </TabTrigger>
        ))}
        <TabMarker layout={layouts[activeTab.name]} />
      </TabList>
    </TabNavigator>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    borderTopWidth: TabBarRuleWidth,
  },
});
