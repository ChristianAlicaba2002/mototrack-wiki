import { useServiceIntervalsViewModel } from '../model/service-intervals-view-model';
import { ServiceIntervalsView } from './service-intervals-view';

/** /service-intervals: the km between services of each type. */
export function ServiceIntervalsScreen() {
  const viewModel = useServiceIntervalsViewModel();
  return <ServiceIntervalsView {...viewModel} />;
}
