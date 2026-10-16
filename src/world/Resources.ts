import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { toonify } from "./materials";
import { MODEL_PACK_URL } from "./modelPack";

// Every model the world uses, keyed by their source path in assets/models.
// Kenney kits (CC0) — see public/models/CREDITS.txt. They ship as one packed,
// meshopt-compressed GLB; run scripts/pack-models.mjs after changing this list.
export const MODELS = [
  "car/van", "car/box", "car/cone",
  "roads/road-straight", "roads/road-crossroad", "roads/road-end-round", "roads/light-square", "roads/construction-barrier",
  "racing/barrierRed", "racing/barrierWhite", "racing/bannerTowerRed", "racing/flagCheckers",
  "racing/flagGreen", "racing/grandStand",
  "nature/tree_oak_fall", "nature/tree_default_fall", "nature/tree_fat_fall", "nature/tree_detailed_fall",
  "nature/tree_blocks_fall", "nature/tree_simple_fall", "nature/tree_pineRoundA", "nature/tree_default",
  "nature/plant_bush", "nature/plant_bushLarge", "nature/plant_bushSmall", "nature/flower_redA", "nature/flower_yellowA",
  "nature/flower_purpleA", "nature/grass", "nature/grass_large", "nature/rock_largeA", "nature/rock_smallA",
  "nature/rock_tallA", "nature/mushroom_redGroup", "nature/log", "nature/stump_round",
  "furniture/desk", "furniture/chairDesk", "furniture/computerScreen", "furniture/computerKeyboard",
  "furniture/lampRoundTable", "furniture/bookcaseOpen", "furniture/cardboardBoxClosed",
  "furniture/cardboardBoxOpen", "furniture/pottedPlant", "furniture/rugRectangle", "furniture/trashcan",
] as const;

export type ModelName = (typeof MODELS)[number];

export class Resources {
  private models = new Map<string, THREE.Object3D>();
  fonts!: { display: Font; body: Font };

  async load(onProgress: (ratio: number) => void) {
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => onProgress(total ? loaded / total : 0);

    const gltfLoader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
    const fontLoader = new FontLoader(manager);

    const models = gltfLoader.loadAsync(MODEL_PACK_URL).then((gltf: GLTF) => {
      dequantize(gltf.scene);
      for (const name of MODELS) {
        const node = gltf.scene.getObjectByName(name.replace("/", "__"));
        if (!node) throw new Error(`Model missing from pack: ${name}`);
        node.removeFromParent();
        node.position.set(0, 0, 0);
        this.models.set(name, toonify(node));
      }
    });
    // Space Grotesk Bold / Inter Medium, converted to typeface JSON (OFL, via fontsource).
    const fonts = Promise.all([
      fontLoader.loadAsync("/fonts/space-grotesk-bold.typeface.json"),
      fontLoader.loadAsync("/fonts/inter-medium.typeface.json"),
    ]).then(([display, body]) => (this.fonts = { display, body }));

    await Promise.all([models, fonts]);
    onProgress(1);
  }

  /** Fresh copy of a model (geometry + materials shared). */
  model(name: ModelName) {
    const model = this.models.get(name);
    if (!model) throw new Error(`Model not loaded: ${name}`);
    return model.clone(true);
  }
}

/**
 * The pack stores positions, normals and colors as quantized integers (the
 * node transforms undo the scaling). Expand them back to floats so batching,
 * recoloring and geometry merges see the same layout as any other mesh.
 */
function dequantize(root: THREE.Object3D) {
  const done = new Set<THREE.BufferGeometry>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || done.has(mesh.geometry)) return;
    done.add(mesh.geometry);
    for (const [name, attr] of Object.entries(mesh.geometry.attributes)) {
      // Meshopt output is often interleaved (padded to 4 bytes), so go through getX..getW.
      const interleaved = attr instanceof THREE.InterleavedBufferAttribute;
      const array = interleaved ? attr.data.array : attr.array;
      if (!interleaved && array instanceof Float32Array && !attr.normalized) continue;
      const n = attr.itemSize;
      const out = new Float32Array(attr.count * n);
      for (let i = 0; i < attr.count; i++) {
        out[i * n] = attr.getX(i);
        if (n > 1) out[i * n + 1] = attr.getY(i);
        if (n > 2) out[i * n + 2] = attr.getZ(i);
        if (n > 3) out[i * n + 3] = attr.getW(i);
      }
      mesh.geometry.setAttribute(name, new THREE.BufferAttribute(out, n));
    }
  });
}

/**
 * Wraps a model so its origin sits at the bottom-center (or center) of its
 * bounding box after scaling — Kenney kits all use different pivots.
 */
export function normalize(obj: THREE.Object3D, scale = 1, origin: "bottom" | "center" = "bottom") {
  obj.scale.multiplyScalar(scale);
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  const wrapper = new THREE.Group();
  wrapper.add(obj);
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= origin === "bottom" ? box.min.y : center.y;
  wrapper.userData.size = box.getSize(new THREE.Vector3());
  return wrapper;
}
