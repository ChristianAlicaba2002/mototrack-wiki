import * as ImagePicker from 'expo-image-picker';

import type { DocumentFile } from '@/lib/firestore/documents';

/**
 * Papers stay readable at 50% JPEG quality, and a smaller photo saves faster
 * and uses less of the free Firestore quota (photos are stored there as text).
 */
const PHOTO_QUALITY = 0.5;
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: PHOTO_QUALITY, base64: true };

export type PhotoSource = 'camera' | 'library';

export type PickedPhoto = DocumentFile & { width: number; height: number };

export type PickPhotoResult =
  | { kind: 'picked'; photo: PickedPhoto }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

/** Takes or chooses one photo of a document, asking for camera access when needed. */
export async function pickDocumentPhoto(source: PhotoSource): Promise<PickPhotoResult> {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return {
          kind: 'error',
          message: permission.canAskAgain
            ? 'MotoTrack needs the camera to photograph your document.'
            : 'Camera access is off for MotoTrack. Turn it on in your phone’s settings, or choose a photo from the gallery.',
        };
      }
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) return { kind: 'cancelled' };
    const asset = result.assets[0];
    if (!asset.base64) {
      return { kind: 'error', message: 'MotoTrack couldn’t open that photo. Take a new one or choose a different photo.' };
    }
    return {
      kind: 'picked',
      // The picker's base64 is always JPEG, whatever the original format (HEIC, PNG…).
      photo: { uri: asset.uri, base64: asset.base64, mimeType: 'image/jpeg', width: asset.width, height: asset.height },
    };
  } catch {
    return {
      kind: 'error',
      message: source === 'camera' ? 'Couldn’t open the camera.' : 'Couldn’t open your photos.',
    };
  }
}
