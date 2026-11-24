import { Fragment, type ReactNode, type Ref, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Border, ControlHeight, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ---------- Panel ----------

type PanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Red left edge: this panel is about the bike you're riding now. */
  marked?: boolean;
};

/** A sheet of paper on the bench: flat, bordered, no shadow. */
export function Panel({ children, style, marked }: PanelProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.backgroundElement, borderColor: theme.line },
        marked && { borderLeftColor: theme.brand, borderLeftWidth: 4 },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Section label with an optional action on the right, e.g. "See all". */
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

/** The one way the app marks the active bike: a red square and "Riding now". Pair it with `<Panel marked>`. */
export function ActiveMark() {
  const theme = useTheme();
  return (
    <View style={styles.activeMark}>
      <View style={[styles.activeSquare, { backgroundColor: theme.brand }]} />
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Riding now
      </ThemedText>
    </View>
  );
}

/** A full-width hairline rule. */
export function Rule() {
  const theme = useTheme();
  return <View style={[styles.rule, { backgroundColor: theme.line }]} />;
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
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {context}
          </ThemedText>
        ) : null}
        <ThemedText type="heading" accessibilityRole="header" numberOfLines={1}>
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
  children: ReactNode;
};

/** A titled group of fields: stamped label, then a bordered sheet. */
export function Section({ title, description, children }: SectionProps) {
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

// ---------- Empty state ----------

type EmptyStateProps = {
  /** A short readout shown above the title, e.g. "000000 km" or "₱0". */
  stamp?: string;
  title: string;
  body: string;
  action?: ReactNode;
};

/** What a screen or card shows before there's anything in it. */
export function EmptyState({ stamp, title, body, action }: EmptyStateProps) {
  return (
    <Panel style={styles.empty}>
      {stamp ? (
        <ThemedText type="readoutSmall" themeColor="textSecondary">
          {stamp}
        </ThemedText>
      ) : null}
      <ThemedText type="heading">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {body}
      </ThemedText>
      {action}
    </Panel>
  );
}

// ---------- Readouts ----------

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
            style={[dims, i > 0 && { borderLeftColor: theme.background, borderLeftWidth: Border.hairline }]}>
            <ThemedText style={[text, { color: theme.background, opacity: i < firstReal ? 0.35 : 1 }]}>{d}</ThemedText>
          </View>
        ))}
      </View>
      <ThemedText type="readoutSmall" themeColor="textSecondary">
        km
      </ThemedText>
    </View>
  );
}

/** A number plate, drawn like one: black on white, square-cornered. */
export function Plate({ number }: { number: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.plate, { borderColor: theme.text, backgroundColor: theme.backgroundElement }]}
      accessible
      accessibilityLabel={`Plate ${number}`}>
      <ThemedText type="readoutBold" style={styles.plateText}>
        {number.toUpperCase()}
      </ThemedText>
    </View>
  );
}

type Stat = { label: string; value: string };

/** Headline numbers between two heavy rules, like the footer of a ledger page. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.statStrip, { borderColor: theme.text }]}>
      {stats.map((stat, i) => (
        <Fragment key={stat.label}>
          {i > 0 ? <View style={[styles.statDivider, { backgroundColor: theme.line }]} /> : null}
          <View style={styles.stat} accessible accessibilityLabel={`${stat.label}: ${stat.value}`}>
            <ThemedText type="eyebrow" themeColor="textSecondary">
              {stat.label}
            </ThemedText>
            <ThemedText type="readoutLarge" numberOfLines={1} adjustsFontSizeToFit>
              {stat.value}
            </ThemedText>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

// ---------- FormField ----------

type FormFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown to the right of the label, e.g. "Forgot password?". */
  labelAction?: ReactNode;
  /** Icon at the start of the input; gets the current border color. */
  leading?: (color: string) => ReactNode;
  /** Shown inside the input on the right, e.g. a show-password toggle. */
  trailing?: ReactNode;
  /** A unit shown in its own cell on the right, e.g. "km". */
  suffix?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Render the value in the readout face (numbers, dates, plates). */
  mono?: boolean;
  inputRef?: Ref<TextInputInstance>;
};

