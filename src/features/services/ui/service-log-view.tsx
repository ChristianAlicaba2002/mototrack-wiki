import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon, PlusIcon, WrenchIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, Radius, Section } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { formatCost, formatServiceDate } from '../model/format';
import { SERVICE_LOG_LIMIT, type ServiceLogViewModel } from '../model/service-log-view-model';
import { ServiceRow } from './service-row';

const CONTENT_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function ServiceLogView({
  loadState,
  title,
  services,
  servicesLoading,
  totalCost,
  isTruncated,
  error,
  addService,
  openService,
  back,
}: ServiceLogViewModel) {
  const ready = loadState === 'ready';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <IconButton
            accessibilityLabel="Back"
            onPress={back}
            icon={(c) => <ChevronLeftIcon size={22} color={c} />}
          />
          <View style={styles.headerText}>
            <ThemedText type="smallBold" style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
              Service log
            </ThemedText>
            {ready ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {title}
              </ThemedText>
            ) : null}
          </View>
          {ready ? (
            <IconButton
              variant="primary"
              accessibilityLabel="Log a service"
              onPress={addService}
              icon={(c) => <PlusIcon size={20} color={c} />}
            />
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} />
        ) : !ready ? (
          <View style={styles.content}>
            <ErrorMessage>{error ?? 'This motorcycle no longer exists.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={back} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {servicesLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : services.length === 0 ? (
              !error && <EmptyLog onAdd={addService} />
            ) : (
              <>
                <Summary
                  count={services.length}
                  totalCost={totalCost}
                  lastDate={formatServiceDate(services[0].date)}
                />
                <Section
                  title="History"
                  description={isTruncated ? `Your last ${SERVICE_LOG_LIMIT} services.` : undefined}>
                  {services.map((service) => (
                    <ServiceRow key={service.id} service={service} onPress={() => openService(service.id)} showNotes />
                  ))}
                </Section>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function Summary({ count, totalCost, lastDate }: { count: number; totalCost: number; lastDate: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.summary, { backgroundColor: theme.accent }]}>
      <Stat label={count === 1 ? 'Service' : 'Services'} value={String(count)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.onAccent }]} />
      <Stat label="Total spent" value={formatCost(totalCost)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.onAccent }]} />
      <Stat label="Last service" value={lastDate} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText style={[styles.statValue, { color: theme.onAccent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.onAccent }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function EmptyLog({ onAdd }: { onAdd: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.emptyBadge, { backgroundColor: theme.accentSoft }]}>
        <WrenchIcon size={36} color={theme.accent} />
      </View>
      <ThemedText style={styles.emptyTitle}>No services yet</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
        Log oil changes, brake jobs, chain and tire work to keep track of what was done and what it cost.
      </ThemedText>
      <Button label="Log a service" onPress={onAdd} icon={(c) => <PlusIcon size={20} color={c} />} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSpacer: {
    width: 40,
  },
  loader: {
    marginTop: Spacing.five,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.card,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    opacity: 0.85,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.card,
  },
  emptyBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  emptyText: {
    textAlign: 'center',
  },
});
