import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { cells, stations, stationNames } from '../game/layout';
import { isPlate } from '../game/shift';
import type { Item, Shift } from '../game/shift';

const cream = '#fff0d5';
const ink = '#28343a';
const teal = '#358e89';
const wood = '#c88b52';
const coral = '#e84c43';
const colors: Record<string, string> = {
  bun: '#e4a147', cheese: '#f7c54b', tomato: coral, lettuce: '#65b94d', raw: '#d66b71',
  cooking: '#b45448', perfect: '#754027', overcooked: '#52332d', burnt: '#242126',
};
const box = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
const sphere = new T.SphereGeometry(0.5, 16, 10);
const cylinder = new T.CylinderGeometry(0.5, 0.5, 1, 24);
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

function foodModel(root: T.Group, item: Item, y = 0) {
  if (isPlate(item)) {
    shape(root, cylinder, item.dirty ? '#b9a591' : '#e9f7ef', 0, y + .03, 0, .56, .055, .56);
    const bun = item.food.find(({ id }) => id === 'bun');
    if (bun) shape(root, sphere, colors.bun!, 0, y + .08, 0, .46, .10, .46);
    const layers = item.food.filter(({ id }) => id !== 'bun');
    layers.forEach((food, i) => foodModel(root, food, y + .10 + i * .066));
    if (bun) shape(root, sphere, colors.bun!, 0, y + .15 + layers.length * .066, 0, .47, .16, .47);
    return;
  }
  const color = (item.id === 'patty' ? colors[item.state] : colors[item.id]) ?? cream;
  const geometry = item.id === 'cheese' || item.state === 'prepped' ? box : cylinder;
  const width = item.state === 'prepped' ? .35 : .43;
  shape(root, geometry, color, 0, y + .045, 0, width, .075, width);
}

