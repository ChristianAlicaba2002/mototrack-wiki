import { formatKm } from '@/features/garage/model/odometer';
import type { WithId } from '@/lib/firestore/collections';
import {
  SERVICE_INTERVAL_LIMITS,
  type ServiceIntervals,
  type ServiceRecord,
  type ServiceType,
} from '@/lib/firestore/types';

import { SERVICE_TYPE_ORDER } from './service-form';

/**
 * Km between services when the rider hasn't set their own. Rough figures for
 * the small scooters and commuters most riders have; the owner's manual (or the
 * bike's spec sheet in the wiki) is the real answer, which is why they're editable.
 * null = no mileage reminder: batteries wear out with age, and repairs or
 * one-off jobs don't repeat.
 */
export const DEFAULT_SERVICE_INTERVALS: ServiceIntervals = {
  oil_change: 3000,
  brakes: 10_000,
  chain: 1000,
  tires: 15_000,
  battery: null,
  inspection: 5000,
  repair: null,
  other: null,
};

/** The rider's intervals, falling back to the default for any type they never set. */
export function resolveIntervals(saved: Partial<ServiceIntervals> | null | undefined): ServiceIntervals {
  const intervals = { ...DEFAULT_SERVICE_INTERVALS };
  if (!saved) return intervals;
  for (const type of SERVICE_TYPE_ORDER) {
    const value = saved[type];
    if (value === null || isValidInterval(value)) intervals[type] = value;
  }
  return intervals;
}

export function isValidInterval(km: unknown): km is number {
  return (
    typeof km === 'number' &&
    Number.isInteger(km) &&
    km >= SERVICE_INTERVAL_LIMITS.minKm &&
    km <= SERVICE_INTERVAL_LIMITS.maxKm
  );
}

/** Odometer reading when this type of service is due again, or null if the type has no interval. */
export function computeNextDueKm(type: ServiceType, odometerKm: number, intervals: ServiceIntervals): number | null {
  const interval = intervals[type];
  return interval === null ? null : odometerKm + interval;
}

/**
 * The service's next-due reading: the one saved with it, or, for services
 * logged before intervals existed, worked out from the current intervals.
 */
export function nextDueKmOf(service: ServiceRecord, intervals: ServiceIntervals): number | null {
  return service.nextDueKm ?? computeNextDueKm(service.type, service.odometerKm, intervals);
}

export type DueStatus = 'ok' | 'soon' | 'overdue';

/** Due "soon" within this share of the interval, or this many km, whichever is larger. */
const SOON_SHARE = 0.1;
const SOON_MIN_KM = 300;

export function dueStatus(remainingKm: number, intervalKm: number | null): DueStatus {
  if (remainingKm <= 0) return 'overdue';
  const soonKm = Math.max(SOON_MIN_KM, Math.round((intervalKm ?? 0) * SOON_SHARE));
  return remainingKm <= soonKm ? 'soon' : 'ok';
}

/** "in 1,200 km", "due now", "overdue by 300 km". */
export function formatRemaining(remainingKm: number): string {
  if (remainingKm > 0) return `in ${formatKm(remainingKm)} km`;
  if (remainingKm === 0) return 'due now';
  return `overdue by ${formatKm(-remainingKm)} km`;
}

export type UpcomingService = {
  type: ServiceType;
  /** The most recent service of this type. */
  last: WithId<ServiceRecord>;
  nextDueKm: number;
  /** Km left before it's due; negative when overdue. */
  remainingKm: number;
  status: DueStatus;
};

/**
 * What's due next on a bike: for each service type, the most recent service of
 * that type and when it's due again, soonest first. Types with no interval, or
 * never logged, are left out. `services` must be newest first, as the log query
 * returns them.
 */
export function upcomingServices(
  services: WithId<ServiceRecord>[],
  bikeOdometerKm: number,
  intervals: ServiceIntervals
): UpcomingService[] {
  const seen = new Set<ServiceType>();
  const upcoming: UpcomingService[] = [];
  for (const service of services) {
    if (seen.has(service.type)) continue;
    seen.add(service.type);
    const nextDueKm = nextDueKmOf(service, intervals);
    if (nextDueKm === null) continue;
    const remainingKm = nextDueKm - bikeOdometerKm;
    upcoming.push({
      type: service.type,
      last: service,
      nextDueKm,
      remainingKm,
      status: dueStatus(remainingKm, intervals[service.type]),
    });
  }
  return upcoming.sort((a, b) => a.remainingKm - b.remainingKm);
}

/**
 * Where one service stands: 'superseded' once the same type was done again
 * later, otherwise its status against the bike's odometer.
 */
export function serviceDueState(
  service: WithId<ServiceRecord>,
  services: WithId<ServiceRecord>[],
  bikeOdometerKm: number,
  intervals: ServiceIntervals
):
  | { kind: 'none' }
  | { kind: 'superseded'; nextDueKm: number; by: WithId<ServiceRecord> }
  | { kind: 'due'; nextDueKm: number; remainingKm: number; status: DueStatus } {
  const nextDueKm = nextDueKmOf(service, intervals);
  if (nextDueKm === null) return { kind: 'none' };
  // Newest first, so the first match of this type is the latest one.
  const latest = services.find((s) => s.type === service.type);
  if (latest && latest.id !== service.id) return { kind: 'superseded', nextDueKm, by: latest };
  const remainingKm = nextDueKm - bikeOdometerKm;
  return { kind: 'due', nextDueKm, remainingKm, status: dueStatus(remainingKm, intervals[service.type]) };
}
