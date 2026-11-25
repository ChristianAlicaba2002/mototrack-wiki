import { useVaultViewModel } from '../model/vault-view-model';
import { VaultView } from './vault-view';

export function VaultScreen() {
  const viewModel = useVaultViewModel();
  return <VaultView {...viewModel} />;
}
