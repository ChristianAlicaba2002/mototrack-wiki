import { useLocalSearchParams } from 'expo-router';

import { useServiceFormViewModel } from '../model/service-form-view-model';
import { ServiceFormView } from './service-form-view';

/** /service-form?bikeId=<bikeId> logs a service; add &id=<serviceId> to edit one. */
export function ServiceFormScreen() {
  const { bikeId, id } = useLocalSearchParams<{ bikeId?: string; id?: string }>();
  return <ServiceForm key={`${bikeId ?? ''}/${id ?? 'new'}`} bikeId={bikeId ?? ''} serviceId={id || undefined} />;
}

function ServiceForm({ bikeId, serviceId }: { bikeId: string; serviceId: string | undefined }) {
  const viewModel = useServiceFormViewModel(bikeId, serviceId);
  return <ServiceFormView {...viewModel} />;
}
