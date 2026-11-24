import { EmailAuthProvider, reauthenticateWithCredential, type User } from 'firebase/auth';

/** How the rider signs in. The login screen offers Google and email + password. */
export type SignInMethod = 'google' | 'password';

/**
 * Google if the account is linked to Google (re-confirming with Google works
 * then), otherwise email and password.
 */
export function signInMethodOf(user: Pick<User, 'providerData'>): SignInMethod {
  return user.providerData.some((provider) => provider.providerId === 'google.com') ? 'google' : 'password';
}

/**
 * Confirms an email + password account with its password, so Firebase allows
 * a sensitive change such as deleting the account. A wrong password fails with
 * auth/invalid-credential (or auth/wrong-password on older projects).
 */
export async function reauthenticateWithPassword(user: User, password: string): Promise<void> {
  if (!user.email) throw Object.assign(new Error('This account has no email.'), { code: 'auth/missing-email' });
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}
