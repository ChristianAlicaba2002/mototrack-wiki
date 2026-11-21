import { useLocalSearchParams } from 'expo-router';

import { useExpenseSummaryViewModel } from '../model/expense-summary-view-model';
import { ExpenseSummaryView } from './expense-summary-view';

/** /expenses[?bikeId=<bikeId>]: what's been spent, per bike, per service type and per month. */
export function ExpenseSummaryScreen() {
  const { bikeId } = useLocalSearchParams<{ bikeId?: string }>();
  // Keyed so opening it for another bike starts from that bike's filter.
  return <ExpenseSummary key={bikeId ?? ''} bikeId={bikeId ?? null} />;
}

function ExpenseSummary({ bikeId }: { bikeId: string | null }) {
  const viewModel = useExpenseSummaryViewModel(bikeId);
  return <ExpenseSummaryView {...viewModel} />;
}
