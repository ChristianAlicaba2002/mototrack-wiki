import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { GroqError, type GroqErrorKind } from '@/lib/ai/groq';

const GROQ_ERROR_MESSAGES: Record<GroqErrorKind, string> = {
  'missing-key': 'The AI mechanic isn’t set up on this build yet.',
  'rate-limited': 'The AI mechanic is busy right now. Wait a minute and try again.',
  timeout: 'The AI mechanic took too long to answer. Please try again.',
  network: 'Can’t reach the AI mechanic. Check your connection and try again.',
  'bad-response': 'The AI mechanic couldn’t answer that. Please try again.',
};

export function toMechanicErrorMessage(error: unknown): string {
  if (error instanceof GroqError) return GROQ_ERROR_MESSAGES[error.kind];
  return toGarageErrorMessage(error);
}
