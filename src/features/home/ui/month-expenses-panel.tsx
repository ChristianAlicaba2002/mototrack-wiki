import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/line-icons';
import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { openExpenseSummary } from '@/features/expenses/model/navigation';
import { ErrorMessage, PanelHeading } from '@/features/garage/ui/controls';
import { formatCost } from '@/features/services/model/format';
import { useTheme } from '@/hooks/use-theme';

import type { MonthExpenses } from '../model/month-expenses';

type MonthExpensesPanelProps = {
  expenses: MonthExpenses;
  loading: boolean;
  error: string | null;
};

/** This month's spending across all bikes, against last month. Opens the full summary. */
export function MonthExpensesPanel({ expenses, loading, error }: MonthExpensesPanelProps) {
  const theme = useTheme();

  if (loading) return <MonthExpensesPanelSkeleton />;

  const { thisMonth, lastMonth, topType, withoutCost } = expenses;
  const entries = thisMonth.count === 1 ? '1 entry' : `${thisMonth.count} entries`;
  const comparison = compareMonths(thisMonth.total, lastMonth.total, lastMonth.label);
  const details = [
    topType ? `Most on ${topType.label.toLowerCase()} · ${formatCost(topType.total)}` : null,
    withoutCost > 0 ? `${withoutCost} without a cost` : null,
  ].filter(Boolean);

  return (
    <View style={[styles.section, { borderTopColor: theme.line }]}>
      <PanelHeading title={`Spent in ${thisMonth.label}`} />

      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <Pressable
          onPress={() => openExpenseSummary()}
          accessibilityRole="button"
          accessibilityLabel={`${formatCost(thisMonth.total)} spent in ${thisMonth.label}, ${entries}. ${comparison}`}
          accessibilityHint="Opens the expense summary"
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, borderColor: theme.line },
            pressed && { backgroundColor: theme.backgroundSelected },
          ]}>
          <View style={styles.cardText}>
            <ThemedText style={styles.total} numberOfLines={1} adjustsFontSizeToFit>
              {formatCost(thisMonth.total)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {thisMonth.count === 0 ? 'Nothing logged this month yet' : `${entries} · ${comparison}`}
            </ThemedText>
            {details.length > 0 ? (
              <ThemedText type="readout" themeColor="textSecondary" numberOfLines={1}>
                {details.join(' · ')}
              </ThemedText>
            ) : null}
          </View>
          <ChevronRightIcon size={18} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

/** "₱400 more than October", "₱250 less than October", "same as October", "nothing in October". */
function compareMonths(current: number, previous: number, previousLabel: string): string {
  if (previous === 0) return current === 0 ? `nothing in ${previousLabel} either` : `nothing in ${previousLabel}`;
  const diff = current - previous;
  if (Math.round(diff * 100) === 0) return `same as ${previousLabel}`;
  return `${formatCost(Math.abs(diff))} ${diff > 0 ? 'more' : 'less'} than ${previousLabel}`;
}

export function MonthExpensesPanelSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="Loading this month’s spending"
      accessibilityState={{ busy: true }}
      style={[styles.section, { borderTopColor: theme.line }]}>
      <SkeletonText lineHeight={14} fontSize={11} width={120} />
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
        <View style={styles.cardText}>
          <SkeletonText lineHeight={40} fontSize={34} width="45%" />
          <SkeletonText lineHeight={20} fontSize={14} width="70%" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three - 4,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  cardText: {
    flex: 1,
    gap: Spacing.one,
  },
  total: {
    fontFamily: Fonts.monoMedium,
    fontSize: 34,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
});
