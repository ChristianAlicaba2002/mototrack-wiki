import type { Bike, WikiCategory, WikiDoc, WikiSpec } from '@/lib/firestore/types';

import { docInCategory } from './categories';
import { formatFluid, formatPsi, formatTorque, formatYears } from './format';
import { docAppliesToBike } from './model-key';

export type WikiFilters = {
  query: string;
  category: WikiCategory | null;
  bike: Pick<Bike, 'make' | 'model' | 'year'> | null;
};

export function queryTokens(query: string): string[] {
  return query
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9.:+-]+/)
    .filter(Boolean);
}

export function matchesQuery(doc: WikiDoc, tokens: string[]): boolean {
  return tokens.every((token) => doc.searchText.includes(token));
}

export function filterWikiDocs<T extends WikiDoc>(docs: T[], { query, category, bike }: WikiFilters): T[] {
  const tokens = queryTokens(query);
  return docs.filter(
    (doc) =>
      (category === null || docInCategory(doc, category)) &&
      (bike === null || docAppliesToBike(doc, bike)) &&
      matchesQuery(doc, tokens)
  );
}

export function specHighlight(spec: WikiSpec, category: WikiCategory | null): string {
  switch (category) {
    case 'fluids':
      return formatFluid(spec.fluids.engineOil);
    case 'tire_pressure':
      return `${spec.tirePressure.front.soloPsi} / ${formatPsi(spec.tirePressure.rear.soloPsi)}`;
    case 'torque': {
      const first = spec.torque[0];
      return first ? `${first.item} · ${formatTorque(first.nm)}` : `${spec.engineCc} cc`;
    }
    default:
      return `${spec.engineCc} cc · ${formatYears(spec.yearFrom, spec.yearTo)}`;
  }
}
