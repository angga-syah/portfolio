import * as THREE from "three";
import type { Physics } from "./Physics";
import { normalize, type ModelName, type Resources } from "./Resources";
import { batchStatic } from "./batch";
import { windMaterial } from "./materials";

export const TILE = 4.5;

/** Deterministic PRNG so the scatter is identical on every visit. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type Keepout = { x: number; z: number; r: number } | { x0: number; x1: number; z0: number; z1: number };

function blocked(x: number, z: number, keepouts: Keepout[]) {
  return keepouts.some((k) =>
    "r" in k ? Math.hypot(x - k.x, z - k.z) < k.r : x > k.x0 && x < k.x1 && z > k.z0 && z < k.z1
  );
}

/** Cross-shaped road network from the spawn crossroad out to each zone. */
export function buildRoads(resources: Resources, arms: number) {
  const root = new THREE.Group();
  const place = (name: ModelName, x: number, z: number, rotY = 0) => {
    const tile = normalize(resources.model(name), TILE);
    tile.position.set(x, 0.005, z);
    tile.rotation.y = rotY;
    root.add(tile);
  };
  place("roads/road-crossroad", 0, 0);
  for (let i = 1; i <= arms; i++) {
    const d = i * TILE;
    // The kit's straight tile runs along X, so the north/south arms turn 90°.
    place("roads/road-straight", 0, -d, Math.PI / 2);
    place("roads/road-straight", 0, d, Math.PI / 2);
    place("roads/road-straight", d, 0);
    place("roads/road-straight", -d, 0);
  }
  const end = (arms + 1) * TILE;
  place("roads/road-end-round", 0, -end, -Math.PI / 2);
  place("roads/road-end-round", 0, end, Math.PI / 2);
  place("roads/road-end-round", end, 0, Math.PI);
  place("roads/road-end-round", -end, 0, 0);
  return batchStatic(root, { castShadow: false });
}

type ScatterKind = { models: ModelName[]; scale: [number, number]; weight: number; collider?: number };

const SCATTER: ScatterKind[] = [
  { models: ["nature/tree_oak_fall", "nature/tree_default_fall", "nature/tree_fat_fall", "nature/tree_detailed_fall", "nature/tree_blocks_fall", "nature/tree_simple_fall", "nature/tree_pineRoundA", "nature/tree_default"], scale: [3, 4.2], weight: 5, collider: 0.7 },
  { models: ["nature/plant_bush", "nature/plant_bushLarge", "nature/plant_bushSmall"], scale: [3, 4.5], weight: 4 },
  { models: ["nature/rock_largeA", "nature/rock_smallA"], scale: [2.5, 4], weight: 2, collider: 0.8 },
  { models: ["nature/rock_tallA"], scale: [2, 3], weight: 0.6, collider: 1.2 },
  { models: ["nature/flower_redA", "nature/flower_yellowA", "nature/flower_purpleA"], scale: [4, 6], weight: 4 },
  { models: ["nature/grass", "nature/grass_large"], scale: [4, 6], weight: 5 },
  { models: ["nature/mushroom_redGroup", "nature/stump_round", "nature/log"], scale: [3, 4], weight: 1 },
];

/**
 * Seeded scatter of nature props around the zones, plus a dense tree border
 * with an invisible wall so you can't drive off into nothing.
 */
export function buildDecor(resources: Resources, physics: Physics, keepouts: Keepout[], { count = 170, radius = 62, border = 70 } = {}) {
  const rand = mulberry32(20240917);
  const root = new THREE.Group();
  const totalWeight = SCATTER.reduce((s, k) => s + k.weight, 0);

  const place = (kind: ScatterKind, x: number, z: number) => {
    const name = kind.models[Math.floor(rand() * kind.models.length)]!;
    const scale = kind.scale[0] + rand() * (kind.scale[1] - kind.scale[0]);
    const obj = normalize(resources.model(name), scale);
    obj.position.set(x, 0, z);
    obj.rotation.y = rand() * Math.PI * 2;
    root.add(obj);
    if (kind.collider) {
      const size = obj.userData.size as THREE.Vector3;
      const w = Math.min(size.x, size.z) * (kind.collider < 1 ? 0.3 : 0.7);
      physics.addStaticBox(new THREE.Vector3(x, size.y / 2, z), new THREE.Vector3(w, size.y, w), obj.rotation.y);
    }
  };

  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < count * 20) {
    attempts++;
    const a = rand() * Math.PI * 2;
    const r = 8 + Math.sqrt(rand()) * (radius - 8);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (blocked(x, z, keepouts)) continue;
    let pick = rand() * totalWeight;
    const kind = SCATTER.find((k) => (pick -= k.weight) < 0) ?? SCATTER[0]!;
    place(kind, x, z);
    placed++;
  }

  // Border: a ring of trees just inside the invisible walls.
  const trees = SCATTER[0]!;
  for (let i = 0; i < 4; i++) {
    for (let s = -border; s <= border; s += 5.5) {
      const jitter = (rand() - 0.5) * 3;
      const inset = border - 2 - rand() * 4;
      const [x, z] = i === 0 ? [s, -inset] : i === 1 ? [s, inset] : i === 2 ? [-inset, s] : [inset, s];
      place(trees, x + (i > 1 ? jitter : 0), z + (i < 2 ? jitter : 0));
    }
  }
  for (const [x, z, w, d] of [[0, -border, border * 2, 1], [0, border, border * 2, 1], [-border, 0, 1, border * 2], [border, 0, 1, border * 2]] as const) {
    physics.addStaticBox(new THREE.Vector3(x, 2, z), new THREE.Vector3(w, 4, d));
  }

  // Everything scattered here sways a little in the wind.
  const batched = batchStatic(root);
  const swayed = new Map<THREE.Material, THREE.Material>();
  batched.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const base = mesh.material as THREE.MeshToonMaterial;
    if (!swayed.has(base)) swayed.set(base, windMaterial(base));
    mesh.material = swayed.get(base)!;
  });
  return batched;
}
