import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { ErrorMessage, IconButton, Panel, PanelHeading, Radius, ScreenHeader } from '@/features/garage/ui/controls';
import { formatCost } from '@/features/services/model/format';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { type ExpenseLine, MONTHS_SHOWN } from '../model/expense-summary';
import { EXPENSE_SERVICE_LIMIT, type ExpenseSummaryViewModel } from '../model/expense-summary-view-model';

const CONTENT_MAX_WIDTH = 560;
const BAR_HEIGHT = 6;

/** Presentational only — all state and actions come from the view model. */
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
                <Totals total={summary.total} count={summary.count} thisMonth={thisMonth.total} />

                {selectedBikeId === null && bikes.length > 1 && (
                  <Breakdown title="By motorcycle" lines={summary.byBike} />
                )}

                <Breakdown title="By service type" lines={summary.byType} />

                <Breakdown
                  title={`By month · last ${MONTHS_SHOWN} months`}
                  lines={summary.byMonth}
                  footnote={
                    summary.olderTotal > 0
                      ? `${formatCost(summary.olderTotal)} more was spent outside these months (before ${oldestShown.label}).`
                      : undefined
                  }
                />

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

/** "All" plus one chip per bike. Scrolls sideways when there are many. */
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

/** Headline numbers as a ruled strip, matching the service log. */
function Totals({ total, count, thisMonth }: { total: number; count: number; thisMonth: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.totals, { borderColor: theme.text }]}>
      <Stat label="Spent" value={formatCost(total)} />
      <View style={[styles.totalsDivider, { backgroundColor: theme.line }]} />
      <Stat label={count === 1 ? 'Entry' : 'Entries'} value={String(count)} />
      <View style={[styles.totalsDivider, { backgroundColor: theme.line }]} />
      <Stat label="This month" value={formatCost(thisMonth)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="readout" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
    </View>
  );
}

/** A titled list of totals, each with a bar scaled to the largest one in the list. */
function Breakdown({ title, lines, footnote }: { title: string; lines: ExpenseLine[]; footnote?: string }) {
  const max = lines.reduce((m, l) => Math.max(m, l.total), 0);
  return (
    <Panel>
      <PanelHeading title={title} />
      <View style={styles.lines}>
        {lines.map((line) => (
          <BarRow key={line.key} line={line} max={max} />
        ))}
      </View>
      {footnote ? (
        <ThemedText type="small" themeColor="textSecondary">
          {footnote}
        </ThemedText>
      ) : null}
    </Panel>
  );
}

function BarRow({ line, max }: { line: ExpenseLine; max: number }) {
  const theme = useTheme();
  const empty = line.count === 0;
  const percent = Math.round(line.share * 100);
  const entries = `${line.count} ${line.count === 1 ? 'entry' : 'entries'}`;
  const width = max > 0 ? `${(line.total / max) * 100}%` : '0%';

  return (
    <View
      style={[styles.line, empty && styles.lineEmpty]}
      accessible
      accessibilityLabel={
        empty
          ? `${line.label}: nothing logged`
          : `${line.label}: ${formatCost(line.total)}, ${percent} percent, ${entries}`
      }>
      <View style={styles.lineTop}>
        <ThemedText type="smallBold" style={styles.lineLabel} numberOfLines={1}>
          {line.label}
        </ThemedText>
        <ThemedText type="readout" style={styles.lineAmount}>
          {empty ? '—' : formatCost(line.total)}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.bar, { width: width as `${number}%`, backgroundColor: theme.accent }]} />
      </View>
      {!empty && (
        <ThemedText type="readout" themeColor="textSecondary" style={styles.lineMeta}>
          {entries}
          {line.total > 0 ? ` · ${percent}%` : ''}
        </ThemedText>
      )}
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
    <Panel style={styles.empty}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {formatCost(0)}
      </ThemedText>
      <ThemedText style={styles.emptyTitle}>Nothing spent yet.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {filtered
          ? 'No services are logged for this motorcycle. Add one from its service log, with what it cost.'
          : 'Log a service with its cost and the totals show up here, by bike, by type and by month.'}
      </ThemedText>
    </Panel>
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
    gap: Spacing.three + 4,
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
  totals: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    paddingVertical: Spacing.three - 4,
  },
  totalsDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    gap: Spacing.one,
    paddingHorizontal: Spacing.three - 4,
  },
  statValue: {
    fontFamily: Fonts.monoMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  lines: {
    gap: Spacing.three,
  },
  line: {
    gap: Spacing.one + 2,
  },
  lineEmpty: {
    opacity: 0.5,
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  lineLabel: {
    flex: 1,
  },
  lineAmount: {
    fontFamily: Fonts.monoMedium,

  },
  track: {
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: BAR_HEIGHT / 2,
  },
  lineMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  notes: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.half,
  },
  empty: {
    gap: Spacing.two + 4,
    paddingVertical: Spacing.four,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
});
