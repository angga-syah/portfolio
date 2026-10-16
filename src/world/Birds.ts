import * as THREE from "three";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

type Bird = { group: THREE.Group; left: THREE.Object3D; right: THREE.Object3D; center: THREE.Vector2; radius: number; height: number; speed: number; phase: number };

/** A few low-poly gulls circling lazily overhead. */
export class Birds {
  private birds: Bird[] = [];

  constructor(scene: THREE.Scene, count = 7) {
    const body = new THREE.ConeGeometry(0.16, 0.8, 5);
    body.rotateX(Math.PI / 2);
    const wing = new THREE.BufferGeometry();
    wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.25, 0, 0, -0.2, 1.1, 0, -0.05, 0, 0, 0.25, 1.1, 0, -0.05, 0, 0, -0.2], 3));
    wing.computeVertexNormals();
    const white = toonMaterial(PALETTE.cream);
    const wingMat = toonMaterial("#dbe8f0").clone();
    wingMat.side = THREE.DoubleSide;

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.add(new THREE.Mesh(body, white));
      const left = new THREE.Mesh(wing, wingMat);
      const right = new THREE.Mesh(wing, wingMat);
      right.scale.x = -1;
      group.add(left, right);
      group.traverse((o) => ((o as THREE.Mesh).castShadow = true));
      const s = 0.9 + Math.random() * 0.5;
      group.scale.setScalar(s);
      scene.add(group);
      this.birds.push({
        group,
        left,
        right,
        center: new THREE.Vector2((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50),
        radius: 12 + Math.random() * 18,
        height: 11 + Math.random() * 6,
        speed: (0.18 + Math.random() * 0.12) * (i % 2 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(elapsed: number) {
    for (const b of this.birds) {
      const a = b.phase + elapsed * b.speed;
      const x = b.center.x + Math.cos(a) * b.radius;
      const z = b.center.y + Math.sin(a) * b.radius;
      const y = b.height + Math.sin(elapsed * 0.7 + b.phase) * 1.2;
      // Face along the circle's tangent.
      const tx = -Math.sin(a) * Math.sign(b.speed);
      const tz = Math.cos(a) * Math.sign(b.speed);
      b.group.position.set(x, y, z);
      b.group.rotation.set(0, Math.atan2(tx, tz), -0.25 * Math.sign(b.speed));
      // Flap in bursts, glide in between.
      const flapping = Math.sin(elapsed * 0.9 + b.phase) > -0.2;
      const flap = flapping ? Math.sin(elapsed * 11 + b.phase) * 0.6 : 0.12;
      b.left.rotation.z = flap;
      b.right.rotation.z = -flap;
    }
  }
}
