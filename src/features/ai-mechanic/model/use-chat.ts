import { useEffect, useRef, useState } from 'react';

import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { useGarageData } from '@/features/garage/model/use-garage-data';
import { useAuth } from '@/hooks/use-auth';
import { chatCompletion } from '@/lib/ai/groq';
import { addMessage, createChat, deleteChat, subscribeToChat, subscribeToMessages, touchChat } from '@/lib/firestore/chats';
import type { WithId } from '@/lib/firestore/collections';
import type { Chat, ChatMessage } from '@/lib/firestore/types';

import { buildMechanicContext } from './build-context';
import { MAX_MESSAGE_LENGTH, toGroqMessages } from './conversation';
import { toMechanicErrorMessage } from './errors';

export const MESSAGE_LIMIT = 200;
export const CHAT_TITLE_LENGTH = 60;

export type ChatLoadState = 'loading' | 'ready' | 'notFound' | 'error';

type Failure = { kind: 'send' | 'reply'; message: string };

type HistoryItem = Pick<ChatMessage, 'role' | 'text'>;

export function chatTitle(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > CHAT_TITLE_LENGTH ? `${flat.slice(0, CHAT_TITLE_LENGTH - 1).trimEnd()}…` : flat;
}

export function useChat(initialChatId: string | null, initialPrompt = '') {
  const { user } = useAuth();
  const uid = user?.uid;
  const { bikes, activeBike, loading: bikesLoading } = useGarageData();

  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [startedHere] = useState(initialChatId === null);
  const [chat, setChat] = useState<WithId<Chat> | null | undefined>(undefined);
  const [loadedMessages, setMessages] = useState<WithId<ChatMessage>[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState(initialPrompt);
  const [waiting, setWaiting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [deleting, setDeleting] = useState(false);

  const busy = useRef(false);
  const removing = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!uid || !chatId) return;
    const onError = (e: Error) => setLoadError(toMechanicErrorMessage(e));
    const unsubscribeChat = subscribeToChat(
      uid,
      chatId,
      (next) => {
        if (next === null && removing.current) return;
        setChat(next);
      },
      onError
    );
    const unsubscribeMessages = subscribeToMessages(uid, chatId, MESSAGE_LIMIT, setMessages, onError);
    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [uid, chatId]);

  const messages = loadedMessages ?? [];
  const isNew = chatId === null;
  const bike = chat ? (bikes.find((b) => b.id === chat.bikeId) ?? null) : activeBike;

  const loadState: ChatLoadState = startedHere
    ? 'ready'
    : chat === null
      ? 'notFound'
      : chat === undefined || loadedMessages === null
        ? loadError
          ? 'error'
          : 'loading'
        : 'ready';

  function history(): HistoryItem[] {
    return [...messages].reverse().map(({ role, text }) => ({ role, text }));
  }

  async function reply(id: string, bikeId: string | null, items: HistoryItem[]) {
    if (!uid) return;
    busy.current = true;
    setWaiting(true);
    setFailure(null);
    try {
      const context = await buildMechanicContext(uid, bikeId);
      const answer = await chatCompletion(toGroqMessages(context, items));
      const keepBike = bikeId !== null && (bikesLoading || bikes.some((b) => b.id === bikeId));
      addMessage(uid, id, 'assistant', answer.slice(0, MAX_MESSAGE_LENGTH)).catch((e) => {
        if (mounted.current) setFailure({ kind: 'reply', message: toMechanicErrorMessage(e) });
      });
      touchChat(uid, id, keepBike ? bikeId : null).catch(() => {});
    } catch (e) {
      if (mounted.current) setFailure({ kind: 'reply', message: toMechanicErrorMessage(e) });
    } finally {
      busy.current = false;
      if (mounted.current) setWaiting(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!uid || !text || busy.current || deleting) return;
    if (text.length > MAX_MESSAGE_LENGTH) return;

    const prior = history();
    let id = chatId;
    let bikeId = chat?.bikeId ?? null;
    const writeFailed = (e: unknown) => {
      if (!mounted.current) return;
      setDraft((current) => current || text);
      setFailure({ kind: 'send', message: toMechanicErrorMessage(e) });
    };

    try {
      if (!id) {
        bikeId = activeBike?.id ?? null;
        const created = createChat(uid, { title: chatTitle(text), bikeId });
        created.saved.catch(writeFailed);
        id = created.id;
        setChatId(id);
      }
      addMessage(uid, id, 'user', text).catch(writeFailed);
    } catch (e) {
      writeFailed(e);
      return;
    }

    setDraft('');
    await reply(id, bikeId, [...prior, { role: 'user', text }]);
  }

  function retry() {
    if (!chatId || busy.current || failure?.kind !== 'reply') return;
    const items = history();
    if (items.at(-1)?.role !== 'user') {
      setFailure(null);
      return;
    }
    reply(chatId, chat?.bikeId ?? null, items);
  }

  async function remove(): Promise<boolean> {
    if (!uid || !chatId || deleting) return false;
    removing.current = true;
    setDeleting(true);
    try {
      await deleteChat(uid, chatId);
      return true;
    } catch (e) {
      removing.current = false;
      if (mounted.current) {
        setFailure({ kind: 'send', message: toMechanicErrorMessage(e) });
        setDeleting(false);
      }
      return false;
    }
  }

  const trimmed = draft.trim();

  return {
    loadState,
    isNew,
    title: chat?.title ?? 'New chat',
    bikeName: bike ? bikeDisplayName(bike) : null,
    bikeLoading: bikesLoading,
    messages,
    draft,
    setDraft,
    canSend: trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH && !waiting && !deleting,
    waiting,
    failure,
    loadError,
    deleting,
    send,
    retry,
    remove,
  };
}

export type ChatViewModel = ReturnType<typeof useChat>;
