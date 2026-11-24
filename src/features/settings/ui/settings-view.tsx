import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { useConfirmDrawer } from '@/components/confirm-drawer';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { ErrorMessage, IconButton, TextAction } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { SettingsViewModel } from '../model/settings-view-model';

export function SettingsView({
  account,
  signingOut,
  error,
  signOut,
  openServiceIntervals,
  back,
}: SettingsViewModel) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();

  const confirmSignOut = () =>
    confirm({
      title: 'Sign out?',
      message: 'You’ll need to sign in with Google again to see your garage.',
      confirmLabel: 'Sign out',
      tone: 'primary',
      onConfirm: signOut,
    });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {drawer}
      <AppHeader
        title="Settings"
        leading={
          <IconButton
            variant="plain"
            accessibilityLabel="Back"
            onPress={back}
            icon={(color) => <ChevronLeftIcon size={24} color={color} />}
          />
        }
      />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.row, { borderBottomColor: theme.line }]}>
            <View style={styles.text}>
              <ThemedText type="eyebrow" themeColor="textSecondary">
                Signed in as
              </ThemedText>
              <ThemedText numberOfLines={1}>{account}</ThemedText>
            </View>
            <TextAction label="Sign out" tone="text" disabled={signingOut} onPress={confirmSignOut} />
          </View>
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <Pressable
            onPress={openServiceIntervals}
            accessibilityRole="button"
            accessibilityLabel="Service intervals"
            accessibilityHint="Set how many km between services of each kind"
            style={({ pressed }) => [styles.row, { borderBottomColor: theme.line }, pressed && styles.pressed]}>
            <View style={styles.text}>
              <ThemedText type="eyebrow" themeColor="textSecondary">
                Maintenance
              </ThemedText>
              <ThemedText>Service intervals</ThemedText>
            </View>
            <ChevronRightIcon size={18} color={theme.textSecondary} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    flexShrink: 1,
    gap: 2,
  },
});
