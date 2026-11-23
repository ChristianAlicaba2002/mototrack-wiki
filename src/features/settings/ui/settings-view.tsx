import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ChevronLeftIcon, SignOutIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  Button,
  ErrorMessage,
  IconButton,
  Panel,
  PanelHeading,
  Radius,
  Rule,
} from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { SettingsViewModel } from '../model/settings-view-model';

export function SettingsView({ name, email, initial, signingOut, error, signOut, back }: SettingsViewModel) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Settings"
        leading={
          <IconButton
            accessibilityLabel="Back"
            onPress={back}
            icon={(color) => <ChevronLeftIcon size={22} color={color} />}
          />
        }
      />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <PanelHeading title="Account" />
            <Panel>
              <View style={styles.kicker}>
                <View style={[styles.mark, { backgroundColor: theme.brand }]} />
                <ThemedText type="eyebrow" themeColor="textSecondary">
                  Signed in as
                </ThemedText>
              </View>

              <View style={styles.identity}>
                <View style={[styles.monogram, { borderColor: theme.text }]}>
                  <ThemedText style={styles.monogramText}>{initial}</ThemedText>
                </View>
                <View style={styles.identityText}>
                  <ThemedText style={styles.name} numberOfLines={1}>
                    {name}
                  </ThemedText>
                  {email ? (
                    <ThemedText type="readout" themeColor="textSecondary" numberOfLines={1}>
                      {email}
                    </ThemedText>
                  ) : null}
                </View>
              </View>

              <Rule />

              {error ? <ErrorMessage>{error}</ErrorMessage> : null}

              <Button
                label="Sign out"
                variant="secondary"
                loading={signingOut}
                onPress={signOut}
                icon={(color) => <SignOutIcon size={18} color={color} />}
              />
            </Panel>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const MonogramSize = 52;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  mark: {
    width: 8,
    height: 8,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  monogram: {
    width: MonogramSize,
    height: MonogramSize,
    borderRadius: Radius.field + 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontFamily: Fonts.display,
    fontSize: 30,
    lineHeight: 34,
  },
  identityText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
});
