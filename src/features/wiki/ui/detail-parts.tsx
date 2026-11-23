import { Children, Fragment, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/icons/line-icons';
import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { Button, ErrorMessage, IconButton, Rule, ScreenHeader } from '@/features/garage/ui/controls';
import { useTheme } from '@/hooks/use-theme';

import type { WikiDetailLoadState } from '../model/wiki-detail-view-model';

const CONTENT_MAX_WIDTH = 560;

type DetailFrameProps = {
  title: string;
  context?: string;
  loadState: WikiDetailLoadState;
  error: string | null;
  back: () => void;
  children: ReactNode;
};

export function DetailFrame({ title, context, loadState, error, back, children }: DetailFrameProps) {
  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title={title}
          context={context}
          leading={
            <IconButton
              variant="plain"
              accessibilityLabel="Back"
              onPress={back}
              icon={(c) => <ChevronLeftIcon size={22} color={c} />}
            />
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          {loadState === 'loading' ? (
            <DetailSkeleton />
          ) : loadState === 'ready' ? (
            children
          ) : loadState === 'error' ? (
            <>
              <ErrorMessage>{error}</ErrorMessage>
              <Button label="Back" variant="secondary" onPress={back} />
            </>
          ) : (
            <NotFound back={back} />
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function NotFound({ back }: { back: () => void }) {
  return (
    <View style={styles.notFound}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        Not in the wiki
      </ThemedText>
      <ThemedText style={styles.notFoundTitle}>This page was moved or removed.</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Go back and search the wiki for it again.
      </ThemedText>
      <Button label="Back to the wiki" variant="secondary" onPress={back} />
    </View>
  );
}

function DetailSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.details} accessible accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      <View style={styles.heading}>
        <SkeletonText lineHeight={14} fontSize={11} width={72} />
        <SkeletonText lineHeight={36} fontSize={32} width="70%" />
      </View>
      <View style={[styles.facts, { borderTopColor: theme.text }]}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.fact, { borderBottomColor: theme.line }]}>
            <SkeletonText lineHeight={14} fontSize={11} width={64} />
            <SkeletonText lineHeight={20} fontSize={15} width={96} />
          </View>
        ))}
      </View>
      <View style={[styles.section, { borderTopColor: theme.line }]}>
        <SkeletonText lineHeight={14} fontSize={11} width={88} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.row}>
            <SkeletonText lineHeight={20} fontSize={14} width="45%" />
            <SkeletonText lineHeight={20} fontSize={14} width={64} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function DetailHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <View style={styles.heading}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {eyebrow}
      </ThemedText>
      <ThemedText style={styles.title} accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

export function Facts({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.facts, { borderTopColor: theme.text }]}>{children}</View>;
}

export function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.fact, { borderBottomColor: theme.line }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="readout" style={styles.factValue} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { borderTopColor: theme.line }]}>
      <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return (
    <View>
      {Children.toArray(children).map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <Rule /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

type LabeledRowProps = {
  label: string;
  value: string;
  note?: string;
};

export function LabeledRow({ label, value, note }: LabeledRowProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}>
      <View style={styles.rowLabel}>
        <ThemedText type="small">{label}</ThemedText>
        {note ? (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="readout" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export function Footnote({ children }: { children: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three + 4,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  details: {
    gap: Spacing.four,
  },
  heading: {
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.2,
  },
  facts: {
    borderTopWidth: 2,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  factValue: {
    flexShrink: 1,
    fontFamily: Fonts.monoMedium,
    fontSize: 15,
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.three + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three - 4,
  },
  rowLabel: {
    flex: 1,
    gap: 2,
  },
  rowValue: {
    fontFamily: Fonts.monoMedium,
    fontSize: 14,
    textAlign: 'right',
  },
  notFound: {
    gap: Spacing.two + 4,
  },
  notFoundTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
});
