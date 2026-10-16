import * as THREE from "three";

// Three ways to watch the van:
//  diorama — fixed-angle follow camera (never rotates with the car), like a
//            tabletop. The offset looks from the south-east so the world's
//            south-facing boards read straight on.
//  chase   — behind the van, turning with it (Euro Truck Simulator style).
//  cockpit — from the driver's seat.
export type CameraMode = "diorama" | "chase" | "cockpit";
export const CAMERA_MODES: CameraMode[] = ["diorama", "chase", "cockpit"];

const OFFSET = new THREE.Vector3(10.5, 14, 13);
const INTRO_OFFSET = new THREE.Vector3(-14, 30, 34);
const INTRO_DURATION = 2.6;

/** `object` follows the physics body; `cabin` also carries the visual lean. */
export type CarPose = { object: THREE.Object3D; cabin: THREE.Object3D; eye: THREE.Vector3; speed: number };

export class CameraRig {
  camera: THREE.PerspectiveCamera;
  target = new THREE.Vector3();
  mode: CameraMode = "diorama";
  zoom = 1;
  private zoomTarget = 1;
  /** Extra distance on portrait screens so nearby props still fit. */
  private fit = 1;
  private aspect = 1;
  private intro = -1; // <0: waiting, 0…1 playing, 1 done
  private lead = new THREE.Vector3();
  private trauma = 0;
  private chaseYaw = 0;
  private chaseReady = false;
  private fov = 40;
  /** Scripted shot (museum tour): when set, the camera glides here instead. */
  override: { pos: THREE.Vector3; look: THREE.Vector3 } | null = null;
  private overrideLook = new THREE.Vector3();
  private overriding = false;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 250);
    this.camera.position.copy(INTRO_OFFSET);
    this.camera.lookAt(0, 0, 0);
  }

  /** Add screen shake (0…1, decays quickly). */
  shake(amount: number) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  startIntro() {
    if (this.intro < 0) this.intro = 0;
  }

  get introDone() {
    return this.intro >= 1;
  }

  setMode(mode: CameraMode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.chaseReady = false;
    this.intro = Math.max(this.intro, 1);
    this.camera.near = mode === "cockpit" ? 0.05 : 0.5;
    this.camera.updateProjectionMatrix();
  }

  /** Where the shadow frustum should centre: ahead of the camera when it looks down the road. */
  get shadowFocus() {
    if (this.mode === "diorama") return this.target;
    const dir = new THREE.Vector3(Math.sin(this.chaseYaw), 0, Math.cos(this.chaseYaw));
    return this.target.clone().addScaledVector(dir, 14);
  }

  onWheel(deltaY: number) {
    this.zoomTarget = THREE.MathUtils.clamp(this.zoomTarget + deltaY * 0.0012, 0.6, 1.8);
  }

  resize(aspect: number) {
    this.aspect = aspect;
    this.camera.aspect = aspect;
    this.fit = aspect < 1 ? THREE.MathUtils.clamp(1.25 / aspect, 1.25, 2) : 1;
    this.camera.updateProjectionMatrix();
  }

  /** Snap straight onto the target (used by the dev step hook / resets). */
  snap(focus: THREE.Vector3) {
    this.target.copy(focus);
    this.chaseReady = false;
    if (this.mode !== "diorama") return;
    this.camera.position.copy(focus).addScaledVector(OFFSET, this.zoom * this.fit);
    this.camera.lookAt(this.target);
  }

  update(focus: THREE.Vector3, velocity: THREE.Vector3, dt: number, car?: CarPose) {
    this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 6);
    if (this.override) {
      if (!this.overriding) {
        // Start the glide from wherever the camera is looking now.
        this.overrideLook.copy(this.camera.position).add(this.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(15));
        this.overriding = true;
      }
      this.setFov(45, dt);
      this.camera.position.lerp(this.override.pos, Math.min(1, dt * 1.6));
      this.overrideLook.lerp(this.override.look, Math.min(1, dt * 2.2));
      this.camera.lookAt(this.overrideLook);
      this.chaseReady = false;
      return;
    }
    this.overriding = false;
    if (car && this.mode === "chase") this.updateChase(car, dt);
    else if (car && this.mode === "cockpit") this.updateCockpit(car, dt);
    else this.updateDiorama(focus, velocity, dt);

    if (this.trauma > 0) {
      const s = this.trauma * this.trauma * (this.mode === "cockpit" ? 0.08 : 0.35);
      const t = performance.now() * 0.05;
      this.camera.position.x += Math.sin(t * 1.3) * s;
      this.camera.position.y += Math.sin(t * 1.7 + 1) * s;
      this.camera.rotation.z += Math.sin(t * 1.1 + 2) * s * 0.05;
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
    }
  }

  private setFov(fov: number, dt: number) {
    // Portrait screens need a wider view to see the road ahead.
    const target = this.aspect < 1 ? fov + 18 : fov;
    const next = this.fov + (target - this.fov) * Math.min(1, dt * 4);
    if (Math.abs(next - this.camera.fov) > 0.01) {
      this.camera.fov = next;
      this.camera.updateProjectionMatrix();
    }
    this.fov = next;
  }

  private updateDiorama(focus: THREE.Vector3, velocity: THREE.Vector3, dt: number) {
    this.setFov(40, dt * 3);
    // Look slightly ahead of the car so you see where you're going.
    this.lead.lerp(new THREE.Vector3(velocity.x, 0, velocity.z).multiplyScalar(0.28), Math.min(1, dt * 2));
    const goal = focus.clone().add(this.lead);
    goal.y = 0;
    this.target.lerp(goal, Math.min(1, dt * 5));

    const offset = OFFSET.clone().multiplyScalar(this.zoom * this.fit);
    if (this.intro >= 0 && this.intro < 1) {
      this.intro = Math.min(1, this.intro + dt / INTRO_DURATION);
      const k = 1 - Math.pow(1 - this.intro, 3);
      offset.lerpVectors(INTRO_OFFSET, offset, k);
    } else if (this.intro < 0) {
      // Slow drift while the start prompt is up.
      const a = performance.now() * 0.00008;
      offset.copy(INTRO_OFFSET).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(a) * 0.3);
    }
    this.camera.position.lerp(this.target.clone().add(offset), this.chaseReady ? 1 : Math.min(1, dt * 4));
    this.chaseReady = this.camera.position.distanceTo(this.target.clone().add(offset)) < 0.5;
    this.camera.lookAt(this.target);
  }

  private updateChase(car: CarPose, dt: number) {
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(car.object.quaternion);
    const heading = Math.atan2(fwd.x, fwd.z);
    if (!this.chaseReady) {
      this.chaseYaw = heading;
    } else {
      // Swing round behind the van with a little lag, like a towed camera.
      let d = heading - this.chaseYaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.chaseYaw += d * Math.min(1, dt * 3.5);
    }
    const dir = new THREE.Vector3(Math.sin(this.chaseYaw), 0, Math.cos(this.chaseYaw));
    const speed = Math.abs(car.speed);
    const back = (6.2 + speed * 0.06) * this.zoom;
    const up = 2.6 * this.zoom;
    const pos = car.object.position;
    const desired = pos.clone().addScaledVector(dir, -back);
    desired.y = Math.max(pos.y, 0) + up;
    const k = this.chaseReady ? Math.min(1, dt * 10) : Math.min(1, dt * 5);
    this.camera.position.lerp(desired, k);
    this.target.copy(pos).addScaledVector(dir, 5);
    this.target.y = Math.max(pos.y, 0) + 0.9;
    this.camera.lookAt(this.target);
    this.chaseReady = true;
    this.setFov(60 + Math.min(speed, 25) * 0.5, dt);
  }

  private updateCockpit(car: CarPose, dt: number) {
    const obj = car.cabin;
    // Fresh matrices, otherwise the view lags a frame behind the van and shakes.
    obj.updateWorldMatrix(true, false);
    this.camera.position.copy(car.eye).applyMatrix4(obj.matrixWorld);
    // Camera looks down -z; the van's nose is +z, so turn around, then dip slightly.
    const q = new THREE.Quaternion();
    obj.getWorldQuaternion(q);
    this.camera.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.08, Math.PI, 0)));
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    this.chaseYaw = Math.atan2(fwd.x, fwd.z);
    this.target.copy(car.object.position);
    this.chaseReady = false;
    this.setFov(68 + Math.min(Math.abs(car.speed), 25) * 0.3, dt);
  }
}
