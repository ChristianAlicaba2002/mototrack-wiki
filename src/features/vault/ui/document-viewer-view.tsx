import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon, DocumentIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';

import type { DocumentViewerViewModel } from '../model/document-viewer-view-model';
import { ZoomableImage } from './zoomable-image';

/** A photo viewer is dark in both themes, so the paper stands out. */
const BACKDROP = '#000000';
const ON_BACKDROP = '#FFFFFF';
const ON_BACKDROP_MUTED = 'rgba(255, 255, 255, 0.7)';
const CHROME = 'rgba(0, 0, 0, 0.55)';

/** Presentational only — all state and actions come from the view model. */
export function DocumentViewerView({ loadState, title, subtitle, photoUrl, photoFailed, error, close }: DocumentViewerViewModel) {
  const insets = useSafeAreaInsets();
  const [chromeVisible, setChromeVisible] = useState(true);
  const dismissProgress = useSharedValue(0);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - dismissProgress.get() * 0.6,
  }));

  const message =
    loadState === 'notFound'
      ? 'This document was deleted.'
      : loadState === 'error'
        ? (error ?? 'The document couldn’t be loaded.')
        : photoFailed
          ? 'The photo couldn’t be loaded. Check your connection.'
          : null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" hidden={!chromeVisible} />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP }, backdropStyle]} />

      {photoUrl ? (
        <ZoomableImage
          uri={photoUrl}
          accessibilityLabel={`Photo of ${title}. Pinch or double tap to zoom.`}
          onTap={() => setChromeVisible((v) => !v)}
          onDismiss={close}
          dismissProgress={dismissProgress}
        />
      ) : message ? (
        <View style={styles.center}>
          <DocumentIcon size={32} color={ON_BACKDROP_MUTED} />
          <ThemedText type="small" style={[styles.message, { color: ON_BACKDROP_MUTED }]}>
            {message}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={ON_BACKDROP} accessibilityLabel="Loading photo" />
        </View>
      )}

      {chromeVisible ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[styles.header, { paddingTop: insets.top + Spacing.two, backgroundColor: CHROME }]}>
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
            <CloseIcon size={22} color={ON_BACKDROP} />
          </Pressable>
          <View style={styles.titles}>
            <ThemedText style={[styles.title, { color: ON_BACKDROP }]} numberOfLines={1} accessibilityRole="header">
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText type="small" style={{ color: ON_BACKDROP_MUTED }} numberOfLines={1}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {chromeVisible && photoUrl ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          pointerEvents="none"
          style={[styles.hint, { paddingBottom: insets.bottom + Spacing.three }]}>
          <ThemedText type="small" style={{ color: ON_BACKDROP_MUTED }}>
            Pinch or double tap to zoom · Swipe down to close
          </ThemedText>
        </Animated.View>
      ) : null}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
});
