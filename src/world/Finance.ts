import * as THREE from "three";
import { t, type L10n, type Lang } from "@/data/world";
import type { WorldCtx } from "./Zones";
import { Text3D, roundedSlab } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

/**
 * A giant live candlestick chart (the IDX Signal project, as a landmark).
 * Prices random-walk; each candle eases toward its new open/close.
 */
export function buildCandleChart(ctx: WorldCtx, x: number, z: number, rotY = 0) {
  const group = new THREE.Group();
  const count = 12;
  const spacing = 0.75;
  const width = count * spacing + 1;
  const up = toonMaterial(PALETTE.emerald);
  const down = toonMaterial(PALETTE.coral);
  const wickMat = toonMaterial(PALETTE.ink);

  const base = new THREE.Mesh(roundedSlab(width, 1.4, 0.35, 0.2), toonMaterial(PALETTE.ink));
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.18;
  group.add(base);
  // Back wall with grid lines.
  const wall = new THREE.Mesh(roundedSlab(width, 6.2, 0.2, 0.25), toonMaterial("#eaf4fa"));
  wall.position.set(0, 3.3, -0.6);
  group.add(wall);
  for (let i = 0; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(width - 0.6, 0.04, 0.04), toonMaterial("#c7d9e5"));
    line.position.set(0, 1 + i * 1.1, -0.48);
    group.add(line);
  }
  const ticker = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.ink), { size: 0.55, depth: 0.14, anchor: "top" }, "IDX");
  ticker.position.set(-width / 2 + 0.35, 6.2, -0.5);
  const tag = new Text3D(ctx.fonts.body, toonMaterial(PALETTE.emeraldDark), { size: 0.3, depth: 0.08, align: "right", anchor: "top" });
  tag.position.set(width / 2 - 0.35, 6.05, -0.5);
  group.add(ticker, tag);

  type Candle = { body: THREE.Mesh; wick: THREE.Mesh; open: number; close: number; hi: number; lo: number; cur: [number, number, number, number] };
  const candles: Candle[] = [];
  let price = 3;
  const bodyGeo = new THREE.BoxGeometry(0.46, 1, 0.46);
  const wickGeo = new THREE.BoxGeometry(0.08, 1, 0.08);
  const next = (c: Candle) => {
    c.open = price;
    price = THREE.MathUtils.clamp(price + (Math.random() - 0.45) * 1.1, 1.2, 5.2);
    c.close = price;
    c.hi = Math.max(c.open, c.close) + Math.random() * 0.45;
    c.lo = Math.min(c.open, c.close) - Math.random() * 0.45;
  };
  for (let i = 0; i < count; i++) {
    const body = new THREE.Mesh(bodyGeo, up);
    const wick = new THREE.Mesh(wickGeo, wickMat);
    const px = -width / 2 + 0.9 + i * spacing;
    body.position.set(px, 0, 0);
    wick.position.set(px, 0, 0);
    body.castShadow = wick.castShadow = true;
    group.add(wick, body);
    const c: Candle = { body, wick, open: 0, close: 0, hi: 0, lo: 0, cur: [3, 3, 3, 3] };
    next(c);
    c.cur = [c.open, c.close, c.hi, c.lo];
    candles.push(c);
  }

  let timer = 0;
  let head = 0;
  ctx.animated.push((_e, dt) => {
    timer += dt;
    if (timer > 0.9) {
      // Shift: the oldest candle becomes the newest.
      timer = 0;
      next(candles[head]!);
      head = (head + 1) % count;
      candles.forEach((c, i) => {
        const slot = (i - head + count) % count;
        c.body.position.x = c.wick.position.x = -width / 2 + 0.9 + slot * spacing;
      });
      const last = candles[(head - 1 + count) % count]!;
      const pct = ((last.close - last.open) / last.open) * 100;
      tag.setText(`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`);
      tag.material = pct >= 0 ? toonMaterial(PALETTE.emeraldDark) : toonMaterial(PALETTE.coral);
    }
    const k = Math.min(1, dt * 6);
    for (const c of candles) {
      const target = [c.open, c.close, c.hi, c.lo];
      for (let j = 0; j < 4; j++) c.cur[j]! += (target[j]! - c.cur[j]!) * k;
      const [o, cl, hi, lo] = c.cur;
      const top = Math.max(o, cl);
      const bottom = Math.min(o, cl);
      const h = Math.max(0.08, top - bottom);
      c.body.scale.y = h;
      c.body.position.y = 0.4 + (bottom + h / 2);
      c.body.material = cl >= o ? up : down;
      c.wick.scale.y = hi - lo;
      c.wick.position.y = 0.4 + (hi + lo) / 2;
    }
  });

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).receiveShadow = true;
  });
  base.castShadow = wall.castShadow = true;
  ctx.scene.add(group);
  ctx.physics.addStaticBox(new THREE.Vector3(x, 3, z - 0.3), new THREE.Vector3(width, 6, 1.6), rotY);
  return group;
}

const VAULT_TEXT = {
  title: { en: "VAULT", id: "BRANKAS" } satisfies L10n,
  done: { en: "PAID IN FULL!", id: "LUNAS!" } satisfies L10n,
};

