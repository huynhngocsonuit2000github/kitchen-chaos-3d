import { expect, test } from '@playwright/test';

test('Q08–Q09 previews blocked placement, buys a stove, undoes and recovers a saved career', async ({ page }, info) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Career', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Burger Town · Day 1' })).toBeVisible();
  await page.getByLabel('Equipment').selectOption('G2');
  await page.getByLabel('Column').fill('3');
  await expect(page.locator('#placement-cost')).toHaveText('Blocked placement');
  await expect(page.getByRole('button', { name: 'Confirm placement' })).toBeDisabled();
  await page.screenshot({ path: info.outputPath('05-planning-blocked.png') });
  await page.getByLabel('Column').fill('6');
  await expect(page.locator('#placement-cost')).toHaveText('Cost $60 · $40 remaining');
  await page.getByRole('button', { name: 'Confirm placement' }).click();
  await expect(page.getByText('Placement saved.')).toBeVisible();
  await expect(page.locator('#cash')).toHaveText('$40 cash');
  await page.getByRole('button', { name: 'Undo placement' }).click();
  await expect(page.locator('#cash')).toHaveText('$100 cash');
  await page.getByRole('button', { name: 'Add two plates · $25' }).click();
  await expect(page.getByText('Plate rack: 6 plates.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Career', exact: true }).click();
  await expect(page.getByText('Plate rack: 6 plates.')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('burger-town.career', '{'));
  await page.reload();
  await page.getByRole('button', { name: 'Career', exact: true }).click();
  await expect(page.getByText('Plate rack: 4 plates.')).toBeVisible();
  await expect(page.getByText('Career save recovered', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Start shift' }).click();
  await expect(page.locator('#tickets')).toContainText('Classic');
  await expect(page.locator('#staff-status')).toContainText('Partner');
  await page.screenshot({ path: info.outputPath('06-career-seated.png') });
});

test('Q10–Q11 unlocks sound, pauses loops and applies low graphics', async ({ page }, info) => {
  const uncaught: string[] = [];
  page.on('pageerror', (error) => uncaught.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.play;
    const clips: HTMLMediaElement[] = [];
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (!clips.includes(this)) clips.push(this);
      return original.call(this);
    };
    Object.defineProperty(window, 'qaAudio', { value: clips });
  });
  const media = () => page.evaluate(() =>
    (window as unknown as { qaAudio: HTMLMediaElement[] }).qaAudio.map(({ paused, volume }) => ({ paused, volume })));
  await page.goto('./');
  expect(await media()).toHaveLength(0);
  await page.getByText('Settings', { exact: true }).click();
  await page.getByLabel('Low graphics').check();
  await page.getByRole('button', { name: 'Start shift' }).click();
  await expect.poll(media).toHaveLength(2);
  await expect.poll(async () => (await media()).every(({ paused }) => !paused)).toBe(true);
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await expect.poll(async () => (await media()).every(({ volume }) => volume === 0)).toBe(true);
  await page.locator('#stage').focus();
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await media()).every(({ paused }) => paused)).toBe(true);
  await page.getByRole('button', { name: 'Resume shift' }).click();
  await expect.poll(async () => page.locator('canvas').evaluate((canvas) => (canvas as HTMLCanvasElement).width / canvas.clientWidth)).toBeLessThan(.75);
  await page.screenshot({ path: info.outputPath('07-low-graphics.png') });
  expect(uncaught).toEqual([]);
});
