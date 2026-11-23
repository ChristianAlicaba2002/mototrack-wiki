import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from '@/components/icons/line-icons';
import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WikiCategory, WikiGuide, WikiSpec } from '@/lib/firestore/types';

import { WIKI_CATEGORY_LABELS, WIKI_DIFFICULTY_LABELS } from '../model/categories';
import { formatLitres, formatMinutes, formatPsi } from '../model/format';
import { specHighlight } from '../model/wiki-search';

export function WikiList({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <ThemedText type="eyebrow" themeColor="textSecondary" accessibilityRole="header">
        {title} · {count}
      </ThemedText>
      <View style={[styles.list, { borderBottomColor: theme.line }]}>{children}</View>
    </View>
  );
}

type RowFrameProps = {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
};

function RowFrame({ accessibilityLabel, onPress, children }: RowFrameProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, { borderTopColor: theme.line }, pressed && styles.pressed]}>
      <View style={styles.rowText}>{children}</View>
      <ChevronRightIcon size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

type SpecRowProps = {
  spec: WikiSpec;
  category: WikiCategory | null;
  onPress: () => void;
};

export function SpecRow({ spec, category, onPress }: SpecRowProps) {
  const highlight = specHighlight(spec, category);
  return (
    <RowFrame accessibilityLabel={`${spec.title} spec sheet, ${highlight}`} onPress={onPress}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {spec.make}
      </ThemedText>
      <ThemedText style={styles.rowTitle} numberOfLines={1}>
        {spec.model}
      </ThemedText>
      <ThemedText type="readout" themeColor="textSecondary" numberOfLines={1}>
        {highlight}
      </ThemedText>
    </RowFrame>
  );
}

export function GuideRow({ guide, onPress }: { guide: WikiGuide; onPress: () => void }) {
  const meta = `${WIKI_CATEGORY_LABELS[guide.category]} · ${WIKI_DIFFICULTY_LABELS[guide.difficulty]} · ${formatMinutes(guide.minutes)}`;
  return (
    <RowFrame accessibilityLabel={`${guide.title}, ${meta}`} onPress={onPress}>
      <ThemedText type="eyebrow" themeColor="textSecondary" numberOfLines={1}>
        {meta}
      </ThemedText>
      <ThemedText style={styles.rowTitle} numberOfLines={2}>
        {guide.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
        {guide.summary}
      </ThemedText>
    </RowFrame>
  );
}

export function PinnedSpec({ spec, onPress }: { spec: WikiSpec; onPress: () => void }) {
  const theme = useTheme();
  const oil = `Oil ${formatLitres(spec.fluids.engineOil.capacityL)}`;
  const tires = `Tires ${spec.tirePressure.front.soloPsi} / ${formatPsi(spec.tirePressure.rear.soloPsi)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Your bike: ${spec.title} spec sheet, ${oil}, ${tires}`}
      style={({ pressed }) => [styles.pinned, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <ThemedText type="eyebrow" style={{ color: theme.brand }}>
          Your bike
        </ThemedText>
        <ThemedText style={styles.pinnedTitle} numberOfLines={1}>
          {spec.title}
        </ThemedText>
        <ThemedText type="readout" themeColor="textSecondary" numberOfLines={1}>
          {oil} · {tires}
        </ThemedText>
      </View>
      <ChevronRightIcon size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export function MissingSpecNote({ bikeModel }: { bikeModel: string }) {
  const theme = useTheme();
  return (
    <View style={styles.missing}>
      <ThemedText type="eyebrow" style={{ color: theme.brand }}>
        Your bike
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        No spec sheet for the {bikeModel} yet. The general guides below still apply.
      </ThemedText>
    </View>
  );
}

export function WikiListSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.group} accessible accessibilityLabel="Loading the wiki" accessibilityState={{ busy: true }}>
      <SkeletonText lineHeight={14} fontSize={11} width={96} />
      <View style={[styles.list, { borderBottomColor: theme.line }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.row, { borderTopColor: theme.line }]}>
            <View style={styles.rowText}>
              <SkeletonText lineHeight={14} fontSize={11} width={56} />
              <SkeletonText lineHeight={26} fontSize={22} width="60%" />
              <SkeletonText lineHeight={20} fontSize={14} width="40%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  list: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.6,
  },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pinnedTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  missing: {
    gap: Spacing.one,
  },
});
