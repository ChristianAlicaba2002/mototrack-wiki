import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CheckIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import { WIKI_CATEGORIES, type WikiCategory } from '@/lib/firestore/types';

import { WIKI_CATEGORY_LABELS } from '../model/categories';

const SCREEN_GUTTER = Spacing.three + 4;

type CategoryChipsProps = {
  selected: WikiCategory | null;
  onSelect: (category: WikiCategory | null) => void;
};

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.chipScroll}
      contentContainerStyle={styles.chips}
      accessibilityRole="tablist">
      <Chip label="All" selected={selected === null} onPress={() => onSelect(null)} />
      {WIKI_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={WIKI_CATEGORY_LABELS[category]}
          selected={selected === category}
          onPress={() => onSelect(selected === category ? null : category)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
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

export function MyBikeToggle({ bikeName, value, onToggle }: MyBikeToggleProps) {
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
  chipScroll: {
    flexGrow: 0,
    marginHorizontal: -SCREEN_GUTTER,
  },
  chips: {
    gap: Spacing.two,
    paddingHorizontal: SCREEN_GUTTER,
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
});
