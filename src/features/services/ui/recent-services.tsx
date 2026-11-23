import { StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Button, ButtonSkeleton, ErrorMessage, PanelHeading, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { ServiceRecord } from '@/lib/firestore/types';

import { openServiceDetail, openServiceForm, openServiceLog } from '../model/navigation';
import { RECENT_SERVICES_COUNT } from '../model/use-bike-services';
import { ServiceList, ServiceListSkeleton } from './service-row';

type RecentServicesProps = {
  bikeId: string;
  services: WithId<ServiceRecord>[];
  loading: boolean;
  error: string | null;
};

export function RecentServices({ bikeId, services, loading, error }: RecentServicesProps) {
  const theme = useTheme();

  if (loading) return <RecentServicesSkeleton />;

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
      ) : services.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No entries yet. Oil, brakes, chain, tires — write it down the day you do it.
        </ThemedText>
      ) : (
        <ServiceList services={services} onOpen={(id) => openServiceDetail(bikeId, id)} />
      )}

      <Button label="Log a service" variant="secondary" onPress={() => openServiceForm(bikeId)} />
    </View>
  );
}

export function RecentServicesSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="Loading the logbook"
      accessibilityState={{ busy: true }}
      style={[styles.section, { borderTopColor: theme.line }]}>
      <View style={styles.heading}>
        <SkeletonText lineHeight={14} fontSize={11} width={64} />
        <SkeletonText lineHeight={20} fontSize={14} width={48} />
      </View>
      <ServiceListSkeleton count={RECENT_SERVICES_COUNT} />
      <ButtonSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
