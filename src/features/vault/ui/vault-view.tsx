import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, PlusIcon } from '@/components/icons/line-icons';
import { TabScreen } from '@/components/screen/tab-screen';
import { SkeletonBlock, SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { VaultDocument } from '@/lib/firestore/types';

import { DOCUMENT_TYPE_LABELS, formatExpiry } from '../model/documents';
import type { VaultViewModel } from '../model/vault-view-model';
import { ChoicePills, DocumentThumb, ExpiryText, StatusBadge } from './parts';

/** Presentational only — all state and actions come from the view model. */
export function VaultView({
  loading,
  documents,
  hasDocuments,
  filter,
  filterOptions,
  setFilter,
  expiredCount,
  expiringSoonCount,
  bikeName,
  error,
  refreshing,
  refresh,
  addDocument,
  openDocument,
}: VaultViewModel) {
  return (
    <TabScreen
      summary="Your OR/CR, insurance and license, ready when you’re stopped."
      action={
        <IconButton
          variant="primary"
          accessibilityLabel="Add a document"
          onPress={addDocument}
          icon={(c) => <PlusIcon size={20} color={c} />}
        />
      }
      onRefresh={refresh}
      refreshing={refreshing}>
      {error && hasDocuments ? <ErrorMessage>{error}</ErrorMessage> : null}

      {loading ? (
        <VaultSkeleton />
      ) : error && !hasDocuments ? (
        <EmptyState
          eyebrow="Couldn’t load"
          title="The vault didn’t load."
          message={error}
          action={<TextAction label="Try again" onPress={refresh} disabled={refreshing} />}
        />
      ) : !hasDocuments ? (
        <EmptyState
          eyebrow="Empty vault"
          title="Keep your papers on your phone."
          message="Photograph your OR/CR, insurance and driver’s license. MotoTrack shows when each one expires."
          action={<Button label="Add your first document" onPress={addDocument} />}
        />
      ) : (
        <>
          <AttentionBanner expired={expiredCount} soon={expiringSoonCount} />
          {filterOptions.length > 0 ? (
            <ChoicePills
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              accessibilityLabel="Filter documents by status"
            />
          ) : null}
          <View>
            {documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                bikeName={bikeName(document.bikeId)}
                onPress={() => openDocument(document.id)}
              />
            ))}
          </View>
        </>
      )}
    </TabScreen>
  );
}

/** "1 expired · 2 expiring soon": shown only when something needs renewing. */
function AttentionBanner({ expired, soon }: { expired: number; soon: number }) {
  const theme = useTheme();
  if (expired === 0 && soon === 0) return null;
  const parts = [
    expired > 0 ? `${expired} expired` : null,
    soon > 0 ? `${soon} expiring within 30 days` : null,
  ].filter(Boolean);
  const color = expired > 0 ? theme.danger : theme.brand;
  return (
    <View style={[styles.banner, { borderLeftColor: color }]} accessibilityRole="alert">
      <ThemedText type="smallBold" style={{ color }}>
        {parts.join(' · ')}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Renew before you ride. They’re listed first below.
      </ThemedText>
    </View>
  );
}

function DocumentRow({
  document,
  bikeName,
  onPress,
}: {
  document: WithId<VaultDocument>;
  bikeName: string | undefined;
  onPress: () => void;
}) {
  const theme = useTheme();
  const meta = [DOCUMENT_TYPE_LABELS[document.type], bikeName].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${document.title}, ${meta}, ${formatExpiry(document.expiresAt)}`}
      accessibilityHint="Opens the document"
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: theme.line },
        pressed && { backgroundColor: theme.backgroundSelected },
      ]}>
      <DocumentThumb document={document} />
      <View style={styles.rowText}>
        <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
          {meta}
        </ThemedText>
        <ThemedText style={styles.rowTitle} numberOfLines={1}>
          {document.title}
        </ThemedText>
        <View style={styles.rowStatus}>
          <StatusBadge expiresAt={document.expiresAt} />
          {document.expiresAt ? <ExpiryText expiresAt={document.expiresAt} style={styles.rowExpiry} /> : null}
        </View>
      </View>
      <ChevronRightIcon size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function VaultSkeleton() {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel="Loading your documents" accessibilityState={{ busy: true }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.row, { borderTopColor: theme.line }]}>
          <SkeletonBlock width={56} height={56} radius={6} />
          <View style={styles.rowText}>
            <SkeletonText lineHeight={14} fontSize={11} width="35%" />
            <SkeletonText lineHeight={23} fontSize={17} width="60%" />
            <SkeletonText lineHeight={20} fontSize={14} width="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  eyebrow,
  title,
  message,
  action,
}: {
  eyebrow: string;
  title: string;
  message: string;
  action: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.center}>
        {eyebrow}
      </ThemedText>
      <ThemedText style={[styles.emptyTitle, styles.center]}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.emptyMessage]}>
        {message}
      </ThemedText>
      <View style={styles.emptyAction}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 2,
    borderLeftWidth: 3,
    paddingLeft: Spacing.three - 4,
    paddingVertical: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.three - 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  rowExpiry: {
    flexShrink: 1,
  },
  rowTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 23,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  center: {
    textAlign: 'center',
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  emptyMessage: {
    maxWidth: 300,
  },
  emptyAction: {
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
});
