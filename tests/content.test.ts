import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BROWSABLE_LIBRARY, LIBRARY } from '../src/lib/data';
import { bookSection, sectionNumber } from '../src/lib/books';
import { autoStudy } from '../src/lib/study';
import { normalizeDictionary, DICTIONARY_SEED, validDictionaryWord } from '../src/lib/dictionary';
import { VOICES, filesFor } from '../src/lib/voices';
import { summarize } from '../src/lib/summaries';

test('full books retain their source, complete section list and verified download bytes', () => {
  const books = BROWSABLE_LIBRARY.filter((i) => i.contentUrl);
  assert.equal(books.length, 15);
  for (const item of books) {
    const bytes = readFileSync('public' + item.contentUrl);
    assert.equal(bytes.length, item.contentBytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.contentHash);
    const book = JSON.parse(bytes.toString());
    assert.equal(book.sections.length, item.sections!.length);
    assert.ok(book.sections.every((p: { x: string }) => p.x.trim().length > 30));
    assert.doesNotMatch(book.sections.at(-1).x, /END OF THE PROJECT GUTENBERG/);
    const last = bookSection(item, book, 999);
    assert.equal(last.sectionIndex, book.sections.length - 1);
    assert.equal(last.bookId, item.id);
    assert.equal(sectionNumber(last.id), book.sections.length - 1);
    const chapter = bookSection(item, book, 0),
      summary = summarize(chapter);
    if (summary) assert.equal(summary.scope, 'chapter');
  }
  assert.equal(books.find((i) => i.id === 'pg-1342')!.sections!.length, 61);
  assert.equal(books.find((i) => i.id === 'pg-11')!.sections!.length, 12);
});

test('automatic study questions quote exact source text and keep stable source-specific review IDs', () => {
  for (const item of BROWSABLE_LIBRARY.filter((i) => i.published)) {
    const questions = autoStudy(item);
    for (const q of questions) {
      assert.equal(item.x.slice(q.start, q.end).trim(), q.explanation);
      assert.ok(q.explanation.includes(q.answer));
      assert.equal(q.options.filter((x) => x === q.answer).length, 1);
      assert.ok(q.passage.includes('_____'));
    }
    assert.deepEqual(autoStudy(item), questions);
    assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  }
  const source = LIBRARY.find((i) => i.published && i.k === 'Article')!;
  assert.equal(autoStudy(source).length, 5);
  const changed = autoStudy({
    ...source,
    x: source.x.replaceAll(autoStudy(source)[0]!.answer, 'reading'),
  });
  assert.notDeepEqual(changed, autoStudy(source));
});

test('real dictionary snapshots include attribution and reject arbitrary URLs as words', () => {
  for (const entry of Object.values(DICTIONARY_SEED)) {
    assert.ok(entry.meanings[0]?.definitions[0]?.definition);
    assert.match(entry.source, /^https:\/\/en.wiktionary.org\/wiki\//);
    assert.match(entry.licence, /CC BY-SA/);
  }
  const af = JSON.parse(readFileSync('public/dictionaries/af.json', 'utf8'));
  assert.ok(Object.keys(af).length > 9000);
  assert.ok(af.stilte.meanings[0].definitions[0].definition);
  assert.equal(validDictionaryWord('https://example.com'), false);
  assert.equal(normalizeDictionary([], 'en'), null);
});

test('downloaded voice engines and previews match the shipped manifest', () => {
  assert.equal(VOICES.length, 6);
  for (const voice of VOICES) {
    assert.ok(readFileSync('public' + voice.preview).length > 1000);
    for (const file of filesFor(voice).filter((f) => !f.remote)) {
      const bytes = readFileSync('public' + file.url);
      assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
    for (const file of voice.files) {
      assert.match(file.remote!, /huggingface.co\/rhasspy\/piper-voices\/resolve\/[a-f0-9]{40}\//);
      assert.ok(file.bytes > 0);
      assert.equal(file.sha256.length, 64);
    }
  }
});
