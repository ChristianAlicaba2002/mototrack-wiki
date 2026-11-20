import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { BIKE_LIMITS, type BikeFormValues } from '../model/bike-form';
import type { BikeFormViewModel } from '../model/bike-form-view-model';
import { Button, ErrorMessage, FormField, IconButton, Panel, ScreenHeader, Section } from './controls';

const FORM_MAX_WIDTH = 560;

/** Alert.alert has no buttons on web, so fall back to the browser's confirm dialog. */
function confirmDelete(name: string, onConfirm: () => void) {
  const title = `Delete ${name}?`;
  const message = 'This removes the motorcycle from your garage. This can’t be undone.';
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

/** Presentational only — all state and actions come from the view model. */
export function BikeFormView({
  isEdit,
  values,
  errors,
  loadState,
  pending,
  error,
  displayName,
  setField,
  blurField,
  save,
  remove,
  cancel,
}: BikeFormViewModel) {
  const theme = useTheme();
  const busy = pending !== null;
  const ready = loadState === 'ready';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title={isEdit ? 'Edit motorcycle' : 'New motorcycle'}
          context={isEdit ? 'Garage' : 'Add to garage'}
          leading={
            <IconButton
              accessibilityLabel="Close"
              onPress={cancel}
              disabled={busy}
              icon={(c) => <CloseIcon size={20} color={c} />}
            />
          }
        />

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : !ready ? (
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
              <Preview values={values} />

              <Section title="Basics">
                <FormField
                  label="Make"
                  value={values.make}
                  onChangeText={(t) => setField('make', t)}
                  onBlur={() => blurField('make')}
                  error={errors.make}
                  placeholder="Honda, Yamaha, Kawasaki…"
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={BIKE_LIMITS.makeMax}
                  editable={!busy}
                />
                <FormField
                  label="Model"
                  value={values.model}
                  onChangeText={(t) => setField('model', t)}
                  onBlur={() => blurField('model')}
                  error={errors.model}
                  placeholder="e.g. Click 125i"
                  autoCorrect={false}
                  maxLength={BIKE_LIMITS.modelMax}
                  editable={!busy}
                />
              </Section>

              <Section title="Specs">
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <FormField
                      label="Engine"
                      mono
                      suffix="cc"
                      value={values.engineCc}
                      onChangeText={(t) => setField('engineCc', t)}
                      onBlur={() => blurField('engineCc')}
                      error={errors.engineCc}
                      placeholder="125"
                      keyboardType="number-pad"
                      maxLength={5}
                      editable={!busy}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <FormField
                      label="Year"
                      mono
                      value={values.year}
                      onChangeText={(t) => setField('year', t)}
                      onBlur={() => blurField('year')}
                      error={errors.year}
                      placeholder={String(new Date().getFullYear())}
                      keyboardType="number-pad"
                      maxLength={4}
                      editable={!busy}
                    />
                  </View>
                </View>
                <FormField
                  label="Odometer"
                  mono
                  suffix="km"
                  value={values.odometerKm}
                  onChangeText={(t) => setField('odometerKm', t)}
                  onBlur={() => blurField('odometerKm')}
                  error={errors.odometerKm}
                  hint="The current reading on your dashboard."
                  placeholder="12,500"
                  keyboardType="number-pad"
                  maxLength={9}
                  editable={!busy}
                />
              </Section>

              <Section title="Details">
                <FormField
                  label="Nickname"
                  optional
                  value={values.nickname}
                  onChangeText={(t) => setField('nickname', t)}
                  onBlur={() => blurField('nickname')}
                  error={errors.nickname}
                  placeholder="e.g. Daily rider"
                  maxLength={BIKE_LIMITS.nicknameMax}
                  editable={!busy}
                />
                <FormField
                  label="Plate number"
                  mono
                  optional
                  value={values.plateNumber}
                  onChangeText={(t) => setField('plateNumber', t)}
                  onBlur={() => blurField('plateNumber')}
                  error={errors.plateNumber}
                  placeholder="ABC 1234"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={BIKE_LIMITS.plateMax}
                  editable={!busy}
                />
              </Section>

              {isEdit && (
                <Button
                  label="Delete motorcycle"
                  variant="danger"
                  onPress={() => confirmDelete(displayName, remove)}
                  loading={pending === 'delete'}
                  disabled={busy}
                />
              )}
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
              <View style={styles.footerInner}>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <Button
                  label={isEdit ? 'Save changes' : 'Add to garage'}
                  onPress={save}
                  loading={pending === 'save'}
                  disabled={busy}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

/** Live preview of the bike as it will appear in the garage. */
function Preview({ values }: { values: BikeFormValues }) {
  const theme = useTheme();
  const name = `${values.make.trim()} ${values.model.trim()}`.trim();
  const title = values.nickname.trim() || name || 'Your motorcycle';
  const specs = [
    values.nickname.trim() ? name : '',
    values.year.trim(),
    values.engineCc.trim() && `${values.engineCc.trim()} cc`,
  ].filter(Boolean);
  const plate = values.plateNumber.trim().toUpperCase();

  return (
    <Panel style={styles.preview}>
      <View accessible={false} style={styles.previewText}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Preview
        </ThemedText>
        <ThemedText style={styles.previewTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {specs.length > 0 ? specs.join(' · ') : 'Fill in the details below'}
        </ThemedText>
      </View>
      {plate ? (
        <ThemedText type="readout" style={[styles.plate, { borderColor: theme.text }]}>
          {plate}
        </ThemedText>
      ) : null}
    </Panel>
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
  preview: {
    gap: Spacing.three,
  },
  previewText: {
    gap: 2,
  },
  previewTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  plate: {
    alignSelf: 'flex-start',
    fontWeight: 700,
    letterSpacing: 1,
    borderWidth: 1.5,
    borderRadius: 3,
    paddingHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
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
