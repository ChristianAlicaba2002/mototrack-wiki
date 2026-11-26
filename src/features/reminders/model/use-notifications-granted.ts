import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getPushPermission, notificationsSupported } from '@/lib/notifications/push';

/**
 * Whether this phone may show notifications. Checked when `uid` changes and
 * whenever the app comes back to the front, since the rider may have turned
 * them on or off in the phone's settings meanwhile.
 */
export function useNotificationsGranted(uid: string | undefined): boolean {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!uid || !notificationsSupported()) return;
    const check = () => getPushPermission().then((p) => setGranted(p === 'granted'), () => setGranted(false));
    check();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => appState.remove();
  }, [uid]);

  return granted;
}
