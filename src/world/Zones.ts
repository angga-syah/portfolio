import * as THREE from "three";
import type * as CANNON from "cannon-es";
import { worldContent as C, t, type L10n, type Lang } from "@/data/world";
import type { Physics } from "./Physics";
import type { Areas } from "./Areas";
import { normalize, type ModelName, type Resources } from "./Resources";
import { Board3D, type Block } from "./Board3D";
import { Text3D, arrowGeometry, roundedSlab, textGeometry, type Fonts } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** "Let's talk" board: clear of the Kopdes site and of the decor keep-out edge. */
export const CONTACT_BOARD = new THREE.Vector3(-15.5, 0, 25.5);
const CONTACT_BOARD_ROT = 0.5;

export const ZONES = {
  projects: new THREE.Vector3(0, 0, -31),
  about: new THREE.Vector3(-31, 0, 0),
  skills: new THREE.Vector3(31, 0, 0),
  contact: new THREE.Vector3(0, 0, 31),
};

export type WorldCtx = {
  scene: THREE.Scene;
  physics: Physics;
  resources: Resources;
  areas: Areas;
  fonts: Fonts;
  /** Called with the new language whenever it changes (and once at start). */
  localized: ((lang: Lang) => void)[];
  /** Per-frame animations: (elapsed, dt). */
  animated: ((elapsed: number, dt: number) => void)[];
  /** Meshes that get the bloom glow. */
  glowing: THREE.Object3D[];
  /** Bodies that burst into paperwork when the van hits them. */
  paperBodies: Set<CANNON.Body>;
  /** Static props, merged into a few draw calls once the world is built. */
  statics: THREE.Group;
};

type PropOptions = { rotY?: number; y?: number; collider?: "static" | "dynamic" | "none"; mass?: number };

/** Place a kit model with its bottom-centre at (x, z). */
function prop(ctx: WorldCtx, name: ModelName, scale: number, x: number, z: number, { rotY = 0, y = 0, collider = "static", mass = 2 }: PropOptions = {}) {
  if (collider === "dynamic") {
    const obj = normalize(ctx.resources.model(name), scale, "center");
    const size = obj.userData.size as THREE.Vector3;
    obj.position.set(x, y + size.y / 2 + 0.01, z);
    obj.rotation.y = rotY;
    ctx.scene.add(obj);
    return { obj, body: ctx.physics.addDynamicBox(obj, size, mass) };
  }
  const obj = normalize(ctx.resources.model(name), scale);
  obj.position.set(x, y, z);
  obj.rotation.y = rotY;
  ctx.statics.add(obj);
  let body: CANNON.Body | undefined;
  if (collider === "static") {
    const size = obj.userData.size as THREE.Vector3;
    body = ctx.physics.addStaticBox(new THREE.Vector3(x, y + size.y / 2, z), size, rotY);
  }
  return { obj, body };
}

function board(ctx: WorldCtx, opts: ConstructorParameters<typeof Board3D>[1], x: number, z: number, rotY = 0) {
  const b = new Board3D(ctx.fonts, opts);
  b.group.position.set(x, 0, z);
  b.group.rotation.y = rotY;
  ctx.scene.add(b.group);
  ctx.localized.push((lang) => b.rebuild(lang));
  ctx.physics.addStaticBox(new THREE.Vector3(x, b.size.y / 2, z - 0.15), new THREE.Vector3(opts.width - 0.8, b.size.y, 0.6), rotY);
  return b;
}

/** Extruded text lying on the ground, readable from the camera. */
function groundLabel(ctx: WorldCtx, text: L10n, x: number, z: number, { size = 0.8, color = PALETTE.cream, arrow = null as null | "N" | "E" | "S" | "W" } = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0.1, z);
  const label = new Text3D(ctx.fonts.display, toonMaterial(color), { size, depth: 0.12, align: "center", anchor: "middle" });
  label.rotation.x = -Math.PI / 2;
  label.castShadow = false;
  group.add(label);
  let arrowMesh: THREE.Mesh | null = null;
  if (arrow) {
    const geo = arrowGeometry(size * 1.6, size * 0.9, 0.12);
    geo.rotateZ({ E: 0, N: Math.PI / 2, W: Math.PI, S: -Math.PI / 2 }[arrow]);
    arrowMesh = new THREE.Mesh(geo, toonMaterial(color));
    arrowMesh.rotation.x = -Math.PI / 2;
    group.add(arrowMesh);
  }
  ctx.scene.add(group);
  ctx.localized.push((lang) => {
    label.setText(t(text, lang).toUpperCase());
    if (!arrowMesh) return;
    const gap = size * 1.3;
    if (arrow === "E") arrowMesh.position.set(label.width / 2 + gap, 0, 0);
    else if (arrow === "W") arrowMesh.position.set(-label.width / 2 - gap, 0, 0);
    else if (arrow === "N") arrowMesh.position.set(0, 0, -size * 1.6);
    else arrowMesh.position.set(0, 0, size * 1.6);
  });
  return group;
}

