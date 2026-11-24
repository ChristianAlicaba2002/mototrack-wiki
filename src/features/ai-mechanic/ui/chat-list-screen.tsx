import { useChatListViewModel } from '../model/chat-list-view-model';
import { ChatListView } from './chat-list-view';

export function ChatListScreen() {
  const viewModel = useChatListViewModel();
  return <ChatListView {...viewModel} />;
}
