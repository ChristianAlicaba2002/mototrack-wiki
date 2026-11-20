import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fragment } from 'react';

import { CloseIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { OdometerReading } from '@/lib/firestore/types';

import { BIKE_LIMITS, parseWholeNumber } from '../model/bike-form';
import { formatKm } from '../model/odometer';
import { HISTORY_LIMIT, type OdometerViewModel } from '../model/odometer-view-model';
import {
  Button,
  ErrorMessage,
  FormField,
  IconButton,
  OdometerReadout,
  Panel,
  Rule,
  ScreenHeader,
  Section,
} from './controls';

const FORM_MAX_WIDTH = 560;

function formatDate(reading: OdometerReading): string {
  // createdAt is null until the server confirms a just-written reading.
  const date = reading.createdAt?.toDate();
  if (!date) return 'Just now';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Presentational only — all state and actions come from the view model. */
export function OdometerView({
  loadState,
  bike,
  title,
  currentKm,
  readings,
  readingsLoading,
  text,
  fieldError,
  saving,
  error,
  setText,
  blur,
  save,
  cancel,
}: OdometerViewModel) {
  const theme = useTheme();
  const typed = parseWholeNumber(text);
  const delta = typed !== null && typed > currentKm ? typed - currentKm : null;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title="Update odometer"
          context={loadState === 'ready' ? title : undefined}
          leading={
            <IconButton
              accessibilityLabel="Close"
              onPress={cancel}
              disabled={saving}
              icon={(c) => <CloseIcon size={20} color={c} />}
            />
          }
        />

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : loadState !== 'ready' || !bike ? (
          <View style={styles.content}>
            <ErrorMessage>{error ?? 'This motorcycle no longer exists.'}</ErrorMessage>
            <Button label="Back to garage" variant="secondary" onPress={cancel} />
          </View>
        ) : (
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive">
              <Panel>
                <ThemedText type="eyebrow" themeColor="textSecondary">
                  On the dash now
                </ThemedText>
                <OdometerReadout km={currentKm} size="lg" />
                {delta !== null ? (
                  <ThemedText type="readout" style={{ color: theme.success }}>
                    +{formatKm(delta)} km since the last reading
                  </ThemedText>
                ) : null}
              </Panel>

              <Section title="New reading">
                <FormField
                  label="Odometer"
                  mono
                  suffix="km"
                  value={text}
                  onChangeText={setText}
                  onBlur={blur}
                  onSubmitEditing={save}
                  returnKeyType="done"
                  error={fieldError}
                  hint="The number on your dashboard right now."
                  placeholder={formatKm(currentKm)}
                  keyboardType="number-pad"
                  maxLength={String(BIKE_LIMITS.odometerMax).length + 2}
                  autoFocus
                  editable={!saving}
                />
              </Section>

              <Section
                title="History"
                description={readings.length >= HISTORY_LIMIT ? `Your last ${HISTORY_LIMIT} readings.` : undefined}>
                {readingsLoading ? (
                  <ActivityIndicator />
                ) : readings.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No readings yet. Your updates will be listed here.
                  </ThemedText>
                ) : (
                  <View>
                    {readings.map((reading, i) => (
                      <Fragment key={reading.id}>
                        {i > 0 ? <Rule /> : null}
                        <HistoryRow reading={reading} previous={readings[i + 1]} isLatest={i === 0} />
                      </Fragment>
                    ))}
                  </View>
                )}
              </Section>
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
              <View style={styles.footerInner}>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <Button label="Save reading" onPress={save} loading={saving} disabled={saving} />
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function HistoryRow({
  reading,
  previous,
  isLatest,
}: {
  reading: WithId<OdometerReading>;
  previous: WithId<OdometerReading> | undefined;
  isLatest: boolean;
}) {
  const theme = useTheme();
  const diff = previous ? reading.odometerKm - previous.odometerKm : null;
  const diffText = diff === null ? 'First reading' : `${diff >= 0 ? '+' : '−'}${formatKm(Math.abs(diff))} km`;
  const date = formatDate(reading);

  return (
    <View
      style={styles.historyRow}
      accessible
      accessibilityLabel={`${date}: ${formatKm(reading.odometerKm)} kilometres, ${diffText}`}>
      <ThemedText type="readout" themeColor="textSecondary" style={styles.historyDate} numberOfLines={1}>
        {date}
      </ThemedText>
      <ThemedText type="readout" style={[styles.historyValue, isLatest && styles.historyLatest]}>
        {formatKm(reading.odometerKm)}
      </ThemedText>
      <ThemedText
        type="readout"
        style={[styles.historyDiff, { color: diff !== null && diff > 0 ? theme.success : theme.textSecondary }]}>
        {diffText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    marginTop: Spacing.five,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  historyDate: {
    flex: 1,
    fontSize: 12,
  },
  historyValue: {
    fontSize: 15,
  },
  historyLatest: {
    fontWeight: 700,
  },
  historyDiff: {
    minWidth: 96,
    textAlign: 'right',
    fontSize: 12,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  footerInner: {
    gap: Spacing.two + 4,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
  },
});
