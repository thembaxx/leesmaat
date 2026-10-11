import type { Item, Lang } from './data';
import { EDITORIALS, studyEditorial } from './summary-editorials';

export type SummaryPoint = {
  label?: string;
  text: string;
  quote: string;
  start: number;
  end: number;
  paragraph: number;
};
export type ReadingSummary = {
  overview: string;
  points: SummaryPoint[];
  scope: 'read' | 'excerpt' | 'notes';
  method: 'editorial' | 'extractive';
  seconds: number;
};
export const SUMMARY_COPY = {
  en: {
    title: 'Smart summary',
    overview: 'At a glance',
    points: 'Main talking points',
    read: 'This read',
    excerpt: 'This excerpt',
    notes: 'These study notes',
    excerptNotice: 'Covers the excerpt available here, not the whole book.',
    notesNotice: 'An overview of the companion notes. Use your own copy for the setwork itself.',
    editorial: 'Edited for this text · available offline',
    extractive: 'Key sentences selected from this text · available offline',
    passage: 'Open supporting passage',
    paragraph: 'Paragraph',
    spoilers: 'Story summaries include events from the text.',
  },
  af: {
    title: 'Slim opsomming',
    overview: 'In ’n oogopslag',
    points: 'Hoofgesprekspunte',
    read: 'Hierdie teks',
    excerpt: 'Hierdie uittreksel',
    notes: 'Hierdie studienotas',
    excerptNotice: 'Dek die uittreksel wat hier beskikbaar is, nie die hele boek nie.',
    notesNotice:
      '’n Oorsig van die begeleidende notas. Gebruik jou eie eksemplaar vir die voorgeskrewe werk.',
    editorial: 'Vir hierdie teks geredigeer · vanlyn beskikbaar',
    extractive: 'Kernsinne uit hierdie teks gekies · vanlyn beskikbaar',
    passage: 'Maak ondersteunende gedeelte oop',
    paragraph: 'Paragraaf',
    spoilers: 'Storie-opsommings bevat gebeure uit die teks.',
  },
} as const;

