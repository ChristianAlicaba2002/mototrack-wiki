import { useSegments } from 'expo-router';
import { useState } from 'react';

import { DefaultTab, Tabs, type Tab } from '@/constants/tabs';

export function useActiveTab(): Tab {
  const [group, child] = useSegments() as readonly string[];
  const [lastTab, setLastTab] = useState<Tab>(DefaultTab);

  const name = group === '(tabs)' ? (child ?? DefaultTab.name) : null;
  const current = Tabs.find((tab) => tab.name === name);

  if (current && current !== lastTab) {
    setLastTab(current);
  }

  return current ?? lastTab;
}
