import { describe, expect, it } from 'vitest';
import fixture from '../../content/EXAMPLE_PACK.json';
import { parseContentPack } from '../content/pack';
import { cells, isSolid, stations } from './layout';
import { hz, isPlate, pattyState, Shift } from './shift';
import type { Food, Input, Plate } from './shift';

const pack = parseContentPack(fixture);
const still = { x: 0, z: 0, dash: false, operate: false };
function shift() {
  const result = new Shift(pack);
  result.start();
  return result;
}
function advance(game: Shift, ticks: number, input: Partial<Input> = {}) {
  for (let i = 0; i < ticks; i++) game.advance({ ...still, ...input });
}
function face(game: Shift, station: string, side = 1) {
  const cell = stations.find(({ tile }) => tile === station)!;
  Object.assign(game.chef, { x: cell.x, z: cell.z + side, facing: { x: 0, z: -side } });
}

describe('M1 simulation', () => {
  it('Q02 bounds walking and dash, and Q19 validates station reachability', () => {
    const game = shift();
    advance(game, 60, { z: 1, dash: true });
    expect(game.chef.z).toBeCloseTo(8.2);
    const visited = new Set<string>();
    const queue = [game.chefs[1]!];
    for (const { x, z } of queue) {
      const key = `${x},${z}`;
      if (visited.has(key)) continue;
      visited.add(key);
      for (const cell of cells) {
        if (Math.abs(cell.x - x) + Math.abs(cell.z - z) === 1 && !isSolid(cell.tile) &&
          !visited.has(`${cell.x},${cell.z}`)) queue.push({ ...game.chef, ...cell });
      }
    }
    expect(stations.every(({ x, z }) => [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
      .some((point) => visited.has(point.join(','))))).toBe(true);
  });

  it('Q03 keeps hands and occupied slots atomic across repeated transfers and chef switches', () => {
    const game = shift();
    face(game, 'B');
    game.interact();
    const bun = game.chef.held;
    game.interact();
    expect(game.costs).toBe(1);
    game.active = 1;
    expect(game.chef.held).toBeUndefined();
    game.active = 0;
    expect(game.chef.held).toBe(bun);
    face(game, 'A');
    game.interact();
    expect(game.slots.A.item).toBe(bun);
    expect(game.chef.held).toBeUndefined();
    face(game, 'P');
    game.interact();
    const second = game.chef.held;
    face(game, 'A');
    game.interact();
    expect(game.slots.A.item).toBe(bun);
    expect(game.chef.held).toBe(second);
  });

  it('Q05 classifies exact patty boundaries and freezes stove and service on pause', () => {
    expect([479, 480, 720, 721, 960, 961].map(pattyState))
      .toEqual(['cooking', 'perfect', 'perfect', 'overcooked', 'overcooked', 'burnt']);
    const game = shift();
    face(game, 'P');
    game.interact();
    face(game, 'G');
    game.interact();
    advance(game, 479);
    game.phase = 'paused';
    advance(game, 500);
    expect(game.tick).toBe(479);
    expect(game.slots.G.progress).toBe(479);
    game.phase = 'service';
    advance(game, 1);
    expect(game.slots.G.item).toEqual({ id: 'patty', state: 'perfect' });
  });

  it('Q04 rejects raw, burnt, extra and unmatched plates, and serves oldest matching order once', () => {
    const game = shift();
    face(game, 'S');
    const plate: Plate = { id: 'plate', dirty: false, food: [] };
    const classic = (state: string): Food[] => [{ id: 'bun', state: 'ready' }, { id: 'patty', state }];
    for (const food of [classic('raw'), classic('burnt'), [...classic('perfect'), { id: 'tomato', state: 'prepped' }]]) {
      plate.food = food;
      game.chef.held = plate;
      game.interact();
      expect(game.slots.S.item).toBe(plate);
      expect(game.served).toBe(0);
      game.interact();
    }
    game.orders.push({ ...game.orders[0]!, id: 99 });
    plate.food = classic('overcooked');
    game.interact();
    game.interact();
    expect(game.sales).toBe(12);
    expect(game.tips).toBe(2);
    expect(game.orders.map(({ id }) => id)).toEqual([99]);
    expect(game.returns[0]?.plate).toBe(plate);
  });

  it('Q15 preserves interrupted chopping and washing, Q16 preserves a discarded plate', () => {
    const game = shift();
    face(game, 'L');
    game.interact();
    face(game, 'K');
    game.interact();
    advance(game, hz, { operate: true });
    advance(game, hz);
    expect(game.slots.K.item).toEqual({ id: 'lettuce', state: 'raw' });
    advance(game, hz, { operate: true });
    expect(game.slots.K.item).toEqual({ id: 'lettuce', state: 'prepped' });
    const plate: Plate = { id: 'plate', dirty: true, food: [] };
    game.returns.push({ at: game.tick + 1, plate });
    face(game, 'W');
    advance(game, hz * 2, { operate: true });
    game.interact();
    expect(game.chef.held).toBeUndefined();
    advance(game, hz);
    advance(game, hz, { operate: true });
    game.interact();
    expect(game.chef.held).toBe(plate);
    expect(plate.dirty).toBe(false);
    plate.food.push({ id: 'bun', state: 'ready' });
    Object.assign(game.chef, { x: 2, z: 8, facing: { x: -1, z: 0 } });
    game.discard();
    expect(game.chef.held).toBe(plate);
    expect(isPlate(game.chef.held!) && plate.food).toEqual([]);
    expect(game.waste).toBe(1);
  });

  it('Q06 offers enough seeded orders to win and settles a completed shift only once', () => {
    const game = shift();
    for (let tick = 0; tick < 300 * hz; tick++) {
      const order = game.orders[0];
      if (order) {
        const recipe = pack.recipes.find(({ id }) => id === order.recipe)!;
        const food = recipe.requires.map((rule) => {
          const [id, states] = rule.split(':');
          return { id: id!, state: states!.split('|')[0]! };
        });
        game.chef.held = { id: 'plate', dirty: false, food };
        face(game, 'S');
        game.interact();
      }
      game.advance(still);
    }
    expect(game.phase).toBe('results');
    expect(game.served).toBeGreaterThanOrEqual(game.day.target);
    const cash = game.cash;
    expect(cash).toBe(100 + game.net);
    advance(game, 300);
    expect(game.cash).toBe(cash);
    expect(game.tick).toBe(300 * hz);
    const next = new Shift(pack, game.day.day + 1, game.seed, cash);
    expect(next.day.day).toBe(4);
    expect(next.cash).toBe(cash);
  });
});
