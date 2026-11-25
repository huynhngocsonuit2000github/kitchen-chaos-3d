import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const material = new T.MeshBasicMaterial({ vertexColors: true });
const key = new T.Vector3(.35, .85, .43).normalize();
const fill = new T.Vector3(-.6, .4, -.5).normalize();
const normal = new T.Vector3();
const tint = new T.Color();

/** Bake the fixed diner lighting into mesh colors. Dynamic actors still respond to the live lights. */
export function bakeProp(group: T.Group) {
  group.updateMatrixWorld(true);
  const geometries: T.BufferGeometry[] = [];
  const meshes: T.Mesh[] = [];
  const inverse = group.matrixWorld.clone().invert();
  group.traverse((node) => {
    if (!(node instanceof T.Mesh) || !(node.material instanceof T.MeshStandardMaterial)) return;
    const geometry = node.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, node.matrixWorld));
    const normals = geometry.getAttribute('normal');
    const colors = new Float32Array(normals.count * 3);
    for (let i = 0; i < normals.count; i++) {
      normal.fromBufferAttribute(normals, i);
      const brightness = .53 + .49 * Math.max(0, normal.dot(key)) + .15 * Math.max(0, normal.dot(fill));
      tint.copy(node.material.color).multiplyScalar(brightness).toArray(colors, i * 3);
    }
    for (const attribute of Object.keys(geometry.attributes)) {
      if (attribute !== 'position') geometry.deleteAttribute(attribute);
    }
    geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    geometries.push(geometry);
    meshes.push(node);
  });
  if (!geometries.length) return;
  const merged = mergeGeometries(geometries);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) throw new Error('Incompatible geometry in Burger Town prop.');
  for (const mesh of meshes) mesh.removeFromParent();
  group.add(new T.Mesh(merged, material));
}

/** Keep the original skeleton and animation tracks while combining body materials into vertex colors. */
export function batchCharacter(group: T.Group) {
  const skin = group.children.filter((node): node is T.SkinnedMesh => node instanceof T.SkinnedMesh);
  const candidate = skin.filter((node) => node.material instanceof T.MeshStandardMaterial &&
    node.material.name !== 'Guest apron');
  const first = candidate[0];
  if (!first || candidate.length < 2) return;
  if (candidate.some((node) => node.skeleton !== first.skeleton || !node.bindMatrix.equals(first.bindMatrix) ||
    node.position.lengthSq() !== 0 || node.quaternion.w !== 1 || node.scale.distanceToSquared(new T.Vector3(1, 1, 1)) !== 0)) return;
  const geometries = candidate.map((node) => {
    const geometry = node.geometry.clone();
    geometry.deleteAttribute('uv');
    const count = geometry.getAttribute('position').count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) (node.material as T.MeshStandardMaterial).color.toArray(colors, i * 3);
    geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
    return geometry;
  });
  const merged = mergeGeometries(geometries);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) return;
  const body = new T.SkinnedMesh(merged, new T.MeshLambertMaterial({ vertexColors: true }));
  body.bind(first.skeleton, first.bindMatrix);
  body.frustumCulled = false;
  group.remove(...candidate);
  group.add(body);
}
