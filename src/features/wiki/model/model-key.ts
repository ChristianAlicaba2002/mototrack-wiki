import type { Bike, WikiDoc, WikiModelRef, WikiSpec } from '@/lib/firestore/types';

type BikeIdentity = Pick<Bike, 'make' | 'model' | 'year'>;

function normalizePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeModelKey(make: string, model: string): string {
  return `${normalizePart(make)}:${normalizePart(model)}`;
}

export function refMatchesBike(ref: WikiModelRef, bike: BikeIdentity): boolean {
  const bikeKey = normalizeModelKey(bike.make, bike.model);
  if (!bikeKey.startsWith(ref.key)) return false;
  if (ref.yearFrom !== null && bike.year < ref.yearFrom) return false;
  if (ref.yearTo !== null && bike.year > ref.yearTo) return false;
  return true;
}

function matchLength(doc: WikiDoc, bike: BikeIdentity): number {
  return doc.models.reduce((best, ref) => (refMatchesBike(ref, bike) ? Math.max(best, ref.key.length) : best), 0);
}

export function isGeneralDoc(doc: WikiDoc): boolean {
  return doc.models.length === 0;
}

export function docAppliesToBike(doc: WikiDoc, bike: BikeIdentity): boolean {
  return isGeneralDoc(doc) || matchLength(doc, bike) > 0;
}

export function findSpecForBike<T extends WikiSpec>(specs: T[], bike: BikeIdentity): T | null {
  let best: T | null = null;
  let bestLength = 0;
  for (const spec of specs) {
    const length = matchLength(spec, bike);
    if (length > bestLength) {
      best = spec;
      bestLength = length;
    }
  }
  return best;
}
