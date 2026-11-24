import { findSpecForBike } from '@/features/wiki/model/model-key';
import { getBike } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import { fetchServices } from '@/lib/firestore/services';
import type { Bike, ServiceRecord, WikiDoc, WikiSpec } from '@/lib/firestore/types';
import { fetchWikiDocs } from '@/lib/firestore/wiki';

export const CONTEXT_SERVICE_COUNT = 5;

export type MechanicContext = {
  bike: WithId<Bike> | null;
  services: WithId<ServiceRecord>[];
  spec: WikiSpec | null;
};

const EMPTY_CONTEXT: MechanicContext = { bike: null, services: [], spec: null };

function isSpec(doc: WikiDoc): doc is WikiSpec {
  return doc.kind === 'spec';
}

async function loadSpec(bike: Bike): Promise<WikiSpec | null> {
  try {
    const docs = await fetchWikiDocs();
    const specs = docs.filter((doc): doc is WithId<WikiSpec> => isSpec(doc));
    return findSpecForBike(specs, bike);
  } catch {
    return null;
  }
}

async function loadServices(uid: string, bikeId: string): Promise<WithId<ServiceRecord>[]> {
  try {
    return await fetchServices(uid, bikeId, CONTEXT_SERVICE_COUNT);
  } catch {
    return [];
  }
}

export async function buildMechanicContext(uid: string, bikeId: string | null): Promise<MechanicContext> {
  if (!bikeId) return EMPTY_CONTEXT;

  let bike: WithId<Bike> | null;
  try {
    bike = await getBike(uid, bikeId);
  } catch {
    return EMPTY_CONTEXT;
  }
  if (!bike) return EMPTY_CONTEXT;

  const [services, spec] = await Promise.all([loadServices(uid, bike.id), loadSpec(bike)]);
  return { bike, services, spec };
}
