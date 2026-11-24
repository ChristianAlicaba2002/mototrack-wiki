import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import {
  type AccessibilityRole,
  type AccessibilityState,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ChevronRightIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

type Tone = 'default' | 'danger';

const ROW_PADDING_X = Spacing.three;
const ICON_TILE = 34;
const ICON_GAP = Spacing.three - 4;
/** Rules between rows start under the label, not under the icon. */
const RULE_INSET = ROW_PADDING_X + ICON_TILE + ICON_GAP;

// ---------- Group ----------

type SettingsGroupProps = {
  title: string;
  /** Small print under the panel. */
  footnote?: string;
  tone?: Tone;
  children: ReactNode;
};

/** An eyebrow title, a white panel of rows with inset rules between them, and optional small print. */
export function SettingsGroup({ title, footnote, tone = 'default', children }: SettingsGroupProps) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.group}>
      <ThemedText
        type="eyebrow"
        themeColor={tone === 'danger' ? 'danger' : 'textSecondary'}
        style={styles.groupTitle}
        accessibilityRole="header">
        {title}
      </ThemedText>
      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: tone === 'danger' ? theme.danger : theme.line,
          },
        ]}>
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 ? <View style={[styles.rule, { backgroundColor: theme.line }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footnote ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
          {footnote}
        </ThemedText>
      ) : null}
    </View>
  );
}

// ---------- Rows ----------

type SettingsRowProps = {
  icon: (color: string) => ReactNode;
  label: string;
  description?: string;
  /** Right-hand side: a switch, a value, a spinner. Replaces the chevron. */
  trailing?: ReactNode;
  /**
   * Show a chevron (when there's no trailing element). On for rows that open
   * another screen; turn it off for rows that act in place, like Sign out.
   */
  chevron?: boolean;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
};

/**
 * One line in a settings panel: icon tile, label and description, trailing control.
 * The whole row is the touch target and is read as a single element.
 */
export function SettingsRow({
  icon,
  label,
  description,
  trailing,
  chevron = true,
  onPress,
  tone = 'default',
  disabled,
  accessibilityRole = onPress ? 'button' : undefined,
  accessibilityState,
  accessibilityHint,
}: SettingsRowProps) {
  const theme = useTheme();
  const danger = tone === 'danger';
  const labelColor = danger ? theme.danger : theme.text;

  const content = (
    <>
      <View style={[styles.tile, { backgroundColor: danger ? theme.brandSoft : theme.backgroundSelected }]}>
        {icon(danger ? theme.danger : theme.text)}
      </View>
      <View style={styles.text}>
        <ThemedText style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {trailing ?? (onPress && chevron ? <ChevronRightIcon size={18} color={theme.textSecondary} /> : null)}
    </>
  );

  const a11y = {
    accessible: true,
    accessibilityRole,
    accessibilityLabel: description ? `${label}. ${description}` : label,
    accessibilityHint,
    accessibilityState: { disabled, ...accessibilityState },
  };

  if (!onPress) {
    return (
      <View style={styles.row} {...a11y}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      {...a11y}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: theme.backgroundSelected },
        disabled && styles.disabled,
      ]}>
      {content}
    </Pressable>
  );
}

type ToggleRowProps = Pick<SettingsRowProps, 'icon' | 'label' | 'description' | 'disabled'> & {
  value: boolean;
  onChange: (value: boolean) => void;
};

/** A row that flips a setting. Tapping anywhere on it flips the switch. */
export function ToggleRow({ value, onChange, disabled, ...row }: ToggleRowProps) {
  const theme = useTheme();
  return (
    <SettingsRow
      {...row}
      disabled={disabled}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      trailing={
        <Switch
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ false: theme.line, true: theme.accent }}
          thumbColor={theme.backgroundElement}
          ios_backgroundColor={theme.line}
          // The row is the accessible element; don't announce the switch twice.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      }
    />
  );
}

/** A trailing spinner with a short status, for rows doing work. */
export function RowProgress({ tone = 'default' }: { tone?: Tone }) {
  const theme = useTheme();
  return <ActivityIndicator color={tone === 'danger' ? theme.danger : theme.textSecondary} />;
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  groupTitle: {
    paddingHorizontal: Spacing.one,
  },
  panel: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginLeft: RULE_INSET,
  },
  footnote: {
    paddingHorizontal: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ICON_GAP,
    minHeight: 60,
    paddingHorizontal: ROW_PADDING_X,
    paddingVertical: Spacing.three - 4,
  },
  disabled: {
    opacity: 0.5,
  },
  tile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: Radius.field + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
});
