import { Image } from 'expo-image';
import type { Timestamp } from 'firebase/firestore';
import { Pressable, StyleSheet, View } from 'react-native';

import { DocumentIcon } from '@/components/icons/line-icons';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Radius } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import { expiryStatus, formatExpiry } from '../model/documents';
import { useDocumentUrl } from '../model/use-document-url';

/** Red when expired, brand red when expiring soon, grey otherwise. */
export function useExpiryColor(expiresAt: Timestamp | null): string {
  const theme = useTheme();
  const kind = expiryStatus(expiresAt).kind;
  if (kind === 'expired') return theme.danger;
  if (kind === 'soon') return theme.brand;
  return theme.textSecondary;
}

/** "Expires in 12 days", coloured by urgency. */
export function ExpiryText({ expiresAt, style }: { expiresAt: Timestamp | null; style?: object }) {
  const color = useExpiryColor(expiresAt);
  return (
    <ThemedText type="readout" style={[{ color }, style]} numberOfLines={1}>
      {formatExpiry(expiresAt)}
    </ThemedText>
  );
}

/** A small preview of the document photo, or a document icon while it loads or if it can't. */
export function DocumentThumb({ storagePath, size = 56 }: { storagePath: string; size?: number }) {
  const theme = useTheme();
  const { url } = useDocumentUrl(storagePath);
  return (
    <View
      style={[
        styles.thumb,
        { width: size, height: size, backgroundColor: theme.backgroundSelected, borderColor: theme.line },
      ]}>
      {url ? (
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <DocumentIcon size={Math.round(size * 0.42)} color={theme.textSecondary} />
      )}
    </View>
  );
}

export type ChoiceOption<T extends string | null> = { value: T; label: string };

/** A wrapping row of single-choice pills. */
export function ChoicePills<T extends string | null>({
  options,
  value,
  onChange,
  disabled,
  accessibilityLabel,
}: {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.pills} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value ?? 'none'}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected, disabled }}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: selected ? theme.text : 'transparent',
                borderColor: selected ? theme.text : theme.line,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={{ color: selected ? theme.background : theme.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pill: {
    minHeight: 38,
    paddingHorizontal: Spacing.three - 2,
    borderRadius: Radius.field,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
