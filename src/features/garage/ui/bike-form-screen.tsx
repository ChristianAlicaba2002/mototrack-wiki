import { useLocalSearchParams } from 'expo-router';

import { useBikeFormViewModel } from '../model/bike-form-view-model';
import { BikeFormView } from './bike-form-view';

/** /bike-form adds a bike; /bike-form?id=<bikeId> edits one. */
export function BikeFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <BikeForm key={id ?? 'new'} bikeId={id || undefined} />;
}

function BikeForm({ bikeId }: { bikeId: string | undefined }) {
  const viewModel = useBikeFormViewModel(bikeId);
  return <BikeFormView {...viewModel} />;
}
