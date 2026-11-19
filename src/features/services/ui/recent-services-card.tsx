import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PlusIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { Button, ErrorMessage, Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { openServiceForm, openServiceLog } from '../model/navigation';
import { useBikeServices } from '../model/use-bike-services';
import { ServiceRow } from './service-row';

const RECENT_COUNT = 3;

/** The active bike's latest services, with shortcuts to log one or see them all. Hidden without a bike. */
export function RecentServicesCard() {
  const theme = useTheme();
  const { activeBike } = useGarageData();
  const bikeId = activeBike?.id;
  const { services, loading, error } = useBikeServices(bikeId, RECENT_COUNT);

  if (!bikeId) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold" accessibilityRole="header">
          Recent services
        </ThemedText>
        {services.length > 0 ? (
          <Pressable
            onPress={() => openServiceLog(bikeId)}
            accessibilityRole="button"
            accessibilityLabel="See all services"
            hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              See all
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : loading ? (
        <ActivityIndicator />
      ) : services.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing logged yet. Record oil changes, brakes, chain and tire work here.
        </ThemedText>
      ) : (
        services.map((service) => (
          <ServiceRow key={service.id} service={service} onPress={() => openServiceForm(bikeId, service.id)} />
        ))
      )}

      <Button
        label="Log a service"
        onPress={() => openServiceForm(bikeId)}
        icon={(c) => <PlusIcon size={20} color={c} />}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
