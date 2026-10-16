import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Merge every static mesh under `root` into one mesh per material. The
 * scattered decor is a few hundred small Kenney meshes; this turns them into
 * a handful of draw calls. Only meshes with a single material are merged.
 */
export function batchStatic(root: THREE.Object3D, { castShadow = true, receiveShadow = true } = {}) {
  root.updateMatrixWorld(true);
  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const leftovers: THREE.Object3D[] = [];

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (Array.isArray(mesh.material)) {
      leftovers.push(mesh);
      return;
    }
    const material = mesh.material;
    const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", src.getAttribute("position"));
    if (src.getAttribute("normal")) geo.setAttribute("normal", src.getAttribute("normal"));
    else geo.computeVertexNormals();
    if ((material as THREE.MeshToonMaterial).vertexColors) {
      const color = src.getAttribute("color");
      if (!color) {
        leftovers.push(mesh);
        return;
      }
      // Normalize to float RGB so kits with RGBA / normalized colors merge.
      const rgb = new Float32Array(color.count * 3);
      for (let i = 0; i < color.count; i++) {
        rgb[i * 3] = color.getX(i);
        rgb[i * 3 + 1] = color.getY(i);
        rgb[i * 3 + 2] = color.getZ(i);
      }
      geo.setAttribute("color", new THREE.BufferAttribute(rgb, 3));
    }
    geo.applyMatrix4(mesh.matrixWorld);
    let list = buckets.get(material);
    if (!list) buckets.set(material, (list = []));
    list.push(geo);
  });

  const out = new THREE.Group();
  buckets.forEach((geos, material) => {
    const merged = mergeGeometries(geos, false);
    if (!merged) return;
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    out.add(mesh);
  });
  for (const obj of leftovers) {
    const clone = obj.clone();
    obj.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    out.add(clone);
  }
  return out;
}
