const FIRESTORE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'You don’t have permission to do that. Try signing out and back in.',
  unavailable: 'Can’t reach the server. Check your connection and try again.',
  'deadline-exceeded': 'The server took too long to respond. Please try again.',
  'not-found': 'This motorcycle no longer exists.',
};

export function toGarageErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code && FIRESTORE_ERROR_MESSAGES[code]) return FIRESTORE_ERROR_MESSAGES[code];
  return 'Something went wrong. Please try again.';
}