export function FormField({
  label,
  labelAction,
  leading,
  trailing,
  suffix,
  hint,
  error,
  optional,
  mono,
  inputRef,
  onFocus,
  onBlur,
  ...inputProps
}: FormFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  // Only the colour changes on focus, so the field never shifts by a pixel.
  const borderColor = error ? theme.danger : focused ? theme.text : theme.line;
  const multiline = Boolean(inputProps.multiline);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {labelAction ??
          (optional ? (
            <ThemedText type="small" themeColor="textSecondary">
              Optional
            </ThemedText>
          ) : null)}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { backgroundColor: theme.background, borderColor },
        ]}>
        {leading ? <View style={styles.inputLeading}>{leading(focused ? theme.text : theme.textSecondary)}</View> : null}
        <TextInput
          ref={inputRef}
          style={[styles.input, mono && styles.inputMono, multiline && styles.inputMultiline, { color: theme.text }]}
          textAlignVertical={multiline ? 'top' : undefined}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.action}
          cursorColor={theme.action}
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
        {trailing ? <View style={styles.inputTrailing}>{trailing}</View> : null}
        {suffix ? (
          <View style={[styles.suffix, { borderLeftColor: theme.line }]}>
            <ThemedText type="readoutSmall" themeColor="textSecondary">
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
    primary: { background: theme.action, border: theme.action, text: theme.onAction },
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
          <ThemedText type="defaultBold" style={{ color: palette.text }}>
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
  tone = 'default',
  disabled,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : theme.action;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
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
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/** Square 44pt button for back, close and add. */
export function IconButton({ accessibilityLabel, onPress, icon, variant = 'secondary', disabled }: IconButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: isPrimary ? theme.action : 'transparent',
          borderColor: isPrimary ? theme.action : theme.line,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {icon(isPrimary ? theme.onAction : theme.text)}
    </Pressable>
  );
}

// ---------- Feedback ----------

/** A message with a coloured rule on its left edge. */
export function Notice({ tone, children }: { tone: 'danger' | 'success'; children: ReactNode }) {
  const theme = useTheme();
  const color = theme[tone];
  return (
    <View
      style={[styles.message, { borderLeftColor: color }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      accessibilityLiveRegion="polite">
      <ThemedText type="small" style={{ color }}>
        {children}
      </ThemedText>
    </View>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  return <Notice tone="danger">{children}</Notice>;
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.panel,
    borderWidth: Border.control,
    padding: Spacing.s16,
    gap: Spacing.s16,
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s16,
  },
  activeMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  activeSquare: {
    width: 8,
    height: 8,
  },
  rule: {
    height: Border.hairline,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
    borderBottomWidth: Border.hairline,
  },
  screenHeaderText: {
    flex: 1,
  },
  section: {
    gap: Spacing.s8,
  },
  sectionHeading: {
    gap: Spacing.s4,
  },
  sectionCard: {
    gap: Spacing.s20,
  },
  empty: {
    gap: Spacing.s12,
    paddingVertical: Spacing.s24,
  },
  readout: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.s8,
  },
  wheels: {
    flexDirection: 'row',
    borderRadius: Radius.control,
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
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelTextMd: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  wheelTextLg: {
    fontFamily: Fonts.monoSemiBold,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  plate: {
    alignSelf: 'flex-start',
    borderWidth: Border.control,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.s8,
    paddingVertical: Spacing.s2,
  },
  plateText: {
    letterSpacing: 1,
  },
  statStrip: {
    flexDirection: 'row',
    borderTopWidth: Border.rule,
    borderBottomWidth: Border.rule,
    paddingVertical: Spacing.s12,
  },
  statDivider: {
    width: Border.hairline,
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    gap: Spacing.s4,
    paddingHorizontal: Spacing.s12,
  },
  field: {
    gap: Spacing.s8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: Border.control,
  },
  inputWrapMultiline: {
    height: undefined,
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: Spacing.s12,
  },
  inputLeading: {
    paddingLeft: Spacing.s12,
  },
  inputTrailing: {
    paddingRight: Spacing.s12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.s12,
    fontFamily: Fonts.body,
    fontSize: 16,
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
    paddingHorizontal: Spacing.s16,
    borderLeftWidth: Border.hairline,
  },
  button: {
    height: ControlHeight,
    borderRadius: Radius.control,
    borderWidth: Border.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.s8,
    paddingHorizontal: Spacing.s24,
  },
  textAction: {
    textDecorationLine: 'underline',
  },
  textPressed: {
    opacity: 0.6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.control,
    borderWidth: Border.control,
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
    paddingLeft: Spacing.s12,
    paddingVertical: Spacing.s4,
  },
});
