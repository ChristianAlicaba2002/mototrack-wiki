import { Fragment } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { ErrorMessage, IconButton, Radius, Rule, ScreenHeader, Section } from '@/features/garage/ui/controls';
import { formatCost } from '@/features/services/model/format';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { type ExpenseLine, MONTHS_SHOWN, type MonthLine } from '../model/expense-summary';
import { EXPENSE_SERVICE_LIMIT, type ExpenseSummaryViewModel } from '../model/expense-summary-view-model';

const CONTENT_MAX_WIDTH = 560;
const BAR_HEIGHT = 3;
const CHART_HEIGHT = 112;

export function ExpenseSummaryView({
  loading,
  error,
  bikes,
  selectedBikeId,
  selectBike,
  summary,
  isTruncated,
  back,
}: ExpenseSummaryViewModel) {
  const theme = useTheme();
  const selectedBike = bikes.find((b) => b.id === selectedBikeId);
  const thisMonth = summary.byMonth[0];
  const oldestShown = summary.byMonth[summary.byMonth.length - 1];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Expenses"
          context={loading ? undefined : selectedBike ? bikeDisplayName(selectedBike) : 'All motorcycles'}
          leading={
            <IconButton
              accessibilityLabel="Back"
              variant="plain"
              onPress={back}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            {bikes.length > 1 && <BikeFilter bikes={bikes} selectedId={selectedBikeId} onSelect={selectBike} />}

            {summary.count === 0 ? (
              !error && <EmptySummary filtered={selectedBike !== undefined} />
            ) : (
              <>
                <Total total={summary.total} count={summary.count} thisMonth={thisMonth.total} />

                <Section title={`Last ${MONTHS_SHOWN} months`} plain>
                  <MonthChart months={summary.byMonth} />
                  {summary.olderTotal > 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatCost(summary.olderTotal)} more was spent outside these months (before{' '}
                      {oldestShown.label}).
                    </ThemedText>
                  ) : null}
                </Section>

                {selectedBikeId === null && bikes.length > 1 && (
                  <Section title="By motorcycle" plain>
                    <Breakdown lines={summary.byBike} />
                  </Section>
                )}

                <Section title="By service type" plain>
                  <Breakdown lines={summary.byType} />
                </Section>

                <Notes withoutCost={summary.withoutCost} isTruncated={isTruncated} />
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

type BikeFilterProps = {
  bikes: WithId<Bike>[];
  selectedId: string | null;
  onSelect: (bikeId: string | null) => void;
};

function BikeFilter({ bikes, selectedId, onSelect }: BikeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filter}
      accessibilityRole="tablist">
      <Chip label="All bikes" selected={selectedId === null} onPress={() => onSelect(null)} />
      {bikes.map((bike) => (
        <Chip
          key={bike.id}
          label={bikeDisplayName(bike)}
          selected={selectedId === bike.id}
          onPress={() => onSelect(bike.id)}
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

function Total({ total, count, thisMonth }: { total: number; count: number; thisMonth: number }) {
  const entries = `${count} ${count === 1 ? 'entry' : 'entries'}`;
  const month = `${formatCost(thisMonth)} this month`;
  return (
    <View style={styles.total} accessible accessibilityLabel={`Total spent: ${formatCost(total)}, ${entries}, ${month}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Total spent
      </ThemedText>
      <ThemedText style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
        {formatCost(total)}
      </ThemedText>
      <ThemedText type="readout" themeColor="textSecondary">
        {entries} · {month}
      </ThemedText>
    </View>
  );
}

function monthShort(line: MonthLine): string {
  return new Date(line.year, line.month, 1).toLocaleDateString(undefined, { month: 'short' });
}

function MonthChart({ months }: { months: MonthLine[] }) {
  const theme = useTheme();
  const ordered = [...months].reverse();
  const max = ordered.reduce((m, l) => Math.max(m, l.total), 0);
  const shownTotal = ordered.reduce((sum, l) => sum + l.total, 0);
  const average = shownTotal / ordered.length;
  const highest = ordered.reduce<MonthLine | null>((best, l) => (l.total > (best?.total ?? 0) ? l : best), null);
  const current = months[0];

  return (
    <View style={styles.chartBlock}>
      <View
        accessible
        accessibilityLabel={months
          .map((l) => `${l.label}: ${l.total > 0 ? formatCost(l.total) : 'nothing spent'}`)
          .join(', ')}>
        <View style={[styles.chart, { borderBottomColor: theme.line }]}>
          {ordered.map((line) => {
            const height = max > 0 ? (line.total / max) * CHART_HEIGHT : 0;
            const isCurrent = line.key === current.key;
            return (
              <View key={line.key} style={styles.column}>
                {line.total > 0 ? (
                  <View
                    style={[
                      styles.columnBar,
                      { height: Math.max(height, 2), backgroundColor: isCurrent ? theme.brand : theme.accent },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={styles.chartLabels}>
          {ordered.map((line) => (
            <ThemedText
              key={line.key}
              type="readout"
              themeColor={line.key === current.key ? 'text' : 'textSecondary'}
              style={styles.chartLabel}
              numberOfLines={1}>
              {monthShort(line)}
            </ThemedText>
          ))}
        </View>
      </View>

      <View style={styles.chartStats}>
        <ChartStat label="Monthly average" value={formatCost(average)} />
        <ChartStat
          label={highest ? `Highest · ${highest.label}` : 'Highest'}
          value={highest ? formatCost(highest.total) : '—'}
        />
      </View>
    </View>
  );
}

function ChartStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chartStat} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText type="readout" style={styles.chartStatValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

function Breakdown({ lines }: { lines: ExpenseLine[] }) {
  const max = lines.reduce((m, l) => Math.max(m, l.total), 0);
  return (
    <View>
      {lines.map((line, i) => (
        <Fragment key={line.key}>
          {i > 0 ? <Rule /> : null}
          <BreakdownRow line={line} max={max} />
        </Fragment>
      ))}
    </View>
  );
}

function BreakdownRow({ line, max }: { line: ExpenseLine; max: number }) {
  const theme = useTheme();
  const percent = Math.round(line.share * 100);
  const entries = `${line.count} ${line.count === 1 ? 'entry' : 'entries'}`;
  const width = max > 0 ? `${(line.total / max) * 100}%` : '0%';

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${line.label}: ${formatCost(line.total)}, ${percent} percent, ${entries}`}>
      <View style={styles.rowTop}>
        <ThemedText type="smallBold" style={styles.rowLabel} numberOfLines={1}>
          {line.label}
        </ThemedText>
        <ThemedText type="readout" style={styles.rowAmount}>
          {formatCost(line.total)}
        </ThemedText>
      </View>
      <View style={styles.rowBottom}>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.bar, { width: width as `${number}%`, backgroundColor: theme.accent }]} />
        </View>
        <ThemedText type="readout" themeColor="textSecondary" style={styles.rowMeta}>
          {entries}
          {line.total > 0 ? ` · ${percent}%` : ''}
        </ThemedText>
      </View>
    </View>
  );
}

function Notes({ withoutCost, isTruncated }: { withoutCost: number; isTruncated: boolean }) {
  if (withoutCost === 0 && !isTruncated) return null;
  return (
    <View style={styles.notes}>
      {withoutCost > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {withoutCost === 1 ? '1 entry has' : `${withoutCost} entries have`} no cost entered and adds nothing to
          the totals.
        </ThemedText>
      )}
      {isTruncated && (
        <ThemedText type="small" themeColor="textSecondary">
          Only the latest {EXPENSE_SERVICE_LIMIT} entries are counted.
        </ThemedText>
      )}
    </View>
  );
}

function EmptySummary({ filtered }: { filtered: boolean }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Total spent
      </ThemedText>
      <ThemedText style={styles.totalValue}>{formatCost(0)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {filtered
          ? 'No services are logged for this motorcycle. Add one from its service log, with what it cost.'
          : 'Log a service with its cost and the totals show up here, by month, by bike and by type.'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    marginTop: Spacing.five,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  filter: {
    gap: Spacing.two,
  },
  chip: {
    maxWidth: 220,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
  total: {
    gap: Spacing.one,
  },
  totalValue: {
    fontFamily: Fonts.display,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.6,
  },
  chartBlock: {
    gap: Spacing.three + 4,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one,
    height: CHART_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  column: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  columnBar: {
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  chartLabel: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  chartStats: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  chartStat: {
    flex: 1,
    gap: Spacing.one,
  },
  chartStatValue: {
    fontFamily: Fonts.monoMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.three - 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLabel: {
    flex: 1,
  },
  rowAmount: {
    fontFamily: Fonts.monoMedium,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  track: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  notes: {
    gap: Spacing.one,
  },
  empty: {
    gap: Spacing.two,
  },
});
