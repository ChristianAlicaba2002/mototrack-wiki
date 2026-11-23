import { useLocalSearchParams } from 'expo-router';
import { type DimensionValue, StyleSheet, View } from 'react-native';

import { SkeletonText } from '@/components/skeleton';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WikiGuide, WikiGuideStep } from '@/lib/firestore/types';

import { WIKI_CATEGORY_LABELS, WIKI_DIFFICULTY_LABELS } from '../model/categories';
import { formatMinutes } from '../model/format';
import { isGeneralDoc } from '../model/model-key';
import { useWikiDetailViewModel } from '../model/wiki-detail-view-model';
import {
  DetailFrame,
  DetailHeading,
  DetailHeadingSkeleton,
  DetailSection,
  DetailSectionSkeleton,
  DetailSkeleton,
  Fact,
  Facts,
  FactSkeleton,
  Rows,
} from './detail-parts';

const TOOL_ROWS = [230, 91, 63, 42, 70];
const PART_ROWS = [300, 161, 250];
const STEP_ROWS: DimensionValue[][] = [
  ['100%', '92%', '40%'],
  ['100%', '70%'],
  ['100%', '96%', '60%'],
  ['100%', '88%'],
];

export function WikiGuideScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loadState, doc, error, back } = useWikiDetailViewModel(id ?? '', 'guide');

  return (
    <DetailFrame
      title="DIY guide"
      context={doc ? WIKI_CATEGORY_LABELS[doc.category] : 'Wiki'}
      loadState={loadState}
      skeleton={<GuideSkeleton />}
      error={error}
      back={back}>
      {doc ? <Guide guide={doc} /> : null}
    </DetailFrame>
  );
}

function Guide({ guide }: { guide: WikiGuide }) {
  return (
    <>
      <DetailHeading eyebrow={WIKI_CATEGORY_LABELS[guide.category]} title={guide.title}>
        <ThemedText themeColor="textSecondary" style={styles.summary}>
          {guide.summary}
        </ThemedText>
      </DetailHeading>

      <Facts>
        <Fact label="Difficulty" value={WIKI_DIFFICULTY_LABELS[guide.difficulty]} />
        <Fact label="Time" value={formatMinutes(guide.minutes)} />
        <Fact label="Fits" value={isGeneralDoc(guide) ? 'All motorcycles' : 'Selected models'} />
      </Facts>

      {guide.tools.length > 0 ? <ItemList title="Tools" items={guide.tools} /> : null}
      {guide.parts.length > 0 ? <ItemList title="Parts" items={guide.parts} /> : null}

      <DetailSection title={`Steps · ${guide.steps.length}`}>
        <Rows>
          {guide.steps.map((step, i) => (
            <Step key={i} number={i + 1} step={step} />
          ))}
        </Rows>
      </DetailSection>
    </>
  );
}

function ItemList({ title, items }: { title: string; items: string[] }) {
  return (
    <DetailSection title={title}>
      <Rows>
        {items.map((item) => (
          <ThemedText key={item} type="small" style={styles.item}>
            {item}
          </ThemedText>
        ))}
      </Rows>
    </DetailSection>
  );
}

function Step({ number, step }: { number: number; step: WikiGuideStep }) {
  const theme = useTheme();
  return (
    <View style={styles.step}>
      <ThemedText type="readout" themeColor="textSecondary" style={styles.stepNumber}>
        {String(number).padStart(2, '0')}
      </ThemedText>
      <View style={styles.stepBody}>
        <ThemedText selectable>{step.text}</ThemedText>
        {step.caution ? (
          <View style={styles.caution} accessible accessibilityLabel={`Caution: ${step.caution}`}>
            <ThemedText type="eyebrow" style={{ color: theme.danger }}>
              Caution
            </ThemedText>
            <ThemedText type="small">{step.caution}</ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GuideSkeleton() {
  return (
    <DetailSkeleton>
      <DetailHeadingSkeleton eyebrow={48} title={['100%', '38%']}>
        <View style={styles.summary}>
          {(['100%', '97%', '30%'] as const).map((width, i) => (
            <SkeletonText key={i} lineHeight={23} fontSize={16} width={width} />
          ))}
        </View>
      </DetailHeadingSkeleton>

      <Facts>
        <FactSkeleton label={80} value={36} />
        <FactSkeleton label={32} value={54} />
        <FactSkeleton label={32} value={135} />
      </Facts>

      <ItemListSkeleton title={40} items={TOOL_ROWS} />
      <ItemListSkeleton title={40} items={PART_ROWS} />

      <DetailSectionSkeleton title={72}>
        <Rows>
          {STEP_ROWS.map((lines, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <SkeletonText lineHeight={23} fontSize={14} width={17} />
              </View>
              <View style={styles.stepBody}>
                <View>
                  {lines.map((width, line) => (
                    <SkeletonText key={line} lineHeight={23} fontSize={16} width={width} />
                  ))}
                </View>
              </View>
            </View>
          ))}
        </Rows>
      </DetailSectionSkeleton>
    </DetailSkeleton>
  );
}

function ItemListSkeleton({ title, items }: { title: number; items: number[] }) {
  return (
    <DetailSectionSkeleton title={title}>
      <Rows>
        {items.map((width, i) => (
          <View key={i} style={styles.item}>
            <SkeletonText lineHeight={20} fontSize={14} width={width} />
          </View>
        ))}
      </Rows>
    </DetailSectionSkeleton>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginTop: Spacing.one,
  },
  item: {
    paddingVertical: Spacing.two + 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  stepNumber: {
    width: 24,
    fontFamily: Fonts.monoMedium,
    lineHeight: 23,
  },
  stepBody: {
    flex: 1,
    gap: Spacing.two,
  },
  caution: {
    gap: 2,
  },
});
