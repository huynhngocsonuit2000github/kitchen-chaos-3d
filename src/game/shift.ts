import type { parseContentPack } from '../content/pack';
import { cells, isSolid, stations } from './layout';
import type { Point, StationId } from './layout';

export type Pack = ReturnType<typeof parseContentPack>;
export type Food = { id: string; state: string };
export type Plate = { id: 'plate'; dirty: boolean; food: Food[] };
export type Item = Food | Plate;
export const isPlate = (item: Item): item is Plate => 'food' in item;
const newPlate = (): Plate => ({ id: 'plate', dirty: false, food: [] });
const bins: Partial<Record<StationId, string>> = {
  B: 'bun', P: 'patty', M: 'tomato', C: 'cheese', L: 'lettuce',
};

export const hz = 60;
const steps = (seconds: number) => seconds * hz;
export const pattyState = (ticks: number) =>
  ticks > steps(16) ? 'burnt' : ticks > steps(12) ? 'overcooked' : ticks >= steps(8) ? 'perfect' : 'cooking';
const obstacles = cells.filter(({ tile }) => isSolid(tile));
type Slot = { item?: Item; progress: number };
type Chef = Point & { name: string; facing: Point; held?: Item; dashUntil: number; dashReady: number };
type Order = { id: number; recipe: string; deadline: number };
export type Input = Point & { dash: boolean; operate: boolean };

export class Shift {
  readonly chefs: Chef[] = cells.filter(({ tile }) => tile === '1' || tile === '2').map(({ x, z, tile }) =>
    ({ x, z, name: tile === '1' ? 'Max' : 'Lina', facing: { x: 0, z: -1 }, dashUntil: 0, dashReady: 0 }));
  readonly slots = Object.fromEntries(stations.map(({ tile }) => [tile, { progress: 0 }])) as Record<StationId, Slot>;
  readonly orders: Order[] = [];
  readonly returns: { at: number; plate: Plate }[] = [];
  readonly dirtyQueue: Plate[] = [];
  readonly day;
  tick = 0;
  active = 0;
  clean;
  served = 0;
  missed = 0;
  waste = 0;
  sales = 0;
  tips = 0;
  costs = 0;
  phase: 'ready' | 'service' | 'paused' | 'results' = 'ready';
  message = 'Collect ingredients and serve burgers before tickets expire.';
  private nextOrder = 0;
  private sequence = 0;
  private randomState;

  constructor(readonly pack: Pack, day = 3, readonly seed = 42, readonly openingCash = pack.restaurant.startCash) {
    this.day = pack.restaurant.days[Math.min(day, pack.restaurant.days.length) - 1]!;
    this.clean = pack.restaurant.plates;
    this.randomState = seed >>> 0;
  }

  get chef() { return this.chefs[this.active]!; }
  get remaining() { return Math.max(0, this.pack.restaurant.shiftSeconds - this.tick / hz); }
  get net() { return this.sales + this.tips - this.costs - 15 - 5; }
  get cash() {
    return this.openingCash + this.sales + this.tips - this.costs - (this.phase === 'results' ? 20 : 0);
  }

  get target() {
    const { x, z, facing } = this.chef;
    return stations.map((station) => {
      const dx = station.x - x;
      const dz = station.z - z;
      return { ...station, distance: Math.hypot(dx, dz), forward: dx * facing.x + dz * facing.z };
    }).filter(({ distance, forward }) => distance <= 1.25 && forward >= distance * 0.5)
      .sort((a, b) => a.distance - b.distance || a.tile.localeCompare(b.tile))[0]?.tile;
  }

  start() {
    if (this.phase !== 'ready') return;
    this.phase = 'service';
    this.spawnOrder();
  }

  advance(input: Input) {
    if (this.phase !== 'service') return;
    this.tick++;
    if (this.remaining === 0) {
      this.missed += this.orders.length;
      this.orders.length = 0;
      this.phase = 'results';
      return;
    }

    for (let i = this.orders.length - 1; i >= 0; i--) {
      if (this.orders[i]!.deadline > this.tick) continue;
      this.orders.splice(i, 1);
      this.missed++;
      this.message = 'An order expired.';
    }
    if (this.tick >= this.nextOrder && this.remaining > 60) this.spawnOrder();
    while (this.returns[0] && this.returns[0].at <= this.tick) this.dirtyQueue.push(this.returns.shift()!.plate);
    this.refillSink();
    this.move(input);
    const stove = this.slots.G;
    if (stove.item && !isPlate(stove.item) && stove.item.state !== 'burnt') {
      stove.progress++;
      stove.item.state = pattyState(stove.progress);
    }
    const target = input.operate ? this.target : undefined;
    if (target === 'K' || target === 'W') this.work(target);
  }

