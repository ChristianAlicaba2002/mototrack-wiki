import { useEffect, useSyncExternalStore } from 'react';

import { toGarageErrorMessage } from '@/features/garage/model/errors';
import type { WithId } from '@/lib/firestore/collections';
import type { WikiDoc } from '@/lib/firestore/types';
import { fetchWikiDocs } from '@/lib/firestore/wiki';

type WikiStore = {
  docs: WithId<WikiDoc>[] | null;
  error: string | null;
};

let store: WikiStore = { docs: null, error: null };
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();

function update(next: Partial<WikiStore>) {
  store = { ...store, ...next };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load() {
  if (pending) return pending;
  if (store.error) update({ error: null });
  pending = fetchWikiDocs()
    .then(
      (docs) => update({ docs, error: null }),
      (e) => update({ error: toGarageErrorMessage(e) })
    )
    .finally(() => {
      pending = null;
    });
  return pending;
}

async function refresh() {
  const docs = await fetchWikiDocs({ fromServer: true });
  update({ docs, error: null });
}

export function useWikiDocs() {
  const { docs, error } = useSyncExternalStore(subscribe, () => store);

  useEffect(() => {
    if (store.docs === null) load();
  }, []);

  return {
    docs: docs ?? [],
    loading: docs === null && error === null,
    error,
    refresh,
  };
}
