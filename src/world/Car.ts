import * as THREE from "three";
import * as CANNON from "cannon-es";
import type { Physics } from "./Physics";
import type { Controls } from "./Controls";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { dominantHue, recolorVertices, toonMaterial } from "./materials";
import { Text3D, roundedSlab } from "./Text3D";
import { PALETTE } from "./palette";

// Calibrated against cannon-es with indexForwardAxis = 2 (the van's nose is +Z):
// a negative engine force drives forward, a positive steering value turns left.
const ENGINE_SIGN = -1;
const STEER_SIGN = -1;

const CFG = {
  mass: 120,
  engine: 300, // per wheel, all-wheel drive
  boost: 1.7,
  maxSpeed: 17, // m/s
  maxReverse: 8,
  steer: 0.55,
  steerSpeed: 7,
  brake: 6,
  idleBrake: 0.7,
  wheelRadius: 0.3,
  suspensionRest: 0.35,
  // Suspension rays start at connectionY; the chassis box starts just above
  // them (the kit's wheels sit under the body, so rays can't go beside it).
  connectionY: 0.1,
  chassisHalf: new CANNON.Vec3(0.72, 0.415, 1.35),
  chassisOffsetY: 0.535,
  // Where the model's ground line sits relative to the body at rest
  // (wheel centre at rest is connectionY - 0.2, model wheel centre is 0.3).
  modelOffsetY: -0.4,
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const steerQ = new THREE.Quaternion();
const spinQ = new THREE.Quaternion();

const WHEELS = ["wheel-front-left", "wheel-front-right", "wheel-back-left", "wheel-back-right"] as const;

export class Car {
  object = new THREE.Group();
  body: CANNON.Body;
  vehicle: CANNON.RaycastVehicle;
  /** Signed forward speed in m/s. */
  speed = 0;
  /** Visual-only body lean (pitch on throttle/brake, roll in corners). */
  tilt = new THREE.Group();
  /** While held (before the intro drop) the car hangs out of view. */
  held = false;
  private wheels: THREE.Object3D[] = [];
  private model: THREE.Object3D;
  /** Driver's-eye interior, shown instead of the body in cockpit camera. */
  cockpit = new THREE.Group();
  private steeringWheel = new THREE.Group();
  private speedo: Text3D;
  private speedoValue = -1;
  private steering = 0;
  /** Roof sign (the "MBG" board). */
  private coin: THREE.Object3D;
  private livery: THREE.Object3D;
  private prevSpeed = 0;
  private prevYaw = 0;
  private lean = new THREE.Vector2();
  private upsideDownTime = 0;
  private stuckTime = 0;
  /** Last spot where all four wheels sat on flat ground — where "unstuck" puts you back. */
  private safe = { pos: new THREE.Vector3(), yaw: 0, at: 0 };
  /** Called after the van was lifted out of a stuck spot. */
  onUnstuck: () => void = () => {};
  private spawn: THREE.Vector3;
  private spawnYaw: number;

  constructor(physics: Physics, model: THREE.Object3D, scene: THREE.Scene, font: Font, spawn: THREE.Vector3, spawnYaw = 0) {
    this.spawn = spawn.clone();
    this.spawnYaw = spawnYaw;
    this.paint(model);

    // Pull the wheels out into their own pivots centred on each hub, so the
    // vehicle's wheel transforms can drive them directly.
    model.updateMatrixWorld(true);
    const hubs: THREE.Vector3[] = [];
    for (const name of WHEELS) {
      const node = model.getObjectByName(name);
      if (!node) throw new Error(`Van is missing ${name}`);
      const center = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
      const pivot = new THREE.Group();
      pivot.position.copy(center);
      model.add(pivot);
      pivot.updateMatrixWorld(true);
      pivot.attach(node);
      model.remove(pivot);
      pivot.position.set(0, 0, 0);
      scene.add(pivot);
      this.wheels.push(pivot);
      hubs.push(center);
    }

    model.position.y = CFG.modelOffsetY;
    this.model = model;
    this.tilt.add(model);
    this.speedo = new Text3D(font, toonMaterial(PALETTE.gold), { size: 0.042, depth: 0.006, align: "center", anchor: "middle" });
    this.buildCockpit();
    this.tilt.add(this.cockpit);
    this.coin = this.makeRoofSign(font);
    this.tilt.add(this.coin);
    this.livery = this.makeLivery(font);
    this.tilt.add(this.livery);
    this.object.add(this.tilt);
    scene.add(this.object);

    this.body = new CANNON.Body({ mass: CFG.mass, angularDamping: 0.5, linearDamping: 0.05 });
    this.body.addShape(new CANNON.Box(CFG.chassisHalf), new CANNON.Vec3(0, CFG.chassisOffsetY, 0));
    this.body.allowSleep = false;

    this.vehicle = new CANNON.RaycastVehicle({ chassisBody: this.body, indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 });
    for (const hub of hubs) {
      this.vehicle.addWheel({
        radius: CFG.wheelRadius,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        axleLocal: new CANNON.Vec3(1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(hub.x, CFG.connectionY, hub.z),
        suspensionStiffness: 30,
        suspensionRestLength: CFG.suspensionRest,
        maxSuspensionTravel: 0.3,
        maxSuspensionForce: 1e5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        frictionSlip: 3.5,
        rollInfluence: 0.02,
        // cannon's rolling rotation is negative going forward when Y is up;
        // a positive sliding speed keeps wheelspin turning the same way.
        customSlidingRotationalSpeed: 30,
        useCustomSlidingRotationalSpeed: true,
      });
    }
    this.vehicle.addToWorld(physics.world);
    this.reset(this.spawn, this.spawnYaw);
  }

  // MBG livery: white body, dark glass, red trim. Windows first (pale,
  // unsaturated), then the kit's paint colour, then warm accents → red.
  private paint(model: THREE.Object3D) {
    recolorVertices(model, ({ s, l }) => s < 0.4 && l > 0.74, PALETTE.glass);
    const hue = dominantHue(model);
    if (hue !== null) {
      recolorVertices(model, ({ h, s }) => s > 0.25 && Math.abs(((h - hue + 1.5) % 1) - 0.5) < 0.06, PALETTE.putih);
    }
    recolorVertices(model, ({ h, s, l }) => s > 0.35 && l > 0.2 && (h < 0.14 || h > 0.95), PALETTE.merah);
  }

  /** Red side stripes with "MBG" lettering on both flanks. */
  private makeLivery(font: Font) {
    const g = new THREE.Group();
    const red = toonMaterial(PALETTE.merah);
    for (const side of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 2.25), red);
      stripe.position.set(side * 0.755, CFG.modelOffsetY + 0.7, -0.15);
      const label = new Text3D(font, red, { size: 0.24, depth: 0.02, align: "center", anchor: "middle" }, "MBG");
      label.rotation.y = side * (Math.PI / 2);
      label.position.set(side * 0.752, CFG.modelOffsetY + 0.93, -0.35);
      label.castShadow = false;
      g.add(stripe, label);
    }
    // Small white "tray" emblem next to the lettering: a food tray with compartments.
    for (const side of [-1, 1]) {
      const tray = new THREE.Mesh(roundedSlab(0.3, 0.19, 0.02, 0.04), toonMaterial("#c9d3dc"));
      tray.rotation.y = side * (Math.PI / 2);
      tray.position.set(side * 0.755, CFG.modelOffsetY + 0.93, 0.35);
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.17, 0.02), red);
      div.position.set(side * 0.765, CFG.modelOffsetY + 0.93, 0.35);
      g.add(tray, div);
    }
    return g;
  }

  /** Roof sign: red board with "MBG" in white on both faces. */
  private makeRoofSign(font: Font) {
    const group = new THREE.Group();
    const board = new THREE.Mesh(roundedSlab(0.95, 0.36, 0.1, 0.1), toonMaterial(PALETTE.merah));
    board.castShadow = true;
    const white = toonMaterial(PALETTE.putih);
    for (const face of [1, -1]) {
      const t = new Text3D(font, white, { size: 0.2, depth: 0.03, align: "center", anchor: "middle" }, "MBG");
      t.position.z = face * 0.05;
      if (face < 0) t.rotation.y = Math.PI;
      t.castShadow = false;
      group.add(t);
    }
    const postGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8);
    for (const x of [-0.3, 0.3]) {
      const post = new THREE.Mesh(postGeo, toonMaterial(PALETTE.merahDark));
      post.position.set(x, -0.28, 0);
      group.add(post);
    }
    group.add(board);
    group.position.set(0, CFG.modelOffsetY + 1.35 + 0.4, -0.1);
    return group;
  }

  /** Local position of the driver's eyes (right-hand drive, as in Indonesia). */
  static readonly EYE = new THREE.Vector3(-0.3, 0.92, 0.05);

  private buildCockpit() {
    const dark = toonMaterial("#223246");
    const trim = toonMaterial(PALETTE.merahDark);
    const dash = new THREE.Mesh(roundedSlab(1.3, 0.16, 0.42, 0.06), dark);
    dash.position.set(0, 0.52, 0.72);
    dash.rotation.x = -0.12;
    // A-pillars, roof edge and bonnet so you feel inside a vehicle.
    const pillarGeo = new THREE.BoxGeometry(0.07, 0.7, 0.07);
    for (const side of [-1, 1]) {
      const p = new THREE.Mesh(pillarGeo, trim);
      p.position.set(side * 0.66, 0.85, 0.78);
      p.rotation.x = -0.35;
      this.cockpit.add(p);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.12), trim);
    roof.position.set(0, 1.28, 0.74);
    const bonnet = new THREE.Mesh(roundedSlab(1.45, 0.7, 0.06, 0.2), toonMaterial(PALETTE.putih));
    bonnet.rotation.x = -Math.PI / 2 + 0.1;
    bonnet.position.set(0, 0.5, 1.12);
    // Steering wheel in front of the driver.
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 28), dark);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 12), trim);
    hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.025, 0.02), dark);
      spoke.rotation.z = (i * Math.PI * 2) / 3 - Math.PI / 2;
      spoke.position.set(Math.cos(spoke.rotation.z) * 0.085, Math.sin(spoke.rotation.z) * 0.085, 0);
      this.steeringWheel.add(spoke);
    }
    this.steeringWheel.add(rim, hub);
    this.steeringWheel.position.set(Car.EYE.x, 0.67, 0.5);
    this.steeringWheel.scale.setScalar(0.85);
    this.steeringWheel.rotation.x = -0.45;
    // Speedometer on the dash.
    const gauge = new THREE.Mesh(roundedSlab(0.26, 0.12, 0.02, 0.03), toonMaterial("#0f1b28"));
    gauge.position.set(Car.EYE.x + 0.34, 0.64, 0.66);
    gauge.rotation.x = -0.45;
    // Slightly nearer the driver than the gauge face so it isn't hidden behind it.
    this.speedo.position.set(Car.EYE.x + 0.34, 0.645, 0.645);
    this.speedo.rotation.x = -0.45;
    this.speedo.castShadow = false;
    this.cockpit.add(dash, roof, bonnet, this.steeringWheel, gauge, this.speedo);
    // Rotate the wheel/gauge to face the driver (camera looks toward +z).
    for (const o of [this.steeringWheel, gauge, this.speedo]) o.rotation.y = Math.PI;
    this.cockpit.visible = false;
  }

  /** Swap the exterior body for the interior (cockpit camera). */
  setCockpit(on: boolean) {
    this.model.visible = !on;
    this.coin.visible = !on;
    this.livery.visible = !on;
    this.cockpit.visible = on;
  }

  /** Hide the car and keep it parked out of view until `drop()`. */
  hold() {
    this.held = true;
    this.setVisible(false);
    this.body.position.set(this.spawn.x, 60, this.spawn.z);
    this.body.velocity.setZero();
    this.body.angularVelocity.setZero();
  }

  /** Intro: fall from the sky onto the spawn point. */
  drop(height = 9) {
    this.held = false;
    this.setVisible(true);
    this.reset(this.spawn, this.spawnYaw);
    this.body.position.y = height;
    this.body.velocity.set(0, -4, 0);
    this.body.angularVelocity.set(0.6, 0, 0.3);
  }

  private setVisible(v: boolean) {
    this.object.visible = v;
    for (const w of this.wheels) w.visible = v;
  }

  reset(position = this.spawn, yaw = this.spawnYaw) {
    this.body.position.set(position.x, position.y + 1.2, position.z);
    this.body.quaternion.setFromEuler(0, yaw, 0);
    this.body.velocity.setZero();
    this.body.angularVelocity.setZero();
    this.steering = 0;
    this.upsideDownTime = 0;
    this.stuckTime = 0;
    this.safe.pos.set(position.x, 0, position.z);
    this.safe.yaw = yaw;
  }

  /**
   * Flip back onto the wheels. On flat ground that's right here; when the van
   * is hung up on something (no wheel touching), go back to the last safe spot.
   */
  recover() {
    const e = new CANNON.Vec3();
    this.body.quaternion.toEuler(e);
    const onGround = this.vehicle.wheelInfos.some((w) => w.isInContact) && this.body.position.y < 0.8;
    if (onGround) this.reset(new THREE.Vector3(this.body.position.x, 0, this.body.position.z), e.y);
    else this.reset(this.safe.pos.clone(), this.safe.yaw);
  }

  get position() {
    return this.object.position;
  }

  get rearWheelPositions() {
    return [this.wheels[2]!.position, this.wheels[3]!.position];
  }

  get grounded() {
    return this.vehicle.wheelInfos.some((w) => w.isInContact);
  }

  /** Unit vector the nose points at, on the ground plane. */
  get forward() {
    const v = new THREE.Vector3(0, 0, 1).applyQuaternion(this.object.quaternion);
    v.y = 0;
    return v.normalize();
  }

  update(controls: Controls, dt: number) {
    if (this.held) {
      this.body.position.set(this.spawn.x, 60, this.spawn.z);
      this.body.velocity.setZero();
      return;
    }
    const q = this.body.quaternion;
    const localVel = q.inverse().vmult(this.body.velocity);
    this.speed = localVel.z;

    let throttle = controls.enabled ? controls.throttle : 0;
    const steerInput = controls.enabled ? controls.steer : 0;
    const boosting = controls.keys.boost;
    const maxSpeed = CFG.maxSpeed * (boosting ? 1.35 : 1);

    // Throttle against the direction of travel brakes first, then reverses.
    let brake = 0;
    const movingForward = this.speed > 0.8;
    const movingBackward = this.speed < -0.8;
    if ((throttle < 0 && movingForward) || (throttle > 0 && movingBackward)) {
      brake = CFG.brake * Math.abs(throttle);
      throttle = 0;
    }
    if (throttle > 0 && this.speed > maxSpeed) throttle = 0;
    if (throttle < 0 && this.speed < -CFG.maxReverse) throttle = 0;
    if (throttle === 0 && brake === 0) brake = CFG.idleBrake;
    if (controls.enabled && controls.keys.brake) brake = CFG.brake * 1.5;

    const force = throttle * CFG.engine * (boosting ? CFG.boost : 1) * ENGINE_SIGN;
    // Less steering lock at speed keeps high-speed turns controllable.
    const speedFactor = 1 - Math.min(Math.abs(this.speed) / 30, 0.55);
    const targetSteer = steerInput * CFG.steer * speedFactor;
    this.steering += (targetSteer - this.steering) * Math.min(1, CFG.steerSpeed * dt);

    for (let i = 0; i < 4; i++) {
      this.vehicle.applyEngineForce(force, i);
      this.vehicle.setBrake(brake, i);
      this.vehicle.setSteeringValue(i < 2 ? this.steering * STEER_SIGN : 0, i);
    }

    // Auto-recover when stuck on the roof or side.
    const up = q.vmult(new CANNON.Vec3(0, 1, 0));
    if (up.y < 0.3 && this.body.velocity.length() < 1.5) {
      this.upsideDownTime += dt;
      if (this.upsideDownTime > 1.5) this.recover();
    } else {
      this.upsideDownTime = 0;
    }

    // Remember safe ground; rescue the van when it's hung up with wheels in the air
    // (ramp lips, box stacks) and not going anywhere.
    const wheelsDown = this.vehicle.wheelInfos.filter((w) => w.isInContact).length;
    const slow = this.body.velocity.length() < 0.6;
    this.safe.at += dt;
    if (wheelsDown === 4 && up.y > 0.95 && this.body.position.y < 0.6 && Math.abs(this.speed) > 1 && this.safe.at > 0.5) {
      const e = new CANNON.Vec3();
      q.toEuler(e);
      // A little behind where we are now, so we don't respawn into the obstacle.
      const back = new THREE.Vector3(0, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), e.y);
      this.safe.pos.set(this.body.position.x + back.x, 0, this.body.position.z + back.z);
      this.safe.yaw = e.y;
      this.safe.at = 0;
    }
    if (up.y >= 0.3 && wheelsDown < 3 && slow && this.body.position.y > 0.5) {
      this.stuckTime += dt;
      if (this.stuckTime > 1.5) {
        this.reset(this.safe.pos.clone(), this.safe.yaw);
        this.onUnstuck();
      }
    } else {
      this.stuckTime = 0;
    }
    if (this.body.position.y < -10) this.reset();
  }

  /** Wheel contact points on the ground for wheels that are skidding. */
  skidPoints(out: { point: THREE.Vector3; yaw: number; wheel: number }[]) {
    out.length = 0;
    const hardBrake = Math.abs(this.speed) > 6 && this.vehicle.wheelInfos.some((w) => w.brake > CFG.brake);
    for (let i = 0; i < 4; i++) {
      const w = this.vehicle.wheelInfos[i]!;
      if (!w.isInContact) continue;
      if (!(w.sliding || w.skidInfo < 0.7 || (hardBrake && i >= 2))) continue;
      const p = w.raycastResult.hitPointWorld;
      out.push({ point: new THREE.Vector3(p.x, p.y, p.z), yaw: Math.atan2(this.forward.x, this.forward.z), wheel: i });
    }
    return out;
  }

  /** Copy physics state to the meshes (after the physics step). */
  sync(elapsed: number, dt = 1 / 60) {
    // Interpolated state (see Physics.step) keeps the van smooth at any refresh rate.
    const ip = this.body.interpolatedPosition;
    const iq = this.body.interpolatedQuaternion;
    this.object.position.set(ip.x, ip.y, ip.z);
    this.object.quaternion.set(iq.x, iq.y, iq.z, iq.w);
    const lag = new THREE.Vector3(ip.x - this.body.position.x, ip.y - this.body.position.y, ip.z - this.body.position.z);
    // updateWheelTransform() clears isInContact as a side effect; keep the
    // values from the physics step so grounded/skid/stuck checks stay truthful.
    const contact = this.vehicle.wheelInfos.map((w) => w.isInContact);
    for (let i = 0; i < this.wheels.length; i++) {
      this.vehicle.updateWheelTransform(i);
      this.vehicle.wheelInfos[i]!.isInContact = contact[i]!;
      const info = this.vehicle.wheelInfos[i]!;
      const t = info.worldTransform;
      const wheel = this.wheels[i]!;
      wheel.position.set(t.position.x, t.position.y, t.position.z).add(lag);
      // Rebuilt rather than copied: cannon's spin sign is inverted for Y-up.
      steerQ.setFromAxisAngle(Y_AXIS, info.steering);
      spinQ.setFromAxisAngle(X_AXIS, -info.rotation);
      wheel.quaternion.copy(this.object.quaternion).multiply(steerQ).multiply(spinQ);
    }
    this.coin.rotation.z = Math.sin(elapsed * 3) * 0.02 * Math.min(1, Math.abs(this.speed) / 8);

    // Lean the body: nose dips under braking, lifts under throttle; rolls
    // out of corners. Pure visuals on top of the physics body.
    const e = new THREE.Euler().setFromQuaternion(this.object.quaternion, "YXZ");
    let yawRate = (e.y - this.prevYaw) / Math.max(dt, 1e-3);
    if (yawRate > 50 || yawRate < -50) yawRate = 0; // wrapped past ±π
    this.prevYaw = e.y;
    const accel = (this.speed - this.prevSpeed) / Math.max(dt, 1e-3);
    this.prevSpeed = this.speed;
    const pitch = THREE.MathUtils.clamp(-accel * 0.008, -0.1, 0.1);
    const roll = THREE.MathUtils.clamp(yawRate * this.speed * 0.012, -0.14, 0.14);
    const k = Math.min(1, dt * 8);
    this.lean.x += (pitch - this.lean.x) * k;
    this.lean.y += (roll - this.lean.y) * k;
    this.tilt.rotation.set(this.lean.x, 0, this.lean.y);

    if (this.cockpit.visible) {
      this.steeringWheel.rotation.z = this.steering * 4 * STEER_SIGN;
      const kmh = Math.round(Math.abs(this.speed) * 3.6);
      if (kmh !== this.speedoValue) {
        this.speedoValue = kmh;
        this.speedo.setText(`${kmh} km/h`);
      }
    }
  }
}
