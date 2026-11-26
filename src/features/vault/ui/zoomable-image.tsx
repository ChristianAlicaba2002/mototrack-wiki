import { Image } from 'expo-image';
import { type LayoutChangeEvent, StyleSheet } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MAX_SCALE = 5;
/** Pinching below 1× springs back; this is how far it can be pulled first. */
const MIN_PINCH_SCALE = 0.7;
const DOUBLE_TAP_SCALE = 2.5;
/** Swipe down this far (or this fast) at 1× to close. */
const DISMISS_DISTANCE = 140;
const DISMISS_VELOCITY = 1100;
const SPRING = { damping: 22, stiffness: 220, mass: 0.6 } as const;

type ZoomableImageProps = {
  uri: string;
  accessibilityLabel: string;
  /** A single tap that isn't part of a double tap, e.g. to show or hide controls. */
  onTap?: () => void;
  /** Swiped down while not zoomed. */
  onDismiss?: () => void;
  /** 0 at rest, 1 once the swipe-down has gone far enough to close. */
  dismissProgress?: SharedValue<number>;
};

/**
 * A photo that fills its container: pinch to zoom around the fingers, drag
 * while zoomed, double tap to zoom in or out, swipe down at 1× to dismiss.
 */
export function ZoomableImage({ uri, accessibilityLabel, onTap, onDismiss, dismissProgress }: ZoomableImageProps) {
  const containerW = useSharedValue(0);
  const containerH = useSharedValue(0);
  /** The photo's size as drawn at 1× (contain-fit), for pan limits. */
  const imageW = useSharedValue(0);
  const imageH = useSharedValue(0);
  const naturalW = useSharedValue(0);
  const naturalH = useSharedValue(0);

  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);
  /** Focal point at pinch start, relative to the container centre. */
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  /** Vertical drag at 1×, toward dismissing. */
  const dragY = useSharedValue(0);

  function fitImage() {
    'worklet';
    const cw = containerW.get();
    const ch = containerH.get();
    const nw = naturalW.get();
    const nh = naturalH.get();
    if (!cw || !ch) return;
    if (!nw || !nh) {
      imageW.set(cw);
      imageH.set(ch);
      return;
    }
    const fit = Math.min(cw / nw, ch / nh);
    imageW.set(nw * fit);
    imageH.set(nh * fit);
  }

  /** How far the photo may move each way at a scale before its edge leaves the screen edge. */
  function limits(s: number) {
    'worklet';
    return {
      x: Math.max(0, (imageW.get() * s - containerW.get()) / 2),
      y: Math.max(0, (imageH.get() * s - containerH.get()) / 2),
    };
  }

  function clamp(value: number, max: number) {
    'worklet';
    return Math.min(max, Math.max(-max, value));
  }

  function settle() {
    'worklet';
    const s = Math.min(MAX_SCALE, Math.max(1, scale.get()));
    const { x, y } = limits(s);
    scale.set(withSpring(s, SPRING));
    tx.set(withSpring(s === 1 ? 0 : clamp(tx.get(), x), SPRING));
    ty.set(withSpring(s === 1 ? 0 : clamp(ty.get(), y), SPRING));
  }

  const onLayout = (event: LayoutChangeEvent) => {
    containerW.set(event.nativeEvent.layout.width);
    containerH.set(event.nativeEvent.layout.height);
    fitImage();
  };

  const pinch = usePinchGesture({
    onActivate: (event) => {
      'worklet';
      startScale.set(scale.get());
      startTx.set(tx.get());
      startTy.set(ty.get());
      focalX.set(event.focalX - containerW.get() / 2);
      focalY.set(event.focalY - containerH.get() / 2);
    },
    onUpdate: (event) => {
      'worklet';
      const s = Math.min(MAX_SCALE, Math.max(MIN_PINCH_SCALE, startScale.get() * event.scale));
      const ratio = s / startScale.get();
      // Keep the point under the fingers where it started.
      scale.set(s);
      tx.set(focalX.get() - (focalX.get() - startTx.get()) * ratio);
      ty.set(focalY.get() - (focalY.get() - startTy.get()) * ratio);
    },
    onDeactivate: () => {
      'worklet';
      settle();
    },
  });

  const pan = usePanGesture({
    maxPointers: 2,
    onActivate: () => {
      'worklet';
      startTx.set(tx.get());
      startTy.set(ty.get());
    },
    onUpdate: (event) => {
      'worklet';
      if (scale.get() > 1.01) {
        tx.set(startTx.get() + event.translationX);
        ty.set(startTy.get() + event.translationY);
        return;
      }
      if (!onDismiss) return;
      const y = Math.max(0, event.translationY);
      dragY.set(y);
      dismissProgress?.set(Math.min(1, y / DISMISS_DISTANCE));
    },
    onDeactivate: (event) => {
      'worklet';
      if (scale.get() > 1.01) {
        const { x, y } = limits(scale.get());
        tx.set(withDecay({ velocity: event.velocityX, clamp: [-x, x] }));
        ty.set(withDecay({ velocity: event.velocityY, clamp: [-y, y] }));
        return;
      }
      if (onDismiss && (dragY.get() > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY)) {
        scheduleOnRN(onDismiss);
        return;
      }
      dragY.set(withSpring(0, SPRING));
      dismissProgress?.set(withTiming(0));
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: (event) => {
      'worklet';
      if (scale.get() > 1.01) {
        scale.set(withSpring(1, SPRING));
        tx.set(withSpring(0, SPRING));
        ty.set(withSpring(0, SPRING));
        return;
      }
      // Zoom toward the tapped point.
      const fx = event.x - containerW.get() / 2;
      const fy = event.y - containerH.get() / 2;
      const { x, y } = limits(DOUBLE_TAP_SCALE);
      scale.set(withSpring(DOUBLE_TAP_SCALE, SPRING));
      tx.set(withSpring(clamp(fx * (1 - DOUBLE_TAP_SCALE), x), SPRING));
      ty.set(withSpring(clamp(fy * (1 - DOUBLE_TAP_SCALE), y), SPRING));
    },
  });

  const singleTap = useTapGesture({
    onActivate: () => {
      'worklet';
      if (onTap) scheduleOnRN(onTap);
    },
  });

  const taps = useExclusiveGestures(doubleTap, singleTap);
  const gesture = useSimultaneousGestures(pinch, pan, taps);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.get() },
      { translateY: ty.get() + dragY.get() },
      { scale: scale.get() * (1 - Math.min(1, dragY.get() / DISMISS_DISTANCE) * 0.15) },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.fill} onLayout={onLayout} collapsable={false}>
        <Animated.View style={[styles.fill, imageStyle]}>
          <Image
            source={{ uri }}
            style={styles.fill}
            contentFit="contain"
            transition={150}
            accessible
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
            onLoad={(event) => {
              naturalW.set(event.source.width);
              naturalH.set(event.source.height);
              fitImage();
            }}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: '100%',
  },
});
