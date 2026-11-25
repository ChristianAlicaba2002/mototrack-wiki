import { StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import { ErrorMessage, PanelHeading, TextAction } from '@/features/garage/ui/controls';
import type { UpcomingService } from '@/features/services/model/intervals';
import { openServiceDetail, openServiceIntervals, openServiceLog } from '@/features/services/model/navigation';
import { DueNextList } from '@/features/services/ui/due-next-list';
import { useTheme } from '@/hooks/use-theme';

import { DUE_NEXT_COUNT } from '../model/home-view-model';

type DueNextPanelProps = {
  bikeId: string;
  odometerKm: number;
  upcoming: UpcomingService[];
  moreUpcoming: number;
  overdueCount: number;
  hasServices: boolean;
  loading: boolean;
  error: string | null;
};

/** What's due next on the active bike, soonest first, against its current odometer. */
export function DueNextPanel({
  bikeId,
  odometerKm,
  upcoming,
  moreUpcoming,
  overdueCount,
  hasServices,
  loading,
  error,
}: DueNextPanelProps) {
  const theme = useTheme();

  if (loading) return <DueNextPanelSkeleton />;

  const status =
    overdueCount > 0
      ? `${overdueCount} overdue at ${formatKm(odometerKm)} km`
      : `At ${formatKm(odometerKm)} km on the odometer`;

  return (
    <View style={[styles.section, { borderTopColor: theme.line }]}>
      <PanelHeading
        title="Due next"
        action={
          moreUpcoming > 0 ? (
            <TextAction
              label={`+${moreUpcoming} more`}
              accessibilityLabel={`See ${moreUpcoming} more in the service log`}
              onPress={() => openServiceLog(bikeId)}
            />
          ) : undefined
        }
      />

      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : !hasServices ? (
        <ThemedText type="small" themeColor="textSecondary">
          Log a service and MotoTrack works out when it’s due again, from your service intervals.
        </ThemedText>
      ) : (
        <>
          <ThemedText
            type="readout"
            themeColor={overdueCount > 0 ? 'danger' : 'textSecondary'}
            accessibilityLiveRegion="polite">
            {status}
          </ThemedText>
          <DueNextList
            upcoming={upcoming}
            onView={(serviceId) => openServiceDetail(bikeId, serviceId)}
            onEditIntervals={openServiceIntervals}
          />
        </>
      )}
    </View>
  );
}

export function DueNextPanelSkeleton() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="Loading what’s due next"
      accessibilityState={{ busy: true }}
      style={[styles.section, { borderTopColor: theme.line }]}>
      <SkeletonText lineHeight={14} fontSize={11} width={72} />
      <SkeletonText lineHeight={20} fontSize={14} width="55%" />
      {Array.from({ length: DUE_NEXT_COUNT }, (_, i) => (
        <SkeletonText key={i} lineHeight={56} fontSize={18} width="100%" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three - 4,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
