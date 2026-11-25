import { Image } from 'expo-image';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConfirmDrawer } from '@/components/confirm-drawer';
import { ChevronLeftIcon, DocumentIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, Radius, ScreenHeader } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { DocumentDetailViewModel } from '../model/document-detail-view-model';
import { DOCUMENT_TYPE_LABELS, formatDate, formatExpiry } from '../model/documents';
import { useExpiryColor } from './parts';

const CONTENT_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function DocumentDetailView({
  loadState,
  document,
  bikeName,
  photoUrl,
  photoFailed,
  deleting,
  error,
  edit,
  remove,
  back,
}: DocumentDetailViewModel) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();
  const expiryColor = useExpiryColor(document?.expiresAt ?? null);

  return (
    <ThemedView style={styles.root}>
      {drawer}
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title={document?.title ?? 'Document'}
          context={document ? DOCUMENT_TYPE_LABELS[document.type] : 'Vault'}
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={back}
              disabled={deleting}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />

        {loadState === 'loading' ? (
          <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
        ) : !document ? (
          <View style={styles.content}>
            <ErrorMessage>{error ?? 'This document was deleted.'}</ErrorMessage>
            <Button label="Back" variant="secondary" onPress={back} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <View
              style={[styles.photo, { backgroundColor: theme.backgroundSelected, borderColor: theme.line }]}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Photo of ${document.title}`}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
              ) : photoFailed ? (
                <View style={styles.photoMessage}>
                  <DocumentIcon size={28} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    The photo couldn’t be loaded. Check your connection.
                  </ThemedText>
                </View>
              ) : (
                <ActivityIndicator color={theme.textSecondary} />
              )}
            </View>

            <View style={[styles.facts, { borderTopColor: theme.text }]}>
              <Fact label="Type" value={DOCUMENT_TYPE_LABELS[document.type]} />
              <Fact label="Motorcycle" value={bikeName ?? '—'} />
              <Fact
                label="Expiry"
                value={document.expiresAt ? formatDate(document.expiresAt.toDate()) : 'No expiry'}
                note={document.expiresAt ? formatExpiry(document.expiresAt) : undefined}
                noteColor={expiryColor}
              />
              <Fact label="Added" value={document.createdAt ? formatDate(document.createdAt.toDate()) : 'Just now'} />
            </View>

            {error ? <ErrorMessage>{error}</ErrorMessage> : null}
            <View style={styles.actions}>
              <Button label="Edit document" variant="secondary" onPress={edit} disabled={deleting} />
              <Button
                label="Delete document"
                variant="danger"
                loading={deleting}
                onPress={() =>
                  confirm({
                    title: `Delete “${document.title}”?`,
                    message: 'The photo and its details will be removed from your vault. This can’t be undone.',
                    confirmLabel: 'Delete document',
                    tone: 'danger',
                    onConfirm: remove,
                  })
                }
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function Fact({ label, value, note, noteColor }: { label: string; value: string; note?: string; noteColor?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.fact, { borderBottomColor: theme.line }]}
      accessible
      accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.factValues}>
        <ThemedText type="readout" style={styles.factValue} numberOfLines={1}>
          {value}
        </ThemedText>
        {note ? (
          <ThemedText type="small" style={{ color: noteColor }} numberOfLines={1}>
            {note}
          </ThemedText>
        ) : null}
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
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  photo: {
    aspectRatio: 3 / 4,
    maxHeight: 520,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMessage: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  facts: {
    borderTopWidth: 2,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  factValues: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  factValue: {
    fontFamily: Fonts.monoMedium,
    fontSize: 15,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
