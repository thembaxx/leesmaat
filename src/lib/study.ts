import { DICT, type Item } from './data';
import { hash } from './text';
export type StudyQuestion = {
  id: string;
  prompt: string;
  answer: string;
  options: string[];
  passage: string;
  explanation: string;
  start: number;
  end: number;
};
const stop = new Set(
  (
    'about after again against almost along although among because before being between could every first great himself herself little might never other quite should their there these those through under until very where which while would young ' +
    'daardie hierdie hulle omdat nadat voordat maar mense iemand ander altyd baie reeds sonder onder tussen wanneer waarom alles elke eerste'
  ).split(' '),
);
/** Exact source recall, with source words as alternatives. No invented plot or definitions. */
export function autoStudy(item: Item): StudyQuestion[] {
  const parts = [...new Intl.Segmenter(item.g, { granularity: 'sentence' }).segment(item.x)].filter(
    (p) => p.segment.trim().length >= 45 && p.segment.length <= 500,
  );
  const candidates = parts.flatMap((part) => {
    const matches = [...part.segment.matchAll(/\b[\p{L}]{5,}\b/gu)].filter(
      (m) => !stop.has(m[0].toLowerCase()),
    );
    matches.sort(
      (a, b) =>
        Number(!!DICT[b[0].toLowerCase()]) - Number(!!DICT[a[0].toLowerCase()]) ||
        b[0].length - a[0].length,
    );
    const word = matches[0];
    if (!word) return [];
    return [{ part, word: word[0], offset: word.index }];
  });
  const unique = candidates.filter(
    (c, i) => candidates.findIndex((x) => x.word.toLowerCase() === c.word.toLowerCase()) === i,
  );
  const chosen = Array.from(
    { length: Math.min(5, unique.length) },
    (_, i) => unique[Math.floor((i * unique.length) / Math.min(5, unique.length))]!,
  );
  return chosen.map(({ part, word, offset }, i) => {
    const alternatives = unique
      .map((x) => x.word)
      .filter((w) => w.toLowerCase() !== word.toLowerCase());
    const options = [
      ...new Set([word, ...alternatives.slice(i, i + 2), ...alternatives.slice(0, 2)]),
    ].slice(0, 3);
    options.sort((a, b) => hash(item.id + i + a) - hash(item.id + i + b));
    return {
      id: `study-${item.id}-${hash(part.segment + word)}`,
      prompt:
        item.g === 'af'
          ? 'Watter woord voltooi die oorspronklike gedeelte?'
          : 'Which word completes the original passage?',
      answer: word,
      options,
      passage: part.segment.slice(0, offset) + '_____' + part.segment.slice(offset + word.length),
      explanation: part.segment.trim(),
      start: part.index,
      end: part.index + part.segment.length,
    };
  });
}
