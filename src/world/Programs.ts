import * as THREE from "three";
import { t, type L10n } from "@/data/world";
import type { WorldCtx } from "./Zones";
import { Text3D, roundedSlab } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

// National-programme landmarks: Dapur MBG (Makan Bergizi Gratis), Koperasi
// Desa Merah Putih and a Food Estate. Deliberately generic: plain red-white
// styling and our own lettering — no official emblems or agency logos.

const TXT = {
  mbgSub: { en: "Free nutritious meals kitchen", id: "Makan Bergizi Gratis" },
  kopdesSub: { en: "Village cooperative", id: "Koperasi Desa" },
  foodSub: { en: "Rice & corn fields", id: "Lumbung pangan" },
} satisfies Record<string, L10n>;

function shade<T extends THREE.Object3D>(o: T, cast = true) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = true;
    }
  });
  return o;
}

/** Simple building: walls, flat roof slab, door, windows. Front faces +z. */
function building(w: number, h: number, d: number, wall: string, roof: string) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMaterial(wall));
  body.position.y = h / 2;
  const top = new THREE.Mesh(roundedSlab(w + 0.5, d + 0.5, 0.35, 0.15), toonMaterial(roof));
  top.rotation.x = -Math.PI / 2;
  top.position.y = h + 0.17;
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2, 0.1), toonMaterial(PALETTE.glass));
  door.position.set(0, 1, d / 2 + 0.03);
  g.add(body, top, door);
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.1), toonMaterial(PALETTE.glass));
    win.position.set(side * (w / 2 - 1.1), h * 0.55, d / 2 + 0.03);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.18), toonMaterial(roof));
    sill.position.set(side * (w / 2 - 1.1), h * 0.55 - 0.45, d / 2 + 0.06);
    g.add(win, sill);
  }
  return g;
}

/** Name board over a door: title in the building's red, localized subtitle below. */
function facadeSign(ctx: WorldCtx, parent: THREE.Object3D, title: string, sub: L10n, y: number, z: number, width: number) {
  const board = new THREE.Mesh(roundedSlab(width, 1.05, 0.14, 0.14), toonMaterial(PALETTE.putih));
  board.position.set(0, y, z);
  const titleText = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.merah), { size: 0.4, depth: 0.08, align: "center", anchor: "middle", maxWidth: width - 0.3, maxLines: 1 }, title);
  titleText.position.set(0, y + 0.18, z + 0.07);
  const subText = new Text3D(ctx.fonts.body, toonMaterial(PALETTE.ink), { size: 0.2, depth: 0.04, align: "center", anchor: "middle", maxWidth: width - 0.3, maxLines: 1 });
  subText.position.set(0, y - 0.25, z + 0.07);
  parent.add(board, titleText, subText);
  ctx.localized.push((lang) => subText.setText(t(sub, lang)));
}

/** A stainless meal tray ("ompreng") with raised compartments. */
function trayGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(0.9, 0.05, 0.62);
  parts.push(base);
  const rim = (w: number, d: number, x: number, z: number) => {
    const g = new THREE.BoxGeometry(w, 0.08, d);
    g.translate(x, 0.05, z);
    parts.push(g);
  };
  rim(0.9, 0.03, 0, 0.3);
  rim(0.9, 0.03, 0, -0.3);
  rim(0.03, 0.62, 0.44, 0);
  rim(0.03, 0.62, -0.44, 0);
  rim(0.03, 0.3, -0.1, 0.15);
  rim(0.03, 0.3, 0.2, 0.15);
  rim(0.9, 0.03, 0, 0);
  return parts;
}

