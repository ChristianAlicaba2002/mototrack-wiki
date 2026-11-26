import * as Notifications from 'expo-notifications';

import { prepareNotifications, REMINDERS_CHANNEL_ID } from './push';

// Notifications the phone schedules for itself: no server, so they work on the
// free Firebase plan, offline, and in Expo Go.

export type LocalNotification = {
  title: string;
  body: string;
  /** Opened when the notification is tapped, e.g. '/odometer?id=…'. */
  url?: string;
};

function content({ title, body, url }: LocalNotification): Notifications.NotificationContentInput {
  return { title, body, data: url ? { url } : {} };
}

/** Shows a notification right away. */
export async function notifyNow(id: string, notification: LocalNotification): Promise<void> {
  await prepareNotifications();
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: content(notification),
    trigger: { channelId: REMINDERS_CHANNEL_ID },
  });
}

/** Shows a notification at `date`, replacing any scheduled with the same id. */
export async function notifyAt(id: string, date: Date, notification: LocalNotification): Promise<void> {
  await prepareNotifications();
  await Notifications.cancelScheduledNotificationAsync(id);
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: content(notification),
    trigger: {
      // SchedulableTriggerInputTypes is exported (build/index.js), but as a `declare enum`
      // behind `export *` in the .d.ts files, which eslint-plugin-import can't follow.
      // eslint-disable-next-line import/namespace
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: REMINDERS_CHANNEL_ID,
    },
  });
}

/** Ids of the notifications still waiting to be shown. */
export async function scheduledIds(): Promise<string[]> {
  return (await Notifications.getAllScheduledNotificationsAsync()).map((n) => n.identifier);
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Cancels every scheduled notification, e.g. on sign-out so the next rider doesn't get them. */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
