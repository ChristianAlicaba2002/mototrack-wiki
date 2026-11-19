import { type ReactNode, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const Radius = {
  field: 14,
  card: 22,
  pill: 999,
} as const;

// ---------- Section ----------

type SectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** A titled group of fields on a raised card, like iOS Settings. */
export function Section({ title, description, children }: SectionProps) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>{children}</View>
    </View>
  );
}

// ---------- FormField ----------

type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  icon?: (color: string) => ReactNode;
  /** Shown to the right of the input, e.g. a unit. */
  suffix?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function FormField({
  label,
  icon,
  suffix,
  hint,
  error,
  optional,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.accent : 'transparent';
  const iconColor = error ? theme.danger : focused ? theme.accent : theme.textSecondary;
  const multiline = Boolean(inputProps.multiline);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {optional ? (
          <ThemedText type="small" themeColor="textSecondary">
            Optional
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { backgroundColor: theme.background, borderColor },
        ]}>
        {icon?.(iconColor)}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, { color: theme.text }]}
          textAlignVertical={multiline ? 'top' : undefined}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {suffix ? (
          <View style={[styles.suffix, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {suffix}
            </ThemedText>
          </View>
        ) : null}
      </View>
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

// ---------- Buttons ----------

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: (color: string) => ReactNode;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading }: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const palette = {
    primary: { background: theme.accent, text: theme.onAccent },
    secondary: { background: theme.backgroundElement, text: theme.text },
    danger: { background: theme.brandSoft, text: theme.danger },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background },
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon?.(palette.text)}
          <ThemedText type="smallBold" style={[styles.buttonLabel, { color: palette.text }]}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  icon: (color: string) => ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: number;
};

export function IconButton({
  accessibilityLabel,
  onPress,
  icon,
  variant = 'secondary',
  disabled,
  size = 40,
}: IconButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          backgroundColor: isPrimary ? theme.accent : theme.backgroundElement,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {icon(isPrimary ? theme.onAccent : theme.text)}
    </Pressable>
  );
}

// ---------- Feedback ----------

export function ErrorMessage({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.message, { backgroundColor: theme.brandSoft }]} accessibilityRole="alert">
      <View style={[styles.messageDot, { backgroundColor: theme.danger }]} />
      <ThemedText type="small" style={[styles.messageText, { color: theme.danger }]}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  sectionHeading: {
    gap: Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  sectionCard: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
  },
  field: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    height: 52,
    borderRadius: Radius.field,
    borderWidth: 1.5,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
  },
  // Multiline inputs grow with their text; the icon stays at the top.
  inputWrapMultiline: {
    height: undefined,
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: Spacing.three - 2,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 92,
    paddingTop: 0,
    paddingBottom: 0,
  },
  suffix: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  button: {
    height: 54,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buttonLabel: {
    fontSize: 16,
  },
  iconButton: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.field,
  },
  messageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageText: {
    flex: 1,
  },
});
