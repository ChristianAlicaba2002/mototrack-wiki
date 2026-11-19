import { useLocalSearchParams } from 'expo-router';

import { useServiceLogViewModel } from '../model/service-log-view-model';
import { ServiceLogView } from './service-log-view';

/** /services?bikeId=<bikeId>: one bike's maintenance history. */
export function ServiceLogScreen() {
  const { bikeId } = useLocalSearchParams<{ bikeId?: string }>();
  // Keyed so switching bikes starts from a clean state.
  return <ServiceLog key={bikeId ?? ''} bikeId={bikeId ?? ''} />;
}

function ServiceLog({ bikeId }: { bikeId: string }) {
  const viewModel = useServiceLogViewModel(bikeId);
  return <ServiceLogView {...viewModel} />;
}
