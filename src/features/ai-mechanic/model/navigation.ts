import { router } from 'expo-router';

export const NEW_CHAT_ID = 'new';

export function openChat(chatId: string) {
  router.push({ pathname: '/chat', params: { id: chatId } });
}

export function openNewChat(prompt?: string) {
  router.push({ pathname: '/chat', params: prompt ? { id: NEW_CHAT_ID, prompt } : { id: NEW_CHAT_ID } });
}

export function closeChat() {
  if (router.canGoBack()) router.back();
  else router.replace('/ai-mechanic');
}

export function openGarage() {
  router.navigate('/garage');
}
