import { useDeleteAccountViewModel } from '../model/delete-account-view-model';
import { DeleteAccountView } from './delete-account-view';

export function DeleteAccountScreen() {
  const viewModel = useDeleteAccountViewModel();
  return <DeleteAccountView {...viewModel} />;
}
