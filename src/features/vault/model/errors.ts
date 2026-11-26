import { DocumentFileError } from '@/lib/firestore/documents';

/** What the rider was doing, so the message can say what didn't happen. */
export type VaultAction = 'load' | 'save' | 'replace' | 'delete';

const CONNECTION = 'Check your internet connection and try again.';

/**
 * Said when we can't tell what went wrong. It names what didn't happen and
 * never guesses a cause, so it doesn't blame a connection that's fine.
 */
const FALLBACK: Record<VaultAction, string> = {
  load: 'Your documents couldn’t be loaded right now. Pull down to try again.',
  save: 'Your document wasn’t saved. Please try again in a moment.',
  replace: 'The new photo wasn’t saved, so your old one is still there. Please try again in a moment.',
  delete: 'The document wasn’t deleted. Please try again in a moment.',
};

/** Firestore error codes, in words a rider can act on. Unlisted codes use the fallback. */
const MESSAGES: Record<string, string | ((action: VaultAction) => string)> = {
  unauthenticated: 'You’ve been signed out. Sign in again, then try once more.',
  'permission-denied': (action) =>
    action === 'load'
      ? 'You can’t open this document. Sign out, sign back in and try again.'
      : `MotoTrack wouldn’t accept this change. Sign out, sign back in and try again.`,
  unavailable: `Can’t reach MotoTrack. ${CONNECTION}`,
  'deadline-exceeded': `MotoTrack took too long to answer. ${CONNECTION}`,
  // On the free plan this is the daily limit; it resets every day.
  'resource-exhausted': (action) =>
    action === 'load'
      ? 'MotoTrack has reached today’s free limit for loading documents. Try again tomorrow.'
      : 'MotoTrack has reached today’s free limit for saving documents. Try again tomorrow.',
  'not-found': 'This document was deleted.',
};

type FirebaseLikeError = { code?: string; message?: string };

/**
 * Turns any error from the vault into a sentence a rider can act on. Never
 * shows a raw error code or exception text.
 */
export function toVaultErrorMessage(error: unknown, action: VaultAction): string {
  const e = error as FirebaseLikeError | null;
  // The raw error, for whoever is debugging; riders only see the message below.
  if (__DEV__) console.warn(`[vault] ${action} failed:`, e?.code ?? '(no code)', e?.message);

  if (error instanceof DocumentFileError) return error.message;
  // fetch-based transports fail this way when the phone is actually offline.
  if (error instanceof TypeError && /network request failed/i.test(error.message)) {
    return `You’re offline. ${CONNECTION}`;
  }
  const message = e?.code ? MESSAGES[e.code] : undefined;
  if (typeof message === 'function') return message(action);
  return message ?? FALLBACK[action];
}