/** Stack of gold coins — the finance motif scattered around the office. */
function coinStack(ctx: WorldCtx, x: number, z: number, count: number) {
  const radius = 0.75;
  const h = 0.22;
  const geo = new THREE.CylinderGeometry(radius, radius, h, 24);
  const mats = [toonMaterial(PALETTE.gold), toonMaterial(PALETTE.goldDark)];
  for (let i = 0; i < count; i++) {
    const coin = new THREE.Mesh(geo, mats[i % 2]!);
    coin.position.set(x + Math.sin(i * 2.3) * 0.05, h / 2 + i * h, z + Math.cos(i * 1.7) * 0.05);
    ctx.statics.add(coin);
  }
  const body = ctx.physics.addStaticBox(new THREE.Vector3(x, (count * h) / 2, z), new THREE.Vector3(radius * 1.6, count * h, radius * 1.6));
  ctx.paperBodies.add(body);
}

const muted = "#4a5d6e";
const faint = "#7b8c99";

// ---------------------------------------------------------------------------

export function buildSpawn(ctx: WorldCtx) {
  // Direction markings on each road arm.
  groundLabel(ctx, C.zones.projects, 0, -16, { arrow: "N" });
  groundLabel(ctx, C.zones.about, -13, 0, { arrow: "W" });
  groundLabel(ctx, C.zones.skills, 13, 0, { arrow: "E" });
  groundLabel(ctx, C.zones.contact, 0, 13, { arrow: "S" });

  for (const d of [9, 18]) {
    prop(ctx, "roads/light-square", 4.5, 2.9, -d, { rotY: Math.PI / 2, collider: "none" });
    prop(ctx, "roads/light-square", 4.5, -2.9, d, { rotY: -Math.PI / 2, collider: "none" });
    prop(ctx, "roads/light-square", 4.5, d, -2.9, { rotY: 0, collider: "none" });
    prop(ctx, "roads/light-square", 4.5, -d, 2.9, { rotY: Math.PI, collider: "none" });
  }
  for (const [x, z] of [[3.2, 3.2], [-3.2, 3.2], [3.2, -3.2], [-3.2, -3.2]] as const) {
    prop(ctx, "car/cone", 1.6, x, z, { collider: "dynamic", mass: 0.6 });
  }
}

// ---------------------------------------------------------------------------

