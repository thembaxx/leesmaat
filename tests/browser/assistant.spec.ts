import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ASSISTANT_MODELS, assistantFiles } from '../../src/lib/assistant-downloads';

async function seed(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'lm',
      JSON.stringify({ ob: true, placed: { en: true, af: true }, theme: 'paper' }),
    );
  });
}
async function capability(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {
        requestAdapter: async () => ({ limits: { maxStorageBufferBindingSize: 1073741824 } }),
      },
    });
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
  });
}
test('unsupported devices keep the existing summary and never download a model automatically', async ({
  page,
}) => {
  await seed(page);
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/huggingface.co|assistant-runtime/.test(request.url())) requests.push(request.url());
  });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'gpu', { value: undefined, configurable: true }),
  );
  await page.goto('/?read=e6');
  await page.getByRole('button', { name: 'Reading assistant', exact: true }).click();
  await expect(
    page.getByText('Local AI is unavailable in this browser.', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Download Compact reading assistant', exact: true }),
  ).toBeDisabled();
  expect(requests).toEqual([]);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Smart summary', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Main talking points', exact: true }),
  ).toBeVisible();
});
test('model downloads show sizes and reject altered bytes without installing', async ({ page }) => {
  await seed(page);
  await capability(page);
  const file = ASSISTANT_MODELS[0]!.files[0]!;
  await page.route(file.url, (route) =>
    route.fulfill({ status: 200, body: 'x'.repeat(file.bytes), contentType: 'application/json' }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Offline reading assistant', exact: true });
  await expect(panel.getByText(/300\.[0-9] MB download/)).toBeVisible();
  await expect(
    panel.getByRole('button', { name: 'Download Compact reading assistant', exact: true }),
  ).toBeEnabled();
  await panel
    .getByRole('button', { name: 'Download Compact reading assistant', exact: true })
    .click();
  await expect(panel.getByRole('alert')).toContainText('download was incomplete');
  await expect(
    panel.getByRole('button', { name: 'Download Compact reading assistant', exact: true }),
  ).toBeEnabled();
  const keys = await page.evaluate(async () =>
    (await (await caches.open('webllm/config')).keys()).map((r) => r.url),
  );
  expect(keys).toEqual([]);
});
test('model download can be cancelled before any package is installed', async ({ page }) => {
  await seed(page);
  await capability(page);
  await page.route(ASSISTANT_MODELS[0]!.files[0]!.url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.abort();
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .getByRole('button', { name: 'Download Compact reading assistant', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel model download', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Cancel model download', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Download Compact reading assistant', exact: true }),
  ).toBeEnabled();
});

/** Controlled worker replies test UI/citation lifecycle independently of CI GPU availability. */
async function cachedFixture(page: Page) {
  await seed(page);
  await capability(page);
  await page.goto('/offline.html');
  const model = ASSISTANT_MODELS[0]!;
  await page.evaluate(
    async ({ id, files }) => {
      for (const file of files)
        await (
          await caches.open(file.cache)
        ).put(
          file.url,
          new Response('worker fixture', { headers: { 'x-leesmaat-sha256': file.sha256 } }),
        );
      localStorage.setItem('lm-assistant-model', id);
    },
    { id: model.id, files: assistantFiles(model) },
  );
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.defineProperty(window, 'assistantFixtureSources', { value: seen });
    class FixtureWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: null = null;
      stopped = false;
      postMessage(message: {
        id: number;
        action: string;
        schema: string;
        messages?: { content: string }[];
      }) {
        queueMicrotask(() => {
          if (this.stopped) return;
          const source =
            message.action === 'load'
              ? 1
              : JSON.parse(message.schema).properties.points.items.properties.sources.items.enum[0];
          if (message.action === 'generate') {
            const input = JSON.parse(message.messages![1]!.content.split('\n').slice(1).join('\n'));
            if (!Array.isArray(input)) seen.push(input.text);
          }
          this.onmessage?.({
            data:
              message.action === 'load'
                ? { id: message.id, ready: true }
                : {
                    id: message.id,
                    text: JSON.stringify({
                      points: [
                        { text: 'The passage describes care and welcome.', sources: [source] },
                      ],
                    }),
                  },
          });
        });
      }
      terminate() {
        this.stopped = true;
      }
    }
    Object.defineProperty(window, 'Worker', { value: FixtureWorker, configurable: true });
  });
}
test('a downloaded assistant explains selected text offline and cites the exact source', async ({
  page,
  context,
}) => {
  await cachedFixture(page);
  await page.goto('/?read=e1');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.evaluate(() => {
    const words = document.querySelectorAll<HTMLElement>('[data-start]');
    const range = document.createRange();
    range.setStart(words[0]!.firstChild!, 0);
    range.setEnd(words[3]!.firstChild!, words[3]!.textContent!.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.getByRole('button', { name: 'Explain selected passage', exact: true }).click();
  await expect(page.getByRole('blockquote')).toContainText('Every evening, Gogo left');
  await page.getByRole('button', { name: 'Explain passage', exact: true }).click();
  const result = page.getByRole('region', { name: 'Generated reading explanation', exact: true });
  await expect(
    result.getByText('The passage describes care and welcome.', { exact: true }),
  ).toBeVisible();
  await result.getByRole('button', { name: 'Open supporting passage 1', exact: true }).click();
  const source = page.locator('[data-summary-passage]');
  await expect(source.first()).toBeFocused();
  expect((await source.allTextContents()).join(' ')).toBe('Every evening, Gogo left');
  await context.setOffline(false);
});
test('removing a model clears its files and preference while leaving voice storage intact', async ({
  page,
}) => {
  await cachedFixture(page);
  await page.evaluate(async () =>
    (await caches.open('leesmaat-voices-v1')).put('/voice-fixture', new Response('keep')),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Compact reading assistant', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Download Compact reading assistant', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lm-assistant-model'))).toBe('');
  const counts = await page.evaluate(async () => ({
    model: (await (await caches.open('webllm/model')).keys()).length,
    voice: !!(await (await caches.open('leesmaat-voices-v1')).match('/voice-fixture')),
  }));
  expect(counts.model).toBe(0);
  expect(counts.voice).toBe(true);
});

test('chapter summaries process every source passage before reducing their points', async ({
  page,
  request,
}) => {
  await cachedFixture(page);
  const book = await (await request.get('/content/pg-11.json')).json();
  await page.goto('/?read=pg-11');
  await page.getByRole('button', { name: 'Reading assistant', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Chapter summary and talking points', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate summary', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Generated reading explanation', exact: true }),
  ).toBeVisible();
  const texts = await page.evaluate(
    () => (window as unknown as { assistantFixtureSources: string[] }).assistantFixtureSources,
  );
  expect(texts.length).toBeGreaterThan(3);
  expect(texts.join('')).toBe(book.sections[0].x);
});

test('partially cached models can be removed without completing a download', async ({ page }) => {
  await seed(page);
  await capability(page);
  await page.goto('/offline.html');
  const file = ASSISTANT_MODELS[0]!.files[0]!;
  await page.evaluate(
    async (f) =>
      (await caches.open(f.cache)).put(
        f.url,
        new Response('partial fixture', { headers: { 'x-leesmaat-sha256': f.sha256 } }),
      ),
    file,
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page
    .getByRole('button', { name: 'Remove partial Compact reading assistant', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Remove partial Compact reading assistant', exact: true }),
  ).toHaveCount(0);
  const remaining = await page.evaluate(
    async (f) => !!(await (await caches.open(f.cache)).match(f.url)),
    file,
  );
  expect(remaining).toBe(false);
});
