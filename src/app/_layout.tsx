import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

function navigationTheme(base: typeof DefaultTheme, colors: (typeof Colors)['light' | 'dark']) {
  return {
    ...base,
    fonts: {
      regular: { fontFamily: Fonts.sans, fontWeight: '400' as const },
      medium: { fontFamily: Fonts.sansMedium, fontWeight: '500' as const },
      bold: { fontFamily: Fonts.sansSemiBold, fontWeight: '600' as const },
      heavy: { fontFamily: Fonts.sansBold, fontWeight: '700' as const },
    },
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.line,
      notification: colors.brand,
    },
  };
}

const LightNavTheme = navigationTheme(DefaultTheme, Colors.light);
const DarkNavTheme = navigationTheme(DarkTheme, Colors.dark);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const fontsReady = useAppFonts();

  if (!fontsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
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
          <Stack.Screen name="bike-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="odometer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="services" />
          <Stack.Screen name="service" />
          <Stack.Screen name="service-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="expenses" />
          <Stack.Screen name="settings" />
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