export function buildAbout(ctx: WorldCtx) {
  const { x, z } = ZONES.about;

  board(ctx, {
    width: 10,
    height: 5.6,
    lift: 1,
    accent: { color: PALETTE.emerald, side: "left" },
    content: (lang): Block[] => [
      { kind: "text", text: `// ${C.fullName.toUpperCase()}`, size: 0.24, color: PALETTE.emeraldDark, gap: 0.3 },
      { kind: "text", text: t(C.about.title, lang), font: "display", size: 0.52, color: PALETTE.ink, maxLines: 2, gap: 0.3 },
      { kind: "text", text: t(C.about.body, lang), size: 0.24, color: muted, maxLines: 5, gap: 0.28 },
      { kind: "chips", items: C.about.tags, size: 0.2, fg: PALETTE.cream, bg: PALETTE.emeraldDark },
      { kind: "text", text: t(C.about.meta, lang), size: 0.19, color: faint, bottom: true },
    ],
  }, x - 2, z - 7);

  // The accountant's desk on a rug.
  prop(ctx, "furniture/rugRectangle", 4, x - 1, z + 0.5, { collider: "none" });
  prop(ctx, "furniture/desk", 4, x - 1, z - 0.6);
  prop(ctx, "furniture/computerScreen", 4, x - 1.4, z - 1.2, { y: 1.52, collider: "none" });
  prop(ctx, "furniture/computerKeyboard", 4, x - 1.3, z - 0.1, { y: 1.52, collider: "none" });
  prop(ctx, "furniture/lampRoundTable", 4, x + 0.6, z - 1, { y: 1.52, collider: "none" });
  prop(ctx, "furniture/chairDesk", 4, x - 1.1, z + 1.4, { rotY: Math.PI, collider: "dynamic", mass: 3 });
  prop(ctx, "furniture/bookcaseOpen", 4, x - 7, z - 1.5, { rotY: Math.PI / 2 });
  prop(ctx, "furniture/bookcaseOpen", 4, x - 7, z + 0.4, { rotY: Math.PI / 2 });
  prop(ctx, "furniture/pottedPlant", 4, x + 3.2, z - 2.4);
  prop(ctx, "furniture/trashcan", 4, x + 2.4, z + 1.8, { collider: "dynamic", mass: 1 });
  for (const [dx, dz, name, rot] of [[-5, 3.2, "furniture/cardboardBoxClosed", 0], [-4.4, 4.2, "furniture/cardboardBoxClosed", 0.4], [-5.6, 4.6, "furniture/cardboardBoxOpen", -0.3]] as const) {
    const { body } = prop(ctx, name, 4, x + dx, z + dz, { rotY: rot, collider: "dynamic", mass: 1.5 });
    if (body) ctx.paperBodies.add(body);
  }

  coinStack(ctx, x + 3.6, z + 4.2, 7);
  coinStack(ctx, x + 5.2, z + 3.4, 4);
  coinStack(ctx, x + 4.6, z + 5.4, 10);
  buildCalculator(ctx, x - 8.5, z + 5, -0.35);

  // Resume pad + sign.
  const area = ctx.areas.add("resume", new THREE.Vector3(x + 6, 0, z - 6), C.pads.resume, { kind: "url", url: C.resumeUrl }, { color: PALETTE.gold });
  const sign = board(ctx, {
    width: 4.2,
    height: 1.9,
    lift: 1.2,
    panel: PALETTE.gold,
    padding: 0.35,
    content: (lang) => [
      { kind: "text", text: "CV / RESUME", font: "display", size: 0.42, color: PALETTE.ink, maxLines: 1, gap: 0.2 },
      { kind: "text", text: t(C.resumeSign, lang), size: 0.24, color: PALETTE.ink },
    ],
  }, x + 6, z - 9.6);
  ctx.areas.bindClick(sign.group, area);
}

/** A giant desk calculator: the accounting landmark. */
function buildCalculator(ctx: WorldCtx, x: number, z: number, rotY: number) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(roundedSlab(2.6, 3.6, 0.6, 0.3), toonMaterial(PALETTE.ink));
  body.rotation.x = -Math.PI / 2;
  body.position.y = 0.3;
  group.add(body);

  const screen = new THREE.Mesh(roundedSlab(2.1, 0.72, 0.1, 0.1), toonMaterial("#b8e6c9"));
  screen.rotation.x = -Math.PI / 2;
  screen.position.set(0, 0.63, -1.2);
  const digits = new Text3D(ctx.fonts.display, toonMaterial("#123b2a"), { size: 0.34, depth: 0.08, align: "right", anchor: "middle" }, "1.337.000");
  digits.rotation.x = -Math.PI / 2;
  digits.position.set(0.9, 0.68, -1.2);
  group.add(screen, digits);

  const keyGeo = roundedSlab(0.42, 0.42, 0.2, 0.08);
  const colors = [PALETTE.cream, PALETTE.cream, PALETTE.cream, PALETTE.coral];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const key = new THREE.Mesh(keyGeo, toonMaterial(row === 3 && col === 3 ? PALETTE.gold : colors[col]!));
      key.rotation.x = -Math.PI / 2;
      key.position.set(-0.84 + col * 0.56, 0.68, -0.35 + row * 0.56);
      group.add(key);
    }
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  ctx.scene.add(group);
  const collider = ctx.physics.addStaticBox(new THREE.Vector3(x, 0.4, z), new THREE.Vector3(2.6, 0.8, 3.6), rotY);
  ctx.paperBodies.add(collider);
}

// ---------------------------------------------------------------------------

