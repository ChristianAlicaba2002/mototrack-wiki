import { getDocs, getDocsFromServer, type QuerySnapshot } from 'firebase/firestore';

import { wikiCollection, type WithId, withIds } from './collections';
import type { WikiDoc } from './types';

function toWikiDocs(snapshot: QuerySnapshot<WikiDoc>): WithId<WikiDoc>[] {
  return withIds(snapshot)
    .filter((d) => d.kind === 'spec' || d.kind === 'guide')
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function fetchWikiDocs({ fromServer = false } = {}): Promise<WithId<WikiDoc>[]> {
  const collection = wikiCollection();
  return toWikiDocs(await (fromServer ? getDocsFromServer(collection) : getDocs(collection)));
}
