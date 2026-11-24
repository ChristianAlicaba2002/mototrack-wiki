import {
  addDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  type QuerySnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';

import { chatsCollection, messagesCollection, type WithId } from './collections';
import type { Chat, ChatMessage } from './types';

const DELETE_CHUNK = 450;

const chatDoc = (uid: string, chatId: string) => doc(chatsCollection(uid), chatId);

function withEstimatedIds<T>(snapshot: QuerySnapshot<T>): WithId<T>[] {
  return snapshot.docs.map((d) => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }));
}

export function subscribeToChats(
  uid: string,
  max: number,
  onChange: (chats: WithId<Chat>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(chatsCollection(uid), orderBy('updatedAt', 'desc'), limit(max));
  return onSnapshot(q, (snapshot) => onChange(withEstimatedIds(snapshot)), onError);
}

export function subscribeToChat(
  uid: string,
  chatId: string,
  onChange: (chat: WithId<Chat> | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    chatDoc(uid, chatId),
    (snapshot) =>
      onChange(snapshot.exists() ? { ...snapshot.data({ serverTimestamps: 'estimate' }), id: snapshot.id } : null),
    onError
  );
}

export function subscribeToMessages(
  uid: string,
  chatId: string,
  max: number,
  onChange: (messages: WithId<ChatMessage>[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(messagesCollection(uid, chatId), orderBy('createdAt', 'desc'), limit(max));
  return onSnapshot(q, (snapshot) => onChange(withEstimatedIds(snapshot)), onError);
}

export function createChat(
  uid: string,
  input: Pick<Chat, 'title' | 'bikeId'>
): { id: string; saved: Promise<void> } {
  const ref = doc(chatsCollection(uid));
  const saved = setDoc(ref, { ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return { id: ref.id, saved };
}

export async function addMessage(
  uid: string,
  chatId: string,
  role: ChatMessage['role'],
  text: string
): Promise<void> {
  await addDoc(messagesCollection(uid, chatId), { role, text, createdAt: serverTimestamp() });
}

export function touchChat(uid: string, chatId: string, bikeId: string | null): Promise<void> {
  return updateDoc(chatDoc(uid, chatId), { bikeId, updatedAt: serverTimestamp() });
}

export async function deleteChat(uid: string, chatId: string): Promise<void> {
  const messages = await getDocs(messagesCollection(uid, chatId));
  const refs = messages.docs.map((d) => d.ref);
  for (let i = 0; i < refs.length; i += DELETE_CHUNK) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + DELETE_CHUNK)) batch.delete(ref);
    await batch.commit();
  }
  await writeBatch(db).delete(chatDoc(uid, chatId)).commit();
}