const words = (text: string) => text.match(/[\p{L}\p{N}]+(?:[’'][\p{L}]+)*/gu) ?? [];
const STOP = new Set(
  (
    'a an the and or but for to of in on at by with as is are was were be been it its this that these those i you he she we they his her their our my your not from have has had will would can could do does did so than then there into about when which who what how some one also more very only each all ' +
    'die ’n n en of maar vir om van in op aan by met as is was wees dit hierdie daardie ek jy hy sy ons hulle se nie uit het sal sou kan kon doen toe daar wat wie hoe een ook meer baie net elke alles'
  ).split(/\s+/),
);
const tokens = (text: string) =>
  new Set(words(text.toLowerCase()).filter((word) => word.length > 2 && !STOP.has(word)));
const overlap = (a: Set<string>, b: Set<string>) =>
  [...a].filter((word) => b.has(word)).length / Math.max(1, Math.min(a.size, b.size));
const paragraphAt = (text: string, start: number) =>
  text.slice(0, start).split(/\n\s*\n/).length - 1;

type Sentence = SummaryPoint & { terms: Set<string>; count: number; score: number };
function sentences(text: string, language: Lang): Sentence[] {
  const result: Sentence[] = [];
  // Segment inside paragraphs so source ranges remain stable across line endings.
  for (const paragraph of text.matchAll(/[^\r\n]+(?:\r?\n(?!\r?\n)[^\r\n]+)*/g)) {
    const source = paragraph[0],
      offset = paragraph.index;
    for (const { segment, index } of new Intl.Segmenter(language, {
      granularity: 'sentence',
    }).segment(source)) {
      // Segmenter may treat honorifics as boundaries; join them to the following name.
      if (
        /^(Mr|Mrs|Ms|Dr|Prof|Mnr|Mev)\.$/i.test(segment.trim()) &&
        index + segment.length < source.length
      )
        continue;
      const previous = source
        .slice(0, index)
        .match(/(?:^|\s)((?:Mr|Mrs|Ms|Dr|Prof|Mnr|Mev)\.)\s*$/i);
      const raw = previous ? previous[1] + ' ' + segment : segment;
      const start = previous
        ? offset + index - previous[0].length + previous[0].indexOf(previous[1]!)
        : offset + index + raw.length - raw.trimStart().length;
      const end = offset + index + segment.trimEnd().length;
      const quote = text.slice(start, end);
      const count = words(quote).length;
      if (count < 5) continue;
      result.push({
        text: quote.replace(/\s+/g, ' ').trim(),
        quote,
        start,
        end,
        paragraph: paragraphAt(text, start),
        terms: tokens(quote),
        count,
        score: 0,
      });
    }
  }
  return result;
}

/** No requests or model credentials: summaries are based on the item's actual text,
 * including old downloaded versions. Editorials are used only for an exact match. */
export function summarize(item: Item): ReadingSummary | null {
  const count = words(item.x).length;
  if (count < (item.k === 'Book' || item.k === 'Article' ? 60 : 120)) return null;
  const scope =
    item.rights === 'Original study note'
      ? 'notes'
      : item.textSource || item.rights === 'Public-domain excerpt'
        ? 'excerpt'
        : 'read';
  const editorial = EDITORIALS[item.id] ?? studyEditorial(item);
  if (editorial?.source === item.x && editorial.language === item.g) {
    const points = editorial.points.map((point) => {
      const start = item.x.indexOf(point.quote);
      return {
        ...point,
        start,
        end: start + point.quote.length,
        paragraph: paragraphAt(item.x, start),
      };
    });
    if (points.every((point) => point.start >= 0))
      return finish(editorial.overview, points, scope, 'editorial');
  }

  const all = sentences(item.x, item.g);
  const candidates = all.filter(
    (sentence) => (scope !== 'notes' || sentence.paragraph > 0) && sentence.count <= 55,
  );
  if (candidates.length < 2) return null;
  const frequency = new Map<string, number>();
  for (const sentence of candidates)
    for (const term of sentence.terms) frequency.set(term, (frequency.get(term) ?? 0) + 1);
  const titleTerms = tokens(item.t);
  for (const [index, sentence] of candidates.entries()) {
    const relevance =
      [...sentence.terms].reduce((sum, term) => sum + Math.log(1 + (frequency.get(term) ?? 0)), 0) /
      Math.sqrt(Math.max(1, sentence.terms.size));
    // Prefer self-contained, representative sentences; introductions and conclusions
    // get a small bonus, while title matches never override paragraph diversity.
    const dependent = /^(he|she|they|it|this|these|those|hy|sy|hulle|dit|hierdie|daardie)\b/i.test(
      sentence.text.replace(/^[“"‘']/, ''),
    );
    sentence.score =
      relevance +
      overlap(sentence.terms, titleTerms) +
      (index === 0 || index === candidates.length - 1 ? 0.7 : 0) -
      (dependent ? 1 : 0);
  }
  const ranked = [...candidates].sort((a, b) => b.score - a.score || a.start - b.start);
  const overviewSentence =
    ranked.find(
      (sentence) => sentence.count <= Math.max(18, Math.min(40, Math.floor(count * 0.25))),
    ) ?? ranked[0]!;
  const chosen: Sentence[] = [];
  let budget = 0;
  while (chosen.length < 4) {
    const remaining = ranked.filter(
      (sentence) =>
        sentence !== overviewSentence &&
        !chosen.includes(sentence) &&
        budget + sentence.count <= Math.min(90, Math.floor(count * 0.45)) &&
        chosen.every((point) => overlap(point.terms, sentence.terms) < 0.8),
    );
    remaining.sort((a, b) => {
      const adjusted = (sentence: Sentence) =>
        sentence.score - (chosen.some((point) => point.paragraph === sentence.paragraph) ? 3 : 0);
      return adjusted(b) - adjusted(a) || a.start - b.start;
    });
    const next = remaining[0];
    if (!next) break;
    chosen.push(next);
    budget += next.count;
  }
  if (!chosen.length) return null;
  chosen.sort((a, b) => a.start - b.start);
  return finish(
    overviewSentence.text,
    chosen.map(({ text, quote, start, end, paragraph }) => ({
      text,
      quote,
      start,
      end,
      paragraph,
    })),
    scope,
    'extractive',
  );
}
function finish(
  overview: string,
  points: SummaryPoint[],
  scope: ReadingSummary['scope'],
  method: ReadingSummary['method'],
): ReadingSummary {
  const count = words(
    overview + ' ' + points.map((point) => `${point.label ?? ''} ${point.text}`).join(' '),
  ).length;
  return { overview, points, scope, method, seconds: Math.max(10, Math.ceil((count / 180) * 60)) };
}
export function summaryText(item: Item) {
  const summary = summarize(item);
  if (!summary) return '';
  const copy = SUMMARY_COPY[item.g];
  return `## ${copy.title} — ${copy[summary.scope]}\n\n${summary.scope === 'excerpt' ? copy.excerptNotice + '\n\n' : summary.scope === 'notes' ? copy.notesNotice + '\n\n' : ''}${summary.overview}\n\n### ${copy.points}\n\n${summary.points.map((point) => `- ${point.label ? point.label + ': ' : ''}${point.text}`).join('\n')}\n\n${copy[summary.method]}\n\n## ${item.g === 'af' ? 'Leesteks' : 'Reading text'}\n\n`;
}
