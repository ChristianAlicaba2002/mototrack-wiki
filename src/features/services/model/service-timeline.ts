import type { WithId } from '@/lib/firestore/collections';
import type { ServiceRecord } from '@/lib/firestore/types';

export type TimelineEntry = {
  service: WithId<ServiceRecord>;
  /**
   * Km ridden between the previous (older) service and this one.
   * Null for the oldest entry, or when the readings go backwards (e.g. a typo).
   */
  kmSincePrevious: number | null;
};

export type TimelineYear = {
  year: number;
  entries: TimelineEntry[];
  /** Sum of the costs entered that year. */
  totalCost: number;
};

/**
 * Groups a bike's services (most recent first, as the log query returns them)
 * into years, newest year first, and works out the km between entries.
 */
export function buildTimeline(services: WithId<ServiceRecord>[]): TimelineYear[] {
  const years: TimelineYear[] = [];

  services.forEach((service, i) => {
    const older = services[i + 1];
    const gap = older ? service.odometerKm - older.odometerKm : null;
    const entry: TimelineEntry = { service, kmSincePrevious: gap !== null && gap > 0 ? gap : null };

    const year = service.date.toDate().getFullYear();
    const last = years[years.length - 1];
    if (last && last.year === year) last.entries.push(entry);
    else years.push({ year, entries: [entry], totalCost: 0 });
  });

  for (const group of years) group.totalCost = group.entries.reduce((sum, e) => sum + (e.service.cost ?? 0), 0);
  return years;
}
