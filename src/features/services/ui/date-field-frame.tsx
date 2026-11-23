import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

export type DateFieldProps = {
  label: string;
  value: Date;
  minimumDate: Date;
  maximumDate: Date;
  onChange: (date: Date) => void;
  onClose?: () => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
};

export function DateFieldFrame({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={dateFieldStyles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function useDateBoxColors(active: boolean, error?: string) {
  const theme = useTheme();
  return {
    backgroundColor: theme.background,
    borderColor: error ? theme.danger : active ? theme.text : theme.line,
    borderWidth: active || error ? 1.5 : 1,
  };
}

export const dateFieldStyles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    height: 50,
    borderRadius: Radius.field,
    paddingHorizontal: Spacing.three - 2,
  },
  value: {
    flex: 1,
    fontFamily: Fonts.mono,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
});
