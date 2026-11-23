import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { Button, ErrorMessage, PanelHeading, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { openServiceForm, openServiceLog } from '../model/navigation';
import { useBikeServices } from '../model/use-bike-services';
import { ServiceList } from './service-row';

const RECENT_COUNT = 3;

export function RecentServices() {
  const theme = useTheme();
  const { activeBike } = useGarageData();
  const bikeId = activeBike?.id;
  const { services, loading, error } = useBikeServices(bikeId, RECENT_COUNT);

  if (!bikeId) return null;

  return (
    <View style={[styles.section, { borderTopColor: theme.line }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  loading: {
    paddingVertical: 24,
  },
});
