import { createKitchen } from '../rendering/graybox';
import { stationNames } from './layout';
import { hz, isPlate, Shift } from './shift';
import type { Item, Pack } from './shift';

const capitalize = (value: string) => value[0]!.toUpperCase() + value.slice(1);
const describe = (item?: Item) => {
  if (!item) return 'Empty hands';
  if (isPlate(item)) return item.dirty ? 'Dirty plate' :
    item.food.length ? `Plate · ${item.food.map(({ id, state }) => id === 'patty' ? `${state} patty` : id).join(' + ')}` : 'Clean plate';
  return item.state === 'ready' ? capitalize(item.id) : `${capitalize(item.state)} ${item.id}`;
};
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const fragments = [ 'WASD Move', 'Shift Dash', 'E Pick / place', 'Space Work', 'Q Switch', 'Tab Tickets', 'Esc Pause' ];

export function mountGame(pack: Pack) {
  const game = document.createElement('section');
  game.id = 'game';
  game.className = 'game';
  game.innerHTML = `
    <div class="hud">
      <section aria-label="Order tickets"><h2>Order rail</h2><ol id="tickets"></ol></section>
      <section class="clock" aria-label="Shift"><h2>Shift clock</h2><strong id="clock"></strong></section>
      <section class="score" aria-label="Score"><h2>Service</h2><strong id="score"></strong><span id="cash"></span></section>
    </div>
    <div id="stage" class="stage" tabindex="-1">
      <div id="labels" aria-hidden="true"></div>
      <div class="compass" aria-hidden="true"><span>W</span><span>A</span><span>D</span><span>S</span></div>
    </div>
    <div class="service-strip">
      <section><h2 id="chef"></h2><p id="hands"></p></section>
      <section><h2 id="station"></h2><p id="instruction"></p></section>
      <section><h2 id="equipment"></h2><p id="feedback" role="status"></p></section>
    </div>
    <div class="keys">${fragments.map((key) => `<span>${key}</span>`).join('')}</div>
    <dialog id="overlay" aria-labelledby="overlay-title">
      <h2 id="overlay-title"></h2><div id="overlay-copy"></div>
      <div class="buttons"><button id="primary"></button><button id="secondary" class="secondary"></button></div>
    </dialog>`;
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => game.querySelector<E>(`#${id}`)!;
  const stage = $('stage');
  const paint = createKitchen(stage, $('labels'));
  document.querySelector('#build')!.before(game);

  let shift = new Shift(pack);
  let expanded = false;
  let confirming = false;
  let lastPhase: string | undefined;
  const keys = new Set<string>();
  let dash = false;
  let previous = 0;
  let accumulator = 0;
  const dialog = $<HTMLDialogElement>('overlay');
  const primary = $<HTMLButtonElement>('primary');
  const secondary = $<HTMLButtonElement>('secondary');

  function overlay() {
    const phase = shift.phase;
    if (phase === 'service') {
      if (dialog.open) dialog.close();
      stage.focus();
      return;
    }
    let title = 'Open Burger Town';
    let body = `<p>Collect a clean plate from the rack and build each burger at the assembly counter. Cook patties for 8–12 seconds and hold Space to chop vegetables or wash plates.</p>
      <p>Deliver ${shift.day.target} orders to the serving hatch in ${pack.restaurant.shiftSeconds / 60} minutes.</p>`;
    primary.textContent = 'Start shift';
    secondary.hidden = true;
    if (phase === 'paused') {
      title = confirming ? 'Restart this shift?' : 'Shift paused';
      body = confirming ? '<p>Restarting resets your current orders, cash and kitchen.</p>' : '<p>The shift clock and station timers are paused.</p>';
      primary.textContent = confirming ? 'Confirm restart' : 'Resume shift';
      secondary.textContent = confirming ? 'Back' : 'Restart shift';
      secondary.hidden = false;
    } else if (phase === 'results') {
      const won = shift.served >= shift.day.target;
      title = won ? 'Target reached' : 'Target missed';
      body = `<p>Served <strong>${shift.served} / ${shift.day.target}</strong> · Missed ${shift.missed} · Waste ${shift.waste}</p>
        <dl class="receipt"><dt>Sales</dt><dd>$${shift.sales}</dd><dt>Tips</dt><dd>$${shift.tips}</dd>
        <dt>Ingredients</dt><dd>−$${shift.costs}</dd><dt>Wages</dt><dd>−$15</dd>
        <dt>Overhead</dt><dd>−$5</dd><dt>Net</dt><dd>${shift.net < 0 ? '−' : ''}$${Math.abs(shift.net)}</dd>
        <dt>Final cash</dt><dd>$${shift.cash}</dd></dl>`;
      primary.textContent = won ? 'Next day' : 'Retry shift';
      secondary.textContent = 'Return to start';
      secondary.hidden = false;
    }
    $('overlay-title').textContent = title;
    $('overlay-copy').innerHTML = phase === 'paused' ? body :
      `${body}<p class="version">Graybox preview · ${__BUILD_VERSION__} · ${__BUILD_SHA__.slice(0, 12)}</p>`;
    if (!dialog.open) dialog.showModal();
    primary.focus();
  }

  const setText = (id: string, value: string) => {
    const element = $(id);
    if (element.textContent !== value) element.textContent = value;
  };
  let lastTickets = '';
  function drawHud() {
    if (lastPhase !== shift.phase) {
      lastPhase = shift.phase;
      overlay();
    }
    const tickets = shift.orders.slice(0, expanded ? undefined : 3).map(({ recipe, deadline, id }) => {
      const seconds = Math.ceil((deadline - shift.tick) / hz);
      const { requires } = pack.recipes.find((item) => item.id === recipe)!;
      const names = requires.map((rule) => rule.split(':')[0]).join(' · ');
      return `<li class="${seconds <= 15 ? 'urgent' : ''}"><span class="ticket-name">${capitalize(recipe)} <small>#${id}</small></span><small>${names}</small><span class="patience">${seconds}s</span></li>`;
    }).join('');
    const ticketHtml = tickets || '<li class="no-tickets">No pending tickets</li>';
    if (ticketHtml !== lastTickets) {
      $('tickets').innerHTML = ticketHtml;
      lastTickets = ticketHtml;
    }
    setText('clock', clock(Math.ceil(shift.remaining)));
    setText('score', `${shift.served} / ${shift.day.target} served`);
    setText('cash', `$${shift.cash} cash`);
    setText('chef', shift.chef.name);
    setText('hands', describe(shift.chef.held));
    const target = shift.target;
    setText('station', target ? stationNames[target] : 'Face a station');
    const instructions = {
      G: 'E place / pick up patty', K: 'E place vegetable · hold Space to chop',
      W: 'Hold Space to wash · E collect', S: 'E deliver a finished plate',
      A: 'E place plate or add ingredient', R: `E collect / return · ${shift.clean} clean plates`,
      X: 'Space discard food', B: 'E collect bun', P: 'E collect patty', M: 'E collect tomato',
      C: 'E collect cheese', L: 'E collect lettuce',
    };
    setText('instruction', target ? instructions[target] : 'Move toward it to see available actions.');
    const stove = shift.slots.G;
    const utility = target === 'K' || target === 'W' ? shift.slots[target] : undefined;
    const work = utility?.item ? ` · ${describe(utility.item)} ${Math.floor(utility.progress * 100 / (hz * (target === 'K' ? 2 : 3)))}%` : '';
    setText('equipment', stove.item ? `Stove · ${describe(stove.item)} · ${(stove.progress / hz).toFixed(1)}s${work}` : `Stove empty${work}`);
    setText('feedback', shift.message);
  }

  function pause() {
    keys.clear();
    dash = false;
    accumulator = 0;
    if (shift.phase === 'service') shift.phase = 'paused';
    drawHud();
  }

  function restart(nextDay = false, start = true) {
    const settled = shift.phase === 'results';
    shift = new Shift(pack, nextDay ? shift.day.day + 1 : start ? shift.day.day : 3,
      shift.seed, settled && start ? shift.cash : start ? shift.openingCash : pack.restaurant.startCash);
    confirming = false;
    expanded = false;
    keys.clear();
    dash = false;
    accumulator = 0;
    if (start) shift.start();
    if (settled || !start) lastPhase = undefined;
    drawHud();
  }

  primary.addEventListener('click', () => {
    if (shift.phase === 'ready') shift.start();
    else if (shift.phase === 'paused') {
      if (confirming) restart();
      else shift.phase = 'service';
    } else if (shift.phase === 'results') restart(shift.served >= shift.day.target);
    drawHud();
  });
  secondary.addEventListener('click', () => {
    if (shift.phase === 'results') restart(false, false);
    else if (shift.phase === 'paused') {
      confirming = !confirming;
      overlay();
    }
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (shift.phase === 'paused') {
      if (confirming) {
        confirming = false;
        overlay();
      } else {
        shift.phase = 'service';
        drawHud();
      }
    }
  });
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('keydown', (event) => {
    if (shift.phase !== 'service' || !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ',
      'Space', 'ShiftLeft', 'ShiftRight', 'Tab', 'Escape'].includes(event.code)) return;
    event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'KeyE') shift.interact();
    if (event.code === 'KeyQ') {
      shift.active = 1 - shift.active;
      keys.delete('Space');
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') dash = true;
    if (event.code === 'Space') shift.discard();
    if (event.code === 'Tab') expanded = !expanded;
    if (event.code === 'Escape') pause();
    drawHud();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  function frame(now: number) {
    const elapsed = Math.max(0, Math.min((now - previous) / 1000, .1));
    previous = now;
    if (shift.phase === 'service') accumulator += elapsed * hz;
    while (accumulator >= 1 - 1e-8) {
      shift.advance({
        x: Number(keys.has('KeyD')) - Number(keys.has('KeyA')),
        z: Number(keys.has('KeyS')) - Number(keys.has('KeyW')),
        dash,
        operate: keys.has('Space'),
      });
      dash = false;
      accumulator = Math.max(0, accumulator - 1);
    }
    drawHud();
    paint(shift);
    requestAnimationFrame(frame);
  }
  drawHud();
  requestAnimationFrame(frame);
  return primary;
}
