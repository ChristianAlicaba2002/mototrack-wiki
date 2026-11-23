import { StyleSheet, View } from 'react-native';

import { PlaceholderCard, TabScreen } from '@/components/screen/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ActiveBikeCard } from '@/features/garage/ui/active-bike-card';
import { TextAction } from '@/features/garage/ui/controls';
import { RecentServicesCard } from '@/features/services/ui/recent-services-card';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/firebase/google-sign-in';

export default function HomeScreen() {
  return (
    <TabScreen>
      <ActiveBikeCard />
      <RecentServicesCard />
      <PlaceholderCard title="Upcoming maintenance" description="Reminders for what's due, by km or by date." />
      <PlaceholderCard title="Recent activity" description="Your latest logs and documents, in one feed." />
      <SignedInAs />
    </TabScreen>
  );
}

function SignedInAs() {
  const { user } = useAuth();
  const theme = useTheme();
  return (
    <View style={[styles.signedInRow, { borderTopColor: theme.line }]}>
      <View style={styles.signedInText}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Signed in
        </ThemedText>
        <ThemedText type="small" numberOfLines={1}>
          {user?.email ?? user?.displayName ?? 'Rider'}
        </ThemedText>
      </View>
      <TextAction label="Sign out" tone="text" onPress={() => signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  signedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  signedInText: {
    flexShrink: 1,
    gap: 2,
  },
});
