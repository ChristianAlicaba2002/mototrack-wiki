import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SkeletonBlock, SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike } from '@/lib/firestore/types';

import { bikeDisplayName } from '../model/active-bike';
import { openOdometer } from '../model/garage-view-model';
import {
  Button,
  ButtonSkeleton,
  ErrorMessage,
  OdometerReadout,
  OdometerReadoutSkeleton,
  Panel,
  TextAction,
} from './controls';

type ActiveBikeCardProps = {
  bikes: WithId<Bike>[];
  activeBike: WithId<Bike> | null;
  loading: boolean;
  error: string | null;
};

/** The bike the app is focused on, with a shortcut to update its odometer. */
export function ActiveBikeCard({ bikes, activeBike, loading, error }: ActiveBikeCardProps) {
  const theme = useTheme();

  if (loading) return <ActiveBikeCardSkeleton />;
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

function ActiveBikeCardSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading your motorcycle" accessibilityState={{ busy: true }}>
      <Panel>
        <View style={styles.top}>
          <View style={styles.kicker}>
            <SkeletonBlock width={styles.mark.width} height={styles.mark.height} radius={0} />
            <SkeletonText lineHeight={14} fontSize={11} width={84} />
          </View>
        </View>

        <View style={styles.heading}>
          <SkeletonText lineHeight={styles.title.lineHeight} fontSize={styles.title.fontSize} width="62%" />
          <SkeletonText lineHeight={20} fontSize={14} width="46%" />
        </View>

        <View style={styles.readoutRow}>
          <OdometerReadoutSkeleton size="lg" />
        </View>

        <ButtonSkeleton />
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  readoutRow: {
    paddingVertical: Spacing.one,
  },
});