function trayStack(n: number) {
  const g = new THREE.Group();
  const mat = toonMaterial("#c9d3dc");
  const geos = trayGeometry();
  for (let i = 0; i < n; i++) {
    for (const geo of geos) {
      const m = new THREE.Mesh(geo, mat);
      m.position.y = i * 0.11;
      m.rotation.y = (i % 2) * 0.05;
      g.add(m);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------

export function buildDapurMBG(ctx: WorldCtx, x: number, z: number, rotY = 0) {
  const site = new THREE.Group();
  const house = building(8, 3.6, 5.5, PALETTE.putih, PALETTE.merah);
  site.add(house);
  facadeSign(ctx, site, "DAPUR MBG", TXT.mbgSub, 3.1, 2.9, 5.2);

  // Chimney with steam puffs.
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), toonMaterial(PALETTE.merahDark));
  chimney.position.set(2.6, 4.4, -1.2);
  site.add(chimney);
  const puffGeo = new THREE.SphereGeometry(0.35, 10, 8);
  const puffMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, depthWrite: false });
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const p = new THREE.Mesh(puffGeo, puffMat);
    site.add(p);
    return { p, phase: i / 6 };
  });
  ctx.animated.push((e) => {
    for (const { p, phase } of puffs) {
      const k = (e * 0.35 + phase) % 1;
      p.position.set(2.6 + Math.sin(k * 6 + phase * 9) * 0.3, 5.3 + k * 3, -1.2 - k * 0.8);
      p.scale.setScalar(0.5 + k * 1.3);
      p.visible = k < 0.95;
    }
  });

  // Serving table with stacks of meal trays out front, plus a food cart.
  const table = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 1.2), toonMaterial("#b8c4ce"));
  table.position.set(0, 0.9, 4.2);
  const legGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
  for (const [lx, lz] of [[-1.9, 3.7], [1.9, 3.7], [-1.9, 4.7], [1.9, 4.7]] as const) {
    const leg = new THREE.Mesh(legGeo, toonMaterial("#8a98a6"));
    leg.position.set(lx, 0.45, lz);
    site.add(leg);
  }
  site.add(table);
  [[-1.3, 5], [0, 7], [1.3, 4]].forEach(([tx, n]) => {
    const s = trayStack(n!);
    s.position.set(tx!, 0.99, 4.2);
    site.add(s);
  });

  site.position.set(x, 0, z);
  site.rotation.y = rotY;
  ctx.scene.add(shade(site));
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const at = (lx: number, lz: number) => new THREE.Vector3(lx, 0, lz).applyQuaternion(q).add(new THREE.Vector3(x, 0, z));
  const c = at(0, 0);
  ctx.physics.addStaticBox(new THREE.Vector3(c.x, 1.8, c.z), new THREE.Vector3(8.2, 3.6, 5.7), rotY);
  const tb = at(0, 4.2);
  ctx.physics.addStaticBox(new THREE.Vector3(tb.x, 0.5, tb.z), new THREE.Vector3(4, 1, 1.2), rotY);
}

// ---------------------------------------------------------------------------

