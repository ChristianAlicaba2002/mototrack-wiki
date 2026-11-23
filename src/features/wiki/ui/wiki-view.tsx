import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { TabScreen } from '@/components/screen/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing, type ThemeColor } from '@/constants/theme';
import { ErrorMessage, TextAction } from '@/features/garage/ui/controls';

import type { WikiViewModel } from '../model/wiki-view-model';
import { SearchField } from './search-field';
import { FilterButton, WikiFilterDrawer } from './wiki-filters';
import { GuideRow, MissingSpecNote, PinnedSpec, SpecRow, WikiList, WikiListSkeleton } from './wiki-rows';

export function WikiView({
  loading,
  skeletonPinned,
  error,
  isEmpty,
  hasDocs,
  query,
  setQuery,
  category,
  bikeName,
  bikeModel,
  filters,
  filtersApplied,
  filtersOpen,
  openFilters,
  closeFilters,
  applyFilters,
  hasFilters,
  pinnedSpec,
  specs,
  guides,
  missingSpec,
  openSpec,
  openGuide,
  clearFilters,
  refreshing,
  refresh,
}: WikiViewModel) {
  const noResults = !pinnedSpec && specs.length === 0 && guides.length === 0;

  return (
    <TabScreen onRefresh={refresh} refreshing={refreshing} keyboardShouldPersistTaps="handled">
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search specs, fluids, guides" />
        </View>
        <FilterButton active={filtersApplied} onPress={openFilters} />
      </View>

      {error && hasDocs ? <ErrorMessage>{error}</ErrorMessage> : null}

      {loading ? (
        <WikiListSkeleton pinned={skeletonPinned} />
      ) : error && !hasDocs ? (
        <EmptyState
          eyebrow="Couldn’t load"
          eyebrowColor="danger"
          title="The wiki didn’t load."
          message={error}
          action={<TextAction label="Try again" onPress={refresh} disabled={refreshing} />}
        />
      ) : isEmpty ? (
        <EmptyState
          eyebrow="Nothing here yet"
          title="The wiki is empty."
          message="Spec sheets and guides show up here once they are published. Pull down to check again."
        />
      ) : (
        <>
          {pinnedSpec ? <PinnedSpec spec={pinnedSpec} onPress={() => openSpec(pinnedSpec.id)} /> : null}
          {missingSpec && bikeModel ? <MissingSpecNote bikeModel={bikeModel} /> : null}

          {noResults && hasFilters ? (
            <EmptyState
              eyebrow="No matches"
              title={query.trim() ? `Nothing matches “${query.trim()}”.` : 'Nothing matches these filters.'}
              message="Try another word or a different category."
              action={<TextAction label="Clear filters" onPress={clearFilters} />}
            />
          ) : null}

          {specs.length > 0 ? (
            <WikiList title="Spec sheets" count={specs.length}>
              {specs.map((spec) => (
                <SpecRow key={spec.id} spec={spec} category={category} onPress={() => openSpec(spec.id)} />
              ))}
            </WikiList>
          ) : null}

          {guides.length > 0 ? (
            <WikiList title="Guides" count={guides.length}>
              {guides.map((guide) => (
                <GuideRow key={guide.id} guide={guide} onPress={() => openGuide(guide.id)} />
              ))}
            </WikiList>
          ) : null}
        </>
      )}

      <WikiFilterDrawer
        open={filtersOpen}
        onClosed={closeFilters}
        filters={filters}
        bikeName={bikeName}
        onApply={applyFilters}
      />
    </TabScreen>
  );
}

type EmptyStateProps = {
  eyebrow: string;
  eyebrowColor?: ThemeColor;
  title: string;
  message: string;
  action?: ReactNode;
};

function EmptyState({ eyebrow, eyebrowColor = 'textSecondary', title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <ThemedText type="eyebrow" themeColor={eyebrowColor} style={styles.emptyText}>
        {eyebrow}
      </ThemedText>
      <ThemedText style={[styles.emptyTitle, styles.emptyText]}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={[styles.emptyText, styles.emptyMessage]}>
        {message}
      </ThemedText>
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginRight: -Spacing.two,
  },
  searchField: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  emptyText: {
    textAlign: 'center',
  },
  emptyMessage: {
    maxWidth: 300,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  emptyAction: {
    marginTop: Spacing.two,
  },
});
