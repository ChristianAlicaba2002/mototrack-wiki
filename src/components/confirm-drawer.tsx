import { type ReactElement, useCallback, useRef, useState } from 'react';
import { type LayoutChangeEvent, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Button } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

export type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
};

const SHEET_MAX_WIDTH = 560;
const OPEN_DURATION = 280;
const CLOSE_DURATION = 220;
const DISMISS_DISTANCE = 0.3;
const DISMISS_VELOCITY = 900;

export function useConfirmDrawer(): { confirm: (request: ConfirmRequest) => void; drawer: ReactElement } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);
  const onClosed = useCallback(() => setRequest(null), []);
  return { confirm, drawer: <ConfirmDrawer request={request} onClosed={onClosed} /> };
}

type ConfirmDrawerProps = {
  request: ConfirmRequest | null;
  onClosed: () => void;
};

export function ConfirmDrawer({ request, onClosed }: ConfirmDrawerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = useSharedValue(0);
  const translateY = useSharedValue(windowHeight);
  const opened = useRef(false);
  const closing = useRef(false);
  const pendingAction = useRef<(() => void) | undefined>(undefined);

  const finish = useCallback(() => {
    const action = pendingAction.current;
    opened.current = false;
    closing.current = false;
    pendingAction.current = undefined;
    onClosed();
    action?.();
  }, [onClosed]);

  const dismiss = useCallback(
    (action?: () => void) => {
      if (closing.current) return;
      closing.current = true;
      pendingAction.current = action;
      translateY.set(
        withTiming(
          sheetHeight.get() || windowHeight,
          { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
          (done) => {
            if (done) scheduleOnRN(finish);
          },
        ),
      );
    },
    [finish, sheetHeight, translateY, windowHeight],
  );

  const cancel = useCallback(() => dismiss(), [dismiss]);

  const onSheetLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    sheetHeight.set(height);
    if (opened.current) return;
    opened.current = true;
    translateY.set(height);
    translateY.set(withTiming(0, { duration: OPEN_DURATION, easing: Easing.out(Easing.cubic) }));
  };

  const pan = usePanGesture({
    activeOffsetY: 8,
    failOffsetX: [-24, 24],
    onUpdate: (event) => {
      'worklet';
      translateY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      'worklet';
      const height = sheetHeight.get();
      if (event.translationY > height * DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(cancel);
      } else {
        translateY.set(withTiming(0, { duration: CLOSE_DURATION, easing: Easing.out(Easing.cubic) }));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const height = sheetHeight.get();
    const progress = height > 0 ? 1 - Math.min(1, translateY.get() / height) : 0;
    return { opacity: progress };
  });

  const tone = request?.tone ?? 'danger';

  return (
    <Modal
      visible={request !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={cancel}>
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={cancel}
            accessibilityRole="button"
            accessibilityLabel={request?.cancelLabel ?? 'Cancel'}
          />
        </Animated.View>

        {request ? (
          <GestureDetector gesture={pan}>
            <Animated.View
              onLayout={onSheetLayout}
              accessibilityViewIsModal
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.background,
                  borderTopColor: theme.text,
                  paddingBottom: insets.bottom + Spacing.three,
                },
                sheetStyle,
              ]}>
              <View style={[styles.handle, { backgroundColor: theme.line }]} />
              <View style={styles.inner}>
                <View style={styles.text}>
                  <ThemedText style={styles.title} accessibilityRole="header">
                    {request.title}
                  </ThemedText>
                  {request.message ? <ThemedText themeColor="textSecondary">{request.message}</ThemedText> : null}
                </View>
                <View style={styles.actions}>
                  <Button
                    label={request.confirmLabel}
                    variant={tone === 'danger' ? 'danger' : 'primary'}
                    onPress={() => dismiss(request.onConfirm)}
                  />
                  <Button label={request.cancelLabel ?? 'Cancel'} variant="secondary" onPress={cancel} />
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopWidth: 2,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.three,
  },
  inner: {
    gap: Spacing.four,
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    alignSelf: 'center',
  },
  text: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
