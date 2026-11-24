import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MotoTrackLogo, MotoTrackNeedle, NEEDLE_PIVOT_Y } from '@/components/icons/moto-track-logo';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const LOGO_SIZE = 88;
/** One rev up and back, so a fast start doesn't flash the screen for a split second. */
const MIN_VISIBLE_MS = 1100;
const REV_MS = 520;
const FADE_MS = 320;
/** Needle angles relative to the logo's resting needle: down at idle, past the top at full rev. */
const IDLE_DEG = -105;
const REDLINE_DEG = 15;

type LaunchScreenProps = {
  /** True once the app knows whether to show the login screen or the app. */
  ready: boolean;
};

/**
 * Covers the app at launch with the MotoTrack gauge revving, then fades out
 * once `ready` is true. Takes over from the native splash screen, which has
 * the same background colour, so the hand-off is seamless.
 */
export function LaunchScreen({ ready }: LaunchScreenProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);
  const rev = useSharedValue(0);
  const opacity = useSharedValue(1);
  const done = ready && (minElapsed || reduceMotion);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  // Rev the needle: a quick blip up, a slower fall back, again and again.
  useEffect(() => {
    if (reduceMotion) return;
    rev.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: REV_MS, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: REV_MS * 1.3, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      )
    );
    return () => cancelAnimation(rev);
  }, [rev, reduceMotion]);

  useEffect(() => {
    if (!done) return;
    opacity.set(
      withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) scheduleOnRN(setGone, true);
      })
    );
  }, [done, opacity]);

  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(rev.get(), [0, 1], [IDLE_DEG, REDLINE_DEG])}deg` }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  if (gone) return null;

  return (
    <Animated.View
      // Let taps through while fading out.
      pointerEvents={done ? 'none' : 'auto'}
      onLayout={() => {
        SplashScreen.hideAsync().catch(() => {});
      }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading MotoTrack"
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: theme.background }, fadeStyle]}>
      <View style={styles.logo}>
        <MotoTrackLogo size={LOGO_SIZE} color={theme.brand} foreground={theme.onBrand} needle={false} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.needle, needleStyle]}>
          <MotoTrackNeedle size={LOGO_SIZE} color={theme.onBrand} />
        </Animated.View>
      </View>
      <View style={styles.text}>
        <ThemedText style={styles.wordmark}>MotoTrack</ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          Warming up
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    zIndex: 1000,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  needle: {
    transformOrigin: ['50%', NEEDLE_PIVOT_Y, 0],
  },
  text: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
});
