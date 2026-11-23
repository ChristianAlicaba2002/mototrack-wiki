import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LayoutAnimationConfig } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTodayLabel } from '@/hooks/use-today-label';

const TitleHeight = 36;

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  const theme = useTheme();
  const today = useTodayLabel();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: theme.background }}>
      <View style={[styles.header, { borderBottomColor: theme.text }]}>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {today}
        </ThemedText>
        <View style={styles.titleSlot}>
          <LayoutAnimationConfig skipEntering>
            <Animated.View
              key={title}
              entering={FadeInDown.duration(280)}
              exiting={FadeOutUp.duration(200)}
              style={styles.title}>
              <ThemedText type="subtitle" accessibilityRole="header" numberOfLines={1}>
                {title}
              </ThemedText>
            </Animated.View>
          </LayoutAnimationConfig>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderBottomWidth: 2,
  },
  titleSlot: {
    height: TitleHeight,
    overflow: 'hidden',
  },
  title: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
