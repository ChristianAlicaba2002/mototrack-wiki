import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabScreenProps = {
  summary?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function TabScreen({ summary, action, children }: TabScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {summary || action ? (
          <View style={styles.intro}>
            {summary ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.summary}>
                {summary}
              </ThemedText>
            ) : (
              <View style={styles.summary} />
            )}
            {action}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type PlaceholderCardProps = {
  title: string;
  description: string;
};

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
    paddingTop: Spacing.three + 4,
    paddingBottom: BottomTabInset + Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  summary: {
    flex: 1,
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
