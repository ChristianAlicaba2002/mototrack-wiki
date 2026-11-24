import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useConfirmDrawer } from '@/components/confirm-drawer';
import { ChevronLeftIcon, TrashIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, ScreenHeader, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { ChatViewModel } from '../model/use-chat';
import { Composer } from './composer';
import { ExamplePrompts } from './example-prompts';
import { MessageList } from './message-list';

type ChatViewProps = ChatViewModel & {
  back: () => void;
  openGarage: () => void;
};

export function ChatView({
  loadState,
  isNew,
  title,
  bikeName,
  bikeLoading,
  messages,
  draft,
  setDraft,
  canSend,
  waiting,
  failure,
  loadError,
  deleting,
  send,
  retry,
  remove,
  back,
  openGarage,
}: ChatViewProps) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();
  const empty = messages.length === 0 && !waiting;

  function confirmDelete() {
    confirm({
      title: 'Delete this chat?',
      message: 'All of its messages will be deleted too. This can’t be undone.',
      confirmLabel: 'Delete chat',
      tone: 'danger',
      onConfirm: async () => {
        if (await remove()) back();
      },
    });
  }

  return (
    <ThemedView style={styles.root}>
      {drawer}
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
          <ScreenHeader
            title={title}
            subtitle={bikeName ?? undefined}
            leading={
              <IconButton
                variant="plain"
                accessibilityLabel="Back"
                onPress={back}
                disabled={deleting}
                icon={(c) => <ChevronLeftIcon size={22} color={c} />}
              />
            }
            trailing={
              !isNew && loadState === 'ready' ? (
                <IconButton
                  variant="plain"
                  accessibilityLabel="Delete chat"
                  onPress={confirmDelete}
                  disabled={deleting || waiting}
                  icon={(c) => <TrashIcon size={20} color={c} />}
                />
              ) : undefined
            }
          />

          {loadState === 'loading' ? (
            <ActivityIndicator style={styles.loader} color={theme.textSecondary} />
          ) : loadState !== 'ready' ? (
            <View style={styles.padded}>
              <ErrorMessage>{loadError ?? 'This chat no longer exists.'}</ErrorMessage>
              <Button label="Back" variant="secondary" onPress={back} />
            </View>
          ) : (
            <>
              {!bikeName && !bikeLoading ? <NoBikeHint openGarage={openGarage} /> : null}
              {empty ? (
                <ScrollView
                  style={styles.root}
                  contentContainerStyle={styles.padded}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag">
                  <ThemedText style={styles.emptyTitle}>What’s your bike doing?</ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Describe the symptom in English, Filipino or Taglish. Mention when it happens and any sounds or
                    smells.
                  </ThemedText>
                  {failure ? <ErrorMessage>{failure.message}</ErrorMessage> : null}
                  <ExamplePrompts onPick={setDraft} />
                </ScrollView>
              ) : (
                <View style={styles.root}>
                  <MessageList messages={messages} waiting={waiting} failure={failure} retry={retry} />
                </View>
              )}
              <Composer value={draft} onChange={setDraft} onSend={send} canSend={canSend} disabled={deleting} />
            </>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function NoBikeHint({ openGarage }: { openGarage: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.hint, { borderBottomColor: theme.line }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hintText}>
        No motorcycle picked. Add one in Garage for answers that fit your bike.
      </ThemedText>
      <TextAction label="Garage" accessibilityLabel="Open Garage" onPress={openGarage} />
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
  padded: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.four,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hintText: {
    flex: 1,
  },
});
