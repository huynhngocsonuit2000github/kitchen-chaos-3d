import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { cells, isSolid, stations, stationNames } from '../../src/game/layout';
import type { StationId } from '../../src/game/layout';

type GameClock = Window & { playFrames(ticks: number): void };

async function installFrameClock(page: Page) {
  await page.addInitScript(() => {
    let pending: FrameRequestCallback;
    let now = 0;
    window.requestAnimationFrame = (callback) => {
      pending = callback;
      return 1;
    };
    (window as Window as GameClock).playFrames = (ticks) => {
      while (ticks > 0) {
        const batch = Math.min(6, ticks);
        now += batch === 6 ? 100 : (batch * 1000 / 60);
        pending(now);
        ticks -= batch;
      }
    };
  });
}

const run = (page: Page, ticks: number) => page.evaluate((count) => (window as Window as GameClock).playFrames(count), ticks);

test('Q02–Q06, Q11, Q15–Q17 cooks all three recipes through keyboard input and settles a full shift', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installFrameClock(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start shift' }).click();
  await run(page, 1);
  const station = page.locator('#station');
  const feedback = page.locator('#feedback');
  const score = page.locator('#score');
  const equipment = page.locator('#equipment');
  const position = { x: 40, z: 160 }; // 20 fixed walking steps per tile
  let elapsed = 1;

  async function tick(count: number) {
    await run(page, count);
    elapsed += count;
  }

  async function walk(key: string, count: number) {
    if (!count) return;
    await page.keyboard.down(key);
    await tick(count);
    await page.keyboard.up(key);
    if (key === 'a') position.x -= count;
    if (key === 'd') position.x += count;
    if (key === 'w') position.z -= count;
    if (key === 's') position.z += count;
  }

  async function moveTo(x: number, z: number) {
    await walk(x < position.x ? 'a' : 'd', Math.abs(position.x - x));
    await walk(z < position.z ? 'w' : 's', Math.abs(position.z - z));
  }

  async function face(id: StationId) {
    const { x, z } = stations.find(({ tile }) => tile === id)!;
    const points = [
      { x, z: z + 1, key: 'w' }, { x: x + 1, z, key: 'a' },
      { x: x - 1, z, key: 'd' }, { x, z: z - 1, key: 's' },
    ];
    const start = { x: Math.round(position.x / 20), z: Math.round(position.z / 20) };
    const queue = [{ ...start, path: [start] }];
    const seen = new Set<string>();
    let found: typeof points[number] | undefined;
    for (const current of queue) {
      const location = `${current.x},${current.z}`;
      if (seen.has(location)) continue;
      seen.add(location);
      found = points.find((point) => point.x === current.x && point.z === current.z);
      if (found) {
        for (const [index, point] of current.path.entries()) {
          const next = current.path[index + 1];
          const previous = current.path[index - 1];
          const straight = next && previous && (next.x === previous.x || next.z === previous.z);
          if (!straight) await moveTo(point.x * 20, point.z * 20);
        }
        break;
      }
      for (const cell of cells) {
        if (!isSolid(cell.tile) && Math.abs(cell.x - current.x) + Math.abs(cell.z - current.z) === 1) {
          if (!seen.has(`${cell.x},${cell.z}`)) queue.push({ ...cell, path: [...current.path, cell] });
        }
      }
    }
    expect(found, `reachable ${id}`).toBeDefined();
    await walk(found!.key, 1);
    await expect(station).toHaveText(stationNames[id]);
  }

  const press = (key: string) => page.keyboard.press(key);

  async function transfer(id: StationId) {
    await face(id);
    await press('e');
  }

  async function prep(id: 'L' | 'M') {
    await transfer(id);
    await transfer('K');
    await page.keyboard.down('Space');
    await tick(60);
    await page.keyboard.up('Space');
    await tick(30);
    await expect(equipment).toContainText('50%');
    await page.keyboard.down('Space');
    await tick(60);
    await page.keyboard.up('Space');
    await press('e');
    await transfer('A');
  }

  await press('q');
  await expect(page.locator('#chef')).toHaveText('Lina');
  await press('q');
  await transfer('R');
  await transfer('S');
  await expect(feedback).toContainText('Dish rejected');
  await press('e');
  await expect(page.locator('#hands')).toHaveText('Clean plate');
  await transfer('A');
  await transfer('B');
  await transfer('A');
  await transfer('P');
  await transfer('G');
  await tick(240);
  const before = await equipment.textContent();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('heading', { name: 'Shift paused' })).toBeVisible();
  await run(page, 240);
  await expect(equipment).toHaveText(before!);
  await page.getByRole('button', { name: 'Resume shift' }).click();
  await tick(240);
  await expect(equipment).toContainText('Perfect patty');
  await expect(page.locator('.station-food[data-state=perfect]')).toHaveText('Stove · Perfect');
  await page.screenshot({ path: info.outputPath('01-stove-ready.png') });
  await press('e');
  await transfer('A');
  await press('e');
  await transfer('S');
  await expect(score).toHaveText('1 / 10 served');

  await tick(480);
  await face('W');
  await page.keyboard.down('Space');
  await tick(180);
  await page.keyboard.up('Space');
  await press('e');
  await expect(page.locator('#hands')).toHaveText('Clean plate');

  for (const [number, recipe] of [[2, 'Cheese'], [3, 'Garden']] as const) {
    await transfer('A');
    await transfer('B');
    await transfer('A');
    if (recipe === 'Cheese') {
      await transfer('C');
      await transfer('A');
    } else {
      await prep('L');
      await prep('M');
    }
    await transfer('P');
    await transfer('G');
    await tick(480);
    await press('e');
    await transfer('A');
    await press('e');
    await face('S');
    await expect(page.locator('#tickets')).toContainText(recipe);
    if (recipe === 'Garden') await page.screenshot({ path: info.outputPath('02-garden-at-hatch.png') });
    await press('e');
    await expect(score).toHaveText(`${number} / 10 served`);
    if (number === 2) await transfer('R');
  }

  await tick(130 * 60 - elapsed);
  await expect(page.locator('#tickets li')).toHaveCount(3);
  await expect(page.locator('#tickets .order-icon')).toHaveCount(3);
  await expect(page.locator('#tickets .ticket-meter')).toHaveCount(3);
  await page.screenshot({ path: info.outputPath('03-busy-order-rail.png') });
  await tick(18000 - elapsed + 6);
  await expect(page.getByRole('heading', { name: 'Target missed' })).toBeVisible();
  await expect(page.locator('.receipt')).toContainText('$44');
  await expect(page.locator('#clock')).toHaveText('0:00');
  await page.screenshot({ path: info.outputPath('04-closed-shift.png') });
  const final = await page.locator('.receipt').textContent();
  await tick(120);
  await expect(page.locator('.receipt')).toHaveText(final!);
  await page.getByRole('button', { name: 'Retry shift' }).click();
  await expect(score).toHaveText('0 / 10 served');
  await expect(page.locator('#clock')).toHaveText('5:00');
  await press('Escape');
  await page.getByRole('button', { name: 'Restart shift' }).click();
  await expect(page.getByRole('heading', { name: 'Restart this shift?' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm restart' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#tickets')).toContainText('Classic');
  expect(errors).toEqual([]);
});
