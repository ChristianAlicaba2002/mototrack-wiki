import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
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
      accessibilityHint="Opens the service details"
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

const SKELETON_ROWS = [
  { title: '58%', detail: '42%', cost: 52 },
  { title: '44%', detail: '54%', cost: 44 },
  { title: '66%', detail: '36%', cost: 58 },
] as const;

export function ServiceRowSkeleton({ index = 0 }: { index?: number }) {
  const theme = useTheme();
  const widths = SKELETON_ROWS[index % SKELETON_ROWS.length];
  return (
    <View style={styles.row}>
      <View style={[styles.stub, { borderRightColor: theme.line }]}>
        <SkeletonText lineHeight={styles.day.lineHeight} fontSize={styles.day.fontSize} width={24} />
        <SkeletonText lineHeight={14} fontSize={11} width={22} />
        <SkeletonText lineHeight={styles.year.lineHeight} fontSize={styles.year.fontSize} width={26} />
      </View>
      <View style={styles.text}>
        <SkeletonText lineHeight={20} fontSize={styles.title.fontSize} width={widths.title} />
        <SkeletonText lineHeight={styles.detail.lineHeight} fontSize={styles.detail.fontSize} width={widths.detail} />
      </View>
      <SkeletonText lineHeight={20} fontSize={14} width={widths.cost} />
    </View>
  );
}

export function ServiceListSkeleton({ count }: { count: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <Fragment key={i}>
          {i > 0 ? <Rule /> : null}
          <ServiceRowSkeleton index={i} />
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
