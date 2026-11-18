import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon, GaugeIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { OdometerReading } from '@/lib/firestore/types';

import { BIKE_LIMITS, parseWholeNumber } from '../model/bike-form';
import { formatKm } from '../model/odometer';
import { HISTORY_LIMIT, type OdometerViewModel } from '../model/odometer-view-model';
import { Button, ErrorMessage, FormField, IconButton, Radius, Section } from './controls';

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
        <View style={styles.header}>
          <IconButton
            accessibilityLabel="Close"
            onPress={cancel}
            disabled={saving}
            icon={(c) => <CloseIcon size={20} color={c} />}
          />
          <ThemedText type="smallBold" style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
            Update odometer
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} />
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
              <View
                style={[styles.hero, { backgroundColor: theme.accentSoft }]}
                accessible
                accessibilityLabel={`${title}, current odometer ${formatKm(currentKm)} kilometres`}>
                <View style={[styles.heroBadge, { backgroundColor: theme.accent }]}>
                  <GaugeIcon size={28} color={theme.onAccent} />
                </View>
                <View style={styles.heroText}>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {title} · current reading
                  </ThemedText>
                  <View style={styles.heroValueRow}>
                    <ThemedText style={styles.heroValue}>{formatKm(currentKm)}</ThemedText>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      km
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Section title="New reading">
                <FormField
                  label="Odometer"
                  icon={(c) => <GaugeIcon size={18} color={c} />}
                  suffix="km"
                  value={text}
                  onChangeText={setText}
                  onBlur={blur}
                  onSubmitEditing={save}
                  returnKeyType="done"
                  error={fieldError}
                  hint={
                    delta !== null
                      ? `+${formatKm(delta)} km since the last reading.`
                      : 'The number on your dashboard right now.'
                  }
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
                  readings.map((reading, i) => (
                    <HistoryRow key={reading.id} reading={reading} previous={readings[i + 1]} isLatest={i === 0} />
                  ))
                )}
              </Section>
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.backgroundSelected, backgroundColor: theme.background }]}>
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
      <View style={[styles.historyDot, { backgroundColor: isLatest ? theme.accent : theme.backgroundSelected }]} />
      <View style={styles.historyText}>
        <ThemedText style={styles.historyValue}>{formatKm(reading.odometerKm)} km</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {date}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={{ color: diff !== null && diff > 0 ? theme.success : theme.textSecondary }}>
        {diffText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  headerTitle: {
    fontSize: 17,
  },
  headerSpacer: {
    width: 40,
  },
  loader: {
    marginTop: Spacing.five,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: FORM_MAX_WIDTH,
    alignSelf: 'center',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    gap: Spacing.half,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  heroValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyText: {
    flex: 1,
    gap: Spacing.half,
  },
  historyValue: {
    fontWeight: 700,
    fontVariant: ['tabular-nums'],
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
