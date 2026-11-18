import { useLocalSearchParams } from 'expo-router';

import { useOdometerViewModel } from '../model/odometer-view-model';
import { OdometerView } from './odometer-view';

/** /odometer?id=<bikeId>: update a bike's odometer and see its history. */
export function OdometerScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  // Keyed so switching bikes resets the form.
  return id ? <Odometer key={id} bikeId={id} /> : <Odometer bikeId="" />;
}

function Odometer({ bikeId }: { bikeId: string }) {
  const viewModel = useOdometerViewModel(bikeId);
  return <OdometerView {...viewModel} />;
}