  private spawnOrder() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    this.nextOrder = this.tick + steps(18 + this.randomState % 8);
    const recipes = this.day.recipes;
    const offset = this.seed % recipes.length;
    this.orders.push({ id: ++this.sequence, recipe: recipes[(this.sequence - 1 + offset) % recipes.length]!,
      deadline: this.tick + steps(60) });
  }

  private move(input: Input) {
    const chef = this.chef;
    const length = Math.hypot(input.x, input.z);
    if (!length) return;
    chef.facing = { x: input.x / length, z: input.z / length };
    if (input.dash && this.tick >= chef.dashReady) {
      chef.dashUntil = this.tick + steps(0.25);
      chef.dashReady = this.tick + steps(0.75);
    }
    const stride = (this.tick < chef.dashUntil ? 4.5 : 3) / hz;
    const free = (x: number, z: number) => !obstacles.some((cell) =>
      Math.abs(cell.x - x) < 0.8 && Math.abs(cell.z - z) < 0.8);
    const x = chef.x + chef.facing.x * stride;
    if (free(x, chef.z)) chef.x = x;
    const z = chef.z + chef.facing.z * stride;
    if (free(chef.x, z)) chef.z = z;
  }

  private refillSink() {
    if (!this.slots.W.item && this.dirtyQueue.length) {
      this.slots.W.item = this.dirtyQueue.shift();
      this.slots.W.progress = 0;
    }
  }

  private work(target: 'K' | 'W') {
    const slot = this.slots[target];
    const item = slot.item;
    if (!item) return;
    if (target === 'K' && !isPlate(item) && item.state === 'raw') {
      if (++slot.progress === steps(2)) {
        item.state = 'prepped';
        this.message = 'Vegetable prepped.';
      }
    }
    if (target === 'W' && isPlate(item) && item.dirty && ++slot.progress === steps(3)) {
      item.dirty = false;
      this.message = 'Plate clean.';
    }
  }

  interact() {
    if (this.phase !== 'service') return;
    const target = this.target;
    if (!target) { this.message = 'Face a nearby station.'; return; }
    const chef = this.chef;
    const held = chef.held;
    const slot = this.slots[target];
    const ingredient = this.pack.ingredients.find(({ id }) => id === bins[target]);
    if (ingredient && !held) {
      chef.held = { id: ingredient.id, state: ingredient.states[0]! };
      this.costs += ingredient.cost;
      this.message = 'Ingredient collected.';
    } else if (target === 'R' && !held && this.clean > 0) {
      this.clean--;
      chef.held = newPlate();
      this.message = 'Clean plate collected.';
    } else if (target === 'R' && held && isPlate(held) && !held.dirty && !held.food.length) {
      this.clean++;
      chef.held = undefined;
      this.message = 'Plate returned to rack.';
    } else if (!held && slot.item) {
      if (target === 'W' && isPlate(slot.item) && slot.item.dirty) {
        this.message = 'Hold Space to wash the plate first.';
        return;
      }
      if (target === 'G' && !isPlate(slot.item) && slot.item.state === 'cooking') slot.item.state = 'raw';
      chef.held = slot.item;
      slot.item = undefined;
      slot.progress = 0;
      this.message = 'Item picked up.';
      this.refillSink();
    } else if (held && target === 'A' && slot.item && this.assemble(held, slot.item)) {
      this.message = 'Ingredient added to plate.';
    } else if (held && !slot.item && this.accepts(target, held)) {
      slot.item = held;
      slot.progress = 0;
      chef.held = undefined;
      this.message = 'Item placed.';
      if (target === 'G' && !isPlate(held)) held.state = 'cooking';
      if (target === 'S' && isPlate(held)) this.serve(held);
    } else {
      this.message = target === 'X' ? 'Press Space to discard food.' : 'That transfer is unavailable.';
    }
  }

  private accepts(target: StationId, item: Item) {
    if (target === 'G') return item.id === 'patty' && !isPlate(item) && item.state === 'raw';
    if (target === 'K') return item.id === 'lettuce' || item.id === 'tomato';
    if (target === 'W') return isPlate(item) && item.dirty;
    if (target === 'S') return isPlate(item) && !item.dirty;
    return target === 'A';
  }

  private assemble(held: Item, placed: Item) {
    const plate = isPlate(held) ? held : placed;
    const food = plate === held ? placed : held;
    if (!isPlate(plate) || plate.dirty || isPlate(food) || plate.food.some(({ id }) => id === food.id)) return false;
    plate.food.push(food);
    if (plate === held) this.slots.A.item = undefined;
    else this.chef.held = undefined;
    return true;
  }

  private serve(plate: Plate) {
    const order = this.orders.find((ticket) => {
      const recipe = this.pack.recipes.find(({ id }) => id === ticket.recipe)!;
      return recipe.requires.length === plate.food.length && recipe.requires.every((rule) => {
        const [id, states] = rule.split(':');
        return plate.food.some((food) => food.id === id && states!.split('|').includes(food.state));
      });
    });
    if (!order) { this.message = 'Dish rejected · check the ticket and ingredient states.'; return; }

    const recipe = this.pack.recipes.find(({ id }) => id === order.recipe)!;
    this.orders.splice(this.orders.indexOf(order), 1);
    this.served++;
    this.sales += recipe.price;
    const tip = Math.ceil(4 * (order.deadline - this.tick) / steps(60));
    this.tips += plate.food.some(({ state }) => state === 'overcooked') ? Math.floor(tip / 2) : tip;
    plate.food = [];
    plate.dirty = true;
    this.slots.S.item = undefined;
    this.returns.push({ at: this.tick + steps(8), plate });
    this.message = `${recipe.id[0]!.toUpperCase()}${recipe.id.slice(1)} served · +$${recipe.price} sale.`;
  }

  discard() {
    const held = this.chef.held;
    if (this.phase !== 'service' || this.target !== 'X' || !held) return;
    if (isPlate(held)) {
      this.waste += held.food.length;
      held.food = [];
    } else {
      this.waste++;
      this.chef.held = undefined;
    }
    this.message = 'Food discarded.';
  }
}
