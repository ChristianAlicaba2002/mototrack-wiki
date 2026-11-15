import { Pressable, StyleSheet } from 'react-native';

import { MotoTrackLogo } from '@/components/icons/moto-track-logo';
import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/firebase/google-sign-in';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <TabScreen title="MotoTrack" subtitle="Your motorcycle at a glance.">
      <ThemedView style={styles.logoRow}>
        <MotoTrackLogo size={56} color={theme.brand} foreground={theme.onBrand} />
      </ThemedView>
      <PlaceholderCard
        title="Upcoming maintenance"
        description="Service reminders for your bikes will show up here."
      />
      <PlaceholderCard title="Recent activity" description="Your latest logs and documents will show up here." />
      <SignedInAs />
    </TabScreen>
  );
}

function SignedInAs() {
  const { user } = useAuth();
  const theme = useTheme();
  return (
    <ThemedView style={styles.signedInRow}>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.signedInText}>
        {user?.email ?? user?.displayName ?? 'Signed in'}
      </ThemedText>
      <Pressable onPress={() => signOut()} accessibilityRole="button" hitSlop={8}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          Sign out
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    alignItems: 'flex-start',
  },
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: Spacing.three,
  },
  signedInText: {
    flexShrink: 1,
  },
});
