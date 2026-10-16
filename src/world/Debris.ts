import * as THREE from "three";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

type Piece = { pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Euler; spin: THREE.Vector3; life: number; landed: boolean; color: number };

type DebrisOptions = {
  max: number;
  size: [number, number, number];
  colors: string[];
  /** Terminal fall speed — low for paper, which drifts. */
  terminal: number;
  /** How long pieces lie on the ground before shrinking away. */
  rest: number;
  flutter: number;
};

/**
 * Pooled flying bits (paper sheets, confetti) as one instanced mesh:
 * burst out, flutter down, lie on the ground a while, shrink away.
 */
export class Debris {
  mesh: THREE.InstancedMesh;
  private pieces: Piece[] = [];
  private cursor = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private scale = new THREE.Vector3();
  private colors: THREE.Color[];

  constructor(scene: THREE.Scene, private opts: DebrisOptions) {
    const [w, h, d] = opts.size;
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, d), toonMaterial("#ffffff"), opts.max);
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.colors = opts.colors.map((c) => new THREE.Color(c));
    for (let i = 0; i < opts.max; i++) {
      this.pieces.push({ pos: new THREE.Vector3(0, -50, 0), vel: new THREE.Vector3(), rot: new THREE.Euler(), spin: new THREE.Vector3(), life: 0, landed: false, color: 0 });
      this.mesh.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
      this.mesh.setColorAt(i, this.colors[i % this.colors.length]!);
    }
    scene.add(this.mesh);
  }

  burst(at: THREE.Vector3, count: number, power = 6, direction = new THREE.Vector3()) {
    for (let n = 0; n < count; n++) {
      const p = this.pieces[this.cursor]!;
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.opts.max;
      p.pos.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, Math.random() * 0.5, (Math.random() - 0.5) * 0.8));
      const a = Math.random() * Math.PI * 2;
      const r = (0.4 + Math.random() * 0.6) * power * 0.5;
      p.vel.set(Math.cos(a) * r, power * (0.6 + Math.random() * 0.6), Math.sin(a) * r).addScaledVector(direction, 0.4);
      p.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.spin.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      p.life = 0;
      p.landed = false;
      this.mesh.setColorAt(i, this.colors[Math.floor(Math.random() * this.colors.length)]!);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number, elapsed: number) {
    const { terminal, rest, flutter } = this.opts;
    let dirty = false;
    for (let i = 0; i < this.pieces.length; i++) {
      const p = this.pieces[i]!;
      if (p.pos.y < -10) continue;
      dirty = true;
      p.life += dt;
      let s = 1;
      if (!p.landed) {
        p.vel.y = Math.max(p.vel.y - 18 * dt, -terminal);
        // Air drag + a side-to-side flutter while falling.
        p.vel.x *= 1 - dt * 1.2;
        p.vel.z *= 1 - dt * 1.2;
        p.pos.addScaledVector(p.vel, dt);
        p.pos.x += Math.sin(elapsed * 5 + i) * flutter * dt;
        p.rot.x += p.spin.x * dt;
        p.rot.y += p.spin.y * dt;
        p.rot.z += p.spin.z * dt;
        if (p.pos.y <= 0.13) {
          p.pos.y = 0.13;
          p.landed = true;
          p.life = 0;
          p.rot.set(0, p.rot.y, 0);
        }
      } else {
        s = THREE.MathUtils.clamp(1 - (p.life - rest), 0, 1);
        if (s <= 0) p.pos.y = -50;
      }
      this.q.setFromEuler(p.rot);
      this.scale.setScalar(s);
      this.m.compose(p.pos, this.q, this.scale);
      this.mesh.setMatrixAt(i, this.m);
    }
    if (dirty) this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export const paperDebris = (scene: THREE.Scene) =>
  new Debris(scene, { max: 90, size: [0.42, 0.015, 0.56], colors: [PALETTE.cream, "#eef6fb", "#fff7d6"], terminal: 1.3, rest: 7, flutter: 2.2 });

export const confettiDebris = (scene: THREE.Scene) =>
  new Debris(scene, { max: 260, size: [0.16, 0.02, 0.26], colors: [PALETTE.gold, PALETTE.emerald, PALETTE.coral, "#38bdf8", PALETTE.cream], terminal: 2.2, rest: 5, flutter: 3 });
