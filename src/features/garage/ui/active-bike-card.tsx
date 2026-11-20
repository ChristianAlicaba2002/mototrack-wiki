import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { bikeDisplayName } from '../model/active-bike';
import { openOdometer } from '../model/garage-view-model';
import { useGarageData } from '../model/use-garage-data';
import { Button, ErrorMessage, OdometerReadout, Panel, TextAction } from './controls';

/** The bike the app is focused on, with a shortcut to update its odometer. */
export function ActiveBikeCard() {
  const theme = useTheme();
  const { bikes, activeBike, loading, error } = useGarageData();

  if (loading) {
    return (
      <Panel style={styles.loading}>
        <ActivityIndicator color={theme.textSecondary} />
      </Panel>
    );
  }
  if (error && !activeBike) return <ErrorMessage>{error}</ErrorMessage>;

  if (!activeBike) {
    return (
      <Panel>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Garage is empty
        </ThemedText>
        <ThemedText style={styles.emptyTitle}>Add the bike you ride.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Its odometer and service history will show up here.
        </ThemedText>
        <Button label="Add motorcycle" onPress={() => router.push('/bike-form')} />
      </Panel>
    );
  }

  const title = bikeDisplayName(activeBike);
  const fullName = `${activeBike.make} ${activeBike.model}`;
  const specs = [activeBike.nickname ? fullName : null, String(activeBike.year), `${activeBike.engineCc} cc`]
    .filter(Boolean)
    .join(' · ');

  return (
    <Panel>
      <View style={styles.top}>
        <View style={styles.kicker}>
          <View style={[styles.mark, { backgroundColor: theme.brand }]} />
          <ThemedText type="eyebrow" themeColor="textSecondary">
            Riding now
          </ThemedText>
        </View>
        {bikes.length > 1 ? (
          <TextAction
            label="Switch"
            accessibilityLabel="Switch active motorcycle"
            onPress={() => router.navigate('/garage')}
          />
        ) : null}
      </View>

      <View style={styles.heading}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {specs}
        </ThemedText>
      </View>

      <View style={styles.readoutRow}>
        <OdometerReadout km={activeBike.odometerKm} size="lg" />
      </View>

      <Button label="Update odometer" onPress={() => openOdometer(activeBike.id)} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 220,
    justifyContent: 'center',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mark: {
    width: 8,
    height: 8,
  },
  heading: {
    gap: 2,
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: 800,
    letterSpacing: -0.6,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  readoutRow: {
    paddingVertical: Spacing.one,
  },
});
