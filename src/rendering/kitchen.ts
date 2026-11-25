import * as T from 'three';
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ingredientIcon } from '../game/food-icons';
import { bakeProp, batchCharacter } from './bake';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cells, stations, stationNames } from '../game/layout';
import type { Placement, StationId } from '../game/layout';
import { hz, isPlate } from '../game/shift';
import type { Item, Shift } from '../game/shift';

const teal = '#358e89';
const box = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
const materials = new Map<string, T.MeshLambertMaterial>();
function shape(parent: T.Object3D, geometry: T.BufferGeometry, color: string,
  x: number, y: number, z: number, w: number, h: number, d: number) {
  let material = materials.get(color);
  if (!material) {
    material = new T.MeshLambertMaterial({ color });
    materials.set(color, material);
  }
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}

function foodModel(root: T.Group, item: Item, food: Map<string, T.Group>, y = 0) {
  const add = (key: string, height: number) => {
    const model = food.get(key)!.clone();
    model.position.y = height;
    root.add(model);
  };
  if (isPlate(item)) {
    add(item.dirty ? 'dirty' : 'plate', y);
    const bun = item.food.some(({ id }) => id === 'bun');
    let height = y + .038;
    if (bun) {
      add('bun_bottom', height);
      height += .067;
    }
    for (const [id, thickness] of [['patty', .075], ['cheese', .032], ['lettuce', .042], ['tomato', .063]] as const) {
      const layer = item.food.find((ingredient) => ingredient.id === id);
      if (!layer) continue;
      foodModel(root, layer, food, height);
      height += thickness;
    }
    if (bun) add('bun_top', height);
    return;
  }
  if (item.id === 'bun') {
    add('bun_bottom', y);
    add('bun_top', y + .07);
  } else {
    add(item.id === 'patty' ? item.state : item.id === 'cheese' ? item.id :
      `${item.id}_${item.state}`, y);
  }
}

