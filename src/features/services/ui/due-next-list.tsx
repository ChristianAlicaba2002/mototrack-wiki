import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { type DueStatus, formatRemaining, type UpcomingService } from '../model/intervals';
import { SERVICE_TYPE_LABELS } from '../model/service-form';

type DueNextListProps = {
  upcoming: UpcomingService[];
  /** Opens the last service of that type. */
  onView: (serviceId: string) => void;
  onEditIntervals: () => void;
};

/** When each kind of service comes round again, soonest first, as ruled rows. */
export function DueNextList({ upcoming, onView, onEditIntervals }: DueNextListProps) {
  const theme = useTheme();

  if (upcoming.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText type="small" themeColor="textSecondary">
          None of the services logged here have a km interval, so nothing is due.
        </ThemedText>
        <TextAction label="Set intervals" onPress={onEditIntervals} />
      </View>
    );
  }

  return (
    <View style={[styles.list, { borderBottomColor: theme.line }]}>
      {upcoming.map((item) => (
        <DueRow key={item.type} item={item} onPress={() => onView(item.last.id)} />
      ))}
    </View>
  );
}

function DueRow({ item, onPress }: { item: UpcomingService; onPress: () => void }) {
  const theme = useTheme();
  const label = SERVICE_TYPE_LABELS[item.type];
  const remaining = formatRemaining(item.remainingKm);
  const color = statusColor(item.status, theme);
  const at = `at ${formatKm(item.nextDueKm)} km`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, due ${at}, ${remaining}`}
      accessibilityHint="Opens the last time this was done"
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: theme.line },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      <View style={[styles.marker, { backgroundColor: item.status === 'ok' ? theme.line : color }]} />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {label}
        </ThemedText>
        <ThemedText type="readout" themeColor="textSecondary" numberOfLines={1}>
          {at}
        </ThemedText>
      </View>
      <ThemedText type="readout" style={[styles.remaining, { color }]} numberOfLines={1}>
        {remaining}
      </ThemedText>
      <ChevronRightIcon size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

function statusColor(status: DueStatus, theme: ReturnType<typeof useTheme>): string {
  if (status === 'overdue') return theme.danger;
  if (status === 'soon') return theme.brand;
  return theme.textSecondary;
}

const styles = StyleSheet.create({
  list: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    minHeight: 56,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  marker: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  remaining: {
    flexShrink: 0,
    textAlign: 'right',
  },
  empty: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
