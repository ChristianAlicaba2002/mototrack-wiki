import { useEffect } from 'react';
import { type DimensionValue, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const PULSE_MS = 850;
const PULSE_LOW = 0.45;

type SkeletonBlockProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ width = '100%', height, radius = 3, style }: SkeletonBlockProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(
      withTiming(PULSE_LOW, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.backgroundSelected },
        animatedStyle,
        style,
      ]}
    />
  );
}

type SkeletonTextProps = {
  lineHeight: number;
  fontSize: number;
  width: DimensionValue;
};

export function SkeletonText({ lineHeight, fontSize, width }: SkeletonTextProps) {
  return (
    <View style={{ width, height: lineHeight, justifyContent: 'center' }}>
      <SkeletonBlock height={Math.round(fontSize * 0.72)} />
    </View>
  );
}
