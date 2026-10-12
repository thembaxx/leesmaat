import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LIBRARY } from '../../src/lib/data';
async function seed(page: import('@playwright/test').Page, lang = 'en') {
  await page.addInitScript((lang) => {
    if (!localStorage.getItem('lm'))
      localStorage.setItem(
        'lm',
        JSON.stringify({ ob: true, lang, theme: 'paper', placed: { en: true, af: true } }),
      );
  }, lang);
}
test('complete books download all chapters and keep navigation offline', async ({
  page,
  context,
  request,
}) => {
  await seed(page);
  await page.goto('/?read=pg-11');
  await expect(
    page.getByRole('heading', { name: 'CHAPTER I. Down the Rabbit-Hole', exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Download offline', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Remove offline copy', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Next chapter', exact: true }).click();
  await expect(page).toHaveURL(/read=pg-11%7E1|read=pg-11~1/);
  await expect(
    page.getByRole('heading', { name: 'CHAPTER II. The Pool of Tears', exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'CHAPTER II. The Pool of Tears', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next chapter', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'CHAPTER III. A Caucus-Race and a Long Tale', exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  const text = await (await request.get('/library/pg-11/text')).text();
  expect(text).toContain('CHAPTER XII. Alice’s Evidence');
  expect(text).toContain('Down the Rabbit-Hole');
});

test('dictionary uses attributed senses and preserves a looked-up word offline', async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto('/?read=e1');
  await page.getByRole('button', { name: 'flickered.', exact: true }).click();
  const card = page.getByRole('region', { name: 'Dictionary', exact: true });
  await expect(card.getByRole('heading', { name: 'flicker', exact: true })).toBeVisible();
  await expect(card.getByRole('link', { name: 'Wiktionary via Kaikki' })).toBeVisible();
  await expect(card.getByRole('link', { name: 'CC BY-SA 4.0 / GFDL' })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.getByLabel('Dictionary word').fill('reading');
  await page.getByRole('button', { name: 'Look up word', exact: true }).click();
  await expect(card.getByRole('heading', { name: 'reading', exact: true })).toBeVisible();
  await expect(card.getByRole('heading', { name: 'noun', exact: true })).toBeVisible();
  await context.setOffline(false);
});

test('compact voices preview, download, select and generate reading audio without a network', async ({
  page,
  context,
}) => {
  await seed(page, 'af');
  await page.goto(
    '/?read=' + LIBRARY.find((i) => i.g === 'af' && i.k === 'Poem' && i.published)!.id,
  );
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Preview Afrikaans male', exact: true }).click();
  await page.getByRole('button', { name: 'Download Afrikaans male', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download Afrikaans male', exact: true }),
  ).toHaveCount(0, { timeout: 30000 });
  const profile = page
    .getByRole('heading', { name: 'Afrikaans male', exact: true })
    .locator('..')
    .locator('..')
    .locator('..');
  await profile.getByRole('button', { name: 'Choose', exact: true }).click();
  await expect(profile.getByRole('button', { name: 'Selected', exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lm-voices')!).af)).toBe(
    'pack:af-male',
  );
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Listen', exact: true }).click();
  await expect(page.locator('#s0.bg-hl')).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Afrikaans male', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download Afrikaans male', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lm-voices')!).af)).toBe('');
  await context.setOffline(false);
});

test('voice filters show real accents and model sizes, and failed downloads stay uninstalled', async ({
  page,
}) => {
  await seed(page);
  await page.route('**/voice-runtime/**', (route) => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Voice gender').selectOption('female');
  await page.getByLabel('Voice country').selectOption('GB');
  await expect(page.getByRole('heading', { name: 'Cori', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Linda', exact: true })).toHaveCount(0);
  await expect(page.getByText(/63\.[0-9] MB voice.*shared engine/)).toBeVisible();
  await page.getByRole('button', { name: 'Download Cori', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Voice library' }).getByRole('alert'),
  ).toContainText('could not download');
  await expect(page.getByRole('button', { name: 'Download Cori', exact: true })).toBeVisible();
  const ids = await page.evaluate(async () =>
    (await (await caches.open('leesmaat-voices-v1')).keys()).map((r) => r.url),
  );
  expect(ids).toEqual([]);
});

test('the primary library orders books before poems, stories and articles', async ({ request }) => {
  const html = await (await request.get('/library')).text();
  const published = LIBRARY.filter((i) => i.g === 'en' && i.published);
  const firstBook = Math.min(
    ...published
      .filter((i) => i.k === 'Book')
      .map((i) => html.indexOf(`/library/${i.id}"`))
      .filter((i) => i >= 0),
  );
  const firstPoem = Math.min(
    ...published
      .filter((i) => i.k === 'Poem')
      .map((i) => html.indexOf(`/library/${i.id}"`))
      .filter((i) => i >= 0),
  );
  const firstStory = Math.min(
    ...published
      .filter((i) => i.k === 'Story')
      .map((i) => html.indexOf(`/library/${i.id}"`))
      .filter((i) => i >= 0),
  );
  const firstArticle = Math.min(
    ...published
      .filter((i) => i.k === 'Article')
      .map((i) => html.indexOf(`/library/${i.id}"`))
      .filter((i) => i >= 0),
  );
  expect(firstBook).toBeLessThan(firstPoem);
  expect(firstPoem).toBeLessThan(firstStory);
  expect(firstStory).toBeLessThan(firstArticle);
});
