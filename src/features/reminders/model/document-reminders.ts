import { formatDate } from '@/features/vault/model/documents';
import type { WithId } from '@/lib/firestore/collections';
import type { DocumentType, VaultDocument } from '@/lib/firestore/types';
import type { LocalNotification } from '@/lib/notifications/local';

import { REMINDER_HOUR } from './reminders';

// When to remind a rider that a vault document is about to expire. Pure
// functions: no Firebase, no notifications.

/** Days before the expiry date to remind, as issue #18 asks. */
export const DOCUMENT_REMINDER_DAYS = [30, 15, 7] as const;

export type DocumentReminder = {
  /** `document:{documentId}:{days}`; scheduling again with it replaces the old one. */
  id: string;
  date: Date;
  notification: LocalNotification;
};

export const DOCUMENT_REMINDER_PREFIX = 'document:';

const documentReminderId = (documentId: string, days: number) => `${DOCUMENT_REMINDER_PREFIX}${documentId}:${days}`;

/** What to do about each type, in a few words. */
const RENEW_HINT: Record<DocumentType, string> = {
  registration: 'Renew your registration at LTO before you ride.',
  license: 'Renew your license at LTO before it lapses.',
  insurance: 'Renew your policy so you stay covered.',
  receipt: 'Check if it needs renewing.',
  other: 'Check if it needs renewing.',
};

/**
 * The reminders still ahead for one document: REMINDER_HOUR on the days
 * DOCUMENT_REMINDER_DAYS before it expires. Ones already past are left out,
 * so a document added 10 days before it expires gets only the 7-day reminder.
 */
export function documentReminders(document: WithId<VaultDocument>, now: Date = new Date()): DocumentReminder[] {
  if (!document.expiresAt) return [];
  const expires = document.expiresAt.toDate();
  const reminders: DocumentReminder[] = [];
  for (const days of DOCUMENT_REMINDER_DAYS) {
    const date = new Date(expires);
    date.setDate(date.getDate() - days);
    date.setHours(REMINDER_HOUR, 0, 0, 0);
    if (date <= now) continue;
    reminders.push({
      id: documentReminderId(document.id, days),
      date,
      notification: {
        title: `${document.title} expires in ${days} days`,
        body: `Valid until ${formatDate(expires)}. ${RENEW_HINT[document.type]}`,
        url: `/document?id=${document.id}`,
      },
    });
  }
  return reminders;
}
