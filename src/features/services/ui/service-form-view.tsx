import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { BIKE_LIMITS } from '@/features/garage/model/bike-form';
import {
  Button,
  ErrorMessage,
  FormField,
  IconButton,
  Radius,
  ScreenHeader,
  Section,
} from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { ServiceType } from '@/lib/firestore/types';

import { CURRENCY_SYMBOL } from '../model/format';
import {
  addDays,
  sameDay,
  SERVICE_LIMITS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ORDER,
  startOfDay,
} from '../model/service-form';
import type { ServiceFormViewModel } from '../model/service-form-view-model';
import { DateField } from './date-field';

const FORM_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function ServiceFormView({
  isEdit,
  bikeName,
  values,
  errors,
  odometerHint,
  minimumDate,
  maximumDate,
  loadState,
  pending,
  error,
  setField,
  setType,
  setDate,
  blurField,
  save,
  cancel,
}: ServiceFormViewModel) {
  const theme = useTheme();
  const busy = pending !== null;
  const ready = loadState === 'ready';

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title={isEdit ? 'Edit entry' : 'Log a service'}
          context={ready ? bikeName : undefined}
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
            <ErrorMessage>{error ?? 'This service or motorcycle no longer exists.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={cancel} />
          </View>
        ) : (
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive">
              <Section title="What was done">
                <TypePicker value={values.type} onChange={setType} error={errors.type} disabled={busy} />
                <FormField
                  label="Title"
                  optional
                  value={values.title}
                  onChangeText={(t) => setField('title', t)}
                  onBlur={() => blurField('title')}
                  error={errors.title}
                  hint={values.type ? `Leave empty to use “${SERVICE_TYPE_LABELS[values.type]}”.` : undefined}
                  placeholder={values.type ? SERVICE_TYPE_LABELS[values.type] : 'e.g. Front brake pads'}
                  maxLength={SERVICE_LIMITS.titleMax}
                  editable={!busy}
                />
              </Section>

              <Section title="When">
                <View style={styles.field}>
                  <DateField
                    label="Date"
                    value={values.date}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={setDate}
                    onClose={() => blurField('date')}
                    error={errors.date}
                    hint="The day the work was done."
                    disabled={busy}
                  />
                  <DateShortcuts
                    value={values.date}
                    minimumDate={minimumDate}
                    onPick={setDate}
                    disabled={busy}
                  />
                </View>
                <FormField
                  label="Odometer"
                  mono
                  suffix="km"
                  value={values.odometerKm}
                  onChangeText={(t) => setField('odometerKm', t)}
                  onBlur={() => blurField('odometerKm')}
                  error={errors.odometerKm}
                  hint={odometerHint}
                  placeholder="12,500"
                  keyboardType="number-pad"
                  maxLength={String(BIKE_LIMITS.odometerMax).length + 2}
                  editable={!busy}
                />
              </Section>

              <Section title="Cost & notes">
                <FormField
                  label="Cost"
                  mono
                  optional
                  suffix={CURRENCY_SYMBOL}
                  value={values.cost}
                  onChangeText={(t) => setField('cost', t)}
                  onBlur={() => blurField('cost')}
                  error={errors.cost}
                  hint="Parts and labor together."
                  placeholder="450"
                  keyboardType="decimal-pad"
                  maxLength={14}
                  editable={!busy}
                />
                <FormField
                  label="Notes"
                  optional
                  value={values.notes}
                  onChangeText={(t) => setField('notes', t)}
                  onBlur={() => blurField('notes')}
                  error={errors.notes}
                  placeholder="Shop, parts used, oil brand…"
                  multiline
                  maxLength={SERVICE_LIMITS.notesMax}
                  editable={!busy}
                />
              </Section>
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
              <View style={styles.footerInner}>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <Button
                  label={isEdit ? 'Save changes' : 'Save service'}
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

function TypePicker({
  value,
  onChange,
  error,
  disabled,
}: {
  value: ServiceType | null;
  onChange: (type: ServiceType) => void;
  error?: string;
  disabled: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">Type</ThemedText>
      <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel="Service type">
        {SERVICE_TYPE_ORDER.map((type) => {
          const selected = type === value;
          return (
            <Pill
              key={type}
              label={SERVICE_TYPE_LABELS[type]}
              selected={selected}
              onPress={() => onChange(type)}
              disabled={disabled}
              role="radio"
            />
          );
        })}
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

function DateShortcuts({
  value,
  minimumDate,
  onPick,
  disabled,
}: {
  value: Date;
  minimumDate: Date;
  onPick: (date: Date) => void;
  disabled: boolean;
}) {
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  return (
    <View style={styles.pills}>
      <Pill
        label="Today"
        selected={sameDay(value, today)}
        onPress={() => onPick(today)}
        disabled={disabled}
        role="button"
      />
      <Pill
        label="Yesterday"
        selected={sameDay(value, yesterday)}
        onPress={() => onPick(yesterday)}
        disabled={disabled || yesterday < minimumDate}
        role="button"
      />
    </View>
  );
}

function Pill({
  label,
  selected,
  onPress,
  disabled,
  role,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled: boolean;
  role: 'radio' | 'button';
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === 'radio' ? { checked: selected, disabled } : { selected, disabled }}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? theme.text : 'transparent',
          borderColor: selected ? theme.text : theme.line,
        },
        pressed && styles.pillPressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
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
  field: {
    gap: Spacing.two,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    minHeight: 38,
    paddingHorizontal: Spacing.three - 2,
    borderRadius: Radius.field,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPressed: {
    opacity: 0.8,
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
