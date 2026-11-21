import { router } from 'expo-router';

/** Spending summary across all bikes, or focused on one. */
export function openExpenseSummary(bikeId?: string) {
  router.push(bikeId ? { pathname: '/expenses', params: { bikeId } } : '/expenses');
}

/** Back to where the user came from, or the garage if the screen was opened directly. */
export function closeExpenseSummary() {
  if (router.canGoBack()) router.back();
  else router.replace('/garage');
}
