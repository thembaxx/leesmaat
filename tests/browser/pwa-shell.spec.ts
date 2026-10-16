import { test, expect, type Page } from '@playwright/test';
import { SPLASH_DEVICES, splashLinks } from '../../src/lib/splash';

async function controlled(page: Page) {
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {
      timeout: 20000,
    })
    .toBe(true);
}

for (const [theme, resolved, color] of [
  ['paper', 'paper', 'rgb(251, 250, 247)'],
  ['sepia', 'sepia', 'rgb(244, 236, 216)'],
  ['night', 'night', 'rgb(0, 0, 0)'],
  ['', 'night', 'rgb(0, 0, 0)'],
]) {
  test(`first paint uses ${theme || 'system'} theme before CSS and hydration`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(
      (theme) => localStorage.setItem('lm', JSON.stringify({ theme })),
      theme,
    );
    await page.route('**/_next/static/**', (route) => route.abort());
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    ).toBe(color);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(color);
    await expect(page.locator('link[rel=manifest]')).toHaveAttribute(
      'href',
      `/manifest.webmanifest?theme=${resolved}`,
    );
    const images = await page
      .locator('link[rel=apple-touch-startup-image]')
      .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
    expect(images.length).toBe(SPLASH_DEVICES.length * 4);
    expect(images.every((src) => src.endsWith(`-${resolved}.png`))).toBe(true);
  });
}

test('every portrait and landscape launch image exists at its declared pixel size', async ({
  request,
}) => {
  // Read PNG dimensions directly, including devices sharing CSS sizes but having different pixel ratios.
  for (const device of SPLASH_DEVICES) {
    const [width, height, ratio] = device;
    for (const { href, media } of splashLinks(device)) {
      const response = await request.get(href);
      expect(response.ok(), href).toBe(true);
      const png = await response.body();
      const landscape = media.includes('orientation: landscape');
      expect(png.readUInt32BE(16), href).toBe((landscape ? height : width) * ratio);
      expect(png.readUInt32BE(20), href).toBe((landscape ? width : height) * ratio);
    }
  }
});

test('a first public-page visit prepares offline reading and a themed recovery page', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('lm'))
      localStorage.setItem('lm', JSON.stringify({ ob: true, theme: 'sepia' }));
  });
  await page.goto('/library/e1');
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText('Every evening, Gogo left the kitchen light on.', { exact: false }),
  ).toBeVisible();
  await page.goto('/not-saved');
  await expect(page.getByRole('heading', { name: 'A quiet moment offline.' })).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(244, 236, 216)',
  );
  await expect(page.locator('meta[name=theme-color]').first()).toHaveAttribute(
    'content',
    '#f4ecd8',
  );
  expect(
    await page.locator('img').evaluate((img) => (img as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'Open saved reading' }).click();
  await expect(page.getByRole('heading', { name: 'Bookmarks', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Night', exact: true }).click();
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!.href;
    return (await fetch(href)).json();
  });
  expect(manifest.background_color).toBe('#000000');
  expect(manifest.theme_color).toBe('#000000');
});

test('blocked preference storage still follows the system theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
    Object.defineProperty(document, 'cookie', {
      get() {
        return '';
      },
      set() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/library/e1');
  await expect(page.locator('meta[name=theme-color]').first()).toHaveAttribute(
    'content',
    '#000000',
  );
  await expect(page.locator('link[rel=manifest]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest?theme=night',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('meta[name=theme-color]').first()).toHaveAttribute(
    'content',
    '#fbfaf7',
  );
});
