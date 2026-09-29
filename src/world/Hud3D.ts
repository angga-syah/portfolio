import * as THREE from "three";
import type { Lang } from "@/data/world";
import { Text3D, arrowGeometry, roundedSlab, type Fonts } from "./Text3D";
import { coinGeometry, coinMaterials } from "./Coins";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

export type HudAction = { kind: "quality" } | { kind: "language" } | { kind: "mute" } | { kind: "travel"; slot: number } | { kind: "type" } | { kind: "submit" } | { kind: "skip" } | { kind: "camera" } | { kind: "form"; target: string };

const DEPTH = 10;
const FOV = 30;

/**
 * Screen-anchored 3D HUD, rendered after the world in its own scene so it
 * always sits on top: coin counter, language + sound buttons, and a
 * clickable minimap for quick travel.
 */
export class Hud3D {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  private topLeft = new THREE.Group();
  private topRight = new THREE.Group();
  private bottomRight = new THREE.Group();
  private coinText: Text3D;
  private coin: THREE.Mesh;
  private langText: Text3D;
  private speaker = new THREE.Group();
  private waves: THREE.Object3D[] = [];
  private cross = new THREE.Group();
  private carArrow: THREE.Mesh;
  /** Gold dots on the minimap for coins still out there (race mode). */
  private coinDots: THREE.Mesh[] = [];
  private buttons = new Map<THREE.Object3D, HudAction>();
  private hovered: THREE.Object3D | null = null;
  private raycaster = new THREE.Raycaster();
  private bump = 0;
  private scale = 1;
  // Race UI (centre of the screen).
  private top = new THREE.Group();
  private center = new THREE.Group();
  private timer: Text3D;
  private big: Text3D;
  private bigT = 1;
  private namePanel = new THREE.Group();
  private nameTitle: Text3D;
  private nameText: Text3D;
  private nameHint: Text3D;
  private caret: THREE.Mesh;
  private toast: Text3D;
  private toastPill: THREE.Mesh;
  private toastGroup = new THREE.Group();
  private toastUntil = 0;
  private btnLabels: Text3D[] = [];
  private camText!: Text3D;
  private qualityText: Text3D;

