import { expect, test } from '@playwright/test';

test('Q01 boots the production build with clean browser and asset requests', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', (request) => errors.push(request.url()));
  page.on('response', (response) => {
    if (!response.ok()) errors.push(response.status() + ' ' + response.url());
  });

  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Kitchen Chaos 3D' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Kitchen foundation ready.');
  await expect(page.locator('#build')).toContainText('Content schema 1');
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('foundation-boot.png') });
});

test('Q01 recovers from a missing content asset through a keyboard retry', async ({ page }, testInfo) => {
  await page.route('**/assets/EXAMPLE_PACK-*.json', (route) =>
    route.fulfill({ status: 404, body: 'Fixture unavailable' }), { times: 1 });
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('retry');
  await page.screenshot({ path: testInfo.outputPath('foundation-missing-content.png') });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Kitchen foundation ready.');
  await expect(page.getByRole('status')).toBeFocused();
  await expect(page.getByRole('alert')).toBeHidden();
});

test('Q01 explains how to recover when WebGL 2 is unavailable', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      if (type === 'webgl2') return null;
      return Reflect.apply(getContext, this, [type, options]);
    } as typeof getContext;
  });
  await page.goto('./');
  await expect(page.getByRole('alert')).toContainText('Enable hardware acceleration');
  await expect(page.getByRole('button', { name: 'Retry' })).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('foundation-webgl-error.png') });
});
