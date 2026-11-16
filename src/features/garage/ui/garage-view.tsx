import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  CalendarIcon,
  ChevronRightIcon,
  EngineIcon,
  GaugeIcon,
  MotorcycleIcon,
  PlusIcon,
  TagIcon,
} from '@/components/icons/line-icons';
import { TabScreen } from '@/components/screen/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import type { GarageViewModel } from '../model/garage-view-model';
import { Button, ErrorMessage, IconButton, Radius } from './controls';

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Presentational only — all state and actions come from the view model. */
export function GarageView({ bikes, loading, error, addBike, editBike }: GarageViewModel) {
  const hasBikes = bikes.length > 0;

  return (
    <TabScreen
      title="Garage"
      subtitle="The motorcycles you own and ride."
      headerAction={
        hasBikes ? (
          <IconButton
            variant="primary"
            size={44}
            accessibilityLabel="Add motorcycle"
            onPress={addBike}
            icon={(c) => <PlusIcon size={22} color={c} />}
          />
        ) : undefined
      }>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : hasBikes ? (
        <>
          <GarageSummary bikes={bikes} />
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.listLabel}>
            YOUR BIKES
          </ThemedText>
          {bikes.map((bike) => (
            <BikeCard key={bike.id} bike={bike} onPress={() => editBike(bike.id)} />
          ))}
        </>
      ) : (
        !error && <EmptyGarage onAdd={addBike} />
      )}
    </TabScreen>
  );
}

function GarageSummary({ bikes }: { bikes: WithId<Bike>[] }) {
  const theme = useTheme();
  const totalKm = bikes.reduce((sum, b) => sum + b.odometerKm, 0);
  const totalCc = bikes.reduce((sum, b) => sum + b.engineCc, 0);

  return (
    <View style={[styles.summary, { backgroundColor: theme.accent }]}>
      <Stat label={bikes.length === 1 ? 'Motorcycle' : 'Motorcycles'} value={String(bikes.length)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.onAccent }]} />
      <Stat label="Total km" value={formatNumber(totalKm)} />
      <View style={[styles.summaryDivider, { backgroundColor: theme.onAccent }]} />
      <Stat label="Total cc" value={formatNumber(totalCc)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <ThemedText style={[styles.statValue, { color: theme.onAccent }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      <ThemedText type="small" style={[styles.statLabel, { color: theme.onAccent }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function BikeCard({ bike, onPress }: { bike: WithId<Bike>; onPress: () => void }) {
  const theme = useTheme();
  const name = `${bike.make} ${bike.model}`;
  const title = bike.nickname ?? name;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${bike.year}, ${bike.engineCc} cc, ${formatNumber(bike.odometerKm)} kilometres`}
      accessibilityHint="Opens the motorcycle to edit or delete it"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.cardPressed,
      ]}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: theme.brandSoft }]}>
          <MotorcycleIcon size={26} color={theme.brand} />
        </View>
        <View style={styles.cardHeading}>
          <ThemedText style={styles.cardTitle} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {bike.nickname ? name : bike.make}
          </ThemedText>
        </View>
        <ChevronRightIcon size={20} color={theme.textSecondary} />
      </View>

      <View style={styles.chips}>
        <Chip icon={(c) => <EngineIcon size={14} color={c} />} label={`${bike.engineCc} cc`} />
        <Chip icon={(c) => <CalendarIcon size={14} color={c} />} label={String(bike.year)} />
        {bike.plateNumber ? <Chip icon={(c) => <TagIcon size={14} color={c} />} label={bike.plateNumber} /> : null}
      </View>

      <View style={[styles.odometer, { backgroundColor: theme.background }]}>
        <GaugeIcon size={18} color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.odometerLabel}>
          Odometer
        </ThemedText>
        <ThemedText style={styles.odometerValue}>{formatNumber(bike.odometerKm)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          km
        </ThemedText>
      </View>
    </Pressable>
  );
}

function Chip({ icon, label }: { icon: (color: string) => ReactNode; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.background }]}>
      {icon(theme.textSecondary)}
      <ThemedText type="small" numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

function EmptyGarage({ onAdd }: { onAdd: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.emptyBadge, { backgroundColor: theme.brandSoft }]}>
        <MotorcycleIcon size={44} color={theme.brand} />
      </View>
      <View style={styles.emptyText}>
        <ThemedText style={styles.emptyTitle}>Your garage is empty</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Add your first motorcycle to track mileage, specs, and service history in one place.
        </ThemedText>
      </View>
      <Button label="Add motorcycle" onPress={onAdd} icon={(c) => <PlusIcon size={20} color={c} />} />
    </View>
  );
}

function SkeletonCard() {
  const theme = useTheme();
  const block = { backgroundColor: theme.backgroundSelected };
  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}
      accessibilityLabel="Loading motorcycles">
      <View style={styles.cardTop}>
        <View style={[styles.avatar, block]} />
        <View style={styles.cardHeading}>
          <View style={[styles.skeletonLine, block, { width: '60%' }]} />
          <View style={[styles.skeletonLine, block, { width: '35%' }]} />
        </View>
      </View>
      <View style={[styles.odometer, block]} />
    </View>
  );
}

const styles = StyleSheet.create({
  listLabel: {
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.card,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    opacity: 0.35,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    opacity: 0.85,
  },
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeading: {
    flex: 1,
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.pill,
  },
  odometer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.field,
  },
  odometerLabel: {
    flex: 1,
  },
  odometerValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.card,
  },
  emptyBadge: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  center: {
    textAlign: 'center',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