export function buildKopdes(ctx: WorldCtx, x: number, z: number, rotY = 0) {
  const site = new THREE.Group();
  const house = building(7, 3.3, 5, PALETTE.putih, PALETTE.merah);
  site.add(house);
  facadeSign(ctx, site, "KOPDES MERAH PUTIH", TXT.kopdesSub, 2.85, 2.65, 6.4);

  // Striped red-white awning over the shopfront.
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(6.4 / stripes, 0.08, 1.6), toonMaterial(i % 2 ? PALETTE.putih : PALETTE.merah));
    s.position.set(-3.2 + (i + 0.5) * (6.4 / stripes), 2.15, 3.3);
    s.rotation.x = 0.35;
    site.add(s);
  }
  // Red-white flag on a pole.
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 8), toonMaterial("#c9d3dc"));
  pole.position.set(-4.6, 3, 3);
  const flag = new THREE.Group();
  const red = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.03), toonMaterial(PALETTE.merah));
  red.position.set(0.8, 0.25, 0);
  const white = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.03), toonMaterial(PALETTE.putih));
  white.position.set(0.8, -0.25, 0);
  flag.add(red, white);
  flag.position.set(-4.6, 5.4, 3);
  site.add(pole, flag);
  ctx.animated.push((e) => {
    flag.rotation.y = Math.sin(e * 1.3) * 0.25;
    flag.rotation.z = Math.sin(e * 2.1) * 0.03;
  });

  // Stacked rice sacks labelled BERAS.
  const sackGeo = roundedSlab(0.9, 0.36, 0.6, 0.15);
  const sackMat = toonMaterial("#efe6d2");
  const label = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.merah), { size: 0.14, depth: 0.02, align: "center", anchor: "middle" }, "BERAS");
  const labelGeo = label.geometry;
  const sacks = new THREE.Group();
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 3 - row; i++) {
      const sack = new THREE.Mesh(sackGeo, sackMat);
      sack.rotation.x = -Math.PI / 2;
      sack.position.set(-0.5 + i * 0.95 + row * 0.47, 0.18 + row * 0.36, 0);
      const tag = new THREE.Mesh(labelGeo, label.material);
      tag.position.set(sack.position.x, sack.position.y, 0.31);
      sacks.add(sack, tag);
    }
  }
  sacks.position.set(2.4, 0, 3.4);
  site.add(sacks);

  site.position.set(x, 0, z);
  site.rotation.y = rotY;
  ctx.scene.add(shade(site));
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const at = (lx: number, lz: number) => new THREE.Vector3(lx, 0, lz).applyQuaternion(q).add(new THREE.Vector3(x, 0, z));
  const c = at(0, 0);
  ctx.physics.addStaticBox(new THREE.Vector3(c.x, 1.65, c.z), new THREE.Vector3(7.2, 3.3, 5.2), rotY);
  const sk = at(2.9, 3.4);
  ctx.physics.addStaticBox(new THREE.Vector3(sk.x, 0.55, sk.z), new THREE.Vector3(2.9, 1.1, 0.7), rotY);
  const pl = at(-4.6, 3);
  ctx.physics.addStaticBox(new THREE.Vector3(pl.x, 3, pl.z), new THREE.Vector3(0.2, 6, 0.2), rotY);

  // Knockable crates of goods out front.
  ([[-2.2, 5], [-1.2, 5.6], [-1.8, 6.6]] as const).forEach(([dx, dz], i) => {
    const p = at(dx, dz);
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), toonMaterial(i % 2 ? "#d9a066" : "#c98a4e"));
    crate.position.set(p.x, 0.41, p.z);
    crate.castShadow = crate.receiveShadow = true;
    ctx.scene.add(crate);
    const body = ctx.physics.addDynamicBox(crate, new THREE.Vector3(0.8, 0.8, 0.8), 0.8);
    ctx.paperBodies.add(body);
  });
}

// ---------------------------------------------------------------------------

/**
 * Food Estate: paddy plots with rice tufts, a strip of corn, dikes and a
 * little tractor shuttling along the edge. The fields themselves are
 * drivable — only the tractor and the sign are solid.
 */
