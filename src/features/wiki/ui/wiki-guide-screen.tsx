import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WikiGuide, WikiGuideStep } from '@/lib/firestore/types';

import { WIKI_CATEGORY_LABELS, WIKI_DIFFICULTY_LABELS } from '../model/categories';
import { formatMinutes } from '../model/format';
import { isGeneralDoc } from '../model/model-key';
import { useWikiDetailViewModel } from '../model/wiki-detail-view-model';
import { DetailFrame, DetailHeading, DetailSection, Fact, Facts, Rows } from './detail-parts';

export function WikiGuideScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { loadState, doc, error, back } = useWikiDetailViewModel(id ?? '', 'guide');

  return (
    <DetailFrame
      title="DIY guide"
      context={doc ? WIKI_CATEGORY_LABELS[doc.category] : 'Wiki'}
      loadState={loadState}
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
