import { ingredientIcon, orderIcon } from './food-icons';
import { createKitchen } from '../rendering/kitchen';
import { createAudio } from './audio';
import { loadCareer, saveCareer } from './career';
import { movable, stationNames, validLayout } from './layout';
import type { Placement, StationId } from './layout';
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

export async function mountGame(pack: Pack) {
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
      <section><h2 id="chef"></h2><p id="hands"></p><p id="staff-status"></p></section>
      <section><h2 id="station"></h2><p id="instruction"></p></section>
      <section><h2 id="equipment"></h2><p id="feedback" role="status"></p></section>
    </div>
    <div class="keys">${fragments.map((key) => `<span>${key}</span>`).join('')}<button id="sound" type="button" aria-pressed="false">Mute sound</button></div>
    <dialog id="overlay" aria-labelledby="overlay-title">
      <h2 id="overlay-title"></h2><div id="overlay-copy"></div>
      <details id="settings"><summary>Settings</summary>
        <label>Master volume <input type="range" data-audio="master" min="0" max="1" step=".01" value=".72"></label>
        <label>Music volume <input type="range" data-audio="music" min="0" max="1" step=".01" value=".28"></label>
        <label>Effects volume <input type="range" data-audio="sfx" min="0" max="1" step=".01" value=".65"></label>
        <label><input type="checkbox" id="low-quality"> Low graphics</label>
      </details>
      <div class="buttons"><button id="career" class="secondary">Career</button><button id="primary"></button><button id="secondary" class="secondary"></button></div>
    </dialog>`;
  const $ = <E extends HTMLElement = HTMLElement>(id: string) => game.querySelector<E>(`#${id}`)!;
  const stage = $('stage');
  const paint = await createKitchen(stage, $('labels'));
  document.querySelector('#build')!.before(game);

  let shift = new Shift(pack);
  const loaded = loadCareer(pack);
  let career = loaded.career;
  let careerMode = false;
  let tutorial = false;
  let saveNotice = loaded.recovered ? 'Career save recovered from backup or restored to opening defaults.' : '';
  let layoutPreview: { position: Placement; valid: boolean } | undefined;
  let previousLayout: typeof career | undefined;
  let managedResult: Shift | undefined;
  const audio = createAudio();
  for (const input of game.querySelectorAll<HTMLInputElement>('[data-audio]')) {
    input.addEventListener('input', () => {
      audio.levels[input.dataset.audio as keyof typeof audio.levels] = input.valueAsNumber;
      audio.levelsChanged();
    });
  }
  const graphics = $<HTMLInputElement>('low-quality');
  const sound = $<HTMLButtonElement>('sound');
  sound.addEventListener('click', () => {
    audio.muted = !audio.muted;
    sound.textContent = audio.muted ? 'Unmute sound' : 'Mute sound';
    sound.setAttribute('aria-pressed', String(audio.muted));
    if (!audio.muted && shift.phase === 'service') audio.unlock();
  });
  let previousCueShift: Shift | undefined;
  let previousCue = { served: 0, orders: 0, food: '', message: '' };
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

  const careerButton = $<HTMLButtonElement>('career');
  const rack = pack.upgrades.find(({ id }) => id === 'plate-rack');
  function careerShift() {
    return new Shift(pack, career.day, 41 + career.day, career.cash, {
      seating: true, extraPlates: career.extraPlates, recovery: career.cash <= 0, placements: career.placements,
    });
  }

  function overlay() {
    const phase = shift.phase;
    layoutPreview = undefined;
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
    careerButton.hidden = phase !== 'ready';
    careerButton.textContent = careerMode ? 'Quick shift' : 'Career';
    if (phase === 'ready' && careerMode) {
      title = `Burger Town · Day ${career.day}`;
      const menu = shift.day.recipes.map(capitalize).join(', ');
      body = `<p>Cash <strong>$${career.cash}</strong> · Reputation <strong>${career.reputation}</strong></p>
        <p>Today's menu: ${menu}. Serve ${shift.day.target} orders before closing.</p>
        <p>Plate rack: ${shift.clean} plates.</p>
        ${career.day === 1 ? '<button id="tutorial" class="secondary" type="button">Practice first</button>' : ''}
        ${rack && !career.extraPlates ? `<button id="buy-rack" type="button" ${career.cash < rack.cost ? 'disabled' : ''}>Add two plates · $${rack.cost}</button>` : ''}
        <form id="build-layout"><label>Equipment <select name="tile">
          ${[...movable, 'K2', 'G2'].map((tile) => `<option value="${tile}">${stationNames[tile as StationId]}</option>`).join('')}
        </select></label>
        <label>Column <input type="number" name="x" min="1" max="7" value="6" required></label>
        <label>Row <input type="number" name="z" min="2" max="8" value="5" required></label>
        <output id="placement-cost"></output><button type="submit">Confirm placement</button>
        ${previousLayout ? '<button id="undo-layout" type="button" class="secondary">Undo placement</button>' : ''}
        </form><p id="save-notice" role="status"></p>`;
    }
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
        <dt>Ingredients</dt><dd>−$${shift.costs}</dd><dt>Wages</dt><dd>−$${shift.wages}</dd>
        <dt>Overhead</dt><dd>−$5</dd><dt>Net</dt><dd>${shift.net < 0 ? '−' : ''}$${Math.abs(shift.net)}</dd>
        <dt>Final cash</dt><dd>$${shift.cash}</dd></dl>`;
      primary.textContent = careerMode ? (won ? 'Continue career' : 'Plan retry') : won ? 'Next day' : 'Retry shift';
      secondary.textContent = 'Return to start';
      secondary.hidden = false;
    }
    if (phase === 'results' && tutorial) {
      title = 'Practice complete';
      body = '<p>You served a Classic, washed its plate and switched chefs. Day 1 is ready.</p>';
      primary.textContent = 'Back to planning';
      secondary.hidden = true;
    }
    $('overlay-title').textContent = title;
    $('overlay-copy').innerHTML = phase === 'paused' ? body :
      `${body}<p class="version">M2 work in progress · ${__BUILD_VERSION__} · ${__BUILD_SHA__.slice(0, 12)}</p>`;
    game.querySelector('#save-notice')?.append(document.createTextNode(saveNotice));
    game.querySelector('#tutorial')?.addEventListener('click', () => {
      audio.unlock();
      tutorial = true;
      shift = new Shift(pack, 1, 42, career.cash, { tutorial: true });
      shift.start();
      drawHud();
    });
    game.querySelector('#buy-rack')?.addEventListener('click', () => {
      if (!rack || career.extraPlates || career.cash < rack.cost) return;
      const next = { ...career, cash: career.cash - rack.cost, extraPlates: true };
      if (!saveCareer(next, pack)) {
        saveNotice = 'Could not save the purchase. Your cash has been preserved.';
        overlay();
        return;
      }
      career = next;
      previousLayout = undefined;
      shift = careerShift();
      saveNotice = 'Plate rack upgraded.';
      overlay();
    });
    const form = game.querySelector<HTMLFormElement>('#build-layout');
    if (form) {
      const getPlacement = () => {
        const data = new FormData(form);
        const tile = String(data.get('tile')) as StationId;
        const position: Placement = { tile, x: Number(data.get('x')), z: Number(data.get('z')) };
        const prior = career.placements.find((item) => item.tile === tile);
        const purchase = tile === 'G2' ? 'second-stove' : tile === 'K2' ? 'second-board' : '';
        const cost = prior ? 0 : pack.upgrades.find(({ id }) => id === purchase)?.cost ?? 0;
        const placements = [...career.placements.filter((item) => item.tile !== tile), position];
        return { position, placements, cost, valid: validLayout(placements) };
      };
      const preview = () => {
        const { position, valid, cost } = getPlacement();
        const affordable = career.cash >= cost;
        layoutPreview = Number.isFinite(position.x) && Number.isFinite(position.z) ? { position, valid: valid && affordable } : undefined;
        game.querySelector('#placement-cost')!.textContent = !valid ? 'Blocked placement' :
          !affordable ? `Need $${cost}` : cost ? `Cost $${cost} · $${career.cash - cost} remaining` : 'Placement available';
        form.querySelector<HTMLButtonElement>('[type=submit]')!.disabled = !valid || !affordable;
      };
      form.addEventListener('input', preview);
      preview();
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const { placements, cost, valid } = getPlacement();
        if (!valid || career.cash < cost) return;
        const next = { ...career, placements, cash: career.cash - cost };
        if (!saveCareer(next, pack)) {
          setText('save-notice', 'Could not save placement. Your cash has been preserved.');
          return;
        }
        previousLayout = career;
        career = next;
        shift = careerShift();
        saveNotice = 'Placement saved.';
        overlay();
      });
      game.querySelector('#undo-layout')?.addEventListener('click', () => {
        if (!previousLayout) return;
        if (!saveCareer(previousLayout, pack)) {
          setText('save-notice', 'Could not save the undo.');
          return;
        }
        career = previousLayout;
        previousLayout = undefined;
        shift = careerShift();
        saveNotice = 'Placement undone.';
        overlay();
      });
    }
    dialog.classList.toggle('planning', phase === 'ready' && careerMode);
    if (!dialog.open) dialog.showModal();
    primary.focus();
  }

  const setText = (id: string, value: string) => {
    const element = $(id);
    if (element.textContent !== value) element.textContent = value;
  };
  let lastTickets = '';
  function drawHud() {
    if (careerMode && !tutorial && shift.phase === 'results' && managedResult !== shift) {
      managedResult = shift;
      previousLayout = undefined;
      const won = shift.served >= shift.day.target;
      career = {
        ...career, cash: shift.cash,
        day: Math.min(career.day + Number(won), pack.restaurant.days.length),
        reputation: Math.max(0, career.reputation + (won ? 1 : -1)),
      };
      saveNotice = saveCareer(career, pack) ? '' : 'The browser could not save this career.';
    }
    const stoveItem = shift.slots.G.item;
    const currentCue = {
      served: shift.served, orders: shift.orders.length,
      food: stoveItem && !isPlate(stoveItem) ? stoveItem.state : '', message: shift.message,
    };
    if (shift.phase === 'service' && previousCueShift === shift) {
      if (currentCue.served > previousCue.served) audio.cue('serve');
      else if (currentCue.food !== previousCue.food && currentCue.food === 'perfect') audio.cue('ready');
      else if (currentCue.food !== previousCue.food && ['overcooked', 'burnt'].includes(currentCue.food)) audio.cue('warn');
      else if (currentCue.orders > previousCue.orders) audio.cue('order');
      else if (currentCue.message !== previousCue.message && /picked up|collected/.test(currentCue.message)) audio.cue('pickup');
      else if (currentCue.message !== previousCue.message && /placed|added/.test(currentCue.message)) audio.cue('place');
      else if (currentCue.message !== previousCue.message && /rejected|unavailable/.test(currentCue.message)) audio.cue('warn');
    }
    previousCueShift = shift;
    previousCue = currentCue;
    if (lastPhase !== shift.phase) {
      if (shift.phase === 'results') audio.pause();
      lastPhase = shift.phase;
      overlay();
    }
    const tickets = shift.orders.slice(0, expanded ? undefined : 3).map(({ recipe, deadline, id }) => {
      const seconds = tutorial ? 60 : Math.ceil((deadline - shift.tick) / hz);
      const { requires } = pack.recipes.find((item) => item.id === recipe)!;
      const ingredients = requires.map((rule) => rule.split(':')[0]!);
      const names = ingredients.join(' · ');
      const icons = ingredients.map(ingredientIcon).join('');
      return `<li class="${seconds <= 15 ? 'urgent' : ''}">${orderIcon(recipe)}<span class="ticket-name">${capitalize(recipe)} <small>#${id}</small></span><span class="ticket-ingredients"><span class="sr-only">${names}</span>${icons}</span><span class="patience">${tutorial ? 'Practice' : `${seconds}s`}</span><span class="ticket-meter" aria-hidden="true" style="--time:${Math.min(100, Math.max(0, seconds * 100 / 60))}%"></span></li>`;
    }).join('');
    const ticketHtml = tickets || '<li class="no-tickets">No pending tickets</li>';
    if (ticketHtml !== lastTickets) {
      $('tickets').innerHTML = ticketHtml;
      lastTickets = ticketHtml;
    }
    setText('clock', tutorial ? 'Practice' : clock(Math.ceil(shift.remaining)));
    setText('score', `${shift.served} / ${tutorial ? 1 : shift.day.target} served`);
    setText('cash', `$${shift.cash} cash`);
    setText('chef', shift.chef.name);
    setText('hands', describe(shift.chef.held));
    setText('staff-status', careerMode ? `Partner · ${shift.staffStatus} · 1 Prep / 2 Wash` : '');
    const target = shift.target;
    setText('station', target ? stationNames[target] : 'Face a station');
    const instructions = {
      G: 'E place / pick up patty', K: 'E place vegetable · hold Space to chop',
      G2: 'E place / pick up patty', K2: 'E place vegetable · hold Space to chop',
      W: 'Hold Space to wash · E collect', S: 'E deliver a finished plate',
      A: 'E place plate or add ingredient', R: `E collect / return · ${shift.clean} clean plates`,
      X: 'Space discard food', B: 'E collect bun', P: 'E collect patty', M: 'E collect tomato',
      C: 'E collect cheese', L: 'E collect lettuce',
    };
    setText('instruction', target ? instructions[target] : 'Move toward it to see available actions.');
    const stove = shift.slots[target === 'G2' ? 'G2' : 'G'];
    const utility = target === 'K' || target === 'K2' || target === 'W' ? shift.slots[target] : undefined;
    const work = utility?.item ? ` · ${describe(utility.item)} ${Math.floor(utility.progress * 100 / (hz * (target === 'W' ? 3 : 2)))}%` : '';
    setText('equipment', stove.item ? `Stove · ${describe(stove.item)} · ${(stove.progress / hz).toFixed(1)}s${work}` : `Stove empty${work}`);
    setText('feedback', tutorial && shift.phase === 'service' ? [
      'Take a plate to assembly. Add a bun and a perfectly cooked patty, then serve.',
      'At the sink, face the dirty plate and hold Space to wash.',
      'Press Q to switch chefs and finish practice.',
    ][shift.tutorialStep]! : shift.message);

  }

  function pause() {
    keys.clear();
    dash = false;
    accumulator = 0;
    audio.pause();
    if (shift.phase === 'service') shift.phase = 'paused';
    drawHud();
  }

  function restart(nextDay = false, start = true) {
    const settled = shift.phase === 'results';
    shift = tutorial && start ? new Shift(pack, 1, 42, career.cash, { tutorial: true }) : careerMode ? careerShift() : new Shift(pack, nextDay ? shift.day.day + 1 : start ? shift.day.day : 3,
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

  careerButton.addEventListener('click', () => {
    careerMode = !careerMode;
    restart(false, false);
  });
  primary.addEventListener('click', () => {
    audio.unlock();
    if (shift.phase === 'ready') shift.start();
    else if (shift.phase === 'paused') {
      if (confirming) restart();
      else shift.phase = 'service';
    } else if (shift.phase === 'results') {
      tutorial = false;
      restart(shift.served >= shift.day.target, !careerMode);
    }
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
        audio.unlock();
        shift.phase = 'service';
        drawHud();
      }
    }
  });
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('keydown', (event) => {
    if (shift.phase !== 'service' || !['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ',
      'Space', 'Digit1', 'Digit2', 'ShiftLeft', 'ShiftRight', 'Tab', 'Escape'].includes(event.code)) return;
    event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'KeyE') shift.interact();
    if (event.code === 'KeyQ') {
      shift.switchChef();
      keys.delete('Space');
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') dash = true;
    if (event.code === 'Space') shift.discard();
    if (careerMode && (event.code === 'Digit1' || event.code === 'Digit2')) shift.assignStaff(event.code === 'Digit1' ? 'K' : 'W');
    if (event.code === 'Tab') expanded = !expanded;
    if (event.code === 'Escape') pause();
    drawHud();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  let lastFoleyTick = -1;
  let drawPending = false;
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
    if (shift.phase === 'service' && shift.tick !== lastFoleyTick && shift.tick % 24 < 3) {
      lastFoleyTick = shift.tick;
      if (shift.working) audio.cue(shift.target === 'W' ? 'wash' : 'chop');
      else if (shift.slots.G.item && shift.slots.G.progress / hz < 16) audio.cue('fry');
    }
    drawHud();
    if (!drawPending) {
      drawPending = true;
      queueMicrotask(() => {
        drawPending = false;
        paint(shift, layoutPreview, graphics.checked);
      });
    }
    requestAnimationFrame(frame);
  }
  drawHud();
  requestAnimationFrame(frame);
  return primary;
}
