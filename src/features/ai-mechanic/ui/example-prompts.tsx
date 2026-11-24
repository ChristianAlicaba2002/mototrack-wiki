import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const EXAMPLE_PROMPTS = [
  'Hard to start in the morning',
  'When should I change my CVT belt?',
  'May kalampag sa harap pag dumadaan sa lubak',
  'What tire pressure should I run with a passenger?',
] as const;

export function ExamplePrompts({ onPick }: { onPick: (prompt: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.root}>
      <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
        Try asking
      </ThemedText>
      <View>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onPick(prompt)}
            accessibilityRole="button"
            accessibilityLabel={prompt}
            style={({ pressed }) => [styles.row, { borderTopColor: theme.line }, pressed && styles.pressed]}>
            <ThemedText style={styles.prompt}>{prompt}</ThemedText>
            <ChevronRightIcon size={16} color={theme.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  prompt: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
