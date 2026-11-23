import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomDrawer, useCloseDrawer } from '@/components/bottom-drawer';
import { CheckIcon, FilterIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import { WIKI_CATEGORIES, type WikiCategory } from '@/lib/firestore/types';

import { WIKI_CATEGORY_LABELS } from '../model/categories';
import type { WikiFilters } from '../model/wiki-view-model';

type FilterButtonProps = {
  active: boolean;
  onPress: () => void;
};

export function FilterButton({ active, onPress }: FilterButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Filters, some applied' : 'Filters'}
      style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
      <FilterIcon size={22} color={theme.text} />
      {active ? <View style={[styles.filterDot, { backgroundColor: theme.accent }]} /> : null}
    </Pressable>
  );
}

type WikiFilterDrawerProps = {
  open: boolean;
  onClosed: () => void;
  filters: WikiFilters;
  bikeName: string | null;
  onApply: (filters: WikiFilters) => void;
};

export function WikiFilterDrawer({ open, onClosed, filters, bikeName, onApply }: WikiFilterDrawerProps) {
  return (
    <BottomDrawer open={open} onClosed={onClosed}>
      <FilterSheet initial={filters} bikeName={bikeName} onApply={onApply} />
    </BottomDrawer>
  );
}

type FilterSheetProps = {
  initial: WikiFilters;
  bikeName: string | null;
  onApply: (filters: WikiFilters) => void;
};

function FilterSheet({ initial, bikeName, onApply }: FilterSheetProps) {
  const close = useCloseDrawer();
  const [draft, setDraft] = useState<WikiFilters>(initial);

  return (
    <View style={styles.sheet}>
      <ThemedText style={styles.title} accessibilityRole="header">
        Filters
      </ThemedText>

      <View style={styles.group}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Category
        </ThemedText>
        <CategoryChips
          selected={draft.category}
          onSelect={(category) => setDraft((d) => ({ ...d, category }))}
        />
      </View>

      {bikeName ? (
        <MyBikeToggle
          bikeName={bikeName}
          value={draft.myBikeOnly}
          onToggle={() => setDraft((d) => ({ ...d, myBikeOnly: !d.myBikeOnly }))}
        />
      ) : null}

      <View style={styles.actions}>
        <Button label="Apply filter" onPress={() => close(() => onApply(draft))} />
        <Button
          label="Clear filter"
          variant="secondary"
          onPress={() => close(() => onApply({ category: null, myBikeOnly: false }))}
        />
      </View>
    </View>
  );
}

type CategoryChipsProps = {
  selected: WikiCategory | null;
  onSelect: (category: WikiCategory | null) => void;
};

function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <View style={styles.chips} accessibilityRole="radiogroup">
      <Chip label="All" selected={selected === null} onPress={() => onSelect(null)} />
      {WIKI_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={WIKI_CATEGORY_LABELS[category]}
          selected={selected === category}
          onPress={() => onSelect(selected === category ? null : category)}
        />
      ))}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.text, borderColor: theme.text }
          : { backgroundColor: 'transparent', borderColor: theme.line },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.background : theme.text }} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type MyBikeToggleProps = {
  bikeName: string;
  value: boolean;
  onToggle: () => void;
};

function MyBikeToggle({ bikeName, value, onToggle }: MyBikeToggleProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`Only show what fits my ${bikeName}`}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
      <View
        style={[
          styles.box,
          value
            ? { backgroundColor: theme.text, borderColor: theme.text }
            : { backgroundColor: 'transparent', borderColor: theme.textSecondary },
        ]}>
        {value ? <CheckIcon size={14} color={theme.background} /> : null}
      </View>
      <ThemedText type="small" style={styles.toggleLabel} numberOfLines={1}>
        Only what fits my <ThemedText type="smallBold">{bikeName}</ThemedText>
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheet: {
    gap: Spacing.four,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  group: {
    gap: Spacing.two + 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    flexShrink: 1,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