export function buildProjects(ctx: WorldCtx) {
  const { x, z } = ZONES.projects;
  const spots = [
    { dx: -10, dz: 0, rot: 0.22 },
    { dx: 0, dz: -2, rot: 0 },
    { dx: 10, dz: 0, rot: -0.22 },
  ];

  C.projects.forEach((p, i) => {
    const s = spots[i]!;
    const bx = x + s.dx;
    const bz = z + s.dz - 2;
    const b = board(ctx, {
      width: 8,
      height: 4.6,
      lift: 1.3,
      accent: { color: p.accent, side: "top" },
      content: (lang) => [
        { kind: "text", text: `0${i + 1} / 0${C.projects.length}`, size: 0.22, color: faint, gap: 0.25 },
        { kind: "text", text: t(p.title, lang), font: "display", size: 0.56, color: PALETTE.ink, maxLines: 2, gap: 0.28 },
        { kind: "text", text: t(p.description, lang), size: 0.26, color: muted, maxLines: 3, gap: 0.26 },
        { kind: "chips", items: p.tech, size: 0.2, fg: PALETTE.ink, bg: new THREE.Color(p.accent).lerp(new THREE.Color("#ffffff"), 0.6).getStyle() },
        { kind: "text", text: "github.com/angga-syah", size: 0.2, color: PALETTE.ink, bottom: true },
      ],
    }, bx, bz, s.rot);

    const sculpture = projectSculpture(ctx, p.id, p.accent);
    sculpture.position.set(0, 1.3 + 4.6 + 1.1, 0);
    b.group.add(sculpture);

    const padPos = new THREE.Vector3(bx + Math.sin(s.rot) * 5, 0, bz + Math.cos(s.rot) * 5);
    const area = ctx.areas.add(p.id, padPos, C.pads.open, { kind: "url", url: p.url }, { color: p.accent, name: p.title });
    ctx.areas.bindClick(b.group, area);
  });

  prop(ctx, "racing/bannerTowerRed", 5, x + 16, z - 1, { rotY: -0.3 });
  prop(ctx, "racing/flagCheckers", 4, x - 5, z + 1.5, { collider: "none" });
  prop(ctx, "racing/flagGreen", 4, x + 5, z + 1.5, { collider: "none" });
  prop(ctx, "racing/grandStand", 5, x + 18, z - 8, { rotY: -0.4 });
  for (let i = 0; i < 6; i++) {
    prop(ctx, "racing/barrierRed", 5, x - 14 + i * 1.3, z + 5.5, { collider: "dynamic", mass: 1 });
    prop(ctx, "racing/barrierWhite", 5, x + 7.5 + i * 1.3, z + 5.5, { collider: "dynamic", mass: 1 });
  }
}

