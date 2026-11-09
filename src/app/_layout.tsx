import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();
  const signedIn = user !== null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      {/* Cover the navigator while Firebase restores a saved session, so a
          signed-in user doesn't see the login screen flash. */}
      {initializing && (
        <ThemedView style={StyleSheet.absoluteFill}>
          <ActivityIndicator style={styles.loader} />
        </ThemedView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
  },
});
