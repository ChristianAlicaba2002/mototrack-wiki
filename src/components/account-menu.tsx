import { Image } from 'expo-image';
import { type ComponentRef, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, type View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/firebase/google-sign-in';

const AVATAR_SIZE = 44;

/** Avatar button for the screen header; tapping it opens a menu with the account email and Sign out. */
export function AccountMenu() {
  const { user } = useAuth();
  const theme = useTheme();
  const anchorRef = useRef<ComponentRef<typeof View>>(null);
  const [menuTop, setMenuTop] = useState<number | null>(null);

  const label = user?.displayName ?? user?.email ?? 'Account';
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  const openMenu = () => {
    anchorRef.current?.measureInWindow((_x, y, _w, height) => {
      setMenuTop(y + height + Spacing.two);
    });
  };
  const closeMenu = () => setMenuTop(null);

  return (
    <>
      <Pressable
        ref={anchorRef}
        onPress={openMenu}
        accessibilityRole="button"
        accessibilityLabel="Account menu"
        hitSlop={8}
        style={[styles.avatar, { backgroundColor: theme.brand }]}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <ThemedText type="smallBold" style={{ color: theme.onBrand, fontSize: 18 }}>
            {initial}
          </ThemedText>
        )}
      </Pressable>

      <Modal visible={menuTop !== null} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} accessibilityLabel="Close account menu" />
        <ThemedView
          type="backgroundElement"
          style={[styles.menu, { top: menuTop ?? 0, borderColor: theme.backgroundSelected }]}>
          {user?.displayName ? <ThemedText type="smallBold" numberOfLines={1}>{user.displayName}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {user?.email ?? 'Signed in'}
          </ThemedText>
          <Pressable
            onPress={() => {
              closeMenu();
              signOut();
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.signOutButton, { backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Sign out
            </ThemedText>
          </Pressable>
        </ThemedView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  menu: {
    position: 'absolute',
    right: Spacing.four,
    minWidth: 220,
    maxWidth: 300,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  signOutButton: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