/** Little animated model on top of each project board, hinting at what it does. */
function projectSculpture(ctx: WorldCtx, id: string, accent: string) {
  const group = new THREE.Group();
  const paper = toonMaterial(PALETTE.cream);
  const line = toonMaterial("#c3d3de");
  const doc = (w: number, h: number) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(roundedSlab(w, h, 0.12, 0.06), paper));
    for (let i = 0; i < 4; i++) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(w * (i === 3 ? 0.4 : 0.7), 0.06, 0.04), line);
      l.position.set(-w * (i === 3 ? 0.15 : 0), h * 0.3 - i * h * 0.18, 0.07);
      g.add(l);
    }
    return g;
  };

  if (id === "coretax") {
    // Documents dropping into a tray: auto-download.
    const d = doc(0.9, 1.2);
    const arrow = new THREE.Mesh(arrowGeometry(1, 0.7, 0.2), toonMaterial(accent));
    arrow.geometry.rotateZ(-Math.PI / 2);
    arrow.position.set(0.95, 0.2, 0);
    const tray = new THREE.Mesh(roundedSlab(1.8, 0.25, 0.8, 0.08), toonMaterial(PALETTE.ink));
    tray.position.y = -0.85;
    group.add(d, arrow, tray);
    ctx.animated.push((e) => {
      arrow.position.y = 0.2 - ((e * 0.9) % 1) * 0.6;
      d.rotation.y = Math.sin(e * 1.2) * 0.4;
    });
    ctx.glowing.push(arrow);
  } else if (id === "idx") {
    // Candles that keep ticking.
    const candles: THREE.Mesh[] = [];
    const up = toonMaterial(PALETTE.emerald);
    const down = toonMaterial(PALETTE.coral);
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1, 0.22), i % 3 === 1 ? down : up);
      c.position.x = -0.75 + i * 0.3;
      group.add(c);
      candles.push(c);
    }
    const base = new THREE.Mesh(roundedSlab(2.1, 0.16, 0.5, 0.06), toonMaterial(PALETTE.ink));
    base.position.y = -0.8;
    group.add(base);
    ctx.animated.push((e) => {
      candles.forEach((c, i) => {
        const h = 0.4 + (Math.sin(e * 1.3 + i * 1.1) * 0.5 + 0.5) * (0.4 + i * 0.12);
        c.scale.y = h;
        c.position.y = -0.72 + h / 2 + i * 0.05;
      });
    });
  } else {
    // PDF → spreadsheet grid.
    const d = doc(0.8, 1.05);
    d.position.x = -0.9;
    const pdf = new Text3D(ctx.fonts.display, toonMaterial(PALETTE.coral), { size: 0.2, depth: 0.05, align: "center", anchor: "middle" }, "PDF");
    pdf.position.set(-0.9, -0.28, 0.1);
    const arrow = new THREE.Mesh(arrowGeometry(0.6, 0.45, 0.15), toonMaterial(accent));
    const grid = new THREE.Group();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), toonMaterial(r === 0 ? PALETTE.emeraldDark : "#bff0d8"));
        cell.position.set(c * 0.3 - 0.3, 0.3 - r * 0.3, 0);
        grid.add(cell);
      }
    }
    grid.position.x = 0.95;
    group.add(d, pdf, arrow, grid);
    ctx.animated.push((e) => {
      arrow.position.x = Math.sin(e * 3) * 0.12;
      grid.rotation.y = Math.sin(e * 0.8) * 0.5;
    });
  }
  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  ctx.animated.push((e) => {
    group.position.y = 1.3 + 4.6 + 1.1 + Math.sin(e * 1.6) * 0.12;
  });
  return group;
}

// ---------------------------------------------------------------------------

/** Crate with its label extruded on the three faces the camera can see. */
function crateGeometry(ctx: WorldCtx, label: string, size: number) {
  const box = new THREE.BoxGeometry(size, size, size).toNonIndexed();
  const textSize = Math.min(0.42, (size * 0.75) / Math.max(2, label.length * 0.62));
  const { geometry } = textGeometry(ctx.fonts.display, label, { size: textSize, depth: 0.05, align: "center", anchor: "middle", curveSegments: 3 });
  const faces = [
    new THREE.Matrix4().makeTranslation(0, 0, size / 2),
    new THREE.Matrix4().makeRotationY(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(size / 2, 0, 0)),
    new THREE.Matrix4().makeRotationX(-Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(0, size / 2, 0)),
  ];
  const texts = faces.map((m) => geometry.clone().applyMatrix4(m));
  geometry.dispose();
  const strip = (g: THREE.BufferGeometry) => {
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", g.getAttribute("position"));
    out.setAttribute("normal", g.getAttribute("normal"));
    return out;
  };
  const merged = mergeGeometries([strip(box), ...texts.map(strip)], true)!;
  // Group 0 = box, 1..3 = labels → collapse labels to one material slot.
  merged.groups.forEach((g, i) => (g.materialIndex = i === 0 ? 0 : 1));
  return merged;
}

