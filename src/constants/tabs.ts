export const Tabs = [
  { name: 'index', href: '/', label: 'Home', shortLabel: 'Home' },
  { name: 'garage', href: '/garage', label: 'Garage', shortLabel: 'Garage' },
  { name: 'vault', href: '/vault', label: 'Vault', shortLabel: 'Vault' },
  { name: 'wiki', href: '/wiki', label: 'Wiki', shortLabel: 'Wiki' },
  { name: 'ai-mechanic', href: '/ai-mechanic', label: 'AI Mechanic', shortLabel: 'Mechanic' },
] as const;

export type Tab = (typeof Tabs)[number];

export type TabName = Tab['name'];

export const DefaultTab: Tab = Tabs[0];
