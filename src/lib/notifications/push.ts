import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import type { PushPlatform } from '@/lib/firestore/types';

// Push notifications through Firebase Cloud Messaging (FCM), Android only for
// now. Needs a development or release build: Expo Go has no remote push on
// Android since SDK 53.

/** Must match the expo-notifications `defaultChannel` in app.json. */
export const REMINDERS_CHANNEL_ID = 'reminders';

const DEVICE_ID_KEY = 'mototrack.pushDeviceId';
const ASKED_KEY = 'mototrack.pushPermissionAsked';

/** 'unsupported': this build can't get an FCM token (web, iOS for now, or Expo Go). */
export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

/** Show reminders that arrive while the app is open, like they would in the background. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function pushPlatform(): PushPlatform | null {
  if (Platform.OS !== 'android') return null;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  return 'android';
}

/**
 * Android 13+ only shows the permission prompt once a channel exists, and a
 * token can only be fetched after one is created.
 */
async function ensureChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Service due and document expiry reminders',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#C8102E',
  });
}

export async function getPushPermission(): Promise<PushPermission> {
  if (!pushPlatform()) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Shows the system prompt. Once a rider has said no, Android won't show it
 * again; send them to the app's system settings instead.
 */
export async function requestPushPermission(): Promise<PushPermission> {
  if (!pushPlatform()) return 'unsupported';
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) {
    await Linking.openSettings();
    return 'denied';
  }
  await setAsked();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

/** True once the app has shown the prompt on this phone, so it isn't shown again on every launch. */
export async function hasAskedBefore(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) === '1';
  } catch {
    return false;
  }
}

async function setAsked(): Promise<void> {
  await AsyncStorage.setItem(ASKED_KEY, '1').catch(() => {});
}

/** The native FCM registration token. Call only once permission is granted. */
export async function getPushToken(): Promise<string> {
  await ensureChannel();
  const token = await Notifications.getDevicePushTokenAsync();
  if (typeof token.data !== 'string' || !token.data) throw new Error('No FCM token');
  return token.data;
}

/** FCM can rotate a token at any time; the callback gets the new one. Returns an unsubscribe function. */
export function onPushTokenChange(callback: (token: string) => void): () => void {
  const subscription = Notifications.addPushTokenListener((token) => {
    if (typeof token.data === 'string' && token.data) callback(token.data);
  });
  return () => subscription.remove();
}

/** A random id for this install, kept on the phone. Names the phone's entry in users/{uid}/devices. */
export async function getDeviceId(): Promise<string> {
  const saved = await AsyncStorage.getItem(DEVICE_ID_KEY).catch(() => null);
  if (saved) return saved;
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id).catch(() => {});
  return id;
}