/**
 * The bank vault: shows how many Rp coins you've collected; its door swings
 * open with a confetti burst once you have them all.
 */
export class Vault {
  group = new THREE.Group();
  /** Gold inside, for the bloom pass. */
  gold: THREE.Mesh[] = [];
  private door = new THREE.Group();
  private counter: Text3D;
  private title: Text3D;
  private banner: Text3D;
  private openT = -1;
  private lang: Lang = "id";
  private collected = 0;

  constructor(ctx: WorldCtx, x: number, z: number, private total: number) {
    const steel = toonMaterial("#9fb3c2");
    const dark = toonMaterial(PALETTE.ink);
    const w = 4.6;
    const h = 3.8;
    const d = 3.4;
    const body = new THREE.Mesh(roundedSlab(w, h, d, 0.35), steel);
    body.position.y = h / 2;
    const plinth = new THREE.Mesh(roundedSlab(w + 0.6, 0.4, d + 0.6, 0.2), dark);
    plinth.position.y = 0.2;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 40), toonMaterial("#1b2b3a"));
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, h / 2, d / 2 + 0.01);
    this.group.add(body, plinth, hole);

    // Gold bars behind the door.
    const barGeo = new THREE.BoxGeometry(0.62, 0.26, 0.34);
    const goldMat = toonMaterial(PALETTE.gold);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3 - (r % 2); c++) {
        const bar = new THREE.Mesh(barGeo, goldMat);
        bar.position.set(-0.68 + c * 0.68 + (r % 2) * 0.34, h / 2 - 0.55 + r * 0.28, d / 2 + 0.1);
        this.group.add(bar);
        this.gold.push(bar);
      }
    }

    // Door: hinged on its left edge.
    this.door.position.set(-1.35, h / 2, d / 2 + 0.28);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.32, 40), toonMaterial("#c7d6e0"));
    plate.rotation.x = Math.PI / 2;
    plate.position.x = 1.35;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 40), toonMaterial(PALETTE.gold));
    ring.position.set(1.35, 0, 0.18);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.3, 20), dark);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(1.35, 0, 0.24);
    const wheel = new THREE.Group();
    wheel.position.set(1.35, 0, 0.3);
    for (let i = 0; i < 3; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), dark);
      spoke.rotation.z = (i * Math.PI) / 3;
      wheel.add(spoke);
    }
    const rp = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.goldDark), { size: 0.34, depth: 0.08, align: "center", anchor: "middle" }, "Rp");
    rp.position.set(1.35, -0.72, 0.16);
    this.door.add(plate, ring, hub, wheel, rp);
    this.group.add(this.door);
    ctx.animated.push((e) => {
      if (this.openT < 0) wheel.rotation.z = Math.sin(e * 0.6) * 0.3;
    });

    // Sign on top: title + counter.
    const sign = new THREE.Mesh(roundedSlab(w - 0.4, 1.3, 0.3, 0.2), dark);
    sign.position.set(0, h + 0.75, 0.6);
    this.title = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.gold), { size: 0.42, depth: 0.1, align: "center", anchor: "top" });
    this.title.position.set(0, h + 1.3, 0.76);
    this.counter = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.cream), { size: 0.28, depth: 0.1, align: "center", anchor: "top" });
    this.counter.position.set(0, h + 0.7, 0.76);
    this.banner = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.gold), { size: 0.9, depth: 0.3, align: "center", anchor: "middle" });
    this.banner.position.set(0, h + 2.6, 0.6);
    this.banner.visible = false;
    this.group.add(sign, this.title, this.counter, this.banner);

    this.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.group.position.set(x, 0, z);
    this.group.rotation.y = 0.35;
    ctx.scene.add(this.group);
    ctx.physics.addStaticBox(new THREE.Vector3(x, h / 2, z), new THREE.Vector3(w + 0.4, h, d + 0.6), 0.35);
    ctx.localized.push((lang) => {
      this.lang = lang;
      this.title.setText(t(VAULT_TEXT.title, lang));
      this.banner.setText(t(VAULT_TEXT.done, lang));
      this.refresh();
    });
  }

  /** World position just above the open door (for confetti). */
  get mouth() {
    return new THREE.Vector3(0, 2.2, 2.2).applyMatrix4(this.group.matrixWorld);
  }

  setCount(collected: number) {
    this.collected = collected;
    this.refresh();
    if (collected >= this.total && this.openT < 0) this.openT = 0;
  }

  get isOpen() {
    return this.openT >= 0;
  }

  private refresh() {
    const money = (n: number) => (n * 1000).toLocaleString(this.lang === "id" ? "id-ID" : "en-US");
    this.counter.setText(`Rp ${money(this.collected)} / ${money(this.total)}`);
  }

  update(elapsed: number, dt: number) {
    if (this.openT < 0) return;
    this.openT = Math.min(1, this.openT + dt / 1.6);
    const k = 1 - Math.pow(1 - this.openT, 3);
    this.door.rotation.y = -k * 1.9;
    this.banner.visible = true;
    const pop = Math.min(1, this.openT * 3);
    this.banner.scale.setScalar(pop * (1 + Math.sin(elapsed * 3) * 0.04));
    this.banner.position.y = 3.8 + 2.6 + Math.sin(elapsed * 2) * 0.15;
  }
}
