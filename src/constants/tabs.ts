export const Tabs = [
  { name: 'index', label: 'Home', sf: { default: 'house', selected: 'house.fill' }, md: 'home' },
  { name: 'garage', label: 'Garage', sf: { default: 'motorcycle', selected: 'motorcycle.fill' }, md: 'two_wheeler' },
  { name: 'vault', label: 'Vault', sf: { default: 'folder', selected: 'folder.fill' }, md: 'folder_shared' },
  { name: 'wiki', label: 'Wiki', sf: { default: 'book', selected: 'book.fill' }, md: 'menu_book' },
  {
    name: 'ai-mechanic',
    label: 'AI Mechanic',
    sf: { default: 'wrench.and.screwdriver', selected: 'wrench.and.screwdriver.fill' },
    md: 'build',
  },
] as const;

export type Tab = (typeof Tabs)[number];

export const DefaultTab: Tab = Tabs[0];
