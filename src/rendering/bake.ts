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
