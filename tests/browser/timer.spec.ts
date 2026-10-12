import { test, expect } from '@playwright/test';

for (const width of [320, 390, 430]) {
  test(`daily timer stays inside its card at ${width}px with no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() =>
      localStorage.setItem(
        'lm',
        JSON.stringify({
          ob: true,
          placed: { en: true, af: true },
          theme: 'sepia',
          secs: 272,
          day: new Date().toLocaleDateString('en-CA'),
        }),
      ),
    );
    await page.goto('/');
    const card = page.getByRole('region', { name: 'Daily reading goal' });
    const timer = card.locator('svg[aria-label="Daily progress"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText('4:32');
    const cardBox = await card.boundingBox(),
      timerBox = await timer.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(timerBox).not.toBeNull();
    expect(timerBox!.width).toBeCloseTo(96, 2);
    expect(timerBox!.height).toBeCloseTo(96, 2);
    expect(timerBox!.x).toBeGreaterThanOrEqual(cardBox!.x + 20);
    expect(timerBox!.x + timerBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width - 20);
    const sizes = await card.evaluate((element) => ({
      cardWidth: element.clientWidth,
      cardScroll: element.scrollWidth,
      panelWidth: element.parentElement!.clientWidth,
      panelScroll: element.parentElement!.scrollWidth,
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(sizes.cardScroll).toBeLessThanOrEqual(sizes.cardWidth);
    expect(sizes.panelScroll).toBeLessThanOrEqual(sizes.panelWidth);
    expect(sizes.pageWidth).toBeLessThanOrEqual(sizes.viewport);
  });
}
