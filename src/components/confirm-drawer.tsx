import { type ReactElement, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomDrawer, useCloseDrawer } from '@/components/bottom-drawer';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { Button } from '@/features/garage/ui/controls';

export type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
};

export function useConfirmDrawer(): { confirm: (request: ConfirmRequest) => void; drawer: ReactElement } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback((next: ConfirmRequest) => setRequest(next), []);
  const onClosed = useCallback(() => setRequest(null), []);
  return { confirm, drawer: <ConfirmDrawer request={request} onClosed={onClosed} /> };
}

type ConfirmDrawerProps = {
  request: ConfirmRequest | null;
  onClosed: () => void;
};

export function ConfirmDrawer({ request, onClosed }: ConfirmDrawerProps) {
  const cancelLabel = request?.cancelLabel ?? 'Cancel';
  const tone = request?.tone ?? 'danger';

  return (
    <BottomDrawer open={request !== null} onClosed={onClosed} dismissLabel={cancelLabel}>
      {request ? <ConfirmContent request={request} cancelLabel={cancelLabel} tone={tone} /> : null}
    </BottomDrawer>
  );
}

type ConfirmContentProps = {
  request: ConfirmRequest;
  cancelLabel: string;
  tone: 'danger' | 'primary';
};

function ConfirmContent({ request, cancelLabel, tone }: ConfirmContentProps) {
  const close = useCloseDrawer();
  return (
    <View style={styles.content}>
      <View style={styles.text}>
        <ThemedText style={styles.title} accessibilityRole="header">
          {request.title}
        </ThemedText>
        {request.message ? <ThemedText themeColor="textSecondary">{request.message}</ThemedText> : null}
      </View>
      <View style={styles.actions}>
        <Button
          label={request.confirmLabel}
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onPress={() => close(request.onConfirm)}
        />
        <Button label={cancelLabel} variant="secondary" onPress={() => close()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  text: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  actions: {
    gap: Spacing.two + 4,
  },
});
