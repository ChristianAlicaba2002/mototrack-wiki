import { useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import type { WithId } from '@/lib/firestore/collections';
import type { WikiCategory, WikiGuide, WikiSpec } from '@/lib/firestore/types';

import { docInCategory } from './categories';
import { findSpecForBike } from './model-key';
import { openWikiGuide, openWikiSpec } from './navigation';
import { useWikiDocs } from './use-wiki-docs';
import { filterWikiDocs } from './wiki-search';

const MIN_REFRESH_MS = 600;

export type WikiFilters = {
  category: WikiCategory | null;
  myBikeOnly: boolean;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useWikiViewModel() {
  const wiki = useWikiDocs();
  const garage = useGarageData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<WikiCategory | null>(null);
  const [myBikeOnly, setMyBikeOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const activeBike = garage.activeBike;

  const result = useMemo(() => {
    const allSpecs = wiki.docs.filter((d): d is WithId<WikiSpec> => d.kind === 'spec');
    const bikeSpec = activeBike ? findSpecForBike(allSpecs, activeBike) : null;
    const searching = query.trim().length > 0;
    const pinned =
      bikeSpec && !searching && (category === null || docInCategory(bikeSpec, category)) ? bikeSpec : null;
    const filtered = filterWikiDocs(wiki.docs, {
      query,
      category,
      bike: myBikeOnly && activeBike ? activeBike : null,
    }).filter((d) => d.id !== pinned?.id);

    return {
      pinnedSpec: pinned,
      specs: filtered.filter((d): d is WithId<WikiSpec> => d.kind === 'spec'),
      guides: filtered.filter((d): d is WithId<WikiGuide> => d.kind === 'guide'),
      missingSpec: Boolean(activeBike) && !bikeSpec && !searching && category === null,
    };
  }, [wiki.docs, activeBike, query, category, myBikeOnly]);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([wiki.refresh(), garage.refresh(), wait(MIN_REFRESH_MS)]);
      setRefreshError(null);
    } catch (e) {
      setRefreshError(toGarageErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }

  function applyFilters(next: WikiFilters) {
    setCategory(next.category);
    setMyBikeOnly(next.myBikeOnly);
  }

  function openFilters() {
    Keyboard.dismiss();
    setFiltersOpen(true);
  }

  function clearFilters() {
    setQuery('');
    setCategory(null);
    setMyBikeOnly(false);
  }

  return {
    loading: wiki.loading || garage.loading,
    skeletonPinned: (garage.loading || activeBike !== null) && query.trim().length === 0,
    error: refreshError ?? wiki.error,
    isEmpty: !wiki.loading && !wiki.error && wiki.docs.length === 0,
    hasDocs: wiki.docs.length > 0,
    query,
    setQuery,
    category,
    bikeName: activeBike ? bikeDisplayName(activeBike) : null,
    bikeModel: activeBike ? `${activeBike.make} ${activeBike.model}` : null,
    filters: { category, myBikeOnly: myBikeOnly && activeBike !== null },
    filtersApplied: category !== null || (myBikeOnly && activeBike !== null),
    filtersOpen,
    openFilters,
    closeFilters: () => setFiltersOpen(false),
    applyFilters,
    hasFilters: query.trim().length > 0 || category !== null || (myBikeOnly && activeBike !== null),
    ...result,
    openSpec: openWikiSpec,
    openGuide: openWikiGuide,
    clearFilters,
    refreshing,
    refresh,
  };
}

export type WikiViewModel = ReturnType<typeof useWikiViewModel>;
