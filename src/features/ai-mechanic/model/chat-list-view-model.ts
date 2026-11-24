import { useEffect, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToChats } from '@/lib/firestore/chats';
import type { WithId } from '@/lib/firestore/collections';
import type { Chat } from '@/lib/firestore/types';

import { toMechanicErrorMessage } from './errors';
import { formatChatUpdated } from './format';
import { openChat, openNewChat } from './navigation';

export const CHAT_LIST_LIMIT = 50;

export type ChatRowItem = {
  id: string;
  title: string;
  bikeName: string | null;
  updated: string;
};

export function useChatListViewModel() {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes } = useGarageData();
  const [chats, setChats] = useState<WithId<Chat>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToChats(
      uid,
      CHAT_LIST_LIMIT,
      (next) => {
        setChats(next);
        setError(null);
      },
      (e) => setError(toMechanicErrorMessage(e))
    );
  }, [uid]);

  const rows: ChatRowItem[] = (chats ?? []).map((chat) => {
    const bike = chat.bikeId ? bikes.find((b) => b.id === chat.bikeId) : undefined;
    return {
      id: chat.id,
      title: chat.title,
      bikeName: bike ? bikeDisplayName(bike) : null,
      updated: chat.updatedAt ? formatChatUpdated(chat.updatedAt.toDate()) : '',
    };
  });

  return {
    rows,
    loading: chats === null && error === null,
    error,
    openChat,
    newChat: () => openNewChat(),
    startWith: (prompt: string) => openNewChat(prompt),
  };
}

export type ChatListViewModel = ReturnType<typeof useChatListViewModel>;
