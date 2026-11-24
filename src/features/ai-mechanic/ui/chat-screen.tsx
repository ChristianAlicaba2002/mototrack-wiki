import { useLocalSearchParams } from 'expo-router';

import { closeChat, NEW_CHAT_ID, openGarage } from '../model/navigation';
import { useChat } from '../model/use-chat';
import { ChatView } from './chat-view';

export function ChatScreen() {
  const { id, prompt } = useLocalSearchParams<{ id?: string; prompt?: string }>();
  const chatId = id && id !== NEW_CHAT_ID ? id : null;
  return <Chat key={chatId ?? NEW_CHAT_ID} chatId={chatId} prompt={prompt ?? ''} />;
}

function Chat({ chatId, prompt }: { chatId: string | null; prompt: string }) {
  const viewModel = useChat(chatId, prompt);
  return <ChatView {...viewModel} back={closeChat} openGarage={openGarage} />;
}
