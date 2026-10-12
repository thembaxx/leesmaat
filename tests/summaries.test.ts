import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LIBRARY, type Item } from '../src/lib/data';
import { EDITORIALS } from '../src/lib/summary-editorials';
import { summarize, summaryText } from '../src/lib/summaries';

const item = (id: string) => LIBRARY.find((entry) => entry.id === id)!;
const wordCount = (text: string) => text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
const grounded = (entry: Item) => {
  const digest = summarize(entry);
  assert.ok(digest);
  assert.ok(digest.points.length > 0 && digest.points.length <= 4);
  assert.equal(new Set(digest.points.map((point) => point.start)).size, digest.points.length);
  for (const point of digest.points) {
    assert.ok(point.start >= 0 && point.end <= entry.x.length);
    assert.equal(entry.x.slice(point.start, point.end), point.quote);
    assert.equal(entry.x.slice(0, point.start).split(/\n\s*\n/).length - 1, point.paragraph);
    if (digest.method === 'extractive')
      assert.equal(point.text, point.quote.replace(/\s+/g, ' ').trim());
  }
  assert.ok(
    wordCount(digest.overview + ' ' + digest.points.map((point) => point.text).join(' ')) <
      wordCount(entry.x),
  );
  return digest;
};

test('current summaries have valid supporting passages and remain shorter than their sources', () => {
  for (const entry of LIBRARY) if (summarize(entry)) grounded(entry);
  for (const id of Object.keys(EDITORIALS).filter((id) => !item(id).published))
    assert.equal(grounded(item(id)).method, 'editorial');
  assert.equal(summarize(item('e2')), null);
  assert.equal(summarize(item('e1')), null);
  assert.equal(summarize(item('a5')), null);
});

test('book previews disclose their scope and catalogue records never invent plot summaries', () => {
  const excerpt = grounded(item('nsc-en-FAL-book-1'));
  assert.equal(excerpt.scope, 'excerpt');
  assert.match(excerpt.overview, /Utterson|door/);
  assert.doesNotMatch(excerpt.overview, /transformation|potion|murder/);
  assert.equal(summarize(item('nsc-en-HL-book-0')), null);
  assert.match(summaryText(item('nsc-en-FAL-book-1')), /not the whole book/);
  assert.match(summaryText(item('a3')), /Hoofgesprekspunte/);
});

const archiveText =
  'The neighbourhood library opens its doors to readers every Saturday morning. Volunteers organise books and help visitors choose stories that match their interests. A quiet corner gives children time to read without being interrupted by traffic outside.\r\n\r\nDr. Patel runs a reading group where families share the stories they enjoyed during the week. The reading group welcomes new members and offers help with unfamiliar words. Local volunteers bring extra chairs whenever the reading group becomes too large for the room.\r\n\r\nThe library keeps a notebook of suggestions so visitors can propose new activities for the following month. Readers ask for more poetry, local history and stories in their home languages. These suggestions help the volunteers plan a library that serves the whole neighbourhood.';

test('an older archived version gets its own source-based summary, never current editorial claims', () => {
  const archive = { ...item('e4'), x: archiveText };
  const digest = grounded(archive);
  assert.equal(digest.method, 'extractive');
  assert.doesNotMatch(
    digest.overview + digest.points.map((point) => point.text).join(' '),
    /Naledi|map|courtyard/,
  );
  assert.equal(new Set(digest.points.map((point) => point.paragraph)).size, 3);
  assert.deepEqual(summarize(archive), digest);
  const removedParagraph = { ...archive, x: archive.x.split('\r\n\r\n').slice(0, 2).join('\n\n') };
  assert.equal(summarize(removedParagraph), null);
});

test('new longer poems and Afrikaans passages retain their own language and exact ranges', () => {
  const af = {
    ...item('a3'),
    id: 'new-af',
    x: item('a3').x.replace('Elke Saterdag', 'Elke Sondag'),
  };
  const digest = grounded(af);
  assert.equal(digest.method, 'extractive');
  assert.ok(af.x.includes(digest.overview));
  const poem = { ...item('e5'), id: 'new-poem', x: archiveText.replaceAll('. ', '.\n') };
  assert.equal(grounded(poem).scope, 'read');
});
