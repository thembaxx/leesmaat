import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';

test('a real worker update waits for the reader, then preserves saved data when applied', async ({
  browser,
}) => {
  let version = 1;
  const proxy = createServer(async (request, response) => {
    try {
      const upstream = await fetch('http://127.0.0.1:3100' + request.url, {
        headers: { 'Accept-Encoding': 'identity' },
      });
      response.statusCode = upstream.status;
      for (const [key, value] of upstream.headers) {
        if (!['content-length', 'content-encoding', 'transfer-encoding'].includes(key))
          response.setHeader(key, value);
      }
      if (request.url === '/sw.js') {
        response.end(
          (await upstream.text()).replace(
            /leesmaat-shell-([a-f0-9]+)/,
            `leesmaat-shell-$1-test-${version}`,
          ),
        );
      } else response.end(Buffer.from(await upstream.arrayBuffer()));
    } catch {
      response.statusCode = 503;
      response.end();
    }
  });
  await new Promise<void>((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const address = proxy.address();
  if (!address || typeof address === 'string') throw new Error('Test proxy did not start');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      if (!localStorage.getItem('lm'))
        localStorage.setItem('lm', JSON.stringify({ ob: true, theme: 'paper' }));
    });
    await page.goto(`http://127.0.0.1:${address.port}/?read=e1`);
    await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
            once: true,
          }),
        );
    });
    version = 2;
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
    await expect
      .poll(() =>
        page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting),
      )
      .toBe(true);
    await expect(
      page.getByRole('dialog', { name: "Gogo's Kitchen Light", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lm')!).sv)).toContain('e1');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Update Leesmaat', exact: true })).toBeVisible();
    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: 'Update Leesmaat', exact: true }).click(),
    ]);
    await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(async () => !(await navigator.serviceWorker.getRegistration())?.waiting),
      )
      .toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lm')!).sv)).toContain('e1');
  } finally {
    await context.close();
    proxy.closeAllConnections();
    await new Promise<void>((resolve) => proxy.close(() => resolve()));
  }
});
