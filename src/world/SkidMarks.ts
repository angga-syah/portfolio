import * as THREE from "three";
import { PALETTE } from "./palette";

const MAX = 600;
const SPACING = 0.22;
const LIFETIME = 9;

/** Tyre marks: a ring buffer of small dark quads laid on the ground. */
export class SkidMarks {
  mesh: THREE.InstancedMesh;
  private cursor = 0;
  private born = new Float32Array(MAX).fill(-1e9);
  private last: (THREE.Vector3 | null)[] = [null, null, null, null];
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private hidden = new THREE.Matrix4().makeScale(0, 0, 0);

  constructor(scene: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(0.26, SPACING * 1.25);
    geo.rotateX(-Math.PI / 2);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: PALETTE.shadow, transparent: true, opacity: 0.35, depthWrite: false }), MAX);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    for (let i = 0; i < MAX; i++) this.mesh.setMatrixAt(i, this.hidden);
    scene.add(this.mesh);
  }

  /** `points[i]` is wheel i's contact while skidding; missing wheels break their trail. */
  update(elapsed: number, points: { point: THREE.Vector3; yaw: number; wheel: number }[]) {
    const seen = [false, false, false, false];
    for (const { point, yaw, wheel } of points) {
      seen[wheel] = true;
      const prev = this.last[wheel];
      if (prev && prev.distanceTo(point) < SPACING) continue;
      this.last[wheel] = point.clone();
      this.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      this.s.set(1, 1, 1);
      this.m.compose(new THREE.Vector3(point.x, 0.11, point.z), this.q, this.s);
      this.mesh.setMatrixAt(this.cursor, this.m);
      this.born[this.cursor] = elapsed;
      this.cursor = (this.cursor + 1) % MAX;
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    for (let w = 0; w < 4; w++) if (!seen[w]) this.last[w] = null;

    // Expire old marks (cheap: check a slice per frame).
    for (let n = 0; n < 20; n++) {
      const i = (this.cursor + n) % MAX;
      if (this.born[i]! > -1e8 && elapsed - this.born[i]! > LIFETIME) {
        this.mesh.setMatrixAt(i, this.hidden);
        this.born[i] = -1e9;
        this.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}
