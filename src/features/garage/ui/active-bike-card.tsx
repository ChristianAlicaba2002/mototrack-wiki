import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { bikeDisplayName } from '../model/active-bike';
import { openOdometer } from '../model/garage-view-model';
import {
  Button,
  ErrorMessage,
  OdometerReadout,
  OdometerReadoutSkeleton,
  TextAction,
} from './controls';

type ActiveBikeCardProps = {
  bikes: WithId<Bike>[];
  activeBike: WithId<Bike> | null;
  loading: boolean;
  error: string | null;
};

export function ActiveBikeCard({ bikes, activeBike, loading, error }: ActiveBikeCardProps) {
  const theme = useTheme();

  if (loading) return <ActiveBikeCardSkeleton />;
  if (error && !activeBike) return <ErrorMessage>{error}</ErrorMessage>;

  if (!activeBike) {
    return (
      <View style={styles.root}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Garage is empty
        </ThemedText>
        <View style={styles.heading}>
          <ThemedText style={styles.title}>Add the bike you ride.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Its odometer and service history will show up here.
          </ThemedText>
        </View>
        <Button label="Add motorcycle" onPress={() => router.push('/bike-form')} />
      </View>
    );
  }

  const title = bikeDisplayName(activeBike);
  const fullName = `${activeBike.make} ${activeBike.model}`;
  const specs = [activeBike.nickname ? fullName : null, String(activeBike.year), `${activeBike.engineCc} cc`]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <ThemedText type="eyebrow" style={{ color: theme.brand }}>
          Riding now
        </ThemedText>
        {bikes.length > 1 ? (
          <TextAction
            label="Switch"
            accessibilityLabel="Switch active motorcycle"
            onPress={() => router.navigate('/garage')}
          />
        ) : null}
      </View>

      <View style={styles.heading}>
        <ThemedText style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.specs} numberOfLines={1}>
          {specs}
        </ThemedText>
      </View>

      <View style={styles.readoutRow}>
        <OdometerReadout km={activeBike.odometerKm} size="lg" />
        <TextAction
          label="Update"
          accessibilityLabel="Update odometer"
          onPress={() => openOdometer(activeBike.id)}
        />
      </View>
    </View>
  );
}

function ActiveBikeCardSkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading your motorcycle"
      accessibilityState={{ busy: true }}
      style={styles.root}>
      <View style={styles.top}>
        <SkeletonText lineHeight={14} fontSize={11} width={76} />
      </View>

      <View style={styles.heading}>
        <SkeletonText lineHeight={styles.title.lineHeight} fontSize={styles.title.fontSize} width="70%" />
        <SkeletonText lineHeight={styles.specs.lineHeight} fontSize={styles.specs.fontSize} width="36%" />
      </View>

      <View style={styles.readoutRow}>
        <OdometerReadoutSkeleton size="lg" />
        <SkeletonText lineHeight={20} fontSize={14} width={52} />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    gap: Spacing.three + 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.4,
  },
  specs: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
});
