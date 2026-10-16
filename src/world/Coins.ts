import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { textGeometry } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

function positionsAndNormals(g: THREE.BufferGeometry) {
  const src = g.index ? g.toNonIndexed() : g;
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", src.getAttribute("position"));
  out.setAttribute("normal", src.getAttribute("normal"));
  return out;
}

/**
 * A coin standing on edge (faces ±Z) with "Rp" embossed on both faces.
 * Material slots: 0 = coin, 1 = lettering.
 */
export function coinGeometry(font: Font, radius: number, thickness: number) {
  const disc = new THREE.CylinderGeometry(radius, radius, thickness, 32);
  disc.rotateX(Math.PI / 2);
  const rim = new THREE.TorusGeometry(radius * 0.84, radius * 0.05, 6, 32);
  rim.translate(0, 0, thickness / 2);
  const rimBack = rim.clone().rotateY(Math.PI);
  const { geometry: rp } = textGeometry(font, "Rp", { size: radius * 0.72, depth: thickness * 0.35, align: "center", anchor: "middle", curveSegments: 4 });
  rp.translate(radius * 0.04, 0, thickness / 2);
  const rpBack = rp.clone().rotateY(Math.PI);
  const merged = mergeGeometries([disc, rim, rimBack, rp, rpBack].map(positionsAndNormals), true)!;
  merged.groups.forEach((g, i) => (g.materialIndex = i < 1 ? 0 : 1));
  return merged;
}

export function coinMaterials() {
  return [toonMaterial(PALETTE.gold), toonMaterial(PALETTE.goldDark)];
}

type Coin = { mesh: THREE.Mesh; beam: THREE.Mesh; base: THREE.Vector3; taken: number };

/** Spinning gold "Rp" coins to collect while exploring. */
export class Coins {
  group = new THREE.Group();
  collected = 0;
  total: number;
  meshes: THREE.Mesh[] = [];
  onCollect: (collected: number, total: number, at: THREE.Vector3) => void = () => {};
  private coins: Coin[] = [];
  /** Tall light beams over uncollected coins (race mode), visible from afar. */
  private showBeams = false;

  constructor(scene: THREE.Scene, font: Font, positions: THREE.Vector3[]) {
    const geo = coinGeometry(font, 0.55, 0.16);
    const mats = coinMaterials();
    const beamGeo = new THREE.CylinderGeometry(0.28, 0.28, 16, 12, 1, true);
    beamGeo.translate(0, 8, 0);
    const beamMat = new THREE.MeshBasicMaterial({ color: PALETTE.gold, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    for (const p of positions) {
      const mesh = new THREE.Mesh(geo, mats);
      mesh.castShadow = true;
      mesh.position.copy(p);
      this.group.add(mesh);
      this.meshes.push(mesh);
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(p.x, 0, p.z);
      beam.visible = false;
      beam.renderOrder = 3;
      this.group.add(beam);
      this.coins.push({ mesh, beam, base: p.clone(), taken: -1 });
    }
    this.total = positions.length;
    scene.add(this.group);
  }

  setBeams(on: boolean) {
    this.showBeams = on;
    for (const c of this.coins) c.beam.visible = on && c.taken < 0;
  }

  /** Where the coins still waiting to be picked up are. */
  remaining() {
    return this.coins.filter((c) => c.taken < 0).map((c) => c.base);
  }

  /** Put every coin back (race start). */
  reset() {
    this.collected = 0;
    for (const c of this.coins) {
      c.taken = -1;
      c.mesh.visible = true;
      c.mesh.scale.setScalar(1);
      c.mesh.position.copy(c.base);
      c.beam.visible = this.showBeams;
    }
  }

  update(car: THREE.Vector3, elapsed: number, dt: number) {
    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i]!;
      const m = coin.mesh;
      if (coin.taken < 0) {
        m.rotation.y = elapsed * 2.5 + i;
        m.position.y = coin.base.y + Math.sin(elapsed * 3 + i) * 0.15;
        if (Math.hypot(car.x - m.position.x, car.z - m.position.z) < 1.9 && Math.abs(car.y - m.position.y) < 3) {
          coin.taken = 0;
          coin.beam.visible = false;
          this.collected++;
          this.onCollect(this.collected, this.total, m.position.clone());
        }
      } else if (coin.taken < 1) {
        // Pop up, spin fast, shrink away.
        coin.taken = Math.min(1, coin.taken + dt * 2.2);
        const k = coin.taken;
        m.position.y = coin.base.y + k * 3;
        m.rotation.y += dt * 20;
        m.scale.setScalar(1 - k * k);
        if (k >= 1) m.visible = false;
      }
    }
  }
}
