import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GaugeIcon, MotorcycleIcon, PlusIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { bikeDisplayName } from '../model/active-bike';
import { openOdometer } from '../model/garage-view-model';
import { formatKm } from '../model/odometer';
import { useGarageData } from '../model/use-garage-data';
import { Button, ErrorMessage, Radius } from './controls';

/** The bike the app is focused on, with a shortcut to update its odometer. */
export function ActiveBikeCard() {
  const theme = useTheme();
  const { bikes, activeBike, loading, error } = useGarageData();

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error && !activeBike) return <ErrorMessage>{error}</ErrorMessage>;

  if (!activeBike) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">No motorcycle yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Add one to your garage to start tracking its mileage.
        </ThemedText>
        <Button
          label="Add motorcycle"
          onPress={() => router.push('/bike-form')}
          icon={(c) => <PlusIcon size={20} color={c} />}
        />
      </View>
    );
  }

  const title = bikeDisplayName(activeBike);

  return (
    <View style={[styles.card, { backgroundColor: theme.accentSoft }]}>
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <MotorcycleIcon size={26} color={theme.onAccent} />
        </View>
        <View style={styles.heading}>
          <ThemedText type="small" themeColor="textSecondary">
            Active motorcycle
          </ThemedText>
          <ThemedText style={styles.title} numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
        {bikes.length > 1 ? (
          <Pressable
            onPress={() => router.navigate('/garage')}
            accessibilityRole="button"
            accessibilityLabel="Switch active motorcycle"
            hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Switch
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[styles.odometer, { backgroundColor: theme.background }]}
        accessible
        accessibilityLabel={`Odometer ${formatKm(activeBike.odometerKm)} kilometres`}>
        <GaugeIcon size={18} color={theme.accent} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.odometerLabel}>
          Odometer
        </ThemedText>
        <ThemedText style={styles.odometerValue}>{formatKm(activeBike.odometerKm)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          km
        </ThemedText>
      </View>

      <Button
        label="Update odometer"
        onPress={() => openOdometer(activeBike.id)}
        icon={(c) => <GaugeIcon size={18} color={c} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
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
});
