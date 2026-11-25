import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { WithId } from '@/lib/firestore/collections';
import type { ChatMessage } from '@/lib/firestore/types';

import type { ChatViewModel } from '../model/use-chat';
import { MarkdownText } from './markdown-text';

type MessageListProps = {
  messages: WithId<ChatMessage>[];
  waiting: boolean;
  failure: ChatViewModel['failure'];
  retry: () => void;
};

export function MessageList({ messages, waiting, failure, retry }: MessageListProps) {
  return (
    <FlatList
      inverted
      data={messages}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => <MessageBlock message={item} />}
      ListHeaderComponent={<ReplyStatus waiting={waiting} failure={failure} retry={retry} />}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

function MessageBlock({ message }: { message: WithId<ChatMessage> }) {
  const theme = useTheme();
  const isUser = message.role === 'user';
  return (
    <View style={styles.message}>
      <ThemedText type="eyebrow" style={{ color: isUser ? theme.textSecondary : theme.brand }}>
        {isUser ? 'You' : 'Mechanic'}
      </ThemedText>
      {isUser ? <ThemedText selectable>{message.text}</ThemedText> : <MarkdownText text={message.text} />}
    </View>
  );
}

function ReplyStatus({ waiting, failure, retry }: Omit<MessageListProps, 'messages'>) {
  const theme = useTheme();

  if (waiting) {
    return (
      <View style={styles.message} accessibilityLiveRegion="polite" accessibilityLabel="Mechanic is typing">
        <ThemedText type="eyebrow" style={{ color: theme.brand }}>
          Mechanic
        </ThemedText>
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Typing…
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!failure) return null;

  return (
    <View style={styles.failure} accessibilityRole="alert">
      <ThemedText type="small" style={{ color: theme.danger }}>
        {failure.message}
      </ThemedText>
      {failure.kind === 'reply' ? <TextAction label="Retry" onPress={retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.three + 4,
  },
  message: {
    gap: Spacing.one,
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  failure: {
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
