import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabScreenProps = {
  title: string;
  subtitle?: string;
  /** Small stamped line above the title, e.g. today's date. */
  kicker?: string;
  /** Shown to the right of the title, e.g. an "Add" button. */
  headerAction?: ReactNode;
  children?: ReactNode;
};

/** Shared layout for top-level tab screens: safe-area aware, scrollable, with a ruled title header. */
export function TabScreen({ title, subtitle, kicker, headerAction, children }: TabScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.headerRow, { borderBottomColor: theme.text }]}>
          <View style={styles.header}>
            {kicker ? (
              <ThemedText type="eyebrow" themeColor="textSecondary">
                {kicker}
              </ThemedText>
            ) : null}
            <ThemedText type="subtitle" accessibilityRole="header">
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {headerAction}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type PlaceholderCardProps = {
  title: string;
  description: string;
};

/** Marks a feature that hasn't been built yet: a dashed outline, not a fake card. */
export function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.line }]}>
      <View style={styles.cardTitleRow}>
        <ThemedText type="smallBold" style={styles.cardTitle}>
          {title}
        </ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Soon
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.two,
    borderBottomWidth: 2,
  },
  header: {
    flex: 1,
    gap: Spacing.one,
  },
  card: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: {
    flexShrink: 1,
  },
});
