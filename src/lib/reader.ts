import type { Anchor } from '@/components/Sheets';
/** Source offsets remain stable even when whitespace is normalised on screen. */
export function locateWords(text: string, sentences: string[][]) {
  let cursor = 0;
  return sentences.map((words) =>
    words.map((word) => {
      const start = text.indexOf(word, cursor);
      cursor = start + word.length;
      return { start, end: cursor };
    }),
  );
}
export function anchoredQuote(text: string, anchor: Anchor): string {
  return text.slice(anchor.start, anchor.end);
}

export function findRanges(text: string, query: string): { start: number; end: number }[] {
  if (!query.trim()) return [];
  const source = text.toLowerCase(),
    needle = query.trim().toLowerCase(),
    ranges = [];
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(needle, from);
    if (start < 0) break;
    ranges.push({ start, end: start + needle.length });
    from = start + Math.max(1, needle.length);
  }
  return ranges;
}
