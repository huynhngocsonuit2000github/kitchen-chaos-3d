import type { parseContentPack } from '../content/pack';
import { cells, configuredStations, routeTo, stationFootprint, stationNames } from './layout';
import type { Placement, Point, StationId } from './layout';

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
type Slot = { item?: Item; progress: number };
type Chef = Point & { name: string; facing: Point; held?: Item; dashUntil: number; dashReady: number };
type Order = { id: number; recipe: string; deadline: number; seat?: number };
type Customer = { id: number; entered: number; seat?: number; eatingUntil?: number };
type ShiftOptions = { seating?: boolean; extraPlates?: boolean; recovery?: boolean; tutorial?: boolean; placements?: Placement[] };
export type Input = Point & { dash: boolean; operate: boolean };

export class Shift {
  readonly chefs: Chef[] = cells.filter(({ tile }) => tile === '1' || tile === '2').map(({ x, z, tile }) =>
    ({ x, z, name: tile === '1' ? 'Max' : 'Lina', facing: { x: 0, z: -1 }, dashUntil: 0, dashReady: 0 }));
  readonly slots = Object.fromEntries(Object.keys(stationNames).map((tile) => [tile, { progress: 0 }])) as Record<StationId, Slot>;
  readonly stations;
  private readonly obstacles;
  private readonly occupied;
  readonly orders: Order[] = [];
  readonly returns: { at: number; plate: Plate }[] = [];
  readonly dirtyQueue: Plate[] = [];
  readonly customers: Customer[] = [];
  arrivalsRejected = 0;
  readonly day;
  tick = 0;
  active = 0;
  working = false;
  staffTask?: { chef: number; station: 'K' | 'W'; path: Point[]; since: number };
  staffStatus = 'Idle';
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
  tutorialStep = 0;
  private sequence = 0;
  private visitor = 0;
  private randomState;

  constructor(readonly pack: Pack, day = 3, readonly seed = 42, readonly openingCash = pack.restaurant.startCash, readonly options: ShiftOptions = {}) {
    this.day = pack.restaurant.days[Math.min(day, pack.restaurant.days.length) - 1]!;
    this.stations = configuredStations(options.placements ?? []);
    this.obstacles = stationFootprint(options.placements ?? []);
    this.occupied = new Set(this.obstacles.map(({ x, z }) => `${x},${z}`));
    this.clean = pack.restaurant.plates + (options.extraPlates ? 2 : 0);
    this.randomState = seed >>> 0;
  }

  get chef() { return this.chefs[this.active]!; }
  get remaining() { return this.options.tutorial ? Infinity : Math.max(0, this.pack.restaurant.shiftSeconds - this.tick / hz); }
  get wages() { return this.options.recovery ? 0 : 15; }
  get net() { return this.sales + this.tips - this.costs - this.wages - 5; }
  get cash() {
    return this.openingCash + this.sales + this.tips - this.costs - (this.phase === 'results' ? this.wages + 5 : 0);
  }