export function buildSkills(ctx: WorldCtx) {
  const { x, z } = ZONES.skills;
  const size = 1.5;
  const colors = [PALETTE.cream, "#cfe9f7", "#bff0d8", "#ffe07a"];
  const rows = [5, 4, 3];
  let n = 0;
  rows.forEach((count, row) => {
    for (let i = 0; i < count; i++) {
      const label = C.skills[n % C.skills.length]!;
      const crate = new THREE.Mesh(crateGeometry(ctx, label, size), [toonMaterial(colors[n % colors.length]!), toonMaterial(PALETTE.ink)]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      crate.position.set(x + 1 + (i - (count - 1) / 2) * (size + 0.04), size / 2 + row * size + 0.01, z - 1);
      ctx.scene.add(crate);
      ctx.physics.addDynamicBox(crate, new THREE.Vector3(size, size, size), 1.2);
      n++;
    }
  });

  board(ctx, {
    width: 8,
    height: 3.4,
    lift: 1.4,
    panel: PALETTE.ink,
    frame: "#0f2238",
    content: (lang) => [
      { kind: "text", text: "$ ls ~/skills", size: 0.24, color: PALETTE.gold, gap: 0.26 },
      { kind: "text", text: t(C.skillsBoard.title, lang), font: "display", size: 0.6, color: PALETTE.cream, gap: 0.26 },
      { kind: "text", text: t(C.skillsBoard.body, lang), size: 0.25, color: "#d5e6f2", maxLines: 3 },
    ],
  }, x + 1, z - 7.5);

  buildRamp(ctx, x - 1, z + 8, Math.PI / 2);
  for (const [dx, dz] of [[5, 6], [6.2, 7.4], [7.4, 8.8], [5.8, 10], [7.2, 11]] as const) {
    prop(ctx, "car/cone", 1.6, x + dx, z + dz, { collider: "dynamic", mass: 0.6 });
  }
  prop(ctx, "roads/construction-barrier", 5, x - 5.5, z - 4.5, { collider: "dynamic", mass: 1.5 });
}

/**
 * Jump hump; `rotY` = direction you drive over it (0 = toward +Z). It slopes
 * back down on the far side — a sheer back edge used to trap the van on its lip.
 */
function buildRamp(ctx: WorldCtx, x: number, z: number, rotY: number) {
  const up = 5;
  const down = 3.5;
  const height = 1.8;
  const width = 3.4;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(up, height);
  shape.lineTo(up + down, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  // Drawn in XY rising toward +X; centre it and turn it so it rises toward +Z.
  geo.translate(-(up + down) / 2, 0, -width / 2);
  geo.rotateY(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, [toonMaterial(PALETTE.coral), toonMaterial(PALETTE.cream)]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, 0, z);
  mesh.rotation.y = rotY;
  ctx.scene.add(mesh);

  // One tilted slab per slope, top faces flush with the mesh.
  const dir = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
  const thickness = 0.4;
  const slab = (along: number, run: number, rising: boolean) => {
    const angle = Math.atan2(height, run);
    const c = new THREE.Vector3(x, 0, z).addScaledVector(dir, along);
    const body = ctx.physics.addStaticBox(new THREE.Vector3(c.x, height / 2 - (thickness / 2) * Math.cos(angle), c.z), new THREE.Vector3(width, thickness, Math.hypot(run, height)), 0);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rising ? -angle : angle, rotY, 0, "YXZ"));
    body.quaternion.set(q.x, q.y, q.z, q.w);
    // Static bodies don't refresh their bounds on their own; the wheels'
    // raycasts would miss the slope and the van would hit its foot instead.
    body.aabbNeedsUpdate = true;
  };
  const start = -(up + down) / 2;
  slab(start + up / 2, up, true);
  slab(start + up + down / 2, down, false);
}

// ---------------------------------------------------------------------------

/** Rounded-square outline + lens + dot: a 3D Instagram-style camera icon. */
function cameraIcon(color: string) {
  const g = new THREE.Group();
  const outer = new THREE.Shape();
  const hole = new THREE.Path();
  const rr = (p: THREE.Shape | THREE.Path, s: number, r: number) => {
    p.moveTo(-s + r, -s);
    p.lineTo(s - r, -s);
    p.quadraticCurveTo(s, -s, s, -s + r);
    p.lineTo(s, s - r);
    p.quadraticCurveTo(s, s, s - r, s);
    p.lineTo(-s + r, s);
    p.quadraticCurveTo(-s, s, -s, s - r);
    p.lineTo(-s, -s + r);
    p.quadraticCurveTo(-s, -s, -s + r, -s);
  };
  rr(outer, 0.62, 0.22);
  rr(hole, 0.48, 0.14);
  outer.holes.push(hole);
  const mat = toonMaterial(color);
  g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.14, bevelEnabled: false }), mat));
  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 10, 28), mat);
  lens.position.z = 0.07;
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), mat);
  dot.position.set(0.33, 0.33, 0.07);
  g.add(lens, dot);
  return g;
}

const LINK_GLYPH: Record<string, string> = { github: "</>", linkedin: "in", email: "@" };

