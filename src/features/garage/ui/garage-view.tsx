import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, PlusIcon } from '@/components/icons/line-icons';
import { TabScreen } from '@/components/screen/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import type { GarageViewModel } from '../model/garage-view-model';
import { formatKm as formatNumber } from '../model/odometer';
import { Button, ErrorMessage, IconButton, OdometerReadout, Radius, TextAction } from './controls';

export function GarageView({
  bikes,
  activeBikeId,
  loading,
  error,
  addBike,
  editBike,
  makeActive,
  updateOdometer,
  openServices,
  openExpenses,
}: GarageViewModel) {
  const hasBikes = bikes.length > 0;

  return (
    <TabScreen
      summary={hasBikes ? summaryLine(bikes) : undefined}
      action={
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
        <List>
          <SkeletonRow />
          <SkeletonRow />
        </List>
      ) : hasBikes ? (
        <List>
          <ExpensesLink onPress={() => openExpenses()} />
          {bikes.map((bike) => (
            <BikeRow
              key={bike.id}
              bike={bike}
              isActive={bike.id === activeBikeId}
              onPress={() => editBike(bike.id)}
              onMakeActive={() => makeActive(bike.id)}
              onUpdateOdometer={() => updateOdometer(bike.id)}
              onOpenServices={() => openServices(bike.id)}
              onOpenExpenses={() => openExpenses(bike.id)}
            />
          ))}
        </List>
      ) : (
        !error && <EmptyGarage onAdd={addBike} />
      )}
    </TabScreen>
  );
}

function summaryLine(bikes: WithId<Bike>[]): string {
  const totalKm = bikes.reduce((sum, b) => sum + b.odometerKm, 0);
  return `${bikes.length} ${bikes.length === 1 ? 'bike' : 'bikes'} · ${formatNumber(totalKm)} km ridden`;
}

type BikeRowProps = {
  bike: WithId<Bike>;
  isActive: boolean;
  onPress: () => void;
  onMakeActive: () => void;
  onUpdateOdometer: () => void;
  onOpenServices: () => void;
  onOpenExpenses: () => void;
};

function BikeRow({
  bike,
  isActive,
  onPress,
  onMakeActive,
  onUpdateOdometer,
  onOpenServices,
  onOpenExpenses,
}: BikeRowProps) {
  const theme = useTheme();
  const name = `${bike.make} ${bike.model}`;
  const title = bike.nickname ?? name;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${isActive ? ', active motorcycle' : ''}, ${bike.year}, ${bike.engineCc} cc, ${formatNumber(bike.odometerKm)} kilometres`}
      accessibilityHint="Opens the motorcycle to edit or delete it"
      style={({ pressed }) => [styles.row, { borderTopColor: theme.line }, pressed && styles.pressed]}>
      <View style={styles.rowTop}>
        <View style={styles.rowHeading}>
          {isActive ? (
            <ThemedText type="eyebrow" style={{ color: theme.brand }}>
              Riding now
            </ThemedText>
          ) : null}
          <ThemedText style={styles.rowTitle} numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {bike.nickname ? `${name} · ` : ''}
            {bike.year} · {bike.engineCc} cc
          </ThemedText>
        </View>
        <ChevronRightIcon size={18} color={theme.textSecondary} />
      </View>

      <View style={styles.odometerRow}>
        <OdometerReadout km={bike.odometerKm} />
        {bike.plateNumber ? <Plate number={bike.plateNumber} /> : null}
      </View>

      <View style={styles.actions}>
        <TextAction
          label="Update km"
          accessibilityLabel={`Update odometer for ${title}`}
          onPress={onUpdateOdometer}
        />
        <TextAction label="Service log" accessibilityLabel={`Service log for ${title}`} onPress={onOpenServices} />
        <TextAction label="Expenses" accessibilityLabel={`Expenses for ${title}`} onPress={onOpenExpenses} />
        {!isActive ? (
          <TextAction
            label="Ride this one"
            tone="text"
            accessibilityLabel={`Set ${title} as the active motorcycle`}
            onPress={onMakeActive}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function List({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.list, { borderBottomColor: theme.line }]}>{children}</View>;
}

function ExpensesLink({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Expense summary"
      accessibilityHint="Shows what was spent per motorcycle, per service type and per month"
      style={({ pressed }) => [styles.expenses, { borderTopColor: theme.line }, pressed && styles.pressed]}>
      <View style={styles.expensesText}>
        <ThemedText type="smallBold">Expense summary</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          Totals per bike, per service type and per month
        </ThemedText>
      </View>
      <ChevronRightIcon size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function Plate({ number }: { number: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.plate, { borderColor: theme.text }]} accessibilityLabel={`Plate ${number}`}>
      <ThemedText type="readout" style={styles.plateText}>
        {number.toUpperCase()}
      </ThemedText>
    </View>
  );
}

function EmptyGarage({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        000000 km
      </ThemedText>
      <ThemedText style={styles.emptyTitle}>Nothing parked here yet.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Add your first motorcycle to keep its mileage, specs and service history together.
      </ThemedText>
      <Button label="Add motorcycle" onPress={onAdd} />
    </View>
  );
}

function SkeletonRow() {
  const theme = useTheme();
  const block = { backgroundColor: theme.backgroundSelected };
  return (
    <View
      accessibilityLabel="Loading motorcycles"
      style={[styles.row, styles.skeleton, { borderTopColor: theme.line }]}>
      <View style={[styles.skeletonLine, block, { width: '55%', height: 18 }]} />
      <View style={[styles.skeletonLine, block, { width: '35%' }]} />
      <View style={[styles.skeletonLine, block, { width: 150, height: 32, marginTop: Spacing.two }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
  list: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    gap: Spacing.three,
    paddingVertical: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expenses: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expensesText: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  rowHeading: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Fonts.display,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.2,
  },
  odometerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  plate: {
    borderWidth: 1.5,
    borderRadius: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  plateText: {
    fontFamily: Fonts.monoMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.four,
    rowGap: Spacing.two,
  },
  empty: {
    gap: Spacing.two + 4,
    paddingTop: Spacing.three,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  skeleton: {
    gap: Spacing.two,
  },
  skeletonLine: {
    height: 12,
    borderRadius: Radius.field / 2,
  },
});
