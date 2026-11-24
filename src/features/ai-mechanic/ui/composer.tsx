import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ArrowRightIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { IconButton, Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { MAX_MESSAGE_LENGTH } from '../model/conversation';

const COUNTER_FROM = MAX_MESSAGE_LENGTH - 400;

type ComposerProps = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  canSend: boolean;
  disabled?: boolean;
};

export function Composer({ value, onChange, onSend, canSend, disabled }: ComposerProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.root, { borderTopColor: theme.line, backgroundColor: theme.background }]}>
      <View style={styles.row}>
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Describe what your bike is doing…"
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          accessibilityLabel="Message"
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: focused ? theme.text : theme.line,
              borderWidth: focused ? 1.5 : 1,
            },
          ]}
        />
        <IconButton
          variant="primary"
          size={44}
          accessibilityLabel="Send"
          onPress={onSend}
          disabled={!canSend}
          icon={(c) => <ArrowRightIcon size={20} color={c} />}
        />
      </View>
      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer} numberOfLines={1}>
          AI suggestions, not a substitute for a mechanic
        </ThemedText>
        {value.length >= COUNTER_FROM ? (
          <ThemedText type="readout" themeColor="textSecondary" style={styles.counter}>
            {value.length}/{MAX_MESSAGE_LENGTH}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three - 4,
    paddingBottom: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two + 4,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: Spacing.three - 2,
    paddingTop: Spacing.two + 3,
    paddingBottom: Spacing.two + 3,
    borderRadius: Radius.field,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  disclaimer: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  counter: {
    fontSize: 12,
    lineHeight: 16,
  },
});
