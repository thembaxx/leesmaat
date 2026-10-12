import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function ready(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('lm'))
      localStorage.setItem('lm', JSON.stringify({ ob: true, theme: 'paper' }));
  });
}

test('reader summary links to highlighted source text and restores keyboard focus', async ({
  page,
}) => {
  await ready(page);
  await page.goto('/?read=e6');
  const trigger = page.getByRole('button', { name: 'Smart summary', exact: true });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: 'Smart summary', exact: true });
  await expect(panel.getByRole('heading', { name: 'Main talking points' })).toBeVisible();
  await expect(panel.getByRole('listitem')).toHaveCount(4);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await panel.getByRole('button', { name: 'Open supporting passage: Use evidence' }).click();
  await expect(panel).toHaveCount(0);
  const highlight = page.locator('[data-summary-passage]');
  await expect(highlight.first()).toBeFocused();
  await expect(highlight.first()).toBeInViewport();
  expect((await highlight.allTextContents()).join(' ')).toBe(
    'Support your interpretation with the words on the page.',
  );
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Zen mode', exact: true }).click();
  await expect(trigger).toHaveCount(0);
  await page.getByRole('button', { name: 'Exit zen', exact: true }).click();
  await expect(trigger).toHaveCount(1);
});

test('Afrikaans summaries survive download and an offline reload', async ({ page, context }) => {
  await ready(page);
  await page.goto('/?read=a3');
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
  await page.getByRole('button', { name: 'Download offline' }).click();
  await expect(page.getByRole('button', { name: 'Remove offline copy' })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Slim opsomming', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Slim opsomming', exact: true });
  await expect(panel.getByRole('heading', { name: 'Hoofgesprekspunte' })).toBeVisible();
  await expect(panel.getByText('Die tuin help bure om mekaar te leer ken.')).toBeVisible();
  await panel
    .getByRole('button', { name: 'Maak ondersteunende gedeelte oop: Verandering' })
    .click();
  await expect(page.locator('[data-summary-passage]').first()).toBeInViewport();
  await context.setOffline(false);
});

test('public summaries render without JavaScript, disclose coverage and link to passages', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  await page.goto('/library/e6');
  await page.locator('summary').click();
  await expect(page.getByText('Edited for this text')).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(4);
  await page.getByRole('link', { name: 'Open supporting passage: Use evidence' }).click();
  await expect(page).toHaveURL(/#passage-2$/);
  await expect(page.locator('#passage-2')).toBeInViewport();
  const width = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(width.doc).toBeLessThanOrEqual(width.viewport);
  await page.goto('/library/nsc-en-HL-book-0');
  await expect(
    page.getByText('Verified title and author metadata.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('summary')).toHaveCount(0);
  const text = await (await request.get('/library/e6/text')).text();
  expect(text).toContain('## Smart summary');
  expect(text).toContain('### Main talking points');
  expect(await (await request.get('/llms-full.txt')).text()).toContain('Complete book text:');
  await context.close();
});
