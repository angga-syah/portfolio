import * as THREE from "three";
import type { L10n, Lang } from "@/data/world";
import { t } from "@/data/world";
import { Text3D, roundedSlab, type Fonts } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

export type AreaAction = { kind: "url"; url: string } | { kind: "race" } | { kind: "email"; address: string } | { kind: "form" } | { kind: "tour" };

export type Area = {
  id: string;
  label: L10n;
  /** What opening this area means, shown on the key cap hint. */
  name: L10n;
  position: THREE.Vector3;
  radius: number;
  action: AreaAction;
  pad: THREE.Group;
  ring: THREE.Group;
  text: Text3D;
  active: boolean;
  glow: number;
};

/**
 * Drive-in zones: a 3D dashed ring with an extruded label on the ground.
 * Park on it and press Enter (or click the pad / its sign) to open the link.
 */
export class Areas {
  list: Area[] = [];
  group = new THREE.Group();
  active: Area | null = null;
  /** Meshes that open an area when clicked. */
  clickables = new Map<THREE.Object3D, Area>();
  /** Meshes worth a bloom glow. */
  glowing: THREE.Object3D[] = [];
  onChange: (area: Area | null) => void = () => {};
  keycap = new THREE.Group();
  private keyName: Text3D;
  private lang: Lang = "id";

  constructor(scene: THREE.Scene, private fonts: Fonts) {
    scene.add(this.group);

    // Floating "ENTER" key cap over the car when it's parked on a pad.
    const base = new THREE.Mesh(roundedSlab(2.3, 1.05, 0.5, 0.26), toonMaterial(PALETTE.ink));
    base.position.set(0, -0.07, -0.1);
    const cap = new THREE.Mesh(roundedSlab(2.1, 0.9, 0.5, 0.22), toonMaterial(PALETTE.cream));
    const label = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.42, depth: 0.1, align: "center", anchor: "middle" }, "ENTER");
    label.position.z = 0.25;
    this.keyName = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.34, depth: 0.12, align: "center", anchor: "middle", maxWidth: 7, maxLines: 1 });
    this.keyName.position.set(0, 0.95, 0);
    this.keycap.add(base, cap, label, this.keyName);
    this.keycap.visible = false;
    scene.add(this.keycap);
  }

  add(id: string, position: THREE.Vector3, label: L10n, action: AreaAction, { radius = 2.4, color = PALETTE.emerald, name = label } = {}) {
    const pad = new THREE.Group();
    pad.position.set(position.x, 0.1, position.z);

    const ring = new THREE.Group();
    pad.add(ring);
    const dashes = 18;
    const dashGeo = new THREE.BoxGeometry(radius * 0.22, 0.12, 0.2);
    const dashMat = toonMaterial(color);
    for (let i = 0; i < dashes; i++) {
      const a = (i / dashes) * Math.PI * 2;
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(Math.cos(a) * (radius - 0.2), 0.06, Math.sin(a) * (radius - 0.2));
      dash.rotation.y = -a + Math.PI / 2;
      dash.castShadow = true;
      ring.add(dash);
      this.glowing.push(dash);
    }
    const tint = new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.62);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.35, radius - 0.35, 0.04, 40), toonMaterial(tint));
    disc.receiveShadow = true;
    pad.add(disc);

    const text = new Text3D(this.fonts.display, toonMaterial(PALETTE.ink), { size: 0.5, depth: 0.1, align: "center", anchor: "middle", maxWidth: radius * 1.5, maxLines: 1 });
    text.rotation.x = -Math.PI / 2;
    text.position.y = 0.04;
    pad.add(text);
    this.group.add(pad);

    const area: Area = { id, label, name, position: position.clone(), radius, action, pad, ring, text, active: false, glow: 0 };
    this.list.push(area);
    this.bindClick(pad, area);
    return area;
  }

  /** Make `object` (and its descendants) open `area` when clicked. */
  bindClick(object: THREE.Object3D, area: Area) {
    object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.clickables.set(o, area);
    });
  }

  setLanguage(lang: Lang) {
    for (const a of this.list) a.text.setText(t(a.label, lang).toUpperCase());
    if (this.active) this.keyName.setText(t(this.active.name, lang));
    this.lang = lang;
  }

  update(carPosition: THREE.Vector3, camera: THREE.Camera, elapsed: number, dt: number) {
    let closest: Area | null = null;
    let closestDist = Infinity;
    for (const a of this.list) {
      const d = Math.hypot(carPosition.x - a.position.x, carPosition.z - a.position.z);
      a.active = d < a.radius;
      if (a.active && d < closestDist) {
        closest = a;
        closestDist = d;
      }
      a.glow += ((a.active ? 1 : 0) - a.glow) * Math.min(1, dt * 8);
      const s = 1 + a.glow * (0.08 + Math.sin(elapsed * 6) * 0.03);
      a.pad.scale.set(s, 1, s);
      a.ring.rotation.y += dt * (0.15 + a.glow * 1.2);
    }
    if (closest !== this.active) {
      this.active = closest;
      if (closest) this.keyName.setText(t(closest.name, this.lang));
      this.onChange(closest);
    }
    this.keycap.visible = !!closest;
    if (closest) {
      if (camera.position.distanceTo(carPosition) < 2.5) {
        // Cockpit view: float the key cap through the windscreen instead of over the roof.
        const ahead = new THREE.Vector3(0, 0, -4).applyQuaternion(camera.quaternion);
        this.keycap.position.copy(camera.position).add(ahead);
        this.keycap.position.y += 0.6 + Math.sin(elapsed * 4) * 0.05;
      } else {
        this.keycap.position.set(carPosition.x, 3.5 + Math.sin(elapsed * 4) * 0.12, carPosition.z);
      }
      this.keycap.quaternion.copy(camera.quaternion);
    }
  }
}
