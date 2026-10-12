import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INIT, hydrateState } from '../src/lib/state';
import { applyFields, mergeFields, seedFields, stampChanges } from '../src/lib/sync';
import { nextReview, readingTick } from '../src/lib/learning';
import { locateWords, findRanges } from '../src/lib/reader';
import { LIBRARY } from '../src/lib/data';
import { parse, today } from '../src/lib/text';

test('prototype migration preserves language level, words and notes despite a bad setting', () => {
  const s = hydrateState({
    lang: 'af',
    lv: 2,
    ob: true,
    fs: 900,
    day: today(),
    nt: [{ q: 'stilte', n: 'my note', f: 'Karoo-aand' }],
    wd: [{ w: 'stilte', d: 'geen geluid', t: 'silence', u: '' }],
  });
  assert.equal(s.levels.af, 2);
  assert.equal(s.levels.en, 1);
  assert.equal(s.fs, 19);
  assert.equal(s.wd[0]?.g, 'af');
  assert.equal(s.nt[0]?.n, 'my note');
});
test('independent offline device edits, removals and positions merge and survive reload', () => {
  const s = hydrateState({ ...INIT, sv: ['e1'], day: today(), dl: ['a1'] });
  const base = seedFields(s, 'base');
  const left = stampChanges(s, { ...s, sv: [], pos: { e1: 0.5 } }, base, 'a', 10);
  const right = stampChanges(
    s,
    { ...s, sv: ['e1', 'a1'], pos: { a1: 0.8 }, levels: { en: 2, af: 1 } },
    base,
    'b',
    12,
  );
  const merged = mergeFields(left, right),
    result = applyFields(s, merged);
  assert.deepEqual(result.sv, ['a1']);
  assert.deepEqual(result.pos, { e1: 0.5, a1: 0.8 });
  assert.equal(result.levels.en, 2);
  assert.deepEqual(result.dl, ['a1']);
  assert.deepEqual(applyFields(result, mergeFields(seedFields(result, 'reload'), merged)).sv, [
    'a1',
  ]);
  assert.deepEqual(mergeFields(left, right), mergeFields(right, left));
});
test('ties resolve deterministically and stale clocks cannot overwrite later edits', () => {
  const a = { theme: { value: 'night', time: 10, device: 'a' } };
  const b = { theme: { value: 'sepia', time: 10, device: 'b' } };
  assert.equal(mergeFields(a, b).theme?.value, 'sepia');
  assert.equal(stampChanges(INIT, { ...INIT, theme: 'paper' }, b, 'a', 1).theme?.time, 11);
});
test('review intervals grow; a missed word returns in ten minutes', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  const first = nextReview(undefined, true, now),
    second = nextReview(first, true, now);
  assert.equal(first.interval, 1);
  assert.equal(second.interval, 3);
  assert.equal(nextReview(second, true, now).interval, 6);
  assert.equal(nextReview(second, false, now).due, '2026-10-11T12:10:00.000Z');
});
test('daily goal awards once, handles rollover and preserves a consecutive streak', () => {
  const previous = {
    day: '2026-10-11',
    secs: 299,
    done: '',
    last: '2026-10-10',
    xp: 10,
    streak: 2,
  };
  const earned = { ...previous, ...readingTick(previous, '2026-10-11', '2026-10-10') };
  assert.equal(earned.xp, 30);
  assert.equal(earned.streak, 3);
  assert.deepEqual(readingTick(earned, '2026-10-11', '2026-10-10'), {
    day: '2026-10-11',
    secs: 300,
  });
  assert.deepEqual(readingTick(earned, '2026-10-12', '2026-10-11'), { day: '2026-10-12', secs: 1 });
});
test('anchors identify source words even with repeated text, newlines and punctuation', () => {
  const text = 'Light, light.\n\nThe light shines.';
  const sentences = parse(text, false).flat(),
    offsets = locateWords(text, sentences);
  offsets.forEach((words, i) =>
    words.forEach((range, j) => assert.equal(text.slice(range.start, range.end), sentences[i]![j])),
  );
  assert.equal(offsets.flat().at(-2)?.start, 19);
});
test('curriculum entries are unique, sourced and clearly label their actual reading content', () => {
  assert.equal(new Set(LIBRARY.map((item) => item.id)).size, LIBRARY.length);
  for (const item of LIBRARY.filter((i) => i.n)) {
    assert.ok(item.source?.startsWith('https://'));
    assert.ok(item.rights);
    if (item.published) assert.ok(item.x.length > 100);
    else {
      assert.equal(item.rights, 'Catalogue metadata');
      assert.equal(item.x, '');
      assert.equal(item.m, 0);
    }
    assert.ok(item.course);
    assert.ok([10, 11, 12].includes(item.grade!));
    if (item.rights === 'Original study note') assert.match(item.x, /original|oorspronklike/);
  }
});

test('find supports phrases and repeated matches', () => {
  assert.deepEqual(findRanges('The light. The light stays.', 'the light'), [
    { start: 0, end: 9 },
    { start: 11, end: 20 },
  ]);
});
