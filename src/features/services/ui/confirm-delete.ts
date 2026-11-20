import { Alert, Platform } from 'react-native';

/** Asks before deleting a service. Alert.alert has no buttons on web, so it falls back to the browser's confirm. */
export function confirmDeleteService(onConfirm: () => void, serviceTitle?: string) {
  const title = serviceTitle ? `Delete “${serviceTitle}”?` : 'Delete this service?';
  const message = 'It will be removed from the service log. This can’t be undone.';
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
