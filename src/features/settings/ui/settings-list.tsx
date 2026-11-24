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

const ICON_TILE = 34;
const ICON_GAP = Spacing.three - 4;
const RULE_INSET = ICON_TILE + ICON_GAP;

type SettingsGroupProps = {
  title: string;
  footnote?: string;
  tone?: Tone;
  children: ReactNode;
};

export function SettingsGroup({ title, footnote, tone = 'default', children }: SettingsGroupProps) {
  const theme = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.group}>
      <ThemedText
        type="eyebrow"
        themeColor={tone === 'danger' ? 'danger' : 'textSecondary'}
        accessibilityRole="header">
        {title}
      </ThemedText>
      <View style={[styles.rows, { borderColor: theme.line }]}>
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 ? <View style={[styles.rule, { backgroundColor: theme.line }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footnote ? (
        <ThemedText type="small" themeColor="textSecondary">
          {footnote}
        </ThemedText>
      ) : null}
    </View>
  );
}

type SettingsRowProps = {
  icon: (color: string) => ReactNode;
  label: string;
  description?: string;
  trailing?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  tone?: Tone;
  disabled?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityHint?: string;
};

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
        pressed && styles.pressed,
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
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      }
    />
  );
}

export function RowProgress({ tone = 'default' }: { tone?: Tone }) {
  const theme = useTheme();
  return <ActivityIndicator color={tone === 'danger' ? theme.danger : theme.textSecondary} />;
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  rows: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginLeft: RULE_INSET,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ICON_GAP,
    minHeight: 60,
    paddingVertical: Spacing.three - 4,
  },
  pressed: {
    opacity: 0.6,
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
