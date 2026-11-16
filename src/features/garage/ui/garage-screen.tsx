import { useGarageViewModel } from '../model/garage-view-model';
import { GarageView } from './garage-view';

export function GarageScreen() {
  const viewModel = useGarageViewModel();
  return <GarageView {...viewModel} />;
}
