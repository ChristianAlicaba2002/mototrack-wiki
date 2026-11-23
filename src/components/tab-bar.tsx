import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, type ComponentType } from 'react';
import { type LayoutRectangle, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
  BookIcon,
  HomeIcon,
  type IconProps,
  MotorcycleIcon,
  VaultIcon,
  WrenchIcon,
} from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import type { Tab, TabName } from '@/constants/tabs';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TabIcons: Record<TabName, ComponentType<IconProps>> = {
  index: HomeIcon,
  garage: MotorcycleIcon,
  vault: VaultIcon,
  wiki: BookIcon,
  'ai-mechanic': WrenchIcon,
};

const MarkerWidth = 28;
const MarkerHeight = 3;
export const TabBarRuleWidth = 2;

type TabButtonProps = Pick<TabTriggerSlotProps, 'isFocused' | 'onPress' | 'onLongPress' | 'onLayout'> & {
  tab: Tab;
};

export function TabButton({ tab, isFocused = false, onPress, onLongPress, onLayout }: TabButtonProps) {
  const theme = useTheme();
  const Icon = TabIcons[tab.name];
  const color = isFocused ? theme.text : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon size={22} color={color} />
      <ThemedText
        type="eyebrow"
        style={[styles.label, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {tab.shortLabel}
      </ThemedText>
    </Pressable>
  );
}

type TabMarkerProps = {
  layout?: LayoutRectangle;
};

export function TabMarker({ layout }: TabMarkerProps) {
  const theme = useTheme();
  const offset = useSharedValue(-1);

  useEffect(() => {
    if (!layout) {
      return;
    }
    const target = layout.x + (layout.width - MarkerWidth) / 2;
    offset.set(
      offset.get() < 0 ? target : withTiming(target, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
  }, [layout, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: offset.value < 0 ? 0 : 1,
    transform: [{ translateX: Math.max(offset.value, 0) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.marker, { backgroundColor: theme.brand }, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one + 2,
    paddingTop: Spacing.two + 4,
    paddingBottom: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  marker: {
    position: 'absolute',
    top: -TabBarRuleWidth,
    left: 0,
    width: MarkerWidth,
    height: MarkerHeight,
    borderBottomLeftRadius: MarkerHeight,
    borderBottomRightRadius: MarkerHeight,
  },
});
