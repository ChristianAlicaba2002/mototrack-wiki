import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon, PlusIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import {
  Button,
  ErrorMessage,
  IconButton,
  Panel,
  PanelHeading,
  ScreenHeader,
} from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { formatCost, formatServiceDate } from '../model/format';
import { SERVICE_LOG_LIMIT, type ServiceLogViewModel } from '../model/service-log-view-model';
import { ServiceTimeline } from './service-timeline';

const CONTENT_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function ServiceLogView({
  loadState,
  title,
  services,
  timeline,
  servicesLoading,
  totalCost,
  isTruncated,
  deletingId,
  error,
  addService,
  viewService,
  editService,
  removeService,
  back,
}: ServiceLogViewModel) {
  const theme = useTheme();
  const ready = loadState === 'ready';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Service log"
          context={ready ? title : undefined}
          leading={
            <IconButton
              accessibilityLabel="Back"
              onPress={back}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
          trailing={
            ready ? (
              <IconButton
                variant="primary"
                accessibilityLabel="Log a service"
                onPress={addService}
                icon={(c) => <PlusIcon size={20} color={c} />}
              />
            ) : undefined
          }
        />

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : !ready ? (
          <View style={styles.content}>
            <ErrorMessage>{error ?? 'This motorcycle no longer exists.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={back} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {servicesLoading ? (
              <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
            ) : services.length === 0 ? (
              !error && <EmptyLog onAdd={addService} />
            ) : (
              <>
                <Summary
                  count={services.length}
                  totalCost={totalCost}
                  lastDate={formatServiceDate(services[0].date)}
                />
                <View style={styles.history}>
                  <PanelHeading title={isTruncated ? `Timeline · last ${SERVICE_LOG_LIMIT} entries` : 'Timeline'} />
                  <ServiceTimeline
                    timeline={timeline}
                    deletingId={deletingId}
                    onView={viewService}
                    onEdit={editService}
                    onDelete={removeService}
                  />
                </View>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

/** Totals as a ruled strip, like the footer of a ledger page. */
function Summary({ count, totalCost, lastDate }: { count: number; totalCost: number; lastDate: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.summary, { borderColor: theme.text }]}>
      <Stat label={count === 1 ? 'Entry' : 'Entries'} value={String(count)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.line }]} />
      <Stat label="Spent" value={formatCost(totalCost)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.line }]} />
      <Stat label="Last" value={lastDate} />
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

function EmptyLog({ onAdd }: { onAdd: () => void }) {
  return (
    <Panel style={styles.empty}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Blank page
      </ThemedText>
      <ThemedText style={styles.emptyTitle}>Nothing logged for this bike.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Write down oil changes, brake jobs, chain and tire work — what was done, at what km, and what it cost.
      </ThemedText>
      <Button label="Log the first service" onPress={onAdd} />
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
  summary: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    paddingVertical: Spacing.three - 4,
  },
  summaryDivider: {
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
  history: {
    gap: Spacing.two,
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