export function buildFoodEstate(ctx: WorldCtx, x: number, z: number) {
  const site = new THREE.Group();
  const cols = 4;
  const rows = 3;
  const plot = 3.6;
  const gap = 0.45;
  const width = cols * plot + (cols + 1) * gap;
  const depth = rows * plot + (rows + 1) * gap;

  const dike = new THREE.Mesh(new THREE.BoxGeometry(width, 0.12, depth), toonMaterial("#b98b5e"));
  dike.position.y = 0.06;
  site.add(dike);

  const water = toonMaterial("#8fd3c9");
  const tuftGeo = new THREE.ConeGeometry(0.1, 0.55, 5);
  tuftGeo.translate(0, 0.27, 0);
  const tufts: THREE.Matrix4[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = -width / 2 + gap + plot / 2 + c * (plot + gap);
      const pz = -depth / 2 + gap + plot / 2 + r * (plot + gap);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(plot, 0.04, plot), water);
      pool.position.set(px, 0.13, pz);
      site.add(pool);
      // Rows of young rice.
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const m = new THREE.Matrix4().compose(
            new THREE.Vector3(px - plot / 2 + 0.45 + i * 0.68, 0.14, pz - plot / 2 + 0.45 + j * 0.68),
            new THREE.Quaternion().setFromEuler(new THREE.Euler((Math.random() - 0.5) * 0.3, Math.random() * 3, (Math.random() - 0.5) * 0.3)),
            new THREE.Vector3(1, 0.8 + Math.random() * 0.5, 1)
          );
          tufts.push(m);
        }
      }
    }
  }
  const rice = new THREE.InstancedMesh(tuftGeo, toonMaterial("#5fbf5a"), tufts.length);
  tufts.forEach((m, i) => rice.setMatrixAt(i, m));
  rice.castShadow = true;
  site.add(rice);

  // A strip of corn along the north edge.
  const stalkGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.8, 6);
  stalkGeo.translate(0, 0.9, 0);
  const cobGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.35, 6);
  const leafGeo = new THREE.ConeGeometry(0.28, 0.9, 4);
  const corn = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    for (let j = 0; j < 2; j++) {
      const stalk = new THREE.Mesh(stalkGeo, toonMaterial("#4c9a3f"));
      const cx = -width / 2 + 0.6 + i * ((width - 1.2) / 13);
      const cz = -depth / 2 - 1.2 - j * 0.9;
      stalk.position.set(cx, 0, cz);
      const leaf = new THREE.Mesh(leafGeo, toonMaterial("#6cc35a"));
      leaf.position.set(cx, 1.6, cz);
      const cob = new THREE.Mesh(cobGeo, toonMaterial(PALETTE.gold));
      cob.position.set(cx + 0.1, 1.15, cz);
      cob.rotation.z = -0.4;
      corn.add(stalk, leaf, cob);
    }
  }
  site.add(corn);

  // Tractor shuttling along the south edge.
  const tractor = new THREE.Group();
  const bodyMat = toonMaterial(PALETTE.merah);
  const chassis = new THREE.Mesh(roundedSlab(1.8, 0.7, 1, 0.12), bodyMat);
  chassis.position.set(0, 0.85, 0);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), toonMaterial(PALETTE.glass));
  cab.position.set(-0.3, 1.6, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.1), bodyMat);
  roof.position.set(-0.3, 2.08, 0);
  const tyre = toonMaterial("#27313b");
  const big = new THREE.CylinderGeometry(0.62, 0.62, 0.35, 16);
  big.rotateX(Math.PI / 2);
  const small = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
  small.rotateX(Math.PI / 2);
  const wheels: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const back = new THREE.Mesh(big, tyre);
    back.position.set(-0.45, 0.62, side * 0.62);
    const front = new THREE.Mesh(small, tyre);
    front.position.set(0.65, 0.38, side * 0.55);
    tractor.add(back, front);
    wheels.push(back, front);
  }
  tractor.add(chassis, cab, roof);
  site.add(tractor);
  const lane = depth / 2 + 1.6;
  const run = width / 2 - 1.5;
  ctx.animated.push((e, dt) => {
    // Ping-pong along the edge, turning round at each end.
    const k = (Math.sin(e * 0.25) + 1) / 2;
    const px = -run + k * run * 2;
    const heading = Math.cos(e * 0.25) >= 0 ? 0 : Math.PI;
    tractor.position.set(px, 0, lane);
    tractor.rotation.y += (heading - tractor.rotation.y) * Math.min(1, dt * 3);
    for (const w of wheels) w.rotation.z -= dt * 2 * (heading === 0 ? 1 : -1);
  });

  // Sign.
  const signBoard = new THREE.Mesh(roundedSlab(5.4, 1.2, 0.18, 0.18), toonMaterial("#6b4a2e"));
  signBoard.position.set(-width / 2 + 2.6, 1.9, depth / 2 + 3.4);
  const postGeo = new THREE.BoxGeometry(0.18, 1.4, 0.18);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(postGeo, toonMaterial("#6b4a2e"));
    post.position.set(signBoard.position.x + s * 2.2, 0.7, depth / 2 + 3.4);
    site.add(post);
  }
  const title = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.gold), { size: 0.46, depth: 0.1, align: "center", anchor: "middle" }, "FOOD ESTATE");
  title.position.set(signBoard.position.x, 2.08, depth / 2 + 3.5);
  const sub = new Text3D(ctx.fonts.body, toonMaterial(PALETTE.cream), { size: 0.2, depth: 0.04, align: "center", anchor: "middle" });
  sub.position.set(signBoard.position.x, 1.6, depth / 2 + 3.5);
  site.add(signBoard, title, sub);
  ctx.localized.push((lang) => sub.setText(t(TXT.foodSub, lang)));

  site.position.set(x, 0, z);
  ctx.scene.add(shade(site));
  rice.castShadow = true;
  ctx.physics.addStaticBox(new THREE.Vector3(x + signBoard.position.x, 1.2, z + depth / 2 + 3.4), new THREE.Vector3(5.4, 2.4, 0.4));
  return { width, depth };
}
