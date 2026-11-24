import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, PlusIcon } from '@/components/icons/line-icons';
import { TabScreen } from '@/components/screen/tab-screen';
import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { ErrorMessage, IconButton } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { ChatListViewModel, ChatRowItem } from '../model/chat-list-view-model';
import { ExamplePrompts } from './example-prompts';

export function ChatListView({ rows, loading, error, openChat, newChat, startWith }: ChatListViewModel) {
  const hasChats = rows.length > 0;

  return (
    <TabScreen
      summary="Describe a problem and get troubleshooting help. AI suggestions, not a substitute for a mechanic."
      action={
        <IconButton
          variant="plain"
          accessibilityLabel="New chat"
          onPress={newChat}
          icon={(c) => <PlusIcon size={24} color={c} />}
        />
      }>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {loading ? (
        <View>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      ) : hasChats ? (
        <View>
          {rows.map((row) => (
            <ChatRow key={row.id} row={row} onPress={() => openChat(row.id)} />
          ))}
        </View>
      ) : error ? null : (
        <View style={styles.empty}>
          <View style={styles.emptyText}>
            <ThemedText style={styles.emptyTitle}>Ask the mechanic</ThemedText>
            <ThemedText themeColor="textSecondary">
              Describe what your bike is doing. Answers use your active bike and its service log.
            </ThemedText>
          </View>
          <ExamplePrompts onPick={startWith} />
        </View>
      )}
    </TabScreen>
  );
}

function ChatRow({ row, onPress }: { row: ChatRowItem; onPress: () => void }) {
  const theme = useTheme();
  const meta = [row.bikeName ?? 'No bike', row.updated].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.title}, ${meta}`}
      style={({ pressed }) => [styles.row, { borderTopColor: theme.line }, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold" style={styles.rowTitle} numberOfLines={1}>
          {row.title}
        </ThemedText>
        <ThemedText type="readout" themeColor="textSecondary" style={styles.rowMeta} numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>
      <ChevronRightIcon size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

function SkeletonRow() {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: theme.line }]}>
      <View style={styles.rowText}>
        <SkeletonText lineHeight={22} fontSize={16} width="70%" />
        <SkeletonText lineHeight={18} fontSize={12} width="40%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  rowMeta: {
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    gap: Spacing.four,
  },
  emptyText: {
    gap: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
});