  constructor(fonts: Fonts, zones: { slot: number; x: number; z: number; color: string }[], private mapRadius: number, roadReach: number) {
    this.scene.add(new THREE.HemisphereLight("#ffffff", "#9fc6d8", 2.2));
    const sun = new THREE.DirectionalLight("#ffffff", 1.6);
    sun.position.set(-2, 4, 6);
    this.scene.add(sun, this.topLeft, this.topRight, this.bottomRight, this.top, this.center);

    // Coin counter.
    const pill = new THREE.Mesh(roundedSlab(5.4, 0.8, 0.22, 0.4), toonMaterial(PALETTE.ink));
    pill.position.set(2.7, -0.4, 0);
    this.coin = new THREE.Mesh(coinGeometry(fonts.display, 0.3, 0.1), coinMaterials());
    this.coin.position.set(0.45, -0.4, 0.2);
    this.coinText = new Text3D(fonts.display, toonMaterial(PALETTE.cream), { size: 0.3, depth: 0.08, anchor: "middle", maxWidth: 4.3 });
    this.coinText.position.set(0.9, -0.4, 0.12);
    this.topLeft.add(pill, this.coin, this.coinText);

    // Language + mute buttons.
    const langBtn = this.button(1.1, 0.8, -3.1);
    this.langText = new Text3D(fonts.display, toonMaterial(PALETTE.cream), { size: 0.32, depth: 0.08, align: "center", anchor: "middle" });
    this.langText.position.set(-3.1 + 0.55, -0.4, 0.12);
    this.topRight.add(this.langText);
    this.buttons.set(langBtn, { kind: "language" });

    // Camera mode button: a little 3D camera plus the mode's initial.
    const camBtn = this.button(1.9, 0.8, -5.2);
    this.buttons.set(camBtn, { kind: "camera" });
    const camBody = new THREE.Mesh(roundedSlab(0.34, 0.24, 0.1, 0.05), toonMaterial(PALETTE.cream));
    camBody.position.set(-5.2 + 0.36, -0.4, 0.15);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 14), toonMaterial(PALETTE.ink));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(-5.2 + 0.36, -0.4, 0.22);
    this.camText = new Text3D(fonts.display, toonMaterial(PALETTE.cream), { size: 0.24, depth: 0.06, anchor: "middle", maxWidth: 1.2 });
    this.camText.position.set(-5.2 + 0.62, -0.4, 0.12);
    this.topRight.add(camBody, lens, this.camText);

    // Graphics quality: shows HD / SD, click to switch.
    const qualityBtn = this.button(1.0, 0.8, -6.4);
    this.buttons.set(qualityBtn, { kind: "quality" });
    this.qualityText = new Text3D(fonts.display, toonMaterial(PALETTE.cream), { size: 0.3, depth: 0.08, align: "center", anchor: "middle" });
    this.qualityText.position.set(-6.4 + 0.5, -0.4, 0.12);
    this.topRight.add(this.qualityText);

    const muteBtn = this.button(0.8, 0.8, -1.5);
    this.buttons.set(muteBtn, { kind: "mute" });
    const cream = toonMaterial(PALETTE.cream);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), cream);
    box.position.x = -0.1;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.18, 4), cream);
    cone.rotation.z = Math.PI / 2;
    cone.position.x = 0.02;
    this.speaker.add(box, cone);
    for (let i = 0; i < 2; i++) {
      const wave = new THREE.Mesh(new THREE.TorusGeometry(0.12 + i * 0.1, 0.022, 4, 12, Math.PI * 0.6), cream);
      wave.rotation.z = -Math.PI * 0.3;
      wave.position.x = 0.06;
      this.speaker.add(wave);
      this.waves.push(wave);
    }
    const slash = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), toonMaterial(PALETTE.coral));
    slash.rotation.z = -0.8;
    slash.name = "slash";
    this.speaker.add(slash);
    this.speaker.position.set(-1.1, -0.4, 0.15);
    this.topRight.add(this.speaker);

    // Minimap: road cross, zone dots with numbers, the car as an arrow.
    const r = 1.25;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.14, 40), toonMaterial("#eaf6fb"));
    disc.rotation.x = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 6, 40), toonMaterial(PALETTE.ink));
    rim.position.z = 0.07;
    this.cross.add(disc, rim);
    const road = toonMaterial("#6b7a8a");
    const arm = (roadReach / this.mapRadius) * r * 0.82;
    const h = new THREE.Mesh(new THREE.BoxGeometry(arm * 2, 0.16, 0.05), road);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.16, arm * 2, 0.05), road);
    h.position.z = v.position.z = 0.09;
    this.cross.add(h, v);
    for (const zone of zones) {
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 20), toonMaterial(zone.color));
      dot.rotation.x = Math.PI / 2;
      const p = this.toMap(zone.x, zone.z);
      dot.position.set(p.x, p.y, 0.14);
      const num = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.2, depth: 0.05, align: "center", anchor: "middle" }, String(zone.slot));
      num.position.set(p.x, p.y, 0.2);
      this.cross.add(dot, num);
      this.buttons.set(dot, { kind: "travel", slot: zone.slot });
      this.buttons.set(num, { kind: "travel", slot: zone.slot });
    }
    const dotGeo = new THREE.SphereGeometry(0.06, 10, 8);
    for (let i = 0; i < 24; i++) {
      const dot = new THREE.Mesh(dotGeo, toonMaterial(PALETTE.gold));
      dot.visible = false;
      this.cross.add(dot);
      this.coinDots.push(dot);
    }
    this.carArrow = new THREE.Mesh(arrowGeometry(0.36, 0.26, 0.06), toonMaterial(PALETTE.gold));
    this.carArrow.geometry.center();
    this.carArrow.position.z = 0.24;
    this.cross.add(this.carArrow);
    this.cross.position.set(-r - 0.1, r + 0.1, 0);
    this.cross.rotation.x = -0.35;
    this.bottomRight.add(this.cross);
    this.buttons.set(disc, { kind: "travel", slot: 0 });

    for (const g of [this.topLeft, this.topRight]) g.rotation.x = 0.18;

    // Race timer pill (top centre).
    const timerPill = new THREE.Mesh(roundedSlab(3.2, 0.9, 0.22, 0.45), toonMaterial(PALETTE.gold));
    timerPill.position.y = -0.45;
    this.timer = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.46, depth: 0.1, align: "center", anchor: "middle" });
    this.timer.position.set(0, -0.45, 0.12);
    this.top.add(timerPill, this.timer);
    this.top.visible = false;
    this.top.rotation.x = 0.18;

    // Countdown / GO / FINISH, big in the middle.
    this.big = new Text3D(fonts.display, toonMaterial(PALETTE.gold), { size: 1.6, depth: 0.5, align: "center", anchor: "middle" });
    this.big.visible = false;
    this.center.add(this.big);

    // Name entry.
    const panel = new THREE.Mesh(roundedSlab(7.4, 3.6, 0.3, 0.4), toonMaterial(PALETTE.ink));
    this.nameTitle = new Text3D(fonts.display, toonMaterial(PALETTE.gold), { size: 0.3, depth: 0.1, align: "center", anchor: "middle", maxWidth: 7, maxLines: 1 });
    this.nameTitle.position.set(0, 1.2, 0.18);
    const field = new THREE.Mesh(roundedSlab(5.6, 0.95, 0.2, 0.2), toonMaterial(PALETTE.cream));
    field.position.set(0, 0.25, 0.1);
    this.nameText = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.5, depth: 0.1, align: "center", anchor: "middle" });
    this.nameText.position.set(0, 0.25, 0.22);
    this.caret = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 0.1), toonMaterial(PALETTE.emerald));
    this.caret.position.set(0, 0.25, 0.22);
    this.nameHint = new Text3D(fonts.body, toonMaterial("#d5e6f2"), { size: 0.2, depth: 0.04, align: "center", anchor: "middle", maxWidth: 6.8 });
    this.nameHint.position.set(0, -0.5, 0.18);
    this.namePanel.add(panel, this.nameTitle, field, this.nameText, this.caret, this.nameHint);
    const mk = (label: string, x: number, color: string, action: HudAction) => {
      const b = new THREE.Mesh(roundedSlab(2, 0.62, 0.2, 0.3), toonMaterial(color));
      b.position.set(x, -1.2, 0.2);
      const t = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.24, depth: 0.06, align: "center", anchor: "middle", maxWidth: 1.8 }, label);
      t.position.set(x, -1.2, 0.32);
      t.name = label;
      this.namePanel.add(b, t);
      this.buttons.set(b, action);
      this.buttons.set(t, action);
      this.btnLabels.push(t);
    };
    mk("type", -2.3, PALETTE.cream, { kind: "type" });
    mk("submit", 0, PALETTE.emerald, { kind: "submit" });
    mk("skip", 2.3, "#9fb3c2", { kind: "skip" });
    this.namePanel.visible = false;
    this.center.add(this.namePanel);

    this.toast = new Text3D(fonts.display, toonMaterial(PALETTE.cream), { size: 0.36, depth: 0.1, align: "center", anchor: "middle", maxWidth: 12, maxLines: 1 });
    this.toast.position.z = 0.14;
    this.toastPill = new THREE.Mesh(roundedSlab(1, 0.8, 0.2, 0.4), toonMaterial(PALETTE.ink));
    this.toastGroup.add(this.toastPill, this.toast);
    this.toastGroup.visible = false;
    this.center.add(this.toastGroup);
  }

  /** Race clock in the top centre; pass null to hide. */
  setTimer(ms: number | null) {
    this.top.visible = ms !== null;
    if (ms !== null) this.timer.setText(formatTime(ms));
  }

  /** Big centred word (3, 2, 1, GO!) that pops and fades. */
  flash(text: string, color: string = PALETTE.gold) {
    this.big.setText(text);
    this.big.material = toonMaterial(color);
    this.big.visible = true;
    this.bigT = 0;
  }

  showNameEntry(show: boolean, labels?: { title: string; hint: string; type: string; submit: string; skip: string }) {
    this.namePanel.visible = show;
    if (!show || !labels) return;
    this.nameTitle.setText(labels.title);
    this.nameHint.setText(labels.hint);
    const [type, submit, skip] = this.btnLabels;
    type!.setText(labels.type);
    submit!.setText(labels.submit);
    skip!.setText(labels.skip);
  }

  setName(name: string) {
    this.nameText.setText(name);
    this.caret.position.x = this.nameText.width / 2 + 0.08;
  }

  /** One-line message under the centre for a few seconds. */
  message(text: string, seconds = 4) {
    this.toast.setText(text);
    this.toastPill.geometry.dispose();
    this.toastPill.geometry = roundedSlab(this.toast.width + 0.9, 0.8, 0.2, 0.4);
    this.toastGroup.visible = true;
    this.toastUntil = performance.now() + seconds * 1000;
  }

  private button(w: number, h: number, x: number) {
    const btn = new THREE.Mesh(roundedSlab(w, h, 0.22, 0.36), toonMaterial(PALETTE.ink));
    btn.position.set(x + w / 2, -h / 2, 0);
    this.topRight.add(btn);
    return btn;
  }

  /** World x/z → minimap plane coordinates (north up). Far-off spots pin to the rim. */
  private toMap(x: number, z: number) {
    const r = 1.25 * 0.82;
    return new THREE.Vector2((x / this.mapRadius) * r, (-z / this.mapRadius) * r).clampLength(0, 1.22);
  }

  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const halfH = DEPTH * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const halfW = halfH * aspect;
    // Shrink everything a bit on narrow screens.
    this.scale = THREE.MathUtils.clamp(halfW / 11, 0.26, 0.5);
    const m = 0.22;
    this.topLeft.position.set(-halfW + m, halfH - m, -DEPTH);
    // Portrait: buttons drop below the coin counter instead of colliding with it.
    this.topRight.position.set(halfW - m, halfH - m - (aspect < 0.9 ? 1.05 * this.scale : 0), -DEPTH);
    this.bottomRight.position.set(halfW - m, -halfH + m, -DEPTH);
    this.top.position.set(0, halfH - m - (aspect < 0.9 ? 2.1 * this.scale : 0), -DEPTH);
    this.center.position.set(0, 0.3, -DEPTH);
    for (const g of [this.topLeft, this.topRight, this.bottomRight, this.top]) g.scale.setScalar(this.scale);
    this.center.scale.setScalar(Math.min(1, halfW / 4.2) * 0.8);
  }

  setCoins(collected: number, total: number, lang: Lang) {
    const money = (n: number) => (n * 1000).toLocaleString(lang === "id" ? "id-ID" : "en-US");
    this.coinText.setText(`Rp ${money(collected)} / ${money(total)}`);
    if (collected > 0) this.bump = 1;
  }

  setLanguage(lang: Lang) {
    // The button shows the language you'd switch *to*.
    this.langText.setText(lang === "en" ? "ID" : "EN");
  }

  /** Label on the camera button: MAP / CHASE / CAB (EN) — PETA / KEJAR / KABIN (ID). */
  setCameraMode(mode: "diorama" | "chase" | "cockpit", lang: Lang) {
    const labels = lang === "en" ? { diorama: "MAP", chase: "CHASE", cockpit: "CAB" } : { diorama: "PETA", chase: "KEJAR", cockpit: "KABIN" };
    this.camText.setText(labels[mode]);
  }

  setQuality(level: "high" | "low") {
    this.qualityText.setText(level === "high" ? "HD" : "SD");
  }

  /** Mount a panel in the centre of the screen (e.g. the contact form). */
  addCenter(obj: THREE.Object3D) {
    this.center.add(obj);
  }

  /** Make `obj` a clickable HUD button. */
  addButton(obj: THREE.Object3D, action: HudAction) {
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) this.buttons.set(o, action);
    });
  }

  /** Show these world positions as coin dots on the minimap; null hides them. */
  setCoinMarkers(positions: THREE.Vector3[] | null) {
    this.coinDots.forEach((dot, i) => {
      const p = positions?.[i];
      dot.visible = !!p;
      if (!p) return;
      const m = this.toMap(p.x, p.z);
      dot.position.set(m.x, m.y, 0.2);
    });
  }

  setMuted(muted: boolean) {
    this.speaker.getObjectByName("slash")!.visible = muted;
    for (const w of this.waves) w.visible = !muted;
  }

  pick(ndc: THREE.Vector2): HudAction | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects([...this.buttons.keys()], false)[0];
    this.hovered = hit?.object ?? null;
    return hit ? this.buttons.get(hit.object) ?? null : null;
  }

  update(elapsed: number, dt: number, car: THREE.Vector3, carYaw: number) {
    this.coin.rotation.y = elapsed * 2;
    this.bump = Math.max(0, this.bump - dt * 3);
    this.coin.scale.setScalar(1 + this.bump * 0.6);
    const p = this.toMap(THREE.MathUtils.clamp(car.x, -this.mapRadius, this.mapRadius), THREE.MathUtils.clamp(car.z, -this.mapRadius, this.mapRadius));
    this.carArrow.position.set(p.x, p.y, 0.24);
    // Arrow geometry points +x (east); car yaw 0 faces +z (south on the map).
    this.carArrow.rotation.z = carYaw - Math.PI / 2;
    const pulse = 1 + Math.sin(elapsed * 6) * 0.25;
    for (const dot of this.coinDots) if (dot.visible) dot.scale.setScalar(pulse);
    for (const [obj] of this.buttons) {
      const target = obj === this.hovered ? 1.12 : 1;
      obj.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, dt * 12));
    }
    this.bottomRight.rotation.y = Math.sin(elapsed * 0.5) * 0.06;

    if (this.big.visible) {
      this.bigT += dt;
      const pop = Math.min(1, this.bigT * 6);
      const fade = Math.max(0, 1 - Math.max(0, this.bigT - 0.6) * 2.5);
      this.big.scale.setScalar((0.4 + pop * 0.8) * fade);
      this.big.rotation.x = -0.2 + pop * 0.2;
      if (fade <= 0) this.big.visible = false;
    }
    if (this.namePanel.visible) this.caret.visible = Math.floor(elapsed * 2.5) % 2 === 0;
    if (this.toastGroup.visible) {
      this.toastGroup.position.y = this.namePanel.visible ? -2.4 : -1.6;
      if (performance.now() > this.toastUntil) this.toastGroup.visible = false;
    }
  }
}

export function formatTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}
