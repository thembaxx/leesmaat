import { fetchPublicSource } from '@/lib/upstream';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  DICTIONARY_SEED,
  dictionaryKey,
  validDictionaryWord,
  normalizeDictionary,
  type DictionaryEntry,
} from '@/lib/dictionary';
let af: Promise<Record<string, DictionaryEntry>> | null = null;
export async function GET(request: Request) {
  const url = new URL(request.url),
    language = url.searchParams.get('lang'),
    word = dictionaryKey(url.searchParams.get('word') ?? '');
  if ((language !== 'en' && language !== 'af') || !validDictionaryWord(word))
    return Response.json({ error: 'Invalid dictionary lookup' }, { status: 400 });
  const seed = DICTIONARY_SEED[language === 'af' ? 'af:' + word : word];
  if (seed) return Response.json(seed, { headers: { 'Cache-Control': 'public, max-age=604800' } });
  if (language === 'af') {
    af ??= readFile(join(process.cwd(), 'public/dictionaries/af.json'), 'utf8').then(JSON.parse);
    const dictionary = await af,
      entry =
        dictionary[word] ??
        Object.values(dictionary).find((entry) =>
          entry.forms.some((form) => dictionaryKey(form) === word),
        );
    return entry
      ? Response.json(entry, { headers: { 'Cache-Control': 'public, max-age=604800' } })
      : Response.json({ error: 'No dictionary entry found' }, { status: 404 });
  }
  try {
    const parts = [...word];
    const source = `https://kaikki.org/dictionary/English/meaning/${encodeURIComponent(parts[0]!)}/${encodeURIComponent(parts.slice(0, 2).join(''))}/${encodeURIComponent(word)}.jsonl`;
    const upstream = await fetchPublicSource(source, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'Leesmaat/1.0 (https://github.com/thembaxx/leesmaat)' },
    });
    if (upstream.status === 404)
      return Response.json({ error: 'No dictionary entry found' }, { status: 404 });
    if (!upstream.ok)
      return Response.json({ error: 'Dictionary source unavailable' }, { status: 502 });
    const text = await upstream.text();
    if (text.length > 1e6) return Response.json({ error: 'Entry too large' }, { status: 502 });
    const entry = normalizeDictionary(
      text
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
      language,
    );
    return entry
      ? Response.json(entry, { headers: { 'Cache-Control': 'public, max-age=604800' } })
      : Response.json({ error: 'No dictionary entry found' }, { status: 404 });
  } catch {
    return Response.json({ error: 'Dictionary source unavailable' }, { status: 502 });
  }
}
