import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatKm } from '@/features/garage/model/odometer';
import {
  Button,
  ErrorMessage,
  FormField,
  IconButton,
  ScreenHeader,
  Section,
  TextAction,
} from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from '../model/service-form';
import type { ServiceIntervalsViewModel } from '../model/service-intervals-view-model';

const FORM_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function ServiceIntervalsView({
  loading,
  values,
  errors,
  defaults,
  isDefault,
  saving,
  error,
  setValue,
  resetToDefaults,
  save,
  cancel,
}: ServiceIntervalsViewModel) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title="Service intervals"
          context="Settings"
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={cancel}
              disabled={saving}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : (
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive">
              <ThemedText type="small" themeColor="textSecondary">
                How many km between services of each kind. When you log a service, its next due reading is the
                odometer plus this. Check your owner’s manual or the bike’s spec sheet in the wiki. Leave a field
                empty for no reminder.
              </ThemedText>

              <Section title="Every" plain>
                {SERVICE_TYPE_ORDER.map((type) => (
                  <FormField
                    key={type}
                    label={SERVICE_TYPE_LABELS[type]}
                    optional
                    mono
                    suffix="km"
                    value={values[type]}
                    onChangeText={(text) => setValue(type, text)}
                    error={errors[type]}
                    hint={
                      defaults[type] === null ? 'No reminder by default.' : `Default: ${formatKm(defaults[type])} km.`
                    }
                    placeholder="No reminder"
                    keyboardType="number-pad"
                    maxLength={7}
                    editable={!saving}
                  />
                ))}
              </Section>

              {!isDefault ? (
                <View style={styles.reset}>
                  <TextAction label="Reset to defaults" tone="text" onPress={resetToDefaults} disabled={saving} />
                </View>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
              <View style={styles.footerInner}>
                <ThemedText type="small" themeColor="textSecondary">
                  Applies to services you log or edit from now on.
                </ThemedText>
                {error ? <ErrorMessage>{error}</ErrorMessage> : null}
                <Button label="Save intervals" onPress={save} loading={saving} disabled={saving} />
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </ThemedView>
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
  reset: {
    alignItems: 'flex-start',
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
