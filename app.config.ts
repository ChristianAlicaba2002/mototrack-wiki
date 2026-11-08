import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json. The Google Sign-In config plugin is only needed on iOS
// (it registers the reversed iOS client ID as a URL scheme) and it fails
// without one, so it's added only when an iOS client ID is configured.
// For EAS builds, set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as an EAS environment
// variable — .env is gitignored and isn't uploaded.
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const plugins = [...(config.plugins ?? [])];

  if (iosClientId) {
    const iosUrlScheme = `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme }]);
  }

  return { ...config, name: config.name ?? 'mototrack-wiki', slug: config.slug ?? 'mototrack-wiki', plugins };
};
