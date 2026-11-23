import { useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { DateFieldFrame, type DateFieldProps, dateFieldStyles, useDateBoxColors } from './date-field-frame';

const pad = (n: number) => String(n).padStart(2, '0');

function toIsoDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIsoDay(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

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
  const [focused, setFocused] = useState(false);
  const boxColors = useDateBoxColors(focused, error);

  return (
    <DateFieldFrame label={label} error={error} hint={hint}>
      <View style={[dateFieldStyles.box, boxColors, disabled && dateFieldStyles.disabled]}>
        <input
          type="date"
          aria-label={label}
          aria-invalid={error ? true : undefined}
          value={toIsoDay(value)}
          min={toIsoDay(minimumDate)}
          max={toIsoDay(maximumDate)}
          required
          disabled={disabled}
          onChange={(e) => {
            const date = fromIsoDay(e.currentTarget.value);
            if (date) onChange(date);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onClose?.();
          }}
          style={{
            flex: 1,
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: theme.text,
            fontFamily: Fonts.mono,
            fontSize: 16,
            fontVariantNumeric: 'tabular-nums',
            colorScheme: scheme === 'dark' ? 'dark' : 'light',
          }}
        />
      </View>
    </DateFieldFrame>
  );
}
