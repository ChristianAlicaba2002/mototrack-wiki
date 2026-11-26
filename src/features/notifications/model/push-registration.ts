import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { removeDevice, saveDeviceToken } from '@/lib/firestore/devices';
import {
  getDeviceId,
  getPushPermission,
  getPushToken,
  hasAskedBefore,
  notificationsSupported,
  onPushTokenChange,
  pushPlatform,
  type PushPermission,
  requestPushPermission,
} from '@/lib/notifications/push';

/** Saves this phone's FCM token under the rider, if they've allowed notifications. */
export async function registerThisDevice(uid: string, token?: string): Promise<void> {
  const platform = pushPlatform();
  if (!platform || (await getPushPermission()) !== 'granted') return;
  const [deviceId, fcmToken] = await Promise.all([getDeviceId(), token ?? getPushToken()]);
  await saveDeviceToken(uid, deviceId, fcmToken, platform);
}

/**
 * Stops reminders going to this phone. Called before signing out, so the next
 * rider on the same phone doesn't get them. Best effort: never blocks sign-out.
 */
export async function unregisterThisDevice(uid: string): Promise<void> {
  if (!pushPlatform()) return;
  try {
    await removeDevice(uid, await getDeviceId());
  } catch (e) {
    if (__DEV__) console.warn('[push] Could not remove this phone’s token:', e);
  }
}

function logFailure(e: unknown) {
  // Push is a nice-to-have; the app works without it, so this never shows an error.
  if (__DEV__) console.warn('[push] Could not register this phone:', e);
}

/**
 * Mounted once at the root while signed in. Asks for permission the first
 * time, keeps the saved token current when FCM rotates it, and picks up a
 * permission the rider turned on in the phone's settings.
 */
export function usePushRegistration() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    // Asking works wherever notifications do (reminders are local); the FCM token is Android-only.
    if (!uid || !notificationsSupported()) return;
    let cancelled = false;

    (async () => {
      if ((await getPushPermission()) === 'undetermined' && !(await hasAskedBefore())) {
        await requestPushPermission();
      }
      if (!cancelled) await registerThisDevice(uid);
    })().catch(logFailure);

    const stopTokenUpdates = pushPlatform()
      ? onPushTokenChange((token) => {
          registerThisDevice(uid, token).catch(logFailure);
        })
      : () => {};
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerThisDevice(uid).catch(logFailure);
    });

    return () => {
      cancelled = true;
      stopTokenUpdates();
      appState.remove();
    };
  }, [uid]);
}

/** For Settings: whether push is on for this phone, and a way to turn it on. */
export function usePushPermission() {
  const { user } = useAuth();
  const uid = user?.uid;
  /** null until the first check. */
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [enabling, setEnabling] = useState(false);

  const refresh = useCallback(() => {
    getPushPermission().then(setPermission, () => setPermission('unsupported'));
  }, []);

  useEffect(() => {
    refresh();
    // The rider may come back from the phone's settings with it turned on.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => appState.remove();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!uid || enabling) return;
    setEnabling(true);
    try {
      const next = await requestPushPermission();
      setPermission(next);
      if (next === 'granted') await registerThisDevice(uid);
    } catch (e) {
      logFailure(e);
    } finally {
      setEnabling(false);
    }
  }, [uid, enabling]);

  return { permission, enabling, enable };
}
