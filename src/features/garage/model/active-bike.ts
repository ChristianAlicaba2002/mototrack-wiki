import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

/**
 * The bike the app is focused on: the stored choice if it still exists,
 * otherwise the first (oldest) bike, or null for an empty garage.
 */
export function resolveActiveBike(
  bikes: WithId<Bike>[],
  activeBikeId: string | null | undefined
): WithId<Bike> | null {
  return bikes.find((b) => b.id === activeBikeId) ?? bikes[0] ?? null;
}

export function bikeDisplayName(bike: Pick<Bike, 'nickname' | 'make' | 'model'>): string {
  return bike.nickname ?? `${bike.make} ${bike.model}`;
}
