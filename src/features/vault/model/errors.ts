import { toGarageErrorMessage } from '@/features/garage/model/errors';
import { DocumentFileError } from '@/lib/firestore/documents';

const STORAGE_ERROR_MESSAGES: Record<string, string> = {
  'storage/unauthorized': 'You don’t have permission to do that. Try signing out and back in.',
  'storage/unauthenticated': 'You’re signed out. Sign in again and retry.',
  'storage/retry-limit-exceeded': 'The upload kept failing. Check your connection and try again.',
  'storage/quota-exceeded': 'Storage is full right now. Please try again later.',
  'storage/canceled': 'The upload was cancelled.',
  'storage/object-not-found': 'This file is missing. Edit the document and add the photo again.',
};

export function toVaultErrorMessage(error: unknown): string {
  if (error instanceof DocumentFileError) return error.message;
  const code = (error as { code?: string } | null)?.code;
  if (code && STORAGE_ERROR_MESSAGES[code]) return STORAGE_ERROR_MESSAGES[code];
  if (code === 'not-found') return 'This document was deleted.';
  return toGarageErrorMessage(error);
}
