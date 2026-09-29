import * as THREE from "three";
import * as CANNON from "cannon-es";

type Synced = { object: THREE.Object3D; body: CANNON.Body };

export class Physics {
  world: CANNON.World;
  groundMaterial = new CANNON.Material("ground");
  wheelMaterial = new CANNON.Material("wheel");
  propMaterial = new CANNON.Material("prop");
  private synced: Synced[] = [];

  constructor() {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.3;

    this.world.addContactMaterial(
      new CANNON.ContactMaterial(this.wheelMaterial, this.groundMaterial, { friction: 0.3, restitution: 0, contactEquationStiffness: 1000 })
    );
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.propMaterial, this.groundMaterial, { friction: 0.5, restitution: 0.15 }));
    this.world.addContactMaterial(new CANNON.ContactMaterial(this.propMaterial, this.propMaterial, { friction: 0.4, restitution: 0.1 }));

    // A huge box rather than CANNON.Plane: a rotated Plane gets a broken AABB
    // (upper z clamped to 0), so vehicle raycasts at z > 0 miss the ground.
    const ground = new CANNON.Body({
      mass: 0,
      material: this.groundMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(500, 1, 500)),
      position: new CANNON.Vec3(0, -1, 0),
    });
    this.world.addBody(ground);
  }

  /** Dynamic box that drives `object` (object origin must be the box center). */
  addDynamicBox(object: THREE.Object3D, size: THREE.Vector3, mass: number) {
    const body = new CANNON.Body({
      mass,
      material: this.propMaterial,
      shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
      position: new CANNON.Vec3(object.position.x, object.position.y, object.position.z),
      linearDamping: 0.1,
      angularDamping: 0.2,
      sleepSpeedLimit: 0.2,
    });
    body.quaternion.set(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w);
    body.sleep();
    this.world.addBody(body);
    this.synced.push({ object, body });
    return body;
  }

  addDynamicCylinder(object: THREE.Object3D, radius: number, height: number, mass: number) {
    const body = new CANNON.Body({
      mass,
      material: this.propMaterial,
      shape: new CANNON.Cylinder(radius, radius, height, 10),
      position: new CANNON.Vec3(object.position.x, object.position.y, object.position.z),
      linearDamping: 0.1,
      angularDamping: 0.2,
      sleepSpeedLimit: 0.2,
    });
    body.sleep();
    this.world.addBody(body);
    this.synced.push({ object, body });
    return body;
  }

  /** Immovable box collider (trees, signs, furniture). */
  addStaticBox(center: THREE.Vector3, size: THREE.Vector3, rotY = 0) {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
      position: new CANNON.Vec3(center.x, center.y, center.z),
    });
    body.quaternion.setFromEuler(0, rotY, 0);
    this.world.addBody(body);
    return body;
  }

  step(dt: number) {
    // Fixed 60 Hz physics; meshes follow the *interpolated* state so motion
    // stays smooth on 90/120/144 Hz screens instead of stuttering between steps.
    this.world.step(1 / 60, dt, 4);
    for (const { object, body } of this.synced) {
      const p = body.interpolatedPosition;
      const q = body.interpolatedQuaternion;
      object.position.set(p.x, p.y, p.z);
      object.quaternion.set(q.x, q.y, q.z, q.w);
    }
  }
}