export function buildContact(ctx: WorldCtx) {
  const { x, z } = ZONES.contact;
  const spacing = 6;
  C.links.forEach((link, i) => {
    const lx = x + (i - (C.links.length - 1) / 2) * spacing;
    const lz = z + 3;
    const b = board(ctx, {
      width: 3.2,
      height: 3.4,
      lift: 0.9,
      frame: link.color,
      padding: 0.3,
      content: () => [{ kind: "text", text: link.label, font: "display", size: 0.34, color: PALETTE.ink, bottom: true }],
    }, lx, lz);
    const glyph = LINK_GLYPH[link.id];
    const icon = glyph
      ? new Text3D(ctx.fonts.display, toonMaterial(link.color), { size: 1.05, depth: 0.28, align: "center", anchor: "middle" }, glyph)
      : cameraIcon(link.color);
    icon.position.set(0, 0.9 + 3.4 / 2 + 0.25, 0.12);
    b.group.add(icon);
    ctx.animated.push((e) => {
      icon.rotation.y = Math.sin(e * 1.4 + i) * 0.35;
    });

    const action = link.url.startsWith("mailto:") ? { kind: "email" as const, address: link.url.slice(7) } : { kind: "url" as const, url: link.url };
    const area = ctx.areas.add(link.id, new THREE.Vector3(lx, 0, lz - 4.2), { en: link.label, id: link.label }, action, { color: link.color, radius: 2.1 });
    ctx.areas.bindClick(b.group, area);
  });

  // Blog signpost.
  const bx = x + 16;
  const bz = z - 2;
  const sign = board(ctx, {
    width: 4.6,
    height: 2.5,
    lift: 1.3,
    panel: PALETTE.emerald,
    frame: PALETTE.emeraldDark,
    padding: 0.35,
    content: (lang) => [
      { kind: "text", text: "BLOG", font: "display", size: 0.78, color: PALETTE.cream, gap: 0.22 },
      { kind: "text", text: t(C.blogSign, lang), size: 0.24, color: PALETTE.cream, maxLines: 2 },
    ],
  }, bx, bz, -0.3);
  const blogArrow = new THREE.Mesh(arrowGeometry(1.1, 0.7, 0.18), toonMaterial(PALETTE.cream));
  blogArrow.position.set(1.3, 1.3 + 2.5 - 0.7, 0.14);
  sign.group.add(blogArrow);
  ctx.animated.push((e) => (blogArrow.position.x = 1.3 + Math.sin(e * 4) * 0.12));
  const blog = ctx.areas.add("blog", new THREE.Vector3(bx - 1.2, 0, bz - 4.6), C.pads.blog, { kind: "url", url: C.blogUrl }, { color: PALETTE.emerald });
  ctx.areas.bindClick(sign.group, blog);

  // "Let's talk" board with its own pad, in the open (no trees in front of it).
  const talk = board(ctx, {
    width: 7,
    height: 2.8,
    lift: 1.2,
    accent: { color: PALETTE.coral, side: "top" },
    content: (lang) => [
      { kind: "text", text: t(C.contactBoard.title, lang), font: "display", size: 0.66, color: PALETTE.ink, gap: 0.26 },
      { kind: "text", text: t(C.contactBoard.body, lang), size: 0.26, color: muted, maxLines: 2 },
      { kind: "text", text: "angga@muslim.com", size: 0.24, color: PALETTE.emeraldDark, bottom: true },
    ],
  }, CONTACT_BOARD.x, CONTACT_BOARD.z, CONTACT_BOARD_ROT);
  const talkPad = ctx.areas.add(
    "contact",
    new THREE.Vector3(CONTACT_BOARD.x + Math.sin(CONTACT_BOARD_ROT) * 4.2, 0, CONTACT_BOARD.z + Math.cos(CONTACT_BOARD_ROT) * 4.2),
    C.pads.contact,
    { kind: "form" },
    { color: PALETTE.coral, radius: 1.9, name: { en: "Contact form", id: "Form kontak" } }
  );
  ctx.areas.bindClick(talk.group, talkPad);

  for (const [dx, dz] of [[-9, -6], [-8, -7.4], [9, -6.5]] as const) {
    const { body } = prop(ctx, "car/box", 2, x + dx, z + dz, { rotY: dx * 0.3, collider: "dynamic", mass: 1 });
    if (body) ctx.paperBodies.add(body);
  }
}
