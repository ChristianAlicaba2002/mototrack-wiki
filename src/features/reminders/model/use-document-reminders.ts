import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { WithId } from '@/lib/firestore/collections';
import { subscribeToDocuments } from '@/lib/firestore/documents';
import { DEFAULT_NOTIFICATION_PREFS, type UserProfile, type VaultDocument } from '@/lib/firestore/types';
import { subscribeToUserProfile } from '@/lib/firestore/user-profile';
import { cancelNotification, notifyAt, scheduledIds } from '@/lib/notifications/local';
import { notificationsSupported } from '@/lib/notifications/push';

import { DOCUMENT_REMINDER_PREFIX, documentReminders } from './document-reminders';
import { useNotificationsGranted } from './use-notifications-granted';

/**
 * Schedules each document's reminders and cancels the ones that no longer
 * apply: the document was deleted, renewed, lost its expiry date, or
 * reminders were turned off.
 */
async function sync(documents: WithId<VaultDocument>[], enabled: boolean): Promise<void> {
  const wanted = enabled ? documents.flatMap((d) => documentReminders(d)) : [];
  const wantedIds = new Set(wanted.map((r) => r.id));

  for (const id of await scheduledIds()) {
    if (id.startsWith(DOCUMENT_REMINDER_PREFIX) && !wantedIds.has(id)) await cancelNotification(id);
  }
  // notifyAt replaces a reminder with the same id, so a changed expiry date moves it.
  for (const reminder of wanted) await notifyAt(reminder.id, reminder.date, reminder.notification);
}

/**
 * Mounted once at the root while signed in. Reminds the rider 30, 15 and 7
 * days before a vault document expires. Everything runs on the phone: no
 * server needed, and the reminders arrive even if the app isn't opened.
 */
export function useDocumentReminders() {
  const { user } = useAuth();
  const uid = user?.uid;
  const granted = useNotificationsGranted(uid);
  const [documents, setDocuments] = useState<WithId<VaultDocument>[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  /** Runs one sync at a time, in order. */
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!uid) return;
    const stops = [
      subscribeToDocuments(uid, setDocuments, () => {}),
      subscribeToUserProfile(uid, setProfile, () => setProfile(null)),
    ];
    return () => {
      stops.forEach((stop) => stop());
      // Never let one rider's documents schedule reminders after another signs in.
      setDocuments(null);
      setProfile(undefined);
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || !notificationsSupported() || !documents || profile === undefined) return;
    const enabled =
      granted && (profile?.notificationPrefs?.documentExpiry ?? DEFAULT_NOTIFICATION_PREFS.documentExpiry);
    queue.current = queue.current
      .then(() => sync(documents, enabled))
      .catch((e) => {
        // Reminders are a nice-to-have; never show an error for them.
        if (__DEV__) console.warn('[reminders] Could not update document reminders:', e);
      });
  }, [uid, documents, profile, granted]);
}
