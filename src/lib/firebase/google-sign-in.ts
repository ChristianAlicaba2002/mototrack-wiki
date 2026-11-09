import { signOut as firebaseSignOut, GoogleAuthProvider, signInWithCredential, type User } from 'firebase/auth';
import { TurboModuleRegistry } from 'react-native';

import { auth } from '.';

type GoogleSignInLib = typeof import('@react-native-google-signin/google-signin');

let lib: GoogleSignInLib | null | undefined;

function loadGoogleSignIn(): GoogleSignInLib | null {
  if (lib !== undefined) return lib;
  if (!TurboModuleRegistry.get('RNGoogleSignin')) {
    lib = null;
    return lib;
  }
  // Lazy require on purpose: a static import throws in Expo Go (no native module).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  lib = require('@react-native-google-signin/google-signin') as GoogleSignInLib;
  lib.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  return lib;
}

export async function signInWithGoogle(): Promise<User | null> {
  const google = loadGoogleSignIn();
  if (!google) {
    throw new Error(
      'Google sign-in isn’t available in Expo Go. Use a development build (eas build --profile development).'
    );
  }
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = google;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) return null;

    const { idToken } = response.data;
    if (!idToken) {
      throw new Error('Google Sign-In returned no idToken. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const { user } = await signInWithCredential(auth, credential);
    return user;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}

export async function signOut() {
  await loadGoogleSignIn()?.GoogleSignin.signOut();
  await firebaseSignOut(auth);
}
