import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { useConfirmDrawer } from '@/components/confirm-drawer';
import {
  BellIcon,
  CalendarIcon,
  ChevronLeftIcon,
  GaugeIcon,
  SignOutIcon,
  TrashIcon,
} from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ErrorMessage, IconButton } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { SettingsViewModel } from '../model/settings-view-model';
import { ProfileSummary } from './profile-summary';
import { RowProgress, SettingsGroup, SettingsRow, ToggleRow } from './settings-list';

const PUSH_COPY: Record<'granted' | 'undetermined' | 'denied', { description: string; hint?: string }> = {
  granted: { description: 'On for this phone' },
  undetermined: { description: 'Tap to let MotoTrack send reminders to this phone', hint: 'Asks for permission' },
  denied: {
    description: 'Off. Tap to turn them on in your phone’s settings',
    hint: 'Opens your phone’s settings for MotoTrack',
  },
};

/** Whether this phone gets push notifications, with a way to turn them on. Hidden where push isn't available. */
function PushRow({
  permission,
  enabling,
  onEnable,
  disabled,
}: {
  permission: SettingsViewModel['pushPermission'];
  enabling: boolean;
  onEnable: () => void;
  disabled: boolean;
}) {
  if (permission === null || permission === 'unsupported') return null;
  const copy = PUSH_COPY[permission];
  const on = permission === 'granted';
  return (
    <SettingsRow
      icon={(c) => <BellIcon size={18} color={c} />}
      label="Push notifications"
      description={copy.description}
      onPress={on ? undefined : onEnable}
      disabled={disabled || enabling}
      chevron={!on}
      accessibilityHint={copy.hint}
      trailing={enabling ? <RowProgress /> : undefined}
    />
  );
}

/** Settings is a narrow list; on tablets keep it at a comfortable reading width. */
const CONTENT_MAX_WIDTH = 560;

/** Presentational only — all state and actions come from the view model. */
export function SettingsView({
  name,
  email,
  photoURL,
  initials,
  signInMethod,
  appVersion,
  signingOut,
  notificationPrefs,
  prefsLoaded,
  error,
  pushPermission,
  enablingPush,
  enablePush,
  signOut,
  setNotificationPref,
  openDeleteAccount,
  openServiceIntervals,
  back,
}: SettingsViewModel) {
  const theme = useTheme();
  const { confirm, drawer } = useConfirmDrawer();
  const busy = signingOut;

  const confirmSignOut = () =>
    confirm({
      title: 'Sign out?',
      message:
        signInMethod === 'google'
          ? 'Your garage stays saved. Sign in with Google again to pick up where you left off.'
          : 'Your garage stays saved. Sign in with your email and password to pick up where you left off.',
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
            disabled={busy}
            icon={(color) => <ChevronLeftIcon size={24} color={color} />}
          />
        }
      />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <ProfileSummary
            name={name}
            email={email}
            photoURL={photoURL}
            initials={initials}
            signInMethod={signInMethod}
          />

          {error ? <ErrorMessage>{error}</ErrorMessage> : null}

          <SettingsGroup
            title="Reminders"
            footnote="Reminders come from this phone, so they arrive even offline.">
            <PushRow permission={pushPermission} enabling={enablingPush} onEnable={enablePush} disabled={busy} />
            <ToggleRow
              icon={(c) => <BellIcon size={18} color={c} />}
              label="Service due"
              description="When a service is coming up or overdue, and when the odometer needs updating"
              value={notificationPrefs.serviceDue}
              onChange={(value) => setNotificationPref('serviceDue', value)}
              disabled={!prefsLoaded || busy}
            />
            <ToggleRow
              icon={(c) => <CalendarIcon size={18} color={c} />}
              label="Document expiry"
              description="30, 15 and 7 days before an OR/CR, insurance or license expires"
              value={notificationPrefs.documentExpiry}
              onChange={(value) => setNotificationPref('documentExpiry', value)}
              disabled={!prefsLoaded || busy}
            />
          </SettingsGroup>

          <SettingsGroup title="Maintenance">
            <SettingsRow
              icon={(c) => <GaugeIcon size={18} color={c} />}
              label="Service intervals"
              description="Km between oil changes, chain, brakes and more"
              onPress={openServiceIntervals}
              disabled={busy}
            />
          </SettingsGroup>

          <SettingsGroup title="Account">
            <SettingsRow
              icon={(c) => <SignOutIcon size={18} color={c} />}
              label={signingOut ? 'Signing out…' : 'Sign out'}
              description={email ?? undefined}
              onPress={confirmSignOut}
              disabled={busy}
              accessibilityHint="Asks you to confirm first"
              chevron={false}
              trailing={signingOut ? <RowProgress /> : undefined}
            />
          </SettingsGroup>

          <SettingsGroup title="Danger zone" tone="danger">
            <SettingsRow
              icon={(c) => <TrashIcon size={18} color={c} />}
              tone="danger"
              label="Delete account"
              description="Permanently remove your account and everything in it"
              onPress={openDeleteAccount}
              disabled={busy}
              accessibilityHint="Opens a screen to confirm it’s you before deleting"
            />
          </SettingsGroup>

          {appVersion ? (
            <ThemedText type="readout" themeColor="textSecondary" style={styles.version}>
              MotoTrack {appVersion}
            </ThemedText>
          ) : null}
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
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
  },
});
