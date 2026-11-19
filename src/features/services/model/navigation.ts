import { router } from 'expo-router';

/** The service log of one bike. */
export function openServiceLog(bikeId: string) {
  router.push({ pathname: '/services', params: { bikeId } });
}

/** Log a new service (no serviceId) or edit one. */
export function openServiceForm(bikeId: string, serviceId?: string) {
  router.push({ pathname: '/service-form', params: serviceId ? { bikeId, id: serviceId } : { bikeId } });
}

/** Back to where the user came from, or the garage if the screen was opened directly. */
export function closeServiceScreen() {
  if (router.canGoBack()) router.back();
  else router.replace('/garage');
}
