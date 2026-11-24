import {
  deleteUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  type User,
} from 'firebase/auth';
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

/** Shows the Google account picker and returns a Firebase credential, or null if cancelled. */
async function googleCredential() {
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

    return GoogleAuthProvider.credential(idToken);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const credential = await googleCredential();
  if (!credential) return null;
  const { user } = await signInWithCredential(auth, credential);
  return user;
}

/**
 * Asks the user to sign in with Google again, so Firebase allows a sensitive
 * change such as deleting the account. Resolves to false if they cancel.
 * Picking a different Google account fails with auth/user-mismatch.
 */
export async function reauthenticateWithGoogle(user: User): Promise<boolean> {
  const credential = await googleCredential();
  if (!credential) return false;
  await reauthenticateWithCredential(user, credential);
  return true;
}

/** Deletes the Firebase Auth user and disconnects the app from their Google account. */
export async function deleteSignedInUser(user: User): Promise<void> {
  await deleteUser(user);
  // Best effort: the account is already gone, so a failure here changes nothing.
  await loadGoogleSignIn()?.GoogleSignin.revokeAccess().catch(() => null);
}

export async function signOut() {
  await loadGoogleSignIn()?.GoogleSignin.signOut();
  await firebaseSignOut(auth);
}