  get target() {
    const { x, z, facing } = this.chef;
    return this.stations.map((station) => {
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
    if (this.options.tutorial) {
      if (this.served && this.slots.W.item && isPlate(this.slots.W.item) && !this.slots.W.item.dirty) this.tutorialStep = 2;
      else if (this.served && this.tutorialStep === 0) this.tutorialStep = 1;
    }
    if (this.remaining === 0) {
      this.missed += this.orders.length;
      this.orders.length = 0;
      this.customers.length = 0;
      this.phase = 'results';
      return;
    }

    for (let i = this.orders.length - 1; i >= 0; i--) {
      if (this.orders[i]!.deadline > this.tick) continue;
      const ticket = this.orders[i]!;
      if (ticket.seat !== undefined) {
        const customer = this.customers.findIndex(({ seat }) => seat === ticket.seat);
        if (customer >= 0) this.customers.splice(customer, 1);
      }
      this.orders.splice(i, 1);
      this.missed++;
      this.message = 'An order expired.';
    }
    if (this.tick >= this.nextOrder && this.remaining > 60) this.spawnOrder();
    while (this.returns[0] && this.returns[0].at <= this.tick) this.dirtyQueue.push(this.returns.shift()!.plate);
    this.updateCustomers();
    this.refillSink();
    this.move(input);
    for (const stove of [this.slots.G, this.slots.G2]) {
      if (stove.item && !isPlate(stove.item) && stove.item.state !== 'burnt') {
        stove.progress++;
        stove.item.state = pattyState(stove.progress);
      }
    }
    const target = input.operate ? this.target : undefined;
    this.working = (target === 'K' || target === 'K2' || target === 'W') && Boolean(this.slots[target].item);
    if (target === 'K' || target === 'K2' || target === 'W') this.work(target);
    this.advanceStaff();
  }

  switchChef() {
    this.active = 1 - this.active;
    if (this.options.tutorial && this.tutorialStep === 2) {
      this.tutorialStep = 3;
      this.phase = 'results';
    }
    if (this.staffTask?.chef === this.active) this.clearStaff('Manual control');
  }

  assignStaff(station: 'K' | 'W') {
    const chef = 1 - this.active;
    const destination = this.stations.find(({ tile }) => tile === station)!;
    const path = routeTo(this.chefs[chef]!, destination, this.occupied);
    if (!path || this.chefs[chef]!.held || !this.pendingWork(station)) {
      this.clearStaff('Task unavailable');
      return;
    }
    this.staffTask = { chef, station, path, since: this.tick };
    this.staffStatus = station === 'K' ? 'Preparing vegetables' : 'Washing plates';
  }

  private clearStaff(status: string) {
    this.staffTask = undefined;
    this.staffStatus = status;
  }

  private pendingWork(station: 'K' | 'W') {
    const item = this.slots[station].item;
    return item && (isPlate(item) ? item.dirty : item.state === 'raw');
  }

  private advanceStaff() {
    const task = this.staffTask;
    if (!task) return;
    if (this.tick - task.since > steps(12) || !this.pendingWork(task.station)) {
      this.clearStaff(this.pendingWork(task.station) ? 'Task timed out' : 'Task complete');
      return;
    }
    const chef = this.chefs[task.chef]!;
    const station = this.stations.find(({ tile }) => tile === task.station)!;
    const destination = task.path[0];
    if (destination) {
      const dx = destination.x - chef.x;
      const dz = destination.z - chef.z;
      const length = Math.hypot(dx, dz);
      if (length <= 3 / hz) {
        Object.assign(chef, destination);
        task.path.shift();
      } else {
        chef.facing = { x: dx / length, z: dz / length };
        chef.x += chef.facing.x * 3 / hz;
        chef.z += chef.facing.z * 3 / hz;
      }
    } else {
      const dx = station.x - chef.x;
      const dz = station.z - chef.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 1.25 || distance === 0) {
        this.clearStaff('Station out of reach');
        return;
      }
      chef.facing = { x: dx / distance, z: dz / distance };
      if (!(this.working && this.target === task.station)) this.work(task.station);
    }
  }

  private spawnOrder() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    this.nextOrder = this.options.tutorial ? Infinity : this.tick + steps(18 + this.randomState % 8);
    if (!this.options.seating) {
      this.openTicket();
      return;
    }
    if (this.customers.filter(({ seat }) => seat === undefined).length >= 3) {
      this.arrivalsRejected++;
      return;
    }
    this.customers.push({ id: ++this.visitor, entered: this.tick });
    this.updateCustomers();
  }

  private updateCustomers() {
    if (!this.options.seating) return;
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const { seat, entered, eatingUntil } = this.customers[i]!;
      if (eatingUntil !== undefined && eatingUntil <= this.tick) this.customers.splice(i, 1);
      else if (seat === undefined && this.tick - entered >= steps(60)) {
        this.customers.splice(i, 1);
        this.missed++;
      }
    }
    if (this.remaining <= 60) return;
    for (const seat of [0, 1]) {
      if (this.customers.some((customer) => customer.seat === seat)) continue;
      const waiting = this.customers.find((customer) => customer.seat === undefined);
      if (!waiting) break;
      waiting.seat = seat;
      this.openTicket(seat);
    }
  }

  private openTicket(seat?: number) {
    const recipes = this.day.recipes;
    const offset = this.seed % recipes.length;
    this.orders.push({ id: ++this.sequence, recipe: recipes[(this.sequence - 1 + offset) % recipes.length]!,
      deadline: this.options.tutorial ? Infinity : this.tick + steps(60), seat });
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
    const free = (x: number, z: number) => !this.obstacles.some((cell) =>
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

  private work(target: 'K' | 'K2' | 'W') {
    const slot = this.slots[target];
    const item = slot.item;
    if (!item) return;
    if ((target === 'K' || target === 'K2') && !isPlate(item) && item.state === 'raw') {
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
      if ((target === 'G' || target === 'G2') && !isPlate(slot.item) && slot.item.state === 'cooking') slot.item.state = 'raw';
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
      if ((target === 'G' || target === 'G2') && !isPlate(held)) held.state = 'cooking';
      if (target === 'S' && isPlate(held)) this.serve(held);
    } else {
      this.message = target === 'X' ? 'Press Space to discard food.' : 'That transfer is unavailable.';
    }
  }

  private accepts(target: StationId, item: Item) {
    if (target === 'G' || target === 'G2') return item.id === 'patty' && !isPlate(item) && item.state === 'raw';
    if (target === 'K' || target === 'K2') return item.id === 'lettuce' || item.id === 'tomato';
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
    const tip = this.options.tutorial ? 0 : Math.ceil(4 * (order.deadline - this.tick) / steps(60));
    this.tips += plate.food.some(({ state }) => state === 'overcooked') ? Math.floor(tip / 2) : tip;
    plate.food = [];
    plate.dirty = true;
    this.slots.S.item = undefined;
    const at = this.tick + steps(8);
    const customer = this.customers.find(({ seat }) => order.seat !== undefined && seat === order.seat);
    if (customer) customer.eatingUntil = at;
    this.returns.push({ at, plate });
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
