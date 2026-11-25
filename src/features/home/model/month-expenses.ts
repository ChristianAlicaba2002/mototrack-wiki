import { SERVICE_TYPE_LABELS } from '@/features/services/model/service-form';
import type { ServiceRecord, ServiceType } from '@/lib/firestore/types';

// Pure logic: this month's and last month's spending from a list of services.

export type MonthTotals = {
  /** e.g. "November". */
  label: string;
  total: number;
  /** Entries dated this month, including ones without a cost. */
  count: number;
};

export type MonthExpenses = {
  thisMonth: MonthTotals;
  lastMonth: MonthTotals;
  /** Where most of this month's money went, or null if nothing was spent. */
  topType: { type: ServiceType; label: string; total: number } | null;
  /** Entries this month with no cost entered. */
  withoutCost: number;
};

/** Midnight on the 1st of the month before `now`: where the Home query starts. */
export function startOfLastMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long' });
}

export function summarizeMonth(
  services: Pick<ServiceRecord, 'date' | 'cost' | 'type'>[],
  now: Date = new Date()
): MonthExpenses {
  const year = now.getFullYear();
  const month = now.getMonth();
  const last = new Date(year, month - 1, 1);

  const thisMonth: MonthTotals = { label: monthLabel(year, month), total: 0, count: 0 };
  const lastMonth: MonthTotals = { label: monthLabel(last.getFullYear(), last.getMonth()), total: 0, count: 0 };
  const perType = new Map<ServiceType, number>();
  let withoutCost = 0;

  for (const s of services) {
    const d = s.date.toDate();
    const cost = s.cost ?? 0;
    if (d.getFullYear() === year && d.getMonth() === month) {
      thisMonth.total += cost;
      thisMonth.count += 1;
      if (s.cost === null) withoutCost += 1;
      perType.set(s.type, (perType.get(s.type) ?? 0) + cost);
    } else if (d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth()) {
      lastMonth.total += cost;
      lastMonth.count += 1;
    }
  }

  let topType: MonthExpenses['topType'] = null;
  for (const [type, total] of perType) {
    if (total > 0 && (!topType || total > topType.total)) {
      topType = { type, label: SERVICE_TYPE_LABELS[type], total };
    }
  }

  return { thisMonth, lastMonth, topType, withoutCost };
}
