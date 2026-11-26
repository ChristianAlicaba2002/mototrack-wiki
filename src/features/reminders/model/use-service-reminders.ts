import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { resolveIntervals } from '@/features/services/model/intervals';
import { useAuth } from '@/hooks/use-auth';
import { subscribeToBikes, subscribeToOdometerReadings } from '@/lib/firestore/bikes';
import type { WithId } from '@/lib/firestore/collections';
import { subscribeToAllServices } from '@/lib/firestore/services';
import { type Bike, DEFAULT_NOTIFICATION_PREFS, type ServiceRecord, type UserProfile } from '@/lib/firestore/types';
import { subscribeToUserProfile } from '@/lib/firestore/user-profile';
import { cancelAllNotifications, cancelNotification, notifyAt, notifyNow, scheduledIds } from '@/lib/notifications/local';
import { getPushPermission, notificationsSupported } from '@/lib/notifications/push';

import { odometerReminder, odometerReminderDate, odometerReminderId, serviceAlerts } from './reminders';

/** Enough history to find the latest service of every type on every bike. */
const SERVICES_LIMIT = 500;
const SENT_KEY = 'mototrack.sentServiceAlerts';

async function loadSent(): Promise<Set<string>> {
  try {
    return new Set(JSON.parse((await AsyncStorage.getItem(SENT_KEY)) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

async function saveSent(keys: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SENT_KEY, JSON.stringify([...keys])).catch(() => {});
}

/**
 * Cancels this phone's scheduled reminders and forgets which were shown, so
 * the next rider on the phone doesn't get them. Best effort: never throws.
 */
export async function clearRemindersOnThisPhone(): Promise<void> {
  if (!notificationsSupported()) return;
  await cancelAllNotifications().catch(() => {});
  await AsyncStorage.removeItem(SENT_KEY).catch(() => {});
}

type Inputs = {
  bikes: WithId<Bike>[];
  services: WithId<ServiceRecord>[];
  profile: UserProfile | null;
  /** Latest odometer reading time per bike id. */
  lastReadingAt: Record<string, Date>;
};

/** Shows new service alerts and (re)schedules odometer reminders to match the rider's data. */
async function sync({ bikes, services, profile, lastReadingAt }: Inputs, enabled: boolean): Promise<void> {
  const ids = await scheduledIds();
  const odometerIds = new Set(bikes.map((b) => odometerReminderId(b.id)));

  // Reminders for bikes that were deleted, or all of them when reminders are off.
  for (const id of ids) {
    if (id.startsWith('odometer:') && (!enabled || !odometerIds.has(id))) await cancelNotification(id);
  }
  if (!enabled) return;

  const alerts = serviceAlerts(bikes, services, resolveIntervals(profile?.serviceIntervals));
  const sent = await loadSent();
  for (const alert of alerts) {
    if (sent.has(alert.key)) continue;
    await notifyNow(alert.key, alert.notification);
  }
  // Keep only what's still current, so the list stays small and a new cycle can notify again.
  await saveSent(new Set(alerts.map((a) => a.key)));

  for (const bike of bikes) {
    const last = lastReadingAt[bike.id] ?? bike.createdAt?.toDate();
    if (!last) continue;
    await notifyAt(odometerReminderId(bike.id), odometerReminderDate(last), odometerReminder(bike));
  }
}

/**
 * Mounted once at the root while signed in. Notifies when a service is close
 * to its interval or overdue, and reminds to update the odometer when it
 * hasn't been for a while. Everything runs on the phone: no server needed.
 */
export function useServiceReminders() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [bikes, setBikes] = useState<WithId<Bike>[] | null>(null);
  const [services, setServices] = useState<WithId<ServiceRecord>[] | null>(null);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [lastReadingAt, setLastReadingAt] = useState<Record<string, Date>>({});
  const [granted, setGranted] = useState(false);
  /** Runs one sync at a time, in order. */
  const queue = useRef<Promise<void>>(Promise.resolve());

  // Permission: checked now and whenever the app comes back to the front.
  useEffect(() => {
    if (!uid || !notificationsSupported()) return;
    const check = () => getPushPermission().then((p) => setGranted(p === 'granted'), () => setGranted(false));
    check();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => appState.remove();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const ignore = () => {};
    const stops = [
      subscribeToBikes(uid, setBikes, ignore),
      subscribeToAllServices(uid, SERVICES_LIMIT, setServices, ignore),
      subscribeToUserProfile(uid, setProfile, () => setProfile(null)),
    ];
    return () => {
      stops.forEach((stop) => stop());
      // Never let one rider's data schedule reminders after another signs in.
      setBikes(null);
      setServices(null);
      setProfile(undefined);
      setLastReadingAt({});
    };
  }, [uid]);

  // The latest odometer reading of each bike.
  const bikeIds = bikes?.map((b) => b.id).join(',') ?? '';
  useEffect(() => {
    if (!uid || !bikeIds) return;
    const stops = bikeIds.split(',').map((bikeId) =>
      subscribeToOdometerReadings(
        uid,
        bikeId,
        1,
        (readings) => {
          const at = readings[0]?.createdAt?.toDate();
          if (at) setLastReadingAt((prev) => ({ ...prev, [bikeId]: at }));
        },
        () => {}
      )
    );
    return () => stops.forEach((stop) => stop());
  }, [uid, bikeIds]);

  useEffect(() => {
    if (!uid || !notificationsSupported() || !bikes || !services || profile === undefined) return;
    const enabled = granted && (profile?.notificationPrefs?.serviceDue ?? DEFAULT_NOTIFICATION_PREFS.serviceDue);
    const inputs = { bikes, services, profile, lastReadingAt };
    queue.current = queue.current
      .then(() => sync(inputs, enabled))
      .catch((e) => {
        // Reminders are a nice-to-have; never show an error for them.
        if (__DEV__) console.warn('[reminders] Could not update reminders:', e);
      });
  }, [uid, bikes, services, profile, lastReadingAt, granted]);
}
