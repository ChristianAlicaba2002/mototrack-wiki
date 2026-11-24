import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, FadeOutDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const VISIBLE_MS = 2200;
const TAB_BAR_CLEARANCE = 76;

type Toast = { id: number; message: string };

let nextId = 0;
const listeners = new Set<(toast: Toast) => void>();

export function showToast(message: string) {
  const toast = { id: ++nextId, message };
  listeners.forEach((listener) => listener(toast));
}

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    listeners.add(setToast);
    return () => {
      listeners.delete(setToast);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      pointerEvents="none"
      entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutDown.duration(200)}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { bottom: insets.bottom + TAB_BAR_CLEARANCE, backgroundColor: theme.text }]}>
      <ThemedText style={[styles.message, { color: theme.background }]}>{toast.message}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two + 2,
    borderRadius: 999,
    zIndex: 900,
  },
  message: {
    fontFamily: Fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
});
