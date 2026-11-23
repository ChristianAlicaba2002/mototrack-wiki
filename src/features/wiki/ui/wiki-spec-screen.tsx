import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Rule } from '@/features/garage/ui/controls';
import type { WikiSpec, WikiTirePressure } from '@/lib/firestore/types';

import {
  formatInterval,
  formatLitres,
  formatPsi,
  formatTorque,
  formatYears,
} from '../model/format';
import { useWikiDetailViewModel } from '../model/wiki-detail-view-model';
import {
  DetailFrame,
  DetailHeading,
  DetailHeadingSkeleton,
  DetailSection,
  DetailSectionSkeleton,
  DetailSkeleton,
  Fact,
  Facts,
  FactSkeleton,
  Footnote,
  FootnoteSkeleton,
  LabeledRow,
  LabeledRowSkeleton,
  Rows,
} from './detail-parts';

const FLUID_ROWS = [
  { label: 68, note: 140, value: 42 },
  { label: 56, note: 75, value: 50 },
  { label: 52, note: 150, value: 42 },
  { label: 76, value: 118 },
];

const TORQUE_ROWS = [
  { label: 140, value: 50 },
  { label: 175, value: 50 },
  { label: 70, value: 50 },
  { label: 95, value: 50 },
  { label: 90, value: 59 },
];

const INTERVAL_ROWS = [
  { label: 68, value: 126 },
  { label: 100, value: 126 },
  { label: 62, value: 76 },
  { label: 70, value: 76 },
  { label: 66, value: 76 },
  { label: 52, value: 34 },
  { label: 76, value: 34 },
];

export function WikiSpecScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loadState, doc, error, back } = useWikiDetailViewModel(id ?? '', 'spec');

  return (
    <DetailFrame
      title="Spec sheet"
      context="Wiki"
      loadState={loadState}
      skeleton={<SpecSheetSkeleton />}
      error={error}
      back={back}>
      {doc ? <SpecSheet spec={doc} /> : null}
    </DetailFrame>
  );
}

function SpecSheet({ spec }: { spec: WikiSpec }) {
  const { fluids, tirePressure } = spec;

  return (
    <>
      <DetailHeading eyebrow={spec.make} title={spec.model} />

      <Facts>
        <Fact label="Engine" value={`${spec.engineCc} cc`} />
        <Fact label="Years" value={formatYears(spec.yearFrom, spec.yearTo)} />
      </Facts>

      <DetailSection title="Fluids">
        <Rows>
          <LabeledRow
            label="Engine oil"
            note={fluids.engineOil.grade}
            value={formatLitres(fluids.engineOil.capacityL)}
          />
          {fluids.gearOil ? (
            <LabeledRow label="Gear oil" note={fluids.gearOil.grade} value={formatLitres(fluids.gearOil.capacityL)} />
          ) : null}
          {fluids.coolant ? (
            <LabeledRow label="Coolant" note={fluids.coolant.grade} value={formatLitres(fluids.coolant.capacityL)} />
          ) : null}
          <LabeledRow label="Brake fluid" value={fluids.brakeFluid} />
        </Rows>
      </DetailSection>

      <DetailSection title="Tire pressure">
        <PressureTable front={tirePressure.front} rear={tirePressure.rear} />
      </DetailSection>

      {spec.torque.length > 0 ? (
        <DetailSection title="Torque">
          <Rows>
            {spec.torque.map((row) => (
              <LabeledRow key={row.item} label={row.item} value={formatTorque(row.nm)} />
            ))}
          </Rows>
        </DetailSection>
      ) : null}

      {spec.intervals.length > 0 ? (
        <DetailSection title="Service intervals">
          <Rows>
            {spec.intervals.map((row) => (
              <LabeledRow key={row.item} label={row.item} value={formatInterval(row)} />
            ))}
          </Rows>
        </DetailSection>
      ) : null}

      <Footnote>
        Typical figures for Philippine-market bikes. When your owner’s manual says otherwise, follow the manual.
      </Footnote>
    </>
  );
}

function PressureTable({ front, rear }: { front: WikiTirePressure; rear: WikiTirePressure }) {
  return (
    <View>
      <View style={styles.pressureRow}>
        <View style={styles.pressureLabel} />
        <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.pressureCell}>
          Solo
        </ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.pressureCell}>
          2-up
        </ThemedText>
      </View>
      <PressureRow label="Front" pressure={front} />
      <Rule />
      <PressureRow label="Rear" pressure={rear} />
    </View>
  );
}

function PressureRow({ label, pressure }: { label: string; pressure: WikiTirePressure }) {
  return (
    <View
      style={styles.pressureRow}
      accessible
      accessibilityLabel={`${label}: ${formatPsi(pressure.soloPsi)} solo, ${formatPsi(pressure.passengerPsi)} with a passenger`}>
      <ThemedText type="small" style={styles.pressureLabel}>
        {label}
      </ThemedText>
      <ThemedText type="readout" style={[styles.pressureCell, styles.pressureValue]}>
        {formatPsi(pressure.soloPsi)}
      </ThemedText>
      <ThemedText type="readout" style={[styles.pressureCell, styles.pressureValue]}>
        {formatPsi(pressure.passengerPsi)}
      </ThemedText>
    </View>
  );
}

function SpecSheetSkeleton() {
  return (
    <DetailSkeleton>
      <DetailHeadingSkeleton eyebrow={40} title={[124]} />

      <Facts>
        <FactSkeleton label={48} value={54} />
        <FactSkeleton label={40} value={108} />
      </Facts>

      <DetailSectionSkeleton title={48}>
        <Rows>
          {FLUID_ROWS.map((row, i) => (
            <LabeledRowSkeleton key={i} {...row} />
          ))}
        </Rows>
      </DetailSectionSkeleton>

      <DetailSectionSkeleton title={104}>
        <View>
          <View style={styles.pressureRow}>
            <View style={styles.pressureLabel} />
            <SkeletonCell lineHeight={14} fontSize={11} width={32} />
            <SkeletonCell lineHeight={14} fontSize={11} width={32} />
          </View>
          {[36, 30].map((label, i) => (
            <View key={i}>
              {i > 0 ? <Rule /> : null}
              <View style={styles.pressureRow}>
                <View style={styles.pressureLabel}>
                  <SkeletonText lineHeight={20} fontSize={14} width={label} />
                </View>
                <SkeletonCell lineHeight={20} fontSize={14} width={50} />
                <SkeletonCell lineHeight={20} fontSize={14} width={50} />
              </View>
            </View>
          ))}
        </View>
      </DetailSectionSkeleton>

      <DetailSectionSkeleton title={48}>
        <Rows>
          {TORQUE_ROWS.map((row, i) => (
            <LabeledRowSkeleton key={i} {...row} />
          ))}
        </Rows>
      </DetailSectionSkeleton>

      <DetailSectionSkeleton title={136}>
        <Rows>
          {INTERVAL_ROWS.map((row, i) => (
            <LabeledRowSkeleton key={i} {...row} />
          ))}
        </Rows>
      </DetailSectionSkeleton>

      <FootnoteSkeleton lines={['98%', '96%', '12%']} />
    </DetailSkeleton>
  );
}

function SkeletonCell(props: { lineHeight: number; fontSize: number; width: number }) {
  return (
    <View style={[styles.pressureCell, styles.skeletonCell]}>
      <SkeletonText {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCell: {
    alignItems: 'flex-end',
  },
  pressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
  },
  pressureLabel: {
    flex: 1,
  },
  pressureCell: {
    width: 64,
    textAlign: 'right',
  },
  pressureValue: {
    fontFamily: Fonts.monoMedium,
  },
});
