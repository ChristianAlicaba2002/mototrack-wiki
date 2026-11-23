import { type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const Radius = {
  field: 6,
  card: 10,
  pill: 999,
} as const;

// ---------- Panel ----------

/** A sheet of paper on the bench: flat, bordered, no shadow. */
export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.line }, style]}>
      {children}
    </View>
  );
}

/** Eyebrow label with an optional action on the right, e.g. "See all". */
export function PanelHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.panelHeading}>
      <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
        {title}
      </ThemedText>
      {action}
    </View>
  );
}

/** A full-width hairline rule. */
export function Rule({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return <View style={[styles.rule, { backgroundColor: theme.line, marginHorizontal: inset }]} />;
}

// ---------- Screen header ----------

type ScreenHeaderProps = {
  title: string;
  /** Small line above the title, e.g. the bike's name. */
  context?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

/** Header for stack and modal screens: left-aligned, ruled off from the content. */
export function ScreenHeader({ title, context, leading, trailing }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.screenHeader, { borderBottomColor: theme.line }]}>
      {leading}
      <View style={styles.screenHeaderText}>
        {context ? (
          <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
            {context}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.screenHeaderTitle} accessibilityRole="header" numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
      {trailing}
    </View>
  );
}

// ---------- Section ----------

type SectionProps = {
  title: string;
  description?: string;
  plain?: boolean;
  children: ReactNode;
};

/** A titled group of fields: stamped label, then a bordered sheet. */
export function Section({ title, description, plain, children }: SectionProps) {
  const theme = useTheme();
  if (plain) {
    return (
      <View style={[styles.sectionPlain, { borderTopColor: theme.line }]}>
        <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
        {children}
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Panel style={styles.sectionCard}>{children}</Panel>
    </View>
  );
}

// ---------- Odometer readout ----------

type OdometerReadoutProps = {
  km: number;
  /** Pads with leading zeros to at least this many wheels, like the real thing. */
  digits?: number;
  size?: 'md' | 'lg';
};

/** Mechanical-odometer style number: one wheel per digit, unused leading wheels dimmed. */
export function OdometerReadout({ km, digits = 6, size = 'md' }: OdometerReadoutProps) {
  const theme = useTheme();
  const value = String(Math.max(0, Math.floor(km)));
  const padded = value.padStart(digits, '0');
  const firstReal = padded.length - value.length;
  const dims = size === 'lg' ? styles.wheelLg : styles.wheelMd;
  const text = size === 'lg' ? styles.wheelTextLg : styles.wheelTextMd;

  return (
    <View
      style={styles.readout}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${Number(value).toLocaleString('en-US')} kilometres`}>
      <View style={[styles.wheels, { backgroundColor: theme.text }]}>
        {padded.split('').map((d, i) => (
          <View
            key={i}
            style={[dims, i > 0 && { borderLeftColor: theme.background, borderLeftWidth: StyleSheet.hairlineWidth }]}>
            <ThemedText style={[text, { color: theme.background, opacity: i < firstReal ? 0.35 : 1 }]}>{d}</ThemedText>
          </View>
        ))}
      </View>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        km
      </ThemedText>
    </View>
  );
}

// ---------- FormField ----------

type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown to the right of the input, e.g. a unit. */
  suffix?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Render the value in the readout face (numbers, dates, plates). */
  mono?: boolean;
};

export function FormField({
  label,
  suffix,
  hint,
  error,
  optional,
  mono,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? theme.danger : focused ? theme.text : theme.line;
  const multiline = Boolean(inputProps.multiline);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {optional ? (
          <ThemedText type="small" themeColor="textSecondary">
            optional
          </ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { backgroundColor: theme.background, borderColor, borderWidth: focused || error ? 1.5 : 1 },
        ]}>
        <TextInput
          style={[
            styles.input,
            mono && styles.inputMono,
            multiline && styles.inputMultiline,
            { color: theme.text },
          ]}
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
          <View style={[styles.suffix, { borderLeftColor: theme.line }]}>
            <ThemedText type="eyebrow" themeColor="textSecondary">
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
    primary: { background: theme.accent, border: theme.accent, text: theme.onAccent },
    secondary: { background: 'transparent', border: theme.text, text: theme.text },
    danger: { background: 'transparent', border: theme.danger, text: theme.danger },
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
        { backgroundColor: palette.background, borderColor: palette.border },
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

/** Inline text button: underlined label, no box. */
export function TextAction({
  label,
  onPress,
  accessibilityLabel,
  tone = 'accent',
  disabled,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  tone?: 'accent' | 'text' | 'danger';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = { accent: theme.accent, text: theme.text, danger: theme.danger }[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [pressed && styles.textPressed, disabled && styles.disabled]}>
      <ThemedText type="smallBold" style={[styles.textAction, { color, textDecorationColor: color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type IconButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  icon: (color: string) => ReactNode;
  variant?: 'primary' | 'secondary' | 'plain';
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
          backgroundColor: isPrimary ? theme.accent : 'transparent',
          borderColor: isPrimary ? theme.accent : variant === 'plain' ? 'transparent' : theme.line,
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
    <View style={[styles.message, { borderLeftColor: theme.danger }]} accessibilityRole="alert">
      <ThemedText type="small" style={{ color: theme.danger }}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenHeaderText: {
    flex: 1,
    gap: 2,
  },
  screenHeaderTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  section: {
    gap: Spacing.two,
  },
  sectionPlain: {
    gap: Spacing.three + 4,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionHeading: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.half,
  },
  sectionCard: {
    gap: Spacing.three + 4,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  wheels: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  wheelMd: {
    width: 22,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelLg: {
    width: 34,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelTextMd: {
    fontFamily: Fonts.monoMedium,
    fontSize: 18,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  wheelTextLg: {
    fontFamily: Fonts.monoMedium,
    fontSize: 30,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
  },
  field: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: Radius.field,
    paddingLeft: Spacing.three - 2,
  },
  inputWrapMultiline: {
    height: undefined,
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: Spacing.three - 4,
  },
  input: {
    fontFamily: Fonts.sans,
    flex: 1,
    height: '100%',
    fontSize: 16,
    paddingRight: Spacing.three - 2,
  },
  inputMono: {
    fontFamily: Fonts.mono,
    fontVariant: ['tabular-nums'],
  },
  inputMultiline: {
    height: undefined,
    minHeight: 96,
    paddingTop: 0,
    paddingBottom: 0,
  },
  suffix: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  button: {
    height: 50,
    borderRadius: Radius.field + 2,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buttonLabel: {
    fontSize: 16,
  },
  textAction: {
    textDecorationLine: 'underline',
  },
  textPressed: {
    opacity: 0.6,
  },
  iconButton: {
    borderRadius: Radius.field + 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  message: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.three - 4,
    paddingVertical: Spacing.one,
  },
});
