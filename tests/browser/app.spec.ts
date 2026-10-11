import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function placed(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('lm'))
      localStorage.setItem(
        'lm',
        JSON.stringify({
          ob: true,
          lang: 'en',
          theme: 'paper',
          day: new Date().toLocaleDateString('en-CA'),
        }),
      );
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
}
async function openStory(page: Page) {
  await page.getByLabel('Search library').fill("Gogo's Kitchen Light");
  await page
    .getByRole('button', { name: /Gogo's Kitchen Light.*Story/ })
    .last()
    .click();
  await expect(
    page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
  ).toBeVisible();
}
test('placement gives each language its own level and persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'English Stories' }).click();
  await page.getByRole('button', { name: /^Despite the clamour/ }).click();
  await page.getByRole('button', { name: 'to stay a little longer', exact: true }).click();
  await page.getByRole('button', { name: 'She plans ahead and cares about others' }).click();
  await expect(page.getByText('Advanced', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start reading' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('lm')!));
  expect(state.levels).toEqual({ en: 2, af: 1 });
});
test('reader stores notes at a source range and exposes saved words and bookmarks', async ({
  page,
}) => {
  await placed(page);
  await openStory(page);
  await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
  await page.getByRole('button', { name: 'flickered.', exact: true }).click();
  await page.getByRole('button', { name: 'Save word', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your note' }).fill('The candle brings people together.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('[title="The candle brings people together."]')).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
  await page.getByRole('button', { name: 'Notes', exact: true }).click();
  await expect(page.getByText('The candle brings people together.', { exact: true })).toBeVisible();
  const note = await page.evaluate(() => JSON.parse(localStorage.getItem('lm')!).nt[0]);
  expect(note.itemId).toBe('e1');
  expect(note.end).toBeGreaterThan(note.start);
});
test('download is in IndexedDB and remains readable after an offline reload', async ({
  page,
  context,
}) => {
  await placed(page);
  await openStory(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Download offline', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Download offline', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Remove offline copy', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
  await page.getByRole('button', { name: 'Archive', exact: true }).click();
  await page.getByRole('button', { name: /Gogo's Kitchen Light.*offline/ }).click();
  await expect(page.getByText('Every', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/offline-reader.png', animations: 'disabled' });
  await context.setOffline(false);
});
test('comprehension feedback and XP use the actual question count', async ({ page }) => {
  await placed(page);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Comprehension', exact: true }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'She places a candle by the window' }).click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: 'Care and welcome for the community' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('2 / 2 · +20 XP')).toBeVisible();
});
test('themes persist and screens have no serious accessibility violations', async ({ page }) => {
  await placed(page);
  const check = async () => {
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(result.violations).toEqual([]);
  };
  await check();
  await page.screenshot({ path: 'test-results/home.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Night', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  await openStory(page);
  await check();
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Reading settings', exact: true })).toBeFocused();
});

test('phrase search, selected paragraph notes and zen mode remain usable', async ({ page }) => {
  await placed(page);
  await openStory(page);
  await page.getByRole('button', { name: 'Find in text', exact: true }).click();
  await page.getByRole('textbox', { name: 'Find in text', exact: true }).fill('kitchen light');
  await expect(page.locator('[data-find-current]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Find in text', exact: true }).click();
  await page.evaluate(() => {
    const words = document.querySelectorAll<HTMLElement>('[data-start]');
    const first = words[0]!.firstChild!,
      last = words[3]!.firstChild!;
    const range = document.createRange();
    range.setStart(first, 0);
    range.setEnd(last, last.textContent!.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: 'Add note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Your note' }).fill('A repeated act of kindness');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.locator('[title="A repeated act of kindness"]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Zen mode', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Exit zen', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Exit zen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Listen', exact: true })).toBeVisible();
});
test('saved vocabulary is reviewed and scheduled rather than repeated immediately', async ({
  page,
}) => {
  await placed(page);
  await openStory(page);
  await page.getByRole('button', { name: 'flickered.', exact: true }).click();
  await page.getByRole('button', { name: 'Save word', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'burned with an unsteady light', exact: true }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('1 / 1 · +10 XP')).toBeVisible();
  const review = await page.evaluate(
    () => JSON.parse(localStorage.getItem('lm')!).reviews['en-flickered'],
  );
  expect(review.interval).toBe(1);
});
