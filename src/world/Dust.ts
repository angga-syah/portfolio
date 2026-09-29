import * as THREE from "three";

const COUNT = 140;
const LIFETIME = 0.8;

/** Puffs kicked up behind the rear wheels when driving hard. */
export class Dust {
  points: THREE.Points;
  private life = new Float32Array(COUNT);
  private vel = new Float32Array(COUNT * 3);
  private cursor = 0;
  private spawnAcc = 0;

  constructor(scene: THREE.Scene, color: string) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) positions[i * 3 + 1] = -50;
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.points = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color, size: 0.45, transparent: true, opacity: 0.55, depthWrite: false })
    );
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  /** One-off puff ring (landings, teleports). */
  burst(at: THREE.Vector3, count = 24, power = 3) {
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    for (let n = 0; n < count; n++) {
      const i = (this.cursor = (this.cursor + 1) % COUNT);
      const a = (n / count) * Math.PI * 2;
      this.life[i] = LIFETIME * 1.3;
      this.vel[i * 3] = Math.cos(a) * power;
      this.vel[i * 3 + 1] = 0.5 + Math.random() * 0.8;
      this.vel[i * 3 + 2] = Math.sin(a) * power;
      pos.setXYZ(i, at.x, 0.2, at.z);
    }
    pos.needsUpdate = true;
  }

  /** `emitters` are world positions (rear wheels); `rate` 0…1 how hard to puff. */
  update(dt: number, emitters: THREE.Vector3[], rate: number) {
    const pos = this.points.geometry.attributes.position as THREE.BufferAttribute;
    this.spawnAcc += rate * dt * 60;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      for (const e of emitters) {
        const i = (this.cursor = (this.cursor + 1) % COUNT);
        this.life[i] = LIFETIME;
        this.vel[i * 3] = (Math.random() - 0.5) * 1.4;
        this.vel[i * 3 + 1] = 0.8 + Math.random() * 0.9;
        this.vel[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
        pos.setXYZ(i, e.x + (Math.random() - 0.5) * 0.4, 0.15, e.z + (Math.random() - 0.5) * 0.4);
      }
    }
    for (let i = 0; i < COUNT; i++) {
      if (this.life[i]! <= 0) continue;
      this.life[i]! -= dt;
      if (this.life[i]! <= 0) {
        pos.setY(i, -50);
        continue;
      }
      pos.setXYZ(i, pos.getX(i) + this.vel[i * 3]! * dt, pos.getY(i) + this.vel[i * 3 + 1]! * dt, pos.getZ(i) + this.vel[i * 3 + 2]! * dt);
    }
    pos.needsUpdate = true;
  }
}