function chefModel(index: number) {
  const group = new T.Group();
  const body = new T.Group();
  const color = index ? teal : coral;
  group.add(body);
  shape(body, sphere, color, 0, .46, 0, .56, .59, .42);
  const left = shape(body, box, ink, -.14, .12, .03, .20, .24, .26);
  const right = shape(body, box, ink, .14, .12, .03, .20, .24, .26);
  const skin = index ? '#ad7358' : '#edb18a';
  shape(body, sphere, skin, 0, .90, 0, .61, .56, .58);
  for (const side of [-1, 1]) {
    shape(body, sphere, skin, side * .30, .44, .12, .20, .23, .23);
    shape(body, sphere, ink, side * .10, .92, .267, .056, .071, .045);
  }
  shape(body, cylinder, cream, 0, 1.15, 0, .59, .13, .56);
  if (!index) {
    for (const x of [-.16, 0, .16]) shape(body, sphere, cream, x, 1.28, 0, .33, .36, .43);
  } else {
    shape(body, sphere, '#573637', 0, 1.04, -.23, .32, .34, .30);
    shape(body, box, cream, 0, 1.13, .24, .50, .07, .24);
  }
  const carry = new T.Group();
  carry.position.set(0, .52, .37);
  body.add(carry);
  const ring = new T.Mesh(new T.RingGeometry(.37, .44, 32), new T.MeshBasicMaterial({ color: '#fff7bc', side: T.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .014;
  group.add(ring);
  return { group, body, left, right, carry, ring, x: NaN, z: NaN };
}

export function createKitchen(stage: HTMLElement, labels: HTMLElement) {
  let renderer: T.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    throw new Error('WebGL 2 is required. Enable hardware acceleration or try a supported desktop browser.');
  }
  renderer.domElement.setAttribute('aria-label', '3D Burger Town kitchen');
  stage.prepend(renderer.domElement);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera();
  camera.position.set(14, 18, 13);
  camera.lookAt(5.5, .15, 4.5);
  scene.add(new T.HemisphereLight('#fff5dd', '#838995', 1.8));
  const light = new T.DirectionalLight('#fff0d5', 1.55);
  light.position.set(-4, 9, 5);
  scene.add(light);
  shape(scene, box, '#244849', 5.5, -.31, 4.5, 12, .54, 10);
  const plateSlots = new Map(stations.map(({ tile, x, z }) => {
    const root = new T.Group();
    root.position.set(x, .94, z);
    scene.add(root);
    const label = document.createElement('span');
    label.className = 'station-label';
    label.textContent = stationNames[tile];
    labels.append(label);
    return [tile, { root, label, x, z }];
  }));
  for (const { tile, x, z } of cells) {
    const odd = (x + z) % 2;
    shape(scene, box, x > 8 ? (odd ? '#d59d69' : '#e3b181') :
      (odd ? '#9cb6a6' : '#b8cbb5'), x, -.053, z, .987, .10, .987);
    if (tile === '#' || tile === '|') {
      const back = z === 0 || x === 0;
      const high = back ? .56 : .14;
      shape(scene, box, back ? teal : '#567b73', x, high / 2, z, 1, high, 1);
      if (back) shape(scene, box, cream, x, high, z, .99, .09, .99);
    }
    if (tile === 'T') {
      shape(scene, cylinder, wood, x, .40, z, .83, .77, .83);
      shape(scene, cylinder, cream, x, .81, z, .87, .10, .87);
      shape(scene, cylinder, coral, x, .88, z, .19, .09, .19);
    }
  }
  const binColors: Record<string, string> = {
    B: colors.bun!, P: colors.raw!, M: coral, C: colors.cheese!, L: colors.lettuce!,
  };
  for (const [tile, { x, z }] of plateSlots) {
    const binColor = binColors[tile];
    const base = tile === 'S' ? coral : tile === 'G' ? ink : tile === 'X' ? '#5b6b65' : teal;
    shape(scene, box, base, x, .43, z, .94, .84, .93);
    shape(scene, box, tile === 'A' || tile === 'K' || tile === 'S' ? wood : cream, x, .87, z, .98, .12, .98);
    shape(scene, box, base, x, .55, z + .45, .71, .42, .10);
    if (binColor) {
      shape(scene, box, '#583e37', x, .95, z, .74, .14, .67);
      for (const dx of [-.19, 0, .19]) {
        shape(scene, sphere, binColor, x + dx, 1.02, z, .22, .22, .38);
      }
    }
    if (tile === 'G' || tile === 'W' || tile === 'R') {
      shape(scene, cylinder, tile === 'G' ? ink : tile === 'W' ? '#739ca0' : '#f4fcf0', x, .95, z, .68, .075, .68);
    }
    if (tile === 'W') shape(scene, box, '#718e89', x, 1.10, z - .31, .11, .33, .11);
    if (tile === 'K') shape(scene, box, cream, x, .94, z, .69, .07, .66);
    if (tile === 'X') shape(scene, box, ink, x, .95, z, .67, .10, .61);
  }
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

  const actors = [chefModel(0), chefModel(1)];
  for (const actor of actors) scene.add(actor.group);
  const marker = shape(scene, box, '#ffe992', 0, .935, 0, 1, .03, 1);
  marker.visible = false;
  const modelKeys = new WeakMap<T.Group, string>();
  function showItem(root: T.Group, item?: Item) {
    const key = item ? JSON.stringify(item) : '';
    if (modelKeys.get(root) === key) return;
    modelKeys.set(root, key);
    root.clear();
    if (item) foodModel(root, item);
  }
  const anchor = new T.Vector3();
  let width = 0;
  let height = 0;
  let lastScene = '';

  return (shift: Shift) => {
    const resized = width !== stage.clientWidth || height !== stage.clientHeight;
    if (resized) {
      width = stage.clientWidth;
      height = stage.clientHeight;
      const view = Math.max(14.4, 17 / (width / height));
      camera.left = -view * width / height / 2;
      camera.right = -camera.left;
      camera.top = view / 2;
      camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(width, height);
    }
    const target = shift.target;
    const key = JSON.stringify([shift.active, target,
      shift.chefs.map(({ x, z, facing, held }) => [x, z, facing, held]),
      Object.values(shift.slots).map(({ item }) => item)]);
    const needsPoseReset = actors.some((actor) => actor.left.position.z !== .03);
    if (!resized && key === lastScene && !needsPoseReset) return;
    lastScene = key;
    for (const [tile, { root, label, x, z }] of plateSlots) {
      showItem(root, shift.slots[tile].item);
      anchor.set(x, 1.10, z).project(camera);
      label.style.left = `${(anchor.x + 1) * width / 2}px`;
      label.style.top = `${(1 - anchor.y) * height / 2}px`;
      label.classList.toggle('target', target === tile);
    }
    const highlighted = target && plateSlots.get(target);
    marker.visible = Boolean(highlighted);
    if (highlighted) marker.position.set(highlighted.x, .935, highlighted.z);
    actors.forEach((actor, i) => {
      const chef = shift.chefs[i]!;
      actor.group.position.set(chef.x, 0, chef.z);
      actor.body.rotation.y = Math.atan2(chef.facing.x, chef.facing.z);
      const moved = actor.x !== chef.x || actor.z !== chef.z;
      const stride = moved && !matchMedia('(prefers-reduced-motion: reduce)').matches ? Math.sin(shift.tick / 3) * .085 : 0;
      actor.left.position.z = .03 + stride;
      actor.right.position.z = .03 - stride;
      actor.x = chef.x;
      actor.z = chef.z;
      actor.ring.visible = shift.active === i;
      showItem(actor.carry, chef.held);
    });
    renderer.render(scene, camera);
  };
}
