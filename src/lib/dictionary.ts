import seed from './dictionary-seed.json' with { type: 'json' };
import type { Lang } from './data';
export type DictionaryEntry = {
  word: string;
  requested?: string;
  language: Lang;
  phonetics: { text: string; label: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string | null;
      synonyms: string[];
      lemma?: string | null;
    }[];
  }[];
  forms: string[];
  source: string;
  provider: string;
  licence: string;
  licenceUrl: string;
};
export const DICTIONARY_SEED = seed as unknown as Record<string, DictionaryEntry>;
export const dictionaryKey = (text: string) =>
  text
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replaceAll('’', "'")
    .replace(/^[.,;:!?“”"()]+|[.,;:!?“”"()]+$/g, '')
    .trim();
export const validDictionaryWord = (word: string) =>
  word.length > 0 &&
  word.length <= 64 &&
  /^[\p{Script=Latin}' -]+$/u.test(word) &&
  /\p{Script=Latin}/u.test(word);
export function normalizeDictionary(records: unknown[], language: Lang): DictionaryEntry | null {
  const clean = records.filter((value) => value && typeof value === 'object') as Record<
    string,
    unknown
  >[];
  const first = clean.find((record) => typeof record.word === 'string');
  if (!first) return null;
  const word = String(first.word),
    meanings: DictionaryEntry['meanings'] = [],
    phonetics: DictionaryEntry['phonetics'] = [],
    forms: string[] = [];
  const pos: Record<string, string> = {
    adj: 'adjective',
    adv: 'adverb',
    prep: 'preposition',
    pron: 'pronoun',
    conj: 'conjunction',
    intj: 'interjection',
    det: 'determiner',
  };
  for (const record of clean) {
    const definitions: DictionaryEntry['meanings'][number]['definitions'] = [];
    for (const raw of Array.isArray(record.senses) ? record.senses : []) {
      if (!raw || typeof raw !== 'object') continue;
      const glosses = Array.isArray(raw.glosses)
        ? raw.glosses.filter((value: unknown) => typeof value === 'string')
        : [];
      if (!glosses.length) continue;
      const example = Array.isArray(raw.examples)
        ? raw.examples.find((value: Record<string, unknown>) => typeof value.text === 'string')
        : undefined;
      definitions.push({
        definition: String(glosses.at(-1)).slice(0, 1000),
        example: example?.text?.slice(0, 400) ?? null,
        synonyms: (Array.isArray(raw.synonyms) ? raw.synonyms : [])
          .filter((value: Record<string, unknown>) => typeof value.word === 'string')
          .map((value: { word: string }) => value.word)
          .slice(0, 8),
        lemma:
          Array.isArray(raw.form_of) && typeof raw.form_of[0]?.word === 'string'
            ? raw.form_of[0].word
            : null,
      });
    }
    if (definitions.length)
      meanings.push({
        partOfSpeech: pos[String(record.pos)] ?? String(record.pos ?? ''),
        definitions: definitions.slice(0, 8),
      });
    for (const sound of Array.isArray(record.sounds) ? record.sounds : [])
      if (typeof sound.ipa === 'string')
        phonetics.push({
          text: sound.ipa,
          label: Array.isArray(sound.tags)
            ? sound.tags.filter((v: unknown) => typeof v === 'string').join(', ')
            : '',
        });
    for (const form of Array.isArray(record.forms) ? record.forms : [])
      if (typeof form.form === 'string' && form.form !== '-') forms.push(form.form);
  }
  if (!meanings.length) return null;
  return {
    word,
    language,
    phonetics: phonetics.slice(0, 5),
    meanings,
    forms: [...new Set(forms)].slice(0, 30),
    source: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#${language === 'af' ? 'Afrikaans' : 'English'}`,
    provider: 'Wiktionary via Kaikki',
    licence: 'CC BY-SA 4.0 / GFDL',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  };
}
function seedEntry(word: string, language: Lang) {
  return DICTIONARY_SEED[language === 'af' ? 'af:' + word : word];
}
export async function lookupDictionary(
  text: string,
  language: Lang,
  signal?: AbortSignal,
): Promise<DictionaryEntry> {
  const word = dictionaryKey(text);
  if (!validDictionaryWord(word)) throw new Error('Choose a word or short phrase to look up.');
  const url = `/api/dictionary?lang=${language}&word=${encodeURIComponent(word)}`;
  const cache = 'caches' in globalThis ? await caches.open('leesmaat-dictionary-v1') : null;
  const stored = await cache?.match(url);
  let entry: DictionaryEntry | undefined = stored ? await stored.json() : seedEntry(word, language);
  if (!entry && language === 'af') {
    const snapshot = await caches.match('/dictionaries/af.json');
    if (snapshot) {
      const dictionary = (await snapshot.json()) as Record<string, DictionaryEntry>;
      entry =
        dictionary[word] ??
        Object.values(dictionary).find((candidate) =>
          candidate.forms.some((form) => dictionaryKey(form) === word),
        );
      if (entry)
        await cache?.put(
          url,
          new Response(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json' } }),
        );
    }
  }
  if (!entry) {
    const response = await fetch(url, { signal }).catch((error) => {
      if (signal?.aborted) throw error;
      throw new Error('This word is not saved offline. Reconnect to look it up.');
    });
    if (!response.ok)
      throw new Error(
        response.status === 404
          ? 'No entry was found in this dictionary. Try the base form of the word.'
          : 'The dictionary could not load. Reconnect and try again.',
      );
    entry = (await response.json()) as DictionaryEntry;
    await cache?.put(
      url,
      new Response(JSON.stringify(entry), { headers: { 'Content-Type': 'application/json' } }),
    );
  }
  const lemmas = [
    ...new Set(
      entry.meanings.flatMap((meaning) =>
        meaning.definitions.map((definition) => definition.lemma),
      ),
    ),
  ];
  if (lemmas.length === 1 && lemmas[0] && dictionaryKey(lemmas[0]) !== word) {
    const lemma = seedEntry(dictionaryKey(lemmas[0]), language);
    if (lemma)
      return {
        ...lemma,
        meanings: [...lemma.meanings].sort(
          (a, b) =>
            Number(b.partOfSpeech === entry.meanings[0]?.partOfSpeech) -
            Number(a.partOfSpeech === entry.meanings[0]?.partOfSpeech),
        ),
        requested: text,
      };
  }
  return { ...entry, requested: entry.word !== text ? text : undefined };
}
