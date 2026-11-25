import { useMemo } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';

import { parseMarkdown, type Block, type Span } from '../model/markdown';

function spanStyle(span: Span): TextStyle | undefined {
  if (span.code) return styles.code;
  if (span.bold && span.italic) return styles.boldItalic;
  if (span.bold) return styles.bold;
  if (span.italic) return styles.italic;
  return undefined;
}

function Spans({ spans, heading = false }: { spans: Span[]; heading?: boolean }) {
  return (
    <ThemedText selectable style={heading ? styles.heading : undefined}>
      {spans.map((span, index) => (
        <ThemedText key={index} style={heading ? undefined : spanStyle(span)}>
          {span.text}
        </ThemedText>
      ))}
    </ThemedText>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === 'paragraph') return <Spans spans={block.spans} />;
  if (block.kind === 'heading') return <Spans spans={block.spans} heading />;

  return (
    <View style={[styles.item, block.indent && styles.indent]}>
      <ThemedText themeColor="textSecondary" style={block.kind === 'numbered' ? styles.number : styles.bullet}>
        {block.kind === 'numbered' ? block.marker : '•'}
      </ThemedText>
      <View style={styles.itemText}>
        <Spans spans={block.spans} />
      </View>
    </View>
  );
}

export function MarkdownText({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <View style={styles.blocks}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  blocks: {
    gap: Spacing.two,
  },
  heading: {
    fontFamily: Fonts.sansSemiBold,
  },
  bold: {
    fontFamily: Fonts.sansSemiBold,
  },
  italic: {
    fontFamily: Fonts.sansItalic,
  },
  boldItalic: {
    fontFamily: Fonts.sansSemiBoldItalic,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  indent: {
    paddingLeft: Spacing.three,
  },
  bullet: {
    width: 12,
  },
  number: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    minWidth: 20,
  },
  itemText: {
    flex: 1,
  },
});
