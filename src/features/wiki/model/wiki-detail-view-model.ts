import type { WithId } from '@/lib/firestore/collections';
import type { WikiDoc } from '@/lib/firestore/types';

import { closeWikiScreen } from './navigation';
import { useWikiDocs } from './use-wiki-docs';

export type WikiDetailLoadState = 'loading' | 'ready' | 'notFound' | 'error';

export function useWikiDetailViewModel<K extends WikiDoc['kind']>(id: string, kind: K) {
  const { docs, loading, error } = useWikiDocs();
  const doc = docs.find((d): d is WithId<Extract<WikiDoc, { kind: K }>> => d.id === id && d.kind === kind) ?? null;

  const loadState: WikiDetailLoadState = loading ? 'loading' : doc ? 'ready' : error ? 'error' : 'notFound';

  return {
    loadState,
    doc,
    error,
    back: closeWikiScreen,
  };
}