function chefModel(body: T.Group, clips: T.AnimationClip[], knife: T.Group) {
  const group = new T.Group();
  group.add(body);
  const carry = new T.Group();
  let socket: T.Object3D | undefined;
  body.traverse((node) => {
    if (/^carry_plate(?:[._]?\d+)?$/.test(node.name)) socket = node;
    if (/^hand_r(?:[._]?\d+)?$/.test(node.name)) node.add(knife);
  });
  knife.visible = false;
  knife.rotation.x = -.6;
  if (!socket) throw new Error('Missing chef carry socket.');
  socket.add(carry);
  const ring = new T.Mesh(new T.RingGeometry(.37, .44, 32), new T.MeshBasicMaterial({ color: '#fff7bc', side: T.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .014;
  group.add(ring);
  return {
    group, body, carry, ring, knife, mixer: new T.AnimationMixer(body), clips,
    action: undefined as T.AnimationAction | undefined, x: NaN, z: NaN,
    held: '', gesture: '', gestureUntil: -1,
  };
}

const modelUrls = import.meta.glob('../../assets/runtime/{kit,food}/*.glb', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

export async function createKitchen(stage: HTMLElement, labels: HTMLElement) {
  const loader = new GLTFLoader();
  const characterUrls = import.meta.glob('../../assets/runtime/characters/*.glb', {
    eager: true, query: '?url', import: 'default',
  }) as Record<string, string>;
  const [characters, models] = await Promise.all([
    Promise.all(['max', 'lina', 'guest'].map((name) => loader.loadAsync(characterUrls[`../../assets/runtime/characters/${name}.glb`]!))),
    Promise.all(Object.entries(modelUrls).map(async ([path, url]) => {
      const key = path.split('/').at(-1)!.slice(0, -4);
      return { key, path, model: (await loader.loadAsync(url)).scene };
    })),
  ]);
  const appliances = new Map(models.filter(({ path }) => path.includes('/kit/')).map(({ key, model }) => [key, model]));
  const food = new Map(models.filter(({ path }) => path.includes('/food/')).map(({ key, model }) => [key, model]));
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    throw new Error('WebGL 2 is required. Enable hardware acceleration or try a supported desktop browser.');
  }
  renderer.domElement.setAttribute('aria-label', '3D Burger Town kitchen');
  stage.prepend(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera();
  const bearing = Math.PI / 4;
  const elevation = 55 * Math.PI / 180;
  const focus = new T.Vector3(5.5, .35, 4.5);
  camera.position.copy(focus).add(new T.Vector3(
    22 * Math.cos(elevation) * Math.sin(bearing), 22 * Math.sin(elevation),
    22 * Math.cos(elevation) * Math.cos(bearing),
  ));
  camera.lookAt(focus);
  scene.add(new T.HemisphereLight('#fff1d2', '#a38987', 1.55));
  const light = new T.DirectionalLight('#ffe2bd', 2.35);
  light.position.set(2, 8, 10);
  scene.add(light);
  const bounce = new T.DirectionalLight('#b9e2ee', .65);
  bounce.position.set(10, 6, 1);
  scene.add(bounce);
  const shade = new T.MeshBasicMaterial({
    transparent: true, depthWrite: false, color: '#4b2925', opacity: .32,
  });
  const stamp = document.createElement('canvas');
  stamp.width = stamp.height = 32;
  const brush = stamp.getContext('2d')!;
  const gradient = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'white');
  gradient.addColorStop(.45, '#ffffffa0');
  gradient.addColorStop(1, '#ffffff00');
  brush.fillStyle = gradient;
  brush.fillRect(0, 0, 32, 32);
  shade.map = new T.CanvasTexture(stamp);
  const shadowPlane = new T.PlaneGeometry(1.4, 1.4);
  shadowPlane.rotateX(-Math.PI / 2);
  const contactShadow = (parent: T.Object3D, x: number, z: number, scale = 1) => {
    const shadow = new T.Mesh(shadowPlane, shade);
    shadow.position.set(x, .008, z);
    shadow.scale.setScalar(scale);
    parent.add(shadow);
    return shadow;
  };

  const plinth = appliances.get('Plinth')!.clone();
  plinth.position.set(5.5, 0, 4.5);
  bakeProp(plinth);
  scene.add(plinth);
  const sign = appliances.get('Sign')!.clone();
  sign.position.set(0, .91, 2.0);
  sign.rotation.y = Math.PI / 2;
  bakeProp(sign);
  scene.add(sign);
  const fixedProps = new T.Group();
  scene.add(fixedProps);
  const dinerWindow = appliances.get('DinerWindow')!.clone();
  dinerWindow.position.set(9.6, .73, .02);
  fixedProps.add(dinerWindow);
  const bins = new Set<StationId>(['B', 'P', 'M', 'C', 'L']);
  const plateSlots = new Map((Object.keys(stationNames) as StationId[]).map((tile) => {
    const root = new T.Group();
    const object = new T.Group();
    const model = appliances.get(tile[0]!)!.clone();
    const socket = model.children.flatMap((child) => child.children).find(({ name }) => /^food_socket(?:[._]?\d+)?$/.test(name));
    root.position.y = socket?.position.y ?? .951;
    if (bins.has(tile)) {
      const station = stations.find((entry) => entry.tile === tile)!;
      model.position.set(station.x, 0, station.z);
      fixedProps.add(model);
      object.add(root);
    } else {
      bakeProp(model);
      object.add(model, root);
    }
    scene.add(object);
    const label = document.createElement('span');
    label.className = 'station-label';
    label.textContent = stationNames[tile];
    const detail = document.createElement('span');
    detail.className = 'station-food';
    labels.append(label, detail);
    return [tile, { root, label, detail, detailKey: '', object, x: 0, z: 0 }];
  }));
  const stationShadows = new T.InstancedMesh(shadowPlane, shade, plateSlots.size);
  stationShadows.frustumCulled = false;
  scene.add(stationShadows);
  const shadowTransform = new T.Matrix4();
  let shadowLayout: Shift['stations'] | undefined;
  const modules = new Map<string, { x: number; z: number; yaw: number; color?: string }[]>([
    ['Tile', []], ['Wall', []], ['Trim', []],
  ]);
  for (const { tile, x, z } of cells) {
    const odd = (x + z) % 2;
    modules.get('Tile')!.push({
      x, z, yaw: 0, color: x > 8 ? (odd ? '#d59d69' : '#e3b181') : (odd ? '#ba7766' : '#efc9a0'),
    });
    if (tile === '#' || tile === '|') {
      const back = z === 0 || x === 0;
      modules.get(back ? 'Wall' : 'Trim')!.push({
        x, z, yaw: x === 0 && z > 0 ? Math.PI / 2 : 0,
        color: back ? undefined : tile === '|' ? teal : '#a76856',
      });
    }
    if (tile === 'T') {
      const table = appliances.get('T')!.clone();
      table.position.set(x, 0, z);
      fixedProps.add(table);
      contactShadow(scene, x, z);
      const chair = appliances.get('Seat')!.clone();
      chair.position.set(x + 1.04, 0, z);
      chair.rotation.y = -Math.PI / 2;
      fixedProps.add(chair);
    }
  }
  for (const [name, placements] of modules) {
    const module = appliances.get(name)!;
    bakeProp(module);
    for (const child of module.children) {
      if (!(child instanceof T.Mesh)) continue;
      const material = child.material as T.MeshStandardMaterial | T.MeshBasicMaterial;
      const surface = material.clone();
      const instances = new T.InstancedMesh(child.geometry, surface, placements.length);
      const locator = new T.Object3D();
      placements.forEach(({ x, z, yaw, color }, index) => {
        locator.position.set(x, 0, z);
        locator.rotation.y = yaw;
        locator.updateMatrix();
        instances.setMatrixAt(index, locator.matrix);
        if (color) instances.setColorAt(index, new T.Color(color));
      });
      scene.add(instances);
    }
  }
  const ghost = shape(scene, box, '#e5cc71', 0, .035, 0, .89, .045, .89);
  ghost.visible = false;
  const binItems = {
    B: { id: 'bun', state: 'ready' }, P: { id: 'patty', state: 'raw' },
    M: { id: 'tomato', state: 'raw' }, C: { id: 'cheese', state: 'ready' },
    L: { id: 'lettuce', state: 'raw' },
  } satisfies Partial<Record<string, Item>>;
  for (const { tile, x, z } of stations) {
    if (!(tile in binItems)) continue;
    const item = binItems[tile as keyof typeof binItems];
    for (const [dx, dz] of [[-.19, -.13], [.19, .11]]) {
      const display = new T.Group();
      display.position.set(x + dx!, .956, z + dz!);
      display.scale.setScalar(.72);
      foodModel(display, item, food);
      fixedProps.add(display);
    }
  }
  bakeProp(fixedProps);
  for (const model of food.values()) bakeProp(model);
  const batches = new Map<string, T.Mesh[]>();
  for (const child of scene.children) {
    if (!(child instanceof T.Mesh)) continue;
    const key = `${child.geometry.id}:${child.material.id}`;
    const batch = batches.get(key) ?? [];
    batch.push(child);
    batches.set(key, batch);
  }
  for (const batch of batches.values()) {
    if (batch.length < 2) continue;
    const { geometry, material } = batch[0]!;
    const instances = new T.InstancedMesh(geometry, material, batch.length);
    batch.forEach((mesh, index) => {
      mesh.updateMatrix();
      instances.setMatrixAt(index, mesh.matrix);
      scene.remove(mesh);
    });
    scene.add(instances);
  }

  for (const { scene: character } of characters) batchCharacter(character);
  const characterMaterials = new Map<T.Material, T.MeshLambertMaterial>();
  for (const { scene: character } of characters) character.traverse((node) => {
    if (!(node instanceof T.Mesh) || !(node.material instanceof T.MeshStandardMaterial)) return;
    const original = node.material;
    let surface = characterMaterials.get(original);
    if (!surface) {
      surface = new T.MeshLambertMaterial({ color: original.color, name: original.name });
      characterMaterials.set(original, surface);
    }
    node.material = surface;
  });
  const actors = characters.slice(0, 2).map(({ scene, animations }) => chefModel(scene, animations, appliances.get('Knife')!.clone()));
  const guestSource = characters[2]!;
  const outfits = ['#ac5e65', '#647f9e', '#597955', '#9873ab', '#c08951', '#396e72'];
  const guests = outfits.map((color) => {
    const model = cloneRig(guestSource.scene);
    const mixer = new T.AnimationMixer(model);
    model.traverse((node) => {
      if (!(node instanceof T.Mesh) || node.material.name !== 'Guest apron') return;
      const material = (node.material as T.MeshLambertMaterial).clone();
      material.color.set(color);
      node.material = material;
    });
    model.scale.setScalar(.88);
    model.visible = false;
    scene.add(model);
    const idle = guestSource.animations.find(({ name }) => name === 'idle');
    if (idle) mixer.clipAction(idle).play();
    return { model, mixer, action: undefined as T.AnimationAction | undefined, clip: '', id: -1 };
  });
  const effectGeometry = new T.SphereGeometry(.055, 7, 5);
  const effects = Array.from({ length: 9 }, (_, index) => {
    const material = new T.MeshBasicMaterial({ transparent: true, depthWrite: false });
    const mesh = new T.Mesh(effectGeometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, index, material };
  });
  for (const actor of actors) {
    scene.add(actor.group);
    contactShadow(actor.group, 0, 0, .68);
  }
  const marker = shape(scene, box, '#ffe992', 0, .935, 0, 1, .03, 1);
  marker.visible = false;
  const modelKeys = new WeakMap<T.Group, string>();
  function showItem(root: T.Group, item?: Item) {
    const key = item ? JSON.stringify(item) : '';
    if (modelKeys.get(root) === key) return;
    modelKeys.set(root, key);
    root.clear();
    if (item) foodModel(root, item, food);
  }
  const anchor = new T.Vector3();
  let width = 0;
  let height = 0;
  let canvasWidth = 0;
  let low = false;
  let lastScene = '';
  let lastTick = 0;
  let lastShift: Shift | undefined;
  let lastServed = 0;
  let transitioningGuest = false;
  let sparkleUntil = -1;
  const benchmark = new URLSearchParams(location.search).has('render-stats');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  return (shift: Shift, preview?: { position: Placement; valid: boolean }, qualityLow = false) => {
    const resized = low !== qualityLow || width !== stage.clientWidth || height !== stage.clientHeight;
    low = qualityLow;
    if (resized) {
      width = stage.clientWidth;
      height = stage.clientHeight;
      canvasWidth = Math.min(width, Math.ceil(height * 1.32));
      const view = Math.max(14.4, 17 / (canvasWidth / height));
      camera.left = -view * canvasWidth / height / 2;
      camera.right = -camera.left;
      camera.top = view / 2;
      camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(low ? .55 : Math.min(devicePixelRatio, 1));
      renderer.setSize(canvasWidth, height);
    }
    const target = shift.target;
    const key = JSON.stringify([preview, shift.tick < shift.chef.dashUntil, sparkleUntil >= shift.tick, shift.stations, shift.active, target, shift.phase, shift.customers, shift.working, shift.served,
      shift.chefs.map(({ x, z, facing, held }) => [x, z, facing, held]),
      Object.values(shift.slots).map(({ item }) => item)]);
    if (lastShift !== shift) {
      lastServed = shift.served;
      sparkleUntil = -1;
    } else if (shift.served > lastServed) {
      lastServed = shift.served;
      sparkleUntil = shift.tick + Math.round(hz * .65);
    }
    if (lastShift !== shift) {
      for (const guest of guests) {
        guest.model.visible = false;
        guest.id = -1;
      }
    }
    const delta = lastShift === shift ? Math.max(0, shift.tick - lastTick) / hz : 0;
    const dashing = shift.tick < shift.chef.dashUntil;
    const needsMotion = transitioningGuest || shift.customers.some(({ eatingUntil }) => eatingUntil !== undefined) || dashing || sparkleUntil >= shift.tick || shift.working || shift.staffTask || Boolean(shift.slots.G.item || shift.slots.G2.item) ||
      actors.some((actor) => actor.gestureUntil > shift.tick);
    if (lastShift === shift && !resized && key === lastScene && (!needsMotion || delta < 1 / 20)) return;
    lastTick = shift.tick;
    lastShift = shift;
    lastScene = key;
    ghost.visible = Boolean(preview);
    if (preview) {
      ghost.position.set(preview.position.x, .035, preview.position.z);
      (ghost.material as T.MeshLambertMaterial).color.set(preview.valid ? '#eece70' : '#cf4333');
    }
    if (shadowLayout !== shift.stations) {
      shadowLayout = shift.stations;
      stationShadows.count = shadowLayout.length;
      shadowLayout.forEach(({ x, z }, i) => {
        stationShadows.setMatrixAt(i, shadowTransform.makeTranslation(x, .008, z));
      });
      stationShadows.instanceMatrix.needsUpdate = true;
    }
    for (const [tile, slot] of plateSlots) {
      const station = shift.stations.find((placement) => placement.tile === tile);
      slot.object.visible = Boolean(station);
      const item = station ? shift.slots[tile].item : undefined;
      slot.label.hidden = !station || Boolean(item);
      slot.detail.hidden = !item;
      if (!station) continue;
      const { x, z } = station;
      slot.x = x;
      slot.z = z;
      slot.object.position.set(x, 0, z);
      showItem(slot.root, item);
      if (item) {
        const state = isPlate(item) ? item.dirty ? 'Dirty plate' : item.food.length ? 'Plated' : 'Clean plate' :
          item.id === 'patty' ? item.state : item.state === 'prepped' ? 'Chopped' : item.id;
        const text = state[0]!.toUpperCase() + state.slice(1);
        const detailKey = JSON.stringify(item);
        if (slot.detailKey !== detailKey) {
          slot.detailKey = detailKey;
          slot.detail.dataset.state = state;
          const icons = isPlate(item) ? item.food.map(({ id }) => ingredientIcon(id)).join('') : ingredientIcon(item.id);
          slot.detail.innerHTML = icons + stationNames[tile] + ' · ' + text;
        }
        anchor.set(x, 1.28, z).project(camera);
        slot.detail.style.left = `${(anchor.x * canvasWidth + width) / 2}px`;
        slot.detail.style.top = `${(1 - anchor.y) * height / 2}px`;
      }
      anchor.set(x, 1.10, z).project(camera);
      slot.label.style.left = `${(anchor.x * canvasWidth + width) / 2}px`;
      slot.label.style.top = `${(1 - anchor.y) * height / 2}px`;
      slot.label.classList.toggle('target', target === tile);
    }
    const highlighted = target && plateSlots.get(target);
    marker.visible = Boolean(highlighted);
    if (highlighted) marker.position.set(highlighted.x, .935, highlighted.z);
    actors.forEach((actor, i) => {
      const chef = shift.chefs[i]!;
      actor.group.position.set(chef.x, 0, chef.z);
      const facing = Math.atan2(chef.facing.x, chef.facing.z);
      const turn = facing - actor.body.rotation.y;
      actor.body.rotation.y += Math.atan2(Math.sin(turn), Math.cos(turn)) *
        (reduceMotion.matches || !delta ? 1 : Math.min(1, delta * 24));
      const moved = actor.x !== chef.x || actor.z !== chef.z;
      const held = JSON.stringify(chef.held) ?? '';
      if (actor.held !== held && shift.phase === 'service') {
        actor.gesture = held ? 'pickup' : target === 'G' ? 'fry_interact' : target === 'S' ? 'serve' : 'place';
        actor.gestureUntil = shift.tick + 20;
      }
      actor.held = held;
      const work = i === shift.active ? (shift.working ? target : undefined) :
        shift.staffTask?.path.length === 0 ? shift.staffTask.station : undefined;
      const speed = shift.tick < chef.dashUntil ? 'run' : 'walk';
      const clip = moved ? (held ? `carry_${speed}` : speed) :
        work ? (work === 'W' ? 'wash' : 'chop') :
        shift.tick < actor.gestureUntil ? actor.gesture : held ? 'carry_walk' : 'idle';
      actor.knife.visible = clip === 'chop';
      const animation = actor.clips.find(({ name }) => name === clip);
      if (animation && actor.action?.getClip() !== animation) {
        actor.action?.fadeOut(.11);
        actor.action = actor.mixer.clipAction(animation).reset().setEffectiveWeight(1).fadeIn(.11).play();
        if (['pickup', 'place', 'fry_interact', 'serve', 'success', 'panic'].includes(clip)) {
          actor.action.setLoop(T.LoopOnce, 1);
          actor.action.clampWhenFinished = true;
        }
      }
      if (actor.action) actor.action.paused = clip === 'carry_walk' && !moved;
      actor.mixer.update(reduceMotion.matches ? 0 : Math.min(.12, delta));
      actor.x = chef.x;
      actor.z = chef.z;
      actor.ring.visible = shift.active === i;
      showItem(actor.carry, chef.held);
    });
    transitioningGuest = false;
    const present = new Set(shift.customers.map(({ id }) => id));
    const entrance = new T.Vector3(10, 0, 8);
    const destination = new T.Vector3();
    function follow(guest: typeof guests[number], yaw: number, rest: string) {
      const distance = guest.model.position.distanceTo(destination);
      const walking = shift.phase === 'service' && !reduceMotion.matches && distance > .07;
      if (walking) {
        transitioningGuest = true;
        guest.model.rotation.y = Math.atan2(destination.x - guest.model.position.x, destination.z - guest.model.position.z);
        guest.model.position.lerp(destination, Math.min(1, delta * 3.8 / distance));
      } else {
        guest.model.position.copy(destination);
        guest.model.rotation.y = yaw;
      }
      const clip = walking ? 'walk' : rest;
      if (guest.clip !== clip) {
        const animation = guestSource.animations.find(({ name }) => name === clip);
        if (animation) {
          guest.action?.fadeOut(.11);
          guest.action = guest.mixer.clipAction(animation).reset().setEffectiveWeight(1).fadeIn(.11).play();
        }
        guest.clip = clip;
      }
      guest.mixer.update(reduceMotion.matches ? 0 : Math.min(.1, delta));
      return walking;
    }
    let waiting = 0;
    for (const customer of shift.customers) {
      const guest = guests.find(({ id }) => id === customer.id) ?? guests.find(({ id }) => !present.has(id));
      if (!guest) continue;
      if (!guest.model.visible || guest.id !== customer.id) guest.model.position.copy(entrance);
      guest.id = customer.id;
      guest.model.visible = true;
      if (customer.seat === undefined) destination.set(10, 0, 8 - waiting++ * .72);
      else destination.set(10.06, .19, customer.seat === 0 ? 2 : 5);
      follow(guest, customer.seat === undefined ? Math.PI : -Math.PI / 2,
        customer.eatingUntil !== undefined ? 'eat' : customer.seat !== undefined ? 'seat' : 'idle');
    }
    for (const guest of guests) {
      if (!guest.model.visible || present.has(guest.id)) continue;
      destination.copy(entrance);
      guest.model.visible = follow(guest, Math.PI, 'idle');
    }
    const spark = sparkleUntil >= shift.tick;
    const stoveTile = shift.slots.G.item ? 'G' : 'G2';
    const stoveItem = shift.slots[stoveTile].item;
    const sourceTile = spark ? 'S' : shift.working ? target : stoveItem ? stoveTile : undefined;
    const emitter = sourceTile ? plateSlots.get(sourceTile) : dashing ? {
      x: shift.chef.x - shift.chef.facing.x * .3, z: shift.chef.z - shift.chef.facing.z * .3,
    } : undefined;
    const smoke = sourceTile === stoveTile && stoveItem && !isPlate(stoveItem) && stoveItem.state === 'burnt';
    for (const { mesh, material, index } of effects) {
      mesh.visible = Boolean(emitter) && !reduceMotion.matches && !low;
      if (!emitter || !mesh.visible) continue;
      const life = spark ? 1 - (sparkleUntil - shift.tick) / (hz * .65) : (shift.tick / 65 + index / effects.length) % 1;
      const azimuth = index * 2.399963;
      const radius = .047 + .24 * life;
      mesh.position.set(emitter.x + Math.cos(azimuth) * radius, (sourceTile ? 1.06 : .035) + life * (sourceTile ? .72 : .23), emitter.z + Math.sin(azimuth) * radius);
      mesh.scale.setScalar(.65 + life * (smoke ? 2.4 : 1.25));
      material.color.set(spark ? '#ffe89f' : smoke ? '#605350' : sourceTile === 'W' ? '#a3eaf5' :
        sourceTile === 'K' ? '#a0bf4f' : '#fff1d6');
      material.opacity = (1 - life) * .56;
    }
    renderer.render(scene, camera);
    if (benchmark) {
      stage.dataset.drawCalls = String(renderer.info.render.calls);
      stage.dataset.triangles = String(renderer.info.render.triangles);
    }
  };
}
