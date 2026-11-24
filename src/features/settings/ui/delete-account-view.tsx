import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, FormField, IconButton, Radius, ScreenHeader } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { DeleteAccountViewModel } from '../model/delete-account-view-model';

const CONTENT_MAX_WIDTH = 560;

const WHAT_GETS_DELETED = [
  'Your motorcycles and their photos',
  'Odometer history and the service log',
  'Vault documents and their files',
  'AI mechanic conversations',
  'Your settings and service intervals',
];

/** Presentational only — all state and actions come from the view model. */
export function DeleteAccountView({
  method,
  email,
  password,
  setPassword,
  passwordError,
  phase,
  busy,
  canSubmit,
  error,
  confirmDelete,
  cancel,
}: DeleteAccountViewModel) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <ScreenHeader
          title="Delete account"
          context={email ?? undefined}
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={cancel}
              disabled={busy}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />

        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">
            <View style={styles.intro}>
              <ThemedText type="eyebrow" themeColor="danger">
                Can’t be undone
              </ThemedText>
              <ThemedText style={styles.title} accessibilityRole="header">
                This deletes your account and everything in it.
              </ThemedText>
            </View>

            <View
              style={[styles.list, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}
              accessibilityRole="list">
              {WHAT_GETS_DELETED.map((item, i) => (
                <View key={item} style={[styles.item, i > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <View style={[styles.bullet, { backgroundColor: theme.danger }]} />
                  <ThemedText type="small" style={styles.itemText}>
                    {item}
                  </ThemedText>
                </View>
              ))}
            </View>

            {method === 'password' ? (
              <FormField
                label="Password"
                value={password}
                onChangeText={setPassword}
                error={passwordError ?? undefined}
                hint="Enter your password to confirm it’s you."
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={confirmDelete}
                editable={!busy}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                To confirm it’s you, you’ll be asked to pick your Google account{email ? ` (${email})` : ''}.
              </ThemedText>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderColor: theme.line, backgroundColor: theme.background }]}>
            <View style={styles.footerInner}>
              {error ? <ErrorMessage>{error}</ErrorMessage> : null}
              {phase === 'deleting' ? (
                <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
                  Deleting your data. Keep the app open…
                </ThemedText>
              ) : null}
              <Button
                label={method === 'google' ? 'Confirm with Google and delete' : 'Delete my account'}
                variant="danger"
                onPress={confirmDelete}
                loading={busy}
                disabled={!canSubmit}
              />
              <Button label="Keep my account" variant="secondary" onPress={cancel} disabled={busy} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
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
  intro: {
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  list: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    minHeight: 46,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  footerInner: {
    gap: Spacing.two + 4,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
});
