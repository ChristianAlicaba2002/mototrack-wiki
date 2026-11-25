export type Span = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
};

export type Block =
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'heading'; spans: Span[] }
  | { kind: 'bullet'; indent: boolean; spans: Span[] }
  | { kind: 'numbered'; indent: boolean; marker: string; spans: Span[] };

type SpanStyle = Omit<Span, 'text'>;

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*+•]\s+(.*)$/;
const NUMBERED = /^(\d{1,3})[.)]\s+(.*)$/;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/;
const FENCE = /^(?:```|~~~)/;
const QUOTE = /^>\s?/;
const TABLE_DIVIDER = /^\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*\|?$/;

function isSpace(char: string | undefined): boolean {
  return char === undefined || /\s/.test(char);
}

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[\p{L}\p{N}]/u.test(char);
}

function runLength(text: string, start: number, char: string): number {
  let end = start;
  while (text[end] === char) end++;
  return end - start;
}

function openingMarker(text: string, index: number): string | null {
  const char = text[index];
  if (char !== '*' && char !== '_') return null;
  const length = runLength(text, index, char);
  if (length > 3) return null;
  if (isSpace(text[index + length])) return null;
  if (char === '_' && isWordChar(text[index - 1])) return null;
  return char.repeat(length);
}

function closingIndex(text: string, marker: string, from: number): number {
  const char = marker[0];
  let index = from;
  while (index < text.length) {
    if (text[index] !== char) {
      index++;
      continue;
    }
    const length = runLength(text, index, char);
    const valid =
      length === marker.length &&
      !isSpace(text[index - 1]) &&
      (char !== '_' || !isWordChar(text[index + length]));
    if (valid) return index;
    index += length;
  }
  return -1;
}

function withMarker(style: SpanStyle, marker: string): SpanStyle {
  if (marker.length === 3) return { ...style, bold: true, italic: true };
  if (marker.length === 2) return { ...style, bold: true };
  return { ...style, italic: true };
}

export function parseInline(text: string, style: SpanStyle = {}): Span[] {
  const spans: Span[] = [];
  let buffer = '';
  const flush = () => {
    if (buffer) spans.push({ text: buffer, ...style });
    buffer = '';
  };

  let index = 0;
  while (index < text.length) {
    if (text[index] === '`') {
      const end = text.indexOf('`', index + 1);
      if (end > index + 1) {
        flush();
        spans.push({ text: text.slice(index + 1, end), ...style, code: true });
        index = end + 1;
        continue;
      }
    }

    const marker = openingMarker(text, index);
    if (marker) {
      const start = index + marker.length;
      const end = closingIndex(text, marker, start + 1);
      if (end !== -1) {
        flush();
        spans.push(...parseInline(text.slice(start, end), withMarker(style, marker)));
        index = end + marker.length;
        continue;
      }
      buffer += marker;
      index = start;
      continue;
    }

    buffer += text[index];
    index++;
  }

  flush();
  return spans;
}

function tableRow(line: string): string {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean)
    .join(' · ');
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'paragraph', spans: parseInline(paragraph.join('\n')) });
    paragraph = [];
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const indent = /^\s{2,}/.test(raw);
    const line = raw.trim().replace(QUOTE, '');

    if (TABLE_DIVIDER.test(line)) continue;

    if (!line || RULE.test(line) || FENCE.test(line)) {
      flushParagraph();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({ kind: 'heading', spans: parseInline(heading[1]) });
      continue;
    }

    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      blocks.push({ kind: 'bullet', indent, spans: parseInline(bullet[1]) });
      continue;
    }

    const numbered = NUMBERED.exec(line);
    if (numbered) {
      flushParagraph();
      blocks.push({ kind: 'numbered', indent, marker: `${numbered[1]}.`, spans: parseInline(numbered[2]) });
      continue;
    }

    paragraph.push(line.startsWith('|') ? tableRow(line) : line);
  }

  flushParagraph();
  return blocks;
}
