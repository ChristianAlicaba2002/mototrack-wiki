import { Pressable, StyleSheet, View } from 'react-native';

import { WrenchIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { ServiceRecord } from '@/lib/firestore/types';

import { formatCost, formatServiceDate } from '../model/format';
import { SERVICE_TYPE_LABELS } from '../model/service-form';

type ServiceRowProps = {
  service: WithId<ServiceRecord>;
  onPress: () => void;
  /** Show the first line of the notes under the details. */
  showNotes?: boolean;
};

/** One entry in a service log. */
export function ServiceRow({ service, onPress, showNotes }: ServiceRowProps) {
  const theme = useTheme();
  const typeLabel = SERVICE_TYPE_LABELS[service.type];
  const date = formatServiceDate(service.date);
  const km = `${formatKm(service.odometerKm)} km`;
  const cost = service.cost === null ? null : formatCost(service.cost);
  const subtitle = service.title === typeLabel ? `${date} · ${km}` : `${typeLabel} · ${date} · ${km}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[service.title, typeLabel, date, `${formatKm(service.odometerKm)} kilometres`, cost]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Opens the service to edit or delete it"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
        <WrenchIcon size={18} color={theme.accent} />
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {service.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
        {showNotes && service.notes ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.notes}>
            {service.notes}
          </ThemedText>
        ) : null}
      </View>
      {cost ? <ThemedText style={styles.cost}>{cost}</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: 700,
  },
  notes: {
    fontStyle: 'italic',
  },
  cost: {
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
});
