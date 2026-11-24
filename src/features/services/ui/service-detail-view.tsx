import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConfirmDrawer } from '@/components/confirm-drawer';
import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { Button, ErrorMessage, IconButton, ScreenHeader } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { ServiceRecord } from '@/lib/firestore/types';

import { formatCost, formatLongDate, formatServiceDate } from '../model/format';
import { formatRemaining } from '../model/intervals';
import { SERVICE_TYPE_LABELS } from '../model/service-form';
import type { ServiceDetailViewModel } from '../model/service-detail-view-model';
import { deleteServiceRequest } from './confirm-delete';

const CONTENT_MAX_WIDTH = 560;

export function ServiceDetailView({
  loadState,
  bikeName,
  service,
  dueState,
  deleting,
  error,
  edit,
  remove,
  back,
}: ServiceDetailViewModel) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();

  return (
    <ThemedView style={styles.root}>
      {drawer}
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title="Logbook entry"
          context={bikeName}
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={back}
              disabled={deleting}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : !service ? (
          <View style={styles.content}>
            <ErrorMessage>{error ?? 'This service no longer exists.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={back} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <ServiceDetails service={service} dueState={dueState} />
            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            <View style={styles.actions}>
              <Button label="Edit entry" variant="secondary" onPress={edit} disabled={deleting} />
              <Button
                label="Delete entry"
                variant="danger"
                onPress={() => confirm(deleteServiceRequest(remove, service.title))}
                loading={deleting}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function ServiceDetails({
  service,
  dueState,
}: {
  service: WithId<ServiceRecord>;
  dueState: ServiceDetailViewModel['dueState'];
}) {
  const theme = useTheme();
  const typeLabel = SERVICE_TYPE_LABELS[service.type];

  return (
    <View style={styles.details}>
      <View style={styles.heading}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {typeLabel}
        </ThemedText>
        <ThemedText style={styles.title} accessibilityRole="header">
          {service.title}
        </ThemedText>
      </View>

      <View style={[styles.facts, { borderTopColor: theme.text }]}>
        <Fact label="Date" value={formatLongDate(service.date.toDate())} />
        <Fact label="Odometer" value={`${formatKm(service.odometerKm)} km`} />
        <Fact label="Cost" value={service.cost === null ? '—' : formatCost(service.cost)} />
        <NextDueFact dueState={dueState} />
      </View>

      <View style={styles.notes}>
        <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
          Notes
        </ThemedText>
        {service.notes ? (
          <ThemedText selectable>{service.notes}</ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No notes.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

/** The next-due reading, with how far off it is or that it has been done again since. */
function NextDueFact({ dueState }: { dueState: ServiceDetailViewModel['dueState'] }) {
  const theme = useTheme();
  if (dueState === null) return <Fact label="Next due" value="…" />;
  if (dueState.kind === 'none') return <Fact label="Next due" value="No reminder" />;

  const value = `${formatKm(dueState.nextDueKm)} km`;
  const [note, color] =
    dueState.kind === 'superseded'
      ? [`Done again ${formatServiceDate(dueState.by.date)}`, theme.textSecondary]
      : dueState.status === 'overdue'
        ? [formatRemaining(dueState.remainingKm), theme.danger]
        : dueState.status === 'soon'
          ? [formatRemaining(dueState.remainingKm), theme.brand]
          : [formatRemaining(dueState.remainingKm), theme.textSecondary];

  return <Fact label="Next due" value={value} note={note} noteColor={color} />;
}

function Fact({
  label,
  value,
  note,
  noteColor,
}: {
  label: string;
  value: string;
  /** A second line under the value, e.g. "in 1,200 km". */
  note?: string;
  noteColor?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.fact, { borderBottomColor: theme.line }]}
      accessible
      accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.factValues}>
        <ThemedText type="readout" style={styles.factValue} numberOfLines={1}>
          {value}
        </ThemedText>
        {note ? (
          <ThemedText type="small" style={[styles.factNote, { color: noteColor }]} numberOfLines={1}>
            {note}
          </ThemedText>
        ) : null}
      </View>
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
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  details: {
    gap: Spacing.four,
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  facts: {
    borderTopWidth: 2,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  factValues: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  factNote: {
    textAlign: 'right',
  },
  factValue: {
    flexShrink: 1,
    fontFamily: Fonts.monoMedium,
    fontSize: 15,
  },
  notes: {
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
