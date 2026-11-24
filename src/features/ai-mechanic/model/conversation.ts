import type { GroqMessage } from '@/lib/ai/groq';
import type { ChatMessage } from '@/lib/firestore/types';

import type { MechanicContext } from './build-context';
import { buildSystemPrompt } from './system-prompt';

export const HISTORY_LIMIT = 12;
export const MAX_MESSAGE_LENGTH = 4000;

export function trimHistory<T>(messages: T[], limit: number = HISTORY_LIMIT): T[] {
  return messages.length > limit ? messages.slice(messages.length - limit) : messages;
}

export function toGroqMessages(
  context: MechanicContext,
  history: Pick<ChatMessage, 'role' | 'text'>[]
): GroqMessage[] {
  return [
    { role: 'system', content: buildSystemPrompt(context) },
    ...trimHistory(history).map((m) => ({ role: m.role, content: m.text })),
  ];
}
