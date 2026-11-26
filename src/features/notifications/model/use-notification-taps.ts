import * as Notifications from 'expo-notifications';
import { type Href, router } from 'expo-router';
import { useEffect, useRef } from 'react';

/**
 * Opens the screen a notification points at (its `data.url`) when the rider
 * taps it, whether the app was open, in the background or closed.
 */
export function useNotificationTaps(enabled: boolean) {
  const response = Notifications.useLastNotificationResponse();
  /** Each tap is handled once, even if this re-renders. */
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !response) return;
    const { identifier, content } = response.notification.request;
    if (handled.current === identifier) return;
    handled.current = identifier;
    const url = content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  }, [enabled, response]);
}
