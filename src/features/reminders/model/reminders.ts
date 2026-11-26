import { bikeDisplayName } from '@/features/garage/model/active-bike';
import { formatKm } from '@/features/garage/model/odometer';
import { formatRemaining, upcomingServices } from '@/features/services/model/intervals';
import { SERVICE_TYPE_LABELS } from '@/features/services/model/service-form';
import type { WithId } from '@/lib/firestore/collections';
import type { Bike, ServiceIntervals, ServiceRecord } from '@/lib/firestore/types';
import type { LocalNotification } from '@/lib/notifications/local';

// What to remind a rider about. Pure functions: no Firebase, no notifications.

/** Remind to update the odometer this many days after the last reading. */
export const ODOMETER_STALE_DAYS = 14;
/** Reminders scheduled for a day are shown at this hour, local time. */
export const REMINDER_HOUR = 9;

export type ServiceAlert = {
  /**
   * Unique per bike, service type, due reading and stage ("soon", "overdue"),
   * so each stage of each service cycle notifies once.
   */
  key: string;
  notification: LocalNotification;
};

/**
 * One alert per service that's due soon or overdue, across every bike.
 * `services` may mix bikes, newest first (as the services query returns them).
 */
export function serviceAlerts(
  bikes: WithId<Bike>[],
  services: WithId<ServiceRecord>[],
  intervals: ServiceIntervals
): ServiceAlert[] {
  const alerts: ServiceAlert[] = [];
  for (const bike of bikes) {
    const ofBike = services.filter((s) => s.bikeId === bike.id);
    for (const item of upcomingServices(ofBike, bike.odometerKm, intervals)) {
      if (item.status === 'ok') continue;
      const label = SERVICE_TYPE_LABELS[item.type];
      const name = bikeDisplayName(bike);
      const overdue = item.status === 'overdue';
      alerts.push({
        key: `service:${bike.id}:${item.type}:${item.nextDueKm}:${item.status}`,
        notification: {
          title: overdue ? `${label} is overdue` : `${label} due soon`,
          body: overdue
            ? `${name}: ${formatRemaining(item.remainingKm)} (was due at ${formatKm(item.nextDueKm)} km). Log it once it’s done.`
            : `${name}: ${formatRemaining(item.remainingKm)}, at ${formatKm(item.nextDueKm)} km.`,
          url: '/services',
        },
      });
    }
  }
  return alerts;
}

/** The scheduled id of a bike's odometer reminder. */
export const odometerReminderId = (bikeId: string) => `odometer:${bikeId}`;

/** After the first odometer reminder, repeat this often until the rider updates it. */
export const ODOMETER_REPEAT_DAYS = 7;

/**
 * When to remind about the odometer: REMINDER_HOUR on the day the last
 * reading turns ODOMETER_STALE_DAYS old, then every ODOMETER_REPEAT_DAYS
 * after that, so an ignored reminder comes back weekly rather than daily.
 */
export function odometerReminderDate(lastReadingAt: Date, now: Date = new Date()): Date {
  const next = new Date(lastReadingAt);
  next.setDate(next.getDate() + ODOMETER_STALE_DAYS);
  next.setHours(REMINDER_HOUR, 0, 0, 0);
  while (next <= now) next.setDate(next.getDate() + ODOMETER_REPEAT_DAYS);
  return next;
}

export function odometerReminder(bike: WithId<Bike>): LocalNotification {
  return {
    title: 'Update your odometer',
    body: `It’s been ${ODOMETER_STALE_DAYS} days since you logged ${bikeDisplayName(bike)}’s mileage. Update it so service reminders stay on time.`,
    url: `/odometer?id=${bike.id}`,
  };
}
