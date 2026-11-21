import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from '@/features/services/model/service-form';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike, ServiceRecord, ServiceType } from '@/lib/firestore/types';

// Pure logic: services in, spending totals out. No React, no Firestore.

/** How many calendar months the monthly breakdown covers, counting the current one. */
export const MONTHS_SHOWN = 12;

export type ExpenseLine = {
  key: string;
  label: string;
  total: number;
  /** Entries in this group, including ones without a cost. */
  count: number;
  /** Share of the overall total, 0–1. 0 when nothing was spent. */
  share: number;
};

export type MonthLine = ExpenseLine & { year: number; month: number };

export type ExpenseSummary = {
  total: number;
  count: number;
  /** Entries with no cost entered; they count as entries but add nothing. */
  withoutCost: number;
  byBike: ExpenseLine[];
  byType: ExpenseLine[];
  /** The last MONTHS_SHOWN months, newest first, including months with nothing spent. */
  byMonth: MonthLine[];
  /** Spent before the months in byMonth, so the total still adds up. */
  olderTotal: number;
};

type Acc = { total: number; count: number };

function add(map: Map<string, Acc>, key: string, cost: number) {
  const acc = map.get(key) ?? { total: 0, count: 0 };
  acc.total += cost;
  acc.count += 1;
  map.set(key, acc);
}

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

/** A month as one number, so months compare and subtract easily. */
const monthIndex = (year: number, month: number) => year * 12 + month;

/**
 * Totals per bike, per service type and per month.
 * Pass bikeId to limit everything to one bike; null means all bikes.
 */
export function summarizeExpenses(
  services: WithId<ServiceRecord>[],
  bikes: WithId<Bike>[],
  bikeId: string | null,
  now: Date = new Date()
): ExpenseSummary {
  const scoped = bikeId ? services.filter((s) => s.bikeId === bikeId) : services;

  const perBike = new Map<string, Acc>();
  const perType = new Map<string, Acc>();
  const perMonth = new Map<number, Acc>();
  let total = 0;
  let withoutCost = 0;

  for (const s of scoped) {
    const cost = s.cost ?? 0;
    if (s.cost === null) withoutCost += 1;
    total += cost;
    add(perBike, s.bikeId, cost);
    add(perType, s.type, cost);
    const d = s.date.toDate();
    const m = monthIndex(d.getFullYear(), d.getMonth());
    const acc = perMonth.get(m) ?? { total: 0, count: 0 };
    acc.total += cost;
    acc.count += 1;
    perMonth.set(m, acc);
  }

  const names = new Map(bikes.map((b) => [b.id, bikeDisplayName(b)]));
  const byBike = [...perBike.entries()]
    .map(([key, acc]) => ({
      key,
      label: names.get(key) ?? 'Removed motorcycle',
      ...acc,
      share: share(acc.total, total),
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  const typeRank = (t: string) => SERVICE_TYPE_ORDER.indexOf(t as ServiceType);
  const byType = [...perType.entries()]
    .map(([key, acc]) => ({
      key,
      label: SERVICE_TYPE_LABELS[key as ServiceType] ?? key,
      ...acc,
      share: share(acc.total, total),
    }))
    .sort((a, b) => b.total - a.total || typeRank(a.key) - typeRank(b.key));

  const current = monthIndex(now.getFullYear(), now.getMonth());
  const byMonth: MonthLine[] = [];
  for (let i = 0; i < MONTHS_SHOWN; i++) {
    const m = current - i;
    const year = Math.floor(m / 12);
    const month = m % 12;
    const acc = perMonth.get(m) ?? { total: 0, count: 0 };
    byMonth.push({
      key: `${year}-${month}`,
      label: new Date(year, month, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      year,
      month,
      ...acc,
      share: share(acc.total, total),
    });
  }
  const shownTotal = byMonth.reduce((sum, m) => sum + m.total, 0);
  // Entries dated in the future (after this month) also land here rather than vanish.
  const olderTotal = total - shownTotal;

  return { total, count: scoped.length, withoutCost, byBike, byType, byMonth, olderTotal };
}
