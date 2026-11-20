import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { Button, ErrorMessage, Panel, PanelHeading, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { openServiceForm, openServiceLog } from '../model/navigation';
import { useBikeServices } from '../model/use-bike-services';
import { ServiceList } from './service-row';

const RECENT_COUNT = 3;

/** The active bike's latest services, with shortcuts to log one or see them all. Hidden without a bike. */
export function RecentServicesCard() {
  const theme = useTheme();
  const { activeBike } = useGarageData();
  const bikeId = activeBike?.id;
  const { services, loading, error } = useBikeServices(bikeId, RECENT_COUNT);

  if (!bikeId) return null;

  return (
    <Panel>
      <PanelHeading
        title="Logbook"
        action={
          services.length > 0 ? (
            <TextAction label="See all" accessibilityLabel="See all services" onPress={() => openServiceLog(bikeId)} />
          ) : undefined
        }
      />

      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      ) : services.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No entries yet. Oil, brakes, chain, tires — write it down the day you do it.
        </ThemedText>
      ) : (
        <ServiceList services={services} onOpen={(id) => openServiceForm(bikeId, id)} />
      )}

      <Button label="Log a service" variant="secondary" onPress={() => openServiceForm(bikeId)} />
    </Panel>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 24,
  },
});
