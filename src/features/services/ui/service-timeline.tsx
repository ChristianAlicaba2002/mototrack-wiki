import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { formatCost, formatServiceDate } from '../model/format';
import { SERVICE_TYPE_LABELS } from '../model/service-form';
import type { TimelineEntry, TimelineYear } from '../model/service-timeline';
import { confirmDeleteService } from './confirm-delete';

const RAIL_WIDTH = 22;
const DOT_SIZE = 11;

type ServiceTimelineProps = {
  timeline: TimelineYear[];
  deletingId: string | null;
  onView: (serviceId: string) => void;
  onEdit: (serviceId: string) => void;
  onDelete: (serviceId: string) => void;
};

/** A bike's services on a vertical rail, newest at the top, grouped by year. */
export function ServiceTimeline({ timeline, deletingId, onView, onEdit, onDelete }: ServiceTimelineProps) {
  const lastYear = timeline.length - 1;
  return (
    <View>
      {timeline.map((group, gi) => (
        <View key={group.year}>
          <YearHeader group={group} isFirst={gi === 0} />
          {group.entries.map((entry, ei) => (
            <TimelineRow
              key={entry.service.id}
              entry={entry}
              isLatest={gi === 0 && ei === 0}
              isOldest={gi === lastYear && ei === group.entries.length - 1}
              deleting={deletingId === entry.service.id}
              busy={deletingId !== null}
              onView={() => onView(entry.service.id)}
              onEdit={() => onEdit(entry.service.id)}
              onDelete={() => confirmDeleteService(() => onDelete(entry.service.id), entry.service.title)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function YearHeader({ group, isFirst }: { group: TimelineYear; isFirst: boolean }) {
  const theme = useTheme();
  const count = group.entries.length;
  const summary = [`${count} ${count === 1 ? 'entry' : 'entries'}`, group.totalCost > 0 ? formatCost(group.totalCost) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        {/* The rail runs through the year label, except above the very first one. */}
        <View style={[styles.line, { backgroundColor: isFirst ? 'transparent' : theme.line }]} />
      </View>
      <View
        style={[styles.yearHeader, !isFirst && styles.yearHeaderSpaced]}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${group.year}, ${summary}`}>
        <ThemedText style={styles.year}>{group.year}</ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {summary}
        </ThemedText>
      </View>
    </View>
  );
}

type TimelineRowProps = {
  entry: TimelineEntry;
  isLatest: boolean;
  isOldest: boolean;
  deleting: boolean;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function TimelineRow({ entry, isLatest, isOldest, deleting, busy, onView, onEdit, onDelete }: TimelineRowProps) {
  const theme = useTheme();
  const { service, kmSincePrevious } = entry;
  const typeLabel = SERVICE_TYPE_LABELS[service.type];
  const date = service.date.toDate();
  const dateLabel = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const km = `${formatKm(service.odometerKm)} km`;
  const cost = service.cost === null ? null : formatCost(service.cost);
  const detail = [service.title === typeLabel ? null : typeLabel, km].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, deleting && styles.deleting]}>
      <View style={styles.rail}>
        <View style={[styles.lineStub, { backgroundColor: theme.line }]} />
        <View
          style={[
            styles.dot,
            isLatest
              ? { backgroundColor: theme.brand, borderColor: theme.brand }
              : { backgroundColor: theme.background, borderColor: theme.text },
          ]}
        />
        <View style={[styles.line, { backgroundColor: isOldest ? 'transparent' : theme.line }]} />
      </View>

      <Pressable
        onPress={onView}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={[service.title, typeLabel, formatServiceDate(service.date), `${formatKm(service.odometerKm)} kilometres`, cost]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint="Opens the service details"
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: theme.backgroundElement, borderColor: theme.line },
          pressed && { backgroundColor: theme.backgroundSelected },
        ]}>
        <View style={styles.cardTop}>
          <View style={styles.cardText}>
            <ThemedText type="eyebrow" style={{ color: isLatest ? theme.brand : theme.textSecondary }}>
              {isLatest ? `Latest · ${dateLabel}` : dateLabel}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.title} numberOfLines={2}>
              {service.title}
            </ThemedText>
            <ThemedText type="readout" themeColor="textSecondary" style={styles.detail} numberOfLines={1}>
              {detail}
            </ThemedText>
          </View>
          <ThemedText type="readout" style={styles.cost}>
            {cost ?? '—'}
          </ThemedText>
        </View>

        {service.notes ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
            {service.notes}
          </ThemedText>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: theme.line }]}>
          <ThemedText type="readout" themeColor="textSecondary" style={styles.gap} numberOfLines={1}>
            {kmSincePrevious !== null ? `+${formatKm(kmSincePrevious)} km since previous` : ' '}
          </ThemedText>
          {deleting ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <View style={styles.actions}>
              <TextAction
                label="Edit"
                tone="text"
                accessibilityLabel={`Edit ${service.title}`}
                onPress={onEdit}
                disabled={busy}
              />
              <TextAction
                label="Delete"
                tone="danger"
                accessibilityLabel={`Delete ${service.title}`}
                onPress={onDelete}
                disabled={busy}
              />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  deleting: {
    opacity: 0.5,
  },
  rail: {
    width: RAIL_WIDTH,
    alignItems: 'center',
  },
  line: {
    flex: 1,
    width: 2,
  },
  lineStub: {
    width: 2,
    height: Spacing.three,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  yearHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  yearHeaderSpaced: {
    paddingTop: Spacing.three,
  },
  year: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  card: {
    flex: 1,
    marginBottom: Spacing.two + 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.three - 4,
    gap: Spacing.two,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
  },
  cost: {
    fontFamily: Fonts.monoMedium,

  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    minHeight: 32,
  },
  gap: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three + 4,
  },
});
