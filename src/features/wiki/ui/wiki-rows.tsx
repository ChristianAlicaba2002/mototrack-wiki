import type { ReactNode } from 'react';
import { type DimensionValue, Pressable, StyleSheet, View } from 'react-native';

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

const SPEC_SKELETON_ROWS = [
  { make: 40, model: 78 },
  { make: 40, model: 85 },
  { make: 40, model: 80 },
  { make: 40, model: 113 },
  { make: 64, model: 77 },
  { make: 48, model: 131 },
];

const GUIDE_SKELETON_ROWS: { meta: number; title: number; summary: DimensionValue[] }[] = [
  { meta: 176, title: 175, summary: ['97%', '88%'] },
  { meta: 208, title: 242, summary: ['100%', '82%'] },
  { meta: 232, title: 168, summary: ['94%', '90%'] },
];

const EYEBROW = { lineHeight: 14, fontSize: 11 };
const READOUT = { lineHeight: 20, fontSize: 14 };
const ROW_TITLE = { lineHeight: 26, fontSize: 22 };
const PINNED_TITLE = { lineHeight: 32, fontSize: 28 };

export function WikiListSkeleton({ pinned }: { pinned: boolean }) {
  return (
    <View style={styles.skeleton} accessible accessibilityLabel="Loading the wiki" accessibilityState={{ busy: true }}>
      {pinned ? (
        <View style={styles.pinned}>
          <View style={styles.rowText}>
            <SkeletonText {...EYEBROW} width={72} />
            <SkeletonText {...PINNED_TITLE} width={180} />
            <SkeletonText {...READOUT} width={244} />
          </View>
          <View style={styles.chevron} />
        </View>
      ) : null}

      <SkeletonGroup title={120}>
        {SPEC_SKELETON_ROWS.map((row, i) => (
          <SkeletonRow key={i}>
            <SkeletonText {...EYEBROW} width={row.make} />
            <SkeletonText {...ROW_TITLE} width={row.model} />
            <SkeletonText {...READOUT} width={176} />
          </SkeletonRow>
        ))}
      </SkeletonGroup>

      <SkeletonGroup title={80}>
        {GUIDE_SKELETON_ROWS.map((row, i) => (
          <SkeletonRow key={i}>
            <SkeletonText {...EYEBROW} width={row.meta} />
            <SkeletonText {...ROW_TITLE} width={row.title} />
            {row.summary.map((width, line) => (
              <SkeletonText key={line} {...READOUT} width={width} />
            ))}
          </SkeletonRow>
        ))}
      </SkeletonGroup>
    </View>
  );
}

function SkeletonGroup({ title, children }: { title: number; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <SkeletonText {...EYEBROW} width={title} />
      <View style={[styles.list, { borderBottomColor: theme.line }]}>{children}</View>
    </View>
  );
}

function SkeletonRow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: theme.line }]}>
      <View style={styles.rowText}>{children}</View>
      <View style={styles.chevron} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    gap: Spacing.three,
  },
  chevron: {
    width: 18,
  },
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
