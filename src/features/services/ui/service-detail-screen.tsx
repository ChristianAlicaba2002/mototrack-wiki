import { useLocalSearchParams } from 'expo-router';

import { useServiceDetailViewModel } from '../model/service-detail-view-model';
import { ServiceDetailView } from './service-detail-view';

export function ServiceDetailScreen() {
  const { bikeId, id } = useLocalSearchParams<{ bikeId?: string; id?: string }>();
  return <ServiceDetail key={`${bikeId ?? ''}/${id ?? ''}`} bikeId={bikeId ?? ''} serviceId={id ?? ''} />;
}

function ServiceDetail({ bikeId, serviceId }: { bikeId: string; serviceId: string }) {
  const viewModel = useServiceDetailViewModel(bikeId, serviceId);
  return <ServiceDetailView {...viewModel} />;
}
