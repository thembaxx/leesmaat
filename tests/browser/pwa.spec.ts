import { LIBRARY } from '../../src/lib/data';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function setup(page: Page, theme = 'paper') {
  await page.addInitScript((value) => {
    if (!localStorage.getItem('lm'))
      localStorage.setItem('lm', JSON.stringify({ ob: true, theme: value }));
  }, theme);
}

test('saved and system themes match browser chrome and manifest colors', async ({
  page,
  request,
}) => {
  await setup(page, 'sepia');
  await page.goto('/?read=e1');
  await expect(
    page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    'content',
    '#f4ecd8',
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/manifest.webmanifest',
  );
  const manifest = await (await request.get('/manifest.webmanifest?theme=sepia')).json();
  expect(manifest.background_color).toBe('#f4ecd8');
  expect(manifest.theme_color).toBe('#f4ecd8');
  expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable')).toBe(
    true,
  );
  expect(manifest.shortcuts.map((shortcut: { url: string }) => shortcut.url)).toEqual([
    '/?tab=practice',
    '/?tab=bookmarks',
  ]);
  await page.getByRole('button', { name: 'Reading settings', exact: true }).click();
  await page.getByRole('button', { name: 'Auto', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    'content',
    '#000000',
  );
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute(
    'content',
    '#fbfaf7',
  );
});

test('native Back and Forward restore the reader and sharing uses its public page', async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: async (data: ShareData) => {
        (window as unknown as { shared: ShareData }).shared = data;
      },
    });
  });
  await page.goto('/');
  await page.getByLabel('Search library').fill("Gogo's Kitchen Light");
  await page
    .getByRole('button', { name: /Gogo's Kitchen Light.*Story/ })
    .last()
    .click();
  await expect(page).toHaveURL(/read=e1/);
  await page.getByRole('button', { name: 'Share reading', exact: true }).click();
  expect(
    await page.evaluate(() => (window as unknown as { shared: ShareData }).shared.url),
  ).toContain('/library/e1');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
  ).toBeVisible();
});

test('install action prompts only on a deliberate click and installed state replaces it', async ({
  page,
}) => {
  await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: async () => {
        (window as unknown as { prompted: boolean }).prompted = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });
  await expect(page.getByRole('button', { name: 'Install Leesmaat', exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { prompted?: boolean }).prompted),
  ).toBeUndefined();
  await page.getByRole('button', { name: 'Install Leesmaat', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { prompted: boolean }).prompted)).toBe(
    true,
  );
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText('Leesmaat is installed.', { exact: false })).toBeVisible();
});

test('onboarding offers an accessible static world with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A little reading. A bigger world.' }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});

test('public pages expose content, attribution and LLM files without personal storage', async ({
  page,
  request,
}) => {
  const response = await request.get('/library/e1');
  const html = await response.text();
  expect(html).toContain('Every evening, Gogo left the kitchen light on.');
  expect(html).toContain('application/ld+json');
  expect(html).toContain('Original Leesmaat writing');
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    expect(html).toContain(process.env.NEXT_PUBLIC_SITE_URL + '/library/e1');
    expect(html).toContain('og:image');
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect((sitemap.match(/<loc>/g) ?? []).length).toBe(LIBRARY.length + 2);
    expect(sitemap).toContain(process.env.NEXT_PUBLIC_SITE_URL + '/library/e1');
  }
  expect(await (await request.get('/llms.txt')).text()).toContain(
    'Catalogue records do not imply that reading text is included',
  );
  expect(await (await request.get('/llm.txt')).text()).toBe(
    await (await request.get('/llms.txt')).text(),
  );
  expect(await (await request.get('/library/e1/text')).text()).toContain("# Gogo's Kitchen Light");
  expect(await (await request.get('/robots.txt')).text()).toContain('Allow: /');
  await page.goto('/library/e1');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('mobile, tablet and desktop keep the same background and fit the viewport', async ({
  browser,
}) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 820, height: 1180 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await setup(page, 'night');
    await page.goto('/?read=e1');
    await expect(page.getByRole('button', { name: 'Share reading', exact: true })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
      body: getComputedStyle(document.body).backgroundColor,
      frame: getComputedStyle(document.querySelector('.app-frame')!).backgroundColor,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.body).toBe(dimensions.frame);
    await context.close();
  }
});

test('visited public pages and unvisited title links work offline', async ({ page, context }) => {
  await setup(page);
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      );
  });
  await page.goto('/library');
  await page.goto('/library/e4');
  await expect(
    page.getByRole('heading', { name: 'The Map in the Library', exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Three words waited there:', { exact: false })).toBeVisible();
  await page.goto('/library/e1');
  await expect(
    page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
  ).toBeVisible();
  await page.goto('/an-unsaved-page');
  await expect(page.getByRole('heading', { name: 'A quiet moment offline.' })).toBeVisible();
  await context.setOffline(false);
});

test('read-aloud requests and releases screen wake lock and exposes media controls', async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(() => {
    const status = { requested: 0, released: 0, playback: '', actions: [] as string[] };
    (window as unknown as { nativeStatus: typeof status }).nativeStatus = status;
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: async () => {
          status.requested++;
          return {
            released: false,
            release: async () => {
              status.released++;
            },
          };
        },
      },
    });
    Object.defineProperty(navigator, 'mediaSession', {
      value: {
        metadata: null,
        set playbackState(value: string) {
          status.playback = value;
        },
        setActionHandler(action: string, handler: unknown) {
          if (handler) status.actions.push(action);
        },
      },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [],
        cancel: () => {},
        speak: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
  await page.goto('/?read=e1');
  await page.getByRole('button', { name: 'Listen', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { nativeStatus: { requested: number } }).nativeStatus.requested,
      ),
    )
    .toBe(1);
  const playing = await page.evaluate(
    () =>
      (window as unknown as { nativeStatus: { playback: string; actions: string[] } }).nativeStatus,
  );
  expect(playing.playback).toBe('playing');
  expect(playing.actions).toEqual(
    expect.arrayContaining(['play', 'pause', 'nexttrack', 'previoustrack']),
  );
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { nativeStatus: { released: number } }).nativeStatus.released,
      ),
    )
    .toBe(1);
});
