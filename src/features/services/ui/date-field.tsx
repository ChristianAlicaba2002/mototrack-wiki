import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatLongDate } from '../model/format';
import { DateFieldFrame, type DateFieldProps, dateFieldStyles, useDateBoxColors } from './date-field-frame';

const INLINE_CALENDAR = Platform.OS === 'ios';

export function DateField({
  label,
  value,
  minimumDate,
  maximumDate,
  onChange,
  onClose,
  error,
  hint,
  disabled,
}: DateFieldProps) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const [open, setOpen] = useState(false);
  const boxColors = useDateBoxColors(open, error);
  const shown = formatLongDate(value);

  function close() {
    setOpen(false);
    onClose?.();
  }

  function pick(date: Date) {
    onChange(date);
    close();
  }

  return (
    <DateFieldFrame label={label} error={error} hint={hint}>
      <Pressable
        onPress={() => (open ? close() : setOpen(true))}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${shown}`}
        accessibilityHint={error ?? 'Opens a calendar to pick the date.'}
        accessibilityState={{ disabled, expanded: INLINE_CALENDAR ? open : undefined }}
        style={({ pressed }) => [
          dateFieldStyles.box,
          boxColors,
          pressed && dateFieldStyles.pressed,
          disabled && dateFieldStyles.disabled,
        ]}>
        <ThemedText style={dateFieldStyles.value} numberOfLines={1}>
          {shown}
        </ThemedText>
        <ThemedText type="eyebrow" themeColor="textSecondary">
          {open && INLINE_CALENDAR ? 'Close' : 'Change'}
        </ThemedText>
      </Pressable>
      {open && !disabled ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={INLINE_CALENDAR ? 'inline' : 'default'}
          presentation="dialog"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          accentColor={theme.accent}
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          onValueChange={(_, date) => pick(date)}
          onDismiss={close}
          style={INLINE_CALENDAR ? styles.calendar : undefined}
        />
      ) : null}
    </DateFieldFrame>
  );
}

const styles = StyleSheet.create({
  calendar: {
    alignSelf: 'stretch',
    marginTop: Spacing.one,
  },
});
