import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomDrawer, useCloseDrawer } from '@/components/bottom-drawer';
import { useConfirmDrawer } from '@/components/confirm-drawer';
import { CameraIcon, ChevronLeftIcon, DocumentIcon, ExpandIcon, ImageIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, Radius, ScreenHeader } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { DocumentDetailViewModel } from '../model/document-detail-view-model';
import { DOCUMENT_TYPE_LABELS, formatDate, formatExpiry } from '../model/documents';
import type { PhotoSource } from '../model/pick-photo';
import { StatusBadge, useExpiryColor } from './parts';

const CONTENT_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function DocumentDetailView({
  loadState,
  document,
  bikeName,
  photoUrl,
  photoFailed,
  deleting,
  replacing,
  replaceProgress,
  checkingPhoto,
  busy,
  error,
  edit,
  viewPhoto,
  replacePhoto,
  remove,
  back,
}: DocumentDetailViewModel) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();
  const [sourceDrawerOpen, setSourceDrawerOpen] = useState(false);
  const expiryColor = useExpiryColor(document?.expiresAt ?? null);

  return (
    <ThemedView style={styles.root}>
      {drawer}
      <BottomDrawer open={sourceDrawerOpen} onClosed={() => setSourceDrawerOpen(false)} dismissLabel="Cancel">
        <PhotoSourceChoices onChoose={replacePhoto} />
      </BottomDrawer>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title={document?.title ?? 'Document'}
          context={document ? DOCUMENT_TYPE_LABELS[document.type] : 'Vault'}
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={back}
              disabled={busy}
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
            <Pressable
              onPress={viewPhoto}
              disabled={!photoUrl || replacing}
              style={({ pressed }) => [
                styles.photo,
                { backgroundColor: theme.backgroundSelected, borderColor: theme.line },
                pressed && styles.pressed,
              ]}
              accessibilityRole={photoUrl ? 'imagebutton' : 'image'}
              accessibilityLabel={`Photo of ${document.title}`}
              accessibilityHint={photoUrl ? 'Opens the photo full screen' : undefined}>
              {photoUrl ? (
                <>
                  <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
                  <View style={[styles.expand, { backgroundColor: theme.background, borderColor: theme.line }]}>
                    <ExpandIcon size={16} color={theme.text} />
                  </View>
                </>
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
              {replacing ? <UploadOverlay progress={replaceProgress ?? 0} checking={checkingPhoto} /> : null}
            </Pressable>

            <View style={styles.statusRow}>
              <StatusBadge expiresAt={document.expiresAt} />
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
              <Button
                label="Replace photo"
                variant="secondary"
                icon={(c) => <CameraIcon size={18} color={c} />}
                loading={replacing}
                disabled={busy}
                onPress={() => setSourceDrawerOpen(true)}
              />
              <Button label="Edit details" variant="secondary" onPress={edit} disabled={busy} />
              <Button
                label="Delete document"
                variant="danger"
                loading={deleting}
                disabled={replacing}
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

/** Camera or gallery, for the replacement photo. */
function PhotoSourceChoices({ onChoose }: { onChoose: (source: PhotoSource) => void }) {
  const close = useCloseDrawer();
  return (
    <View style={styles.sourceSheet}>
      <View style={styles.sourceText}>
        <ThemedText style={styles.sheetTitle} accessibilityRole="header">
          Replace photo
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          The new photo takes the old one’s place. Type, motorcycle and expiry stay the same.
        </ThemedText>
      </View>
      <View style={styles.actions}>
        <Button
          label="Take a photo"
          icon={(c) => <CameraIcon size={18} color={c} />}
          onPress={() => close(() => onChoose('camera'))}
        />
        <Button
          label="Choose from gallery"
          variant="secondary"
          icon={(c) => <ImageIcon size={18} color={c} />}
          onPress={() => close(() => onChoose('library'))}
        />
      </View>
    </View>
  );
}

/** Dims the photo while the replacement is checked, then shows the upload percentage. */
function UploadOverlay({ progress, checking }: { progress: number; checking: boolean }) {
  const theme = useTheme();
  const percent = Math.round(progress * 100);
  return (
    <View
      style={[StyleSheet.absoluteFill, styles.overlay]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={checking ? 'Checking the new photo' : 'Uploading the new photo'}
      accessibilityValue={checking ? undefined : { min: 0, max: 100, now: percent }}>
      <ActivityIndicator color="#FFFFFF" />
      <ThemedText type="smallBold" style={styles.overlayText}>
        {checking ? 'Checking the photo…' : `Uploading ${percent}%`}
      </ThemedText>
      {checking ? null : (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: theme.accent }]} />
        </View>
      )}
    </View>
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
  pressed: {
    opacity: 0.85,
  },
  expand: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  overlayText: {
    color: '#FFFFFF',
  },
  progressTrack: {
    width: '60%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: -Spacing.two,
  },
  sourceSheet: {
    gap: Spacing.four,
  },
  sourceText: {
    gap: Spacing.two,
  },
  sheetTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
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
