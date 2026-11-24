import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MailIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';
import type { SignInMethod } from '@/lib/firebase/sign-in-method';

const AVATAR_SIZE = 60;

type ProfileSummaryProps = {
  name: string;
  email: string | null;
  photoURL: string | null;
  initials: string;
  signInMethod: SignInMethod;
};

const METHOD_LABELS: Record<SignInMethod, string> = {
  google: 'Google account',
  password: 'Email account',
};

export function ProfileSummary({ name, email, photoURL, initials, signInMethod }: ProfileSummaryProps) {
  const theme = useTheme();
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = photoURL !== null && !photoFailed;

  return (
    <View
      style={styles.profile}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Signed in as ${name}${email ? `, ${email}` : ''}, ${METHOD_LABELS[signInMethod]}`}>
      <View style={[styles.avatar, { backgroundColor: theme.brand, borderColor: theme.line }]}>
        {showPhoto ? (
          <Image
            source={{ uri: photoURL }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={150}
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <ThemedText style={[styles.initials, { color: theme.onBrand }]}>{initials}</ThemedText>
        )}
      </View>

      <View style={styles.text}>
        <ThemedText style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {name}
        </ThemedText>
        {email ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {email}
          </ThemedText>
        ) : null}
        <View style={[styles.badge, { borderColor: theme.line }]}>
          {signInMethod === 'google' ? (
            <View style={[styles.dot, { backgroundColor: theme.success }]} />
          ) : (
            <MailIcon size={11} color={theme.textSecondary} />
          )}
          <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.badgeText}>
            {METHOD_LABELS[signInMethod]}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  initials: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 0.5,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one + 2,
    marginTop: Spacing.one + 2,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
  },
});
