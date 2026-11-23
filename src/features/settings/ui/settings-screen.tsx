import { useSettingsViewModel } from '../model/settings-view-model';
import { SettingsView } from './settings-view';

export function SettingsScreen() {
  const viewModel = useSettingsViewModel();
  return <SettingsView {...viewModel} />;
}
