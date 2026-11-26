import { Image } from 'expo-image';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraIcon, CloseIcon, ImageIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  Button,
  ErrorMessage,
  FormField,
  IconButton,
  Radius,
  ScreenHeader,
  Section,
} from '@/features/garage/ui/controls';
import { DateField } from '@/features/services/ui/date-field';
import { useTheme } from '@/hooks/use-theme';

import { DOCUMENT_TYPE_DESCRIPTIONS, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ORDER } from '../model/documents';
import {
  DOCUMENT_TITLE_MAX,
  type DocumentFormViewModel,
  EXPIRY_MAX_DATE,
  EXPIRY_MIN_DATE,
} from '../model/document-form-view-model';
import { ChoicePills } from './parts';

const FORM_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function DocumentFormView({
  isEdit,
  loadState,
  values,
  bikes,
  photoUri,
  titlePlaceholder,
  titleError,
  photoError,
  progress,
  checking,
  busy,
  error,
  setType,
  setTitle,
  setBike,
  setHasExpiry,
  setExpiresAt,
  takePhoto,
  choosePhoto,
  save,
  cancel,
}: DocumentFormViewModel) {
  const theme = useTheme();
  const ready = loadState === 'ready' && values !== null;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title={isEdit ? 'Edit document' : 'Add a document'}
          context="Vault"
          leading={
            <IconButton
              accessibilityLabel="Close"
              variant="plain"
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
            <ErrorMessage>{error ?? 'This document was deleted.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={cancel} />
          </View>
        ) : (
          <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive">
              <Section title="Photo" plain>
                <PhotoPicker
                  uri={photoUri}
                  error={photoError}
                  disabled={busy}
                  onTakePhoto={takePhoto}
                  onChoosePhoto={choosePhoto}
                />
              </Section>

              <Section title="What is it" plain>
                <View style={styles.field}>
                  <ChoicePills
                    accessibilityLabel="Document type"
                    options={DOCUMENT_TYPE_ORDER.map((type) => ({ value: type, label: DOCUMENT_TYPE_LABELS[type] }))}
                    value={values.type}
                    onChange={setType}
                    disabled={busy}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    {DOCUMENT_TYPE_DESCRIPTIONS[values.type]}
                  </ThemedText>
                </View>
                <FormField
                  label="Title"
                  optional
                  value={values.title}
                  onChangeText={setTitle}
                  error={titleError}
                  hint={`Leave empty to use “${titlePlaceholder}”.`}
                  placeholder={titlePlaceholder}
                  maxLength={DOCUMENT_TITLE_MAX + 10}
                  editable={!busy}
                />
                {bikes.length > 0 ? (
                  <View style={styles.field}>
                    <ThemedText type="smallBold">Motorcycle</ThemedText>
                    <ChoicePills
                      accessibilityLabel="Motorcycle"
                      options={[
                        ...bikes.map((b) => ({ value: b.id as string | null, label: b.name })),
                        { value: null, label: 'Not for a bike' },
                      ]}
                      value={values.bikeId}
                      onChange={setBike}
                      disabled={busy}
                    />
                  </View>
                ) : null}
              </Section>

              <Section title="Expiry" plain>
                <Pressable
                  onPress={() => setHasExpiry(!values.hasExpiry)}
                  disabled={busy}
                  accessible
                  accessibilityRole="switch"
                  accessibilityLabel="It expires"
                  accessibilityState={{ checked: values.hasExpiry, disabled: busy }}
                  style={styles.switchRow}>
                  <View style={styles.switchText}>
                    <ThemedText type="smallBold">It expires</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      MotoTrack shows a warning 30 days before.
                    </ThemedText>
                  </View>
                  <Switch
                    value={values.hasExpiry}
                    onValueChange={setHasExpiry}
                    disabled={busy}
                    trackColor={{ false: theme.line, true: theme.accent }}
                    thumbColor={theme.backgroundElement}
                    ios_backgroundColor={theme.line}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                </Pressable>
                {values.hasExpiry ? (
                  <DateField
                    label="Valid until"
                    value={values.expiresAt}
                    minimumDate={EXPIRY_MIN_DATE}
                    maximumDate={EXPIRY_MAX_DATE}
                    onChange={setExpiresAt}
                    hint="The last day printed on the document."
                    disabled={busy}
                  />
                ) : null}
              </Section>
            </ScrollView>

            <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
              <View style={styles.footerInner}>
                {error ? <ErrorMessage>{error}</ErrorMessage> : null}
                {checking ? <CheckingPhoto /> : null}
                {progress !== null ? <UploadProgress progress={progress} /> : null}
                <Button
                  label={isEdit ? 'Save changes' : 'Save document'}
                  onPress={save}
                  loading={busy}
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

function PhotoPicker({
  uri,
  error,
  disabled,
  onTakePhoto,
  onChoosePhoto,
}: {
  uri: string | null;
  error?: string;
  disabled: boolean;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <View
        style={[
          styles.preview,
          {
            backgroundColor: theme.backgroundSelected,
            borderColor: error ? theme.danger : theme.line,
            borderStyle: uri ? 'solid' : 'dashed',
          },
        ]}
        accessible
        accessibilityLabel={uri ? 'Photo of the document' : 'No photo yet'}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
        ) : (
          <View style={styles.previewEmpty}>
            <CameraIcon size={28} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Lay the paper flat in good light, and fit all four corners in the frame.
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.photoButtons}>
        <View style={styles.photoButton}>
          <Button
            label={uri ? 'Retake' : 'Take photo'}
            variant={uri ? 'secondary' : 'primary'}
            onPress={onTakePhoto}
            disabled={disabled}
            icon={(c) => <CameraIcon size={18} color={c} />}
          />
        </View>
        <View style={styles.photoButton}>
          <Button
            label="From gallery"
            variant="secondary"
            onPress={onChoosePhoto}
            disabled={disabled}
            icon={(c) => <ImageIcon size={18} color={c} />}
          />
        </View>
      </View>
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Shown while the photo is checked against the chosen document type. */
function CheckingPhoto() {
  return (
    <View style={styles.progress} accessible accessibilityLabel="Checking the photo" accessibilityState={{ busy: true }}>
      <ThemedText type="readout" themeColor="textSecondary">
        Checking the photo…
      </ThemedText>
    </View>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  const theme = useTheme();
  const percent = Math.round(progress * 100);
  return (
    <View
      style={styles.progress}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      accessibilityLabel="Uploading photo">
      <ThemedText type="readout" themeColor="textSecondary">
        {percent < 100 ? `Uploading photo… ${percent}%` : 'Saving…'}
      </ThemedText>
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { backgroundColor: theme.accent, width: `${percent}%` }]} />
      </View>
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
  field: {
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  preview: {
    aspectRatio: 4 / 3,
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmpty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  photoButton: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 48,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  progress: {
    gap: Spacing.one + 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
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
