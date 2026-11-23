import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { Rule } from '@/features/garage/ui/controls';
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

/** One line in the logbook: date stub on the left, the work in the middle, cost on the right. */
export function ServiceRow({ service, onPress, showNotes }: ServiceRowProps) {
  const theme = useTheme();
  const typeLabel = SERVICE_TYPE_LABELS[service.type];
  const date = service.date.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  const km = `${formatKm(service.odometerKm)} km`;
  const cost = service.cost === null ? null : formatCost(service.cost);
  const detail = service.title === typeLabel ? km : `${typeLabel} · ${km}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        service.title,
        typeLabel,
        formatServiceDate(service.date),
        `${formatKm(service.odometerKm)} kilometres`,
        cost,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Opens the service to edit or delete it"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.stub, { borderRightColor: theme.line }]}>
        <ThemedText style={styles.day}>{day}</ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {month}
        </ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.year}>
          {date.getFullYear()}
        </ThemedText>
      </View>
      <View style={styles.text}>
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {service.title}
        </ThemedText>
        <ThemedText type="readout" themeColor="textSecondary" style={styles.detail} numberOfLines={1}>
          {detail}
        </ThemedText>
        {showNotes && service.notes ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {service.notes}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="readout" style={styles.cost}>
        {cost ?? '—'}
      </ThemedText>
    </Pressable>
  );
}

/** A ruled list of service rows. */
export function ServiceList({
  services,
  onOpen,
  showNotes,
}: {
  services: WithId<ServiceRecord>[];
  onOpen: (serviceId: string) => void;
  showNotes?: boolean;
}) {
  return (
    <View>
      {services.map((service, i) => (
        <Fragment key={service.id}>
          {i > 0 ? <Rule /> : null}
          <ServiceRow service={service} onPress={() => onOpen(service.id)} showNotes={showNotes} />
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.one,
    borderRadius: 4,
  },
  stub: {
    width: 48,
    alignItems: 'center',
    paddingRight: Spacing.three - 4,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  day: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 25,
    fontVariant: ['tabular-nums'],
  },
  year: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
  },
  cost: {
    fontFamily: Fonts.monoMedium,

  },
});
