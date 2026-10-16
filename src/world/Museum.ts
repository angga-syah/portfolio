import * as THREE from "three";
import { t, type L10n } from "@/data/world";
import type { WorldCtx } from "./Zones";
import { Board3D } from "./Board3D";
import { Text3D, roundedSlab } from "./Text3D";
import { normalize } from "./Resources";
import { coinGeometry, coinMaterials } from "./Coins";
import { getGradientMap, toonMaterial } from "./materials";
import { PALETTE } from "./palette";

// "Museum Mangkrak": a strip of stalled projects and corruption cases along a
// potholed road on the east side of the map. Each exhibit is a 3D sculpture
// plus a plaque with figures from audits (BPK/BPKP) or court verdicts, and
// the source. It's about projects and cases, not people: no names, no
// official emblems or logos.

const TXT = {
  title: { en: "MUSEUM OF STALLED PROJECTS", id: "MUSEUM MANGKRAK" },
  road: { en: "BROKEN ROAD", id: "JALAN RUSAK" },
  tour: { en: "Tour", id: "Tur" },
  tourName: { en: "Museum tour", id: "Tur museum" },
} satisfies Record<string, L10n>;

// Each exhibit gets a hanging price tag with one figure, nothing else.
type Plaque = { figure: string };

const PLAQUES: Record<string, Plaque> = {
  ikn: { figure: "Rp 466 T" },
  whoosh: { figure: "US$ 7,2 M" },
  hambalang: { figure: "Rp 2,5 T" },
  bts: { figure: "Rp 8,03 T" },
  ektp: { figure: "Rp 5,9 T" },
  insurance: { figure: "Rp 39,58 T" },
  bansos: { figure: "Rp 32,48 M" },
  timah: { figure: "Rp 300 T" },
};

const CONCRETE = "#b9b4ab";
const CONCRETE_DARK = "#8f8a82";
const REBAR = "#a0522d";

// The diorama camera looks from the south-east, so exhibits sit on the west
// side of the road and face east, toward both the road and the camera.
export const MUSEUM_ROAD_X = 56.5;
const EXHIBIT_X = 49;
const ROAD_LENGTH = 94;

type Site = {
  ctx: WorldCtx;
  /** Static meshes (batched later). Local frame: exhibit faces +z, toward the road. */
  statics: THREE.Group;
  /** Animated meshes, same local frame. */
  live: THREE.Group;
  /** Local → world. */
  at: (lx: number, ly: number, lz: number) => THREE.Vector3;
  rotY: number;
  solid: (lx: number, ly: number, lz: number, w: number, h: number, d: number) => void;
  loose: (mesh: THREE.Mesh, lx: number, ly: number, lz: number, size: THREE.Vector3, mass: number) => void;
  /** Register vegetation that keeps growing while visitors are in the museum. */
  grow: (obj: THREE.Object3D, mode?: "all" | "up") => void;
};

type Grower = { obj: THREE.Object3D; full: THREE.Vector3; mode: "all" | "up" };

function makeSite(ctx: WorldCtx, x: number, z: number, rotY: number, growers: Grower[]): Site {
  const statics = new THREE.Group();
  statics.position.set(x, 0, z);
  statics.rotation.y = rotY;
  const live = statics.clone();
  const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const at = (lx: number, ly: number, lz: number) => new THREE.Vector3(lx, ly, lz).applyQuaternion(q).add(new THREE.Vector3(x, 0, z));
  ctx.statics.add(statics);
  ctx.scene.add(live);
  return {
    ctx,
    statics,
    live,
    at,
    rotY,
    solid: (lx, ly, lz, w, h, d) => ctx.physics.addStaticBox(at(lx, ly, lz), new THREE.Vector3(w, h, d), rotY),
    loose: (mesh, lx, ly, lz, size, mass) => {
      mesh.position.copy(at(lx, ly, lz));
      mesh.rotation.y = rotY;
      mesh.castShadow = mesh.receiveShadow = true;
      ctx.scene.add(mesh);
      ctx.physics.addDynamicBox(mesh, size, mass);
    },
    grow: (obj, mode = "all") => {
      live.add(obj);
      growers.push({ obj, full: obj.scale.clone(), mode });
    },
  };
}

function box(w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMaterial(color));
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function cyl(rTop: number, rBottom: number, h: number, color: string, segments = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), toonMaterial(color));
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** A shop-style price tag hanging from a post, swaying a little. */
type Tag = { swing: THREE.Group; at: THREE.Vector3; near: boolean; spin: number };

function plaque(s: Site, p: Plaque, lx: number, lz: number): Tag {
  const w = 4.9;
  const h = 1.4;
  const point = 0.8;
  // Tag outline: rectangle with a pointed left end and a punched hole.
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + point, h / 2);
  shape.lineTo(w / 2 - 0.2, h / 2);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - 0.2);
  shape.lineTo(w / 2, -h / 2 + 0.2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2 - 0.2, -h / 2);
  shape.lineTo(-w / 2 + point, -h / 2);
  shape.lineTo(-w / 2, 0);
  shape.lineTo(-w / 2 + point, h / 2);
  const holeX = -w / 2 + point * 0.62;
  shape.holes.push(new THREE.Path().absarc(holeX, 0, 0.14, 0, Math.PI * 2, true));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
  geo.translate(0, 0, -0.05);
  const card = new THREE.Mesh(geo, toonMaterial("#fff3c4"));
  card.castShadow = card.receiveShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 16), toonMaterial(PALETTE.goldDark));
  rim.position.set(holeX, 0, 0.06);

  const textX = holeX + 0.4;
  const maxWidth = w / 2 - 0.2 - textX;
  const price = new Text3D(s.ctx.fonts.display, toonMaterial(PALETTE.merahDark), { size: 0.5, depth: 0.07, anchor: "middle", maxWidth, maxLines: 1 }, p.figure);
  price.position.set(textX, 0, 0.08);

  // Hangs by a string from an arm on a post; the string runs to the hole.
  const tag = new THREE.Group();
  tag.add(card, rim, price);
  tag.rotation.z = -0.12;
  const swing = new THREE.Group();
  const drop = 0.9;
  const string = box(0.03, drop, 0.03, "#5b5048", 0, -drop / 2, 0);
  tag.position.set(-holeX, -drop - 0.05, 0);
  swing.add(string, tag);
  const top = 4.4;
  swing.position.set(lx + holeX, top, lz);
  s.live.add(swing);
  const postX = lx + holeX - 0.9;
  s.statics.add(box(0.2, top + 0.1, 0.2, "#5b5048", postX, (top + 0.1) / 2, lz - 0.3), box(1.2, 0.12, 0.12, "#5b5048", postX + 0.5, top, lz - 0.3));
  s.statics.add(box(0.06, 0.06, 0.4, "#5b5048", lx + holeX, top, lz - 0.12));
  s.solid(postX, top / 2, lz - 0.3, 0.3, top, 0.3);
  const phase = lx * 3.1 + lz;
  s.ctx.animated.push((e) => {
    swing.rotation.z = Math.sin(e * 1.1 + phase) * 0.05;
    swing.rotation.x = Math.sin(e * 0.8 + phase) * 0.04;
  });
  return { swing, at: s.at(lx, 0, lz), near: false, spin: 0 };
}

// ---------------------------------------------------------------------------
// Exhibits. Each is built around local (0,0,0), within x ∈ [-5, 5], z ∈ [-5, 2.5];
// the plaque stands at the front (z ≈ 3.8), which faces the road.

/** Concrete skeleton, three storeys, overgrown, rebar sticking out of the top. */
function hambalang(s: Site) {
  const floors = 3;
  const fh = 2.3;
  const cols = [-3.2, 0, 3.2];
  const rows = [-3.6, -0.6];
  for (let f = 0; f < floors; f++) {
    for (const cx of cols) {
      for (const cz of rows) {
        // Top storey is half-finished: some columns never got poured.
        if (f === floors - 1 && (cx + cz) % 2 !== 0 && cx !== 0) continue;
        s.statics.add(box(0.45, fh, 0.45, CONCRETE, cx, f * fh + fh / 2, cz));
      }
    }
    if (f < floors - 1 || f === 0) {
      const slab = box(7.4, 0.3, 3.9, f % 2 ? CONCRETE_DARK : CONCRETE, 0, (f + 1) * fh, -2.1);
      if (f === floors - 2) slab.scale.x = 0.7;
      s.statics.add(slab);
    }
  }
  // Rebar poking out of the unfinished top.
  for (let i = 0; i < 14; i++) {
    const r = cyl(0.03, 0.03, 1.1 + (i % 3) * 0.3, REBAR, 5);
    r.position.set(-3.2 + (i % 7) * 1.07, floors * fh - 0.1 + 0.5, i < 7 ? -3.6 : -0.6);
    r.rotation.z = ((i * 37) % 11) / 30 - 0.15;
    s.statics.add(r);
  }
  // Weeds and a tree growing out of it.
  const plants = ["nature/plant_bushLarge", "nature/plant_bush", "nature/grass_large", "nature/plant_bushSmall"] as const;
  [[-2.6, 0, 0.3], [2.4, 0, -4.4], [1.2, fh + 0.15, -2.5], [-1.5, 2 * fh + 0.15, -1.2], [3.5, 0, 0.6], [-3.8, 0, -4.3], [0.2, 0, 1]].forEach(([px, py, pz], i) => {
    const p = normalize(s.ctx.resources.model(plants[i % plants.length]!), 2.4 + (i % 3) * 0.6);
    p.position.set(px!, py!, pz!);
    s.statics.add(p);
  });
  const tree = normalize(s.ctx.resources.model("nature/tree_default_fall"), 3.2);
  tree.position.set(-0.4, fh + 0.15, -3);
  s.statics.add(tree);
  // A faded banner hanging off the first floor.
  const banner = box(3.4, 0.9, 0.04, "#e3ddd0", 0, fh - 0.55, -0.35);
  banner.rotation.z = 0.06;
  s.statics.add(banner);

  // Columns are solid; the van fits underneath the first slab.
  for (const cx of cols) for (const cz of rows) s.solid(cx, fh * 1.5, cz, 0.5, fh * 3, 0.5);
  // Loose rubble you can scatter.
  for (let i = 0; i < 6; i++) {
    const size = new THREE.Vector3(0.5 + (i % 2) * 0.3, 0.4, 0.5);
    const block = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), toonMaterial(i % 2 ? CONCRETE : CONCRETE_DARK));
    s.loose(block, -3 + i * 1.2, 0.21, 1.7 + (i % 2) * 0.6, size, 0.4);
  }

  // Overgrowth: vines climb the front columns and bushes fill the ground
  // floor the longer you stay.
  for (const cx of cols) {
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 1, 6), toonMaterial("#4f9a4a"));
    vine.geometry.translate(0, 0.5, 0);
    vine.position.set(cx, 0, -0.6);
    vine.scale.set(1, fh * 2.2, 1);
    s.grow(vine, "up");
  }
  [[-1.6, -2.1], [1.6, -2.4], [3.4, -2], [-3.4, -1.8]].forEach(([bx, bz], i) => {
    const bush = normalize(s.ctx.resources.model(i % 2 ? "nature/plant_bushLarge" : "nature/plant_bush"), 2.6);
    bush.position.set(bx!, 0, bz!);
    s.grow(bush);
  });

  // It was meant to be a sports centre: a faded running track curving round
  // the front, a rusty basketball hoop and a weed-choked football goal.
  const track = new THREE.Mesh(new THREE.RingGeometry(4.3, 5.3, 40, 1, Math.PI * 1.08, Math.PI * 0.84), toonMaterial("#c8735f"));
  track.rotation.x = -Math.PI / 2;
  track.position.set(0, 0.03, -1.6);
  track.receiveShadow = true;
  s.statics.add(track);
  for (const r of [4.63, 4.97]) {
    const lane = new THREE.Mesh(new THREE.RingGeometry(r - 0.025, r + 0.025, 40, 1, Math.PI * 1.08, Math.PI * 0.84), toonMaterial("#efe6dc"));
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.035, -1.6);
    s.statics.add(lane);
  }
  const rust = "#9c5a36";
  const hoop = new THREE.Group();
  const pole = box(0.14, 3, 0.14, rust, 0, 1.5, 0);
  pole.rotation.z = 0.12; // leaning
  const board = box(1.1, 0.75, 0.06, "#e8e2d6", 0.3, 3.05, 0.35);
  board.rotation.z = 0.12;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 6, 16), toonMaterial(rust));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0.3, 2.72, 0.62);
  hoop.add(pole, board, ring, box(0.06, 0.06, 0.4, rust, 0.3, 2.9, 0.2));
  hoop.position.set(4.3, 0, -3.8);
  hoop.rotation.y = -0.5;
  s.statics.add(hoop);
  s.solid(4.3, 1.5, -3.8, 0.3, 3, 0.3);
  const goal = new THREE.Group();
  const white = "#dcd6cc";
  goal.add(box(0.1, 1.4, 0.1, white, -1.1, 0.7, 0), box(0.1, 1.4, 0.1, white, 1.1, 0.7, 0), box(2.3, 0.1, 0.1, white, 0, 1.4, 0));
  const net = box(2.2, 1.3, 0.02, "#b9c2c9", 0, 0.7, -0.5);
  net.rotation.x = 0.35;
  goal.add(net);
  goal.position.set(-4.4, 0, -4.3);
  goal.rotation.y = 0.6;
  s.statics.add(goal);
  const weeds = normalize(s.ctx.resources.model("nature/grass_large"), 2.2);
  weeds.position.set(-4.3, 0, -4.1);
  s.statics.add(weeds);
  s.solid(-4.4, 0.7, -4.3, 2.3, 1.4, 0.4);
}

/** Lattice tower in a patch of trees with a floating "no signal" icon. */
function bts(s: Site) {
  const h = 11;
  const base = 1.4;
  const top = 0.45;
  const legs: THREE.Vector3[] = [];
  const white = PALETTE.putih;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const a = new THREE.Vector3(sx * base, 0, sz * base - 2);
    const b = new THREE.Vector3(sx * top, h, sz * top - 2);
    legs.push(a, b);
    const len = a.distanceTo(b);
    const leg = cyl(0.07, 0.09, len, "#9aa5b1", 6);
    leg.position.copy(a).lerp(b, 0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    s.statics.add(leg);
  }
  // Cross bracing and red/white bands.
  for (let i = 0; i < 6; i++) {
    const k = i / 6;
    const y = k * h;
    const w = base + (top - base) * k;
    const band = box(w * 2 + 0.1, 0.12, 0.12, i % 2 ? PALETTE.merah : white, 0, y + 0.8, -2 + w);
    const band2 = band.clone();
    band2.position.z = -2 - w;
    const side = box(0.12, 0.12, w * 2 + 0.1, i % 2 ? PALETTE.merah : white, w, y + 0.8, -2);
    const side2 = side.clone();
    side2.position.x = -w;
    s.statics.add(band, band2, side, side2);
  }
  // Antenna panels up top.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const panel = box(0.28, 1.1, 0.12, PALETTE.putih, Math.cos(a) * 0.55, h - 0.2, -2 + Math.sin(a) * 0.55);
    panel.rotation.y = -a + Math.PI / 2;
    s.statics.add(panel);
  }
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: "#ff4d4d" }));
  light.position.set(0, h + 0.35, -2);
  s.live.add(light);
  s.ctx.glowing.push(light);

  // "No signal": four bars, all greyed out, and a red slash, floating and bobbing.
  const icon = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(roundedSlab(0.34, 0.4 + i * 0.35, 0.16, 0.08), toonMaterial("#c3ccd6"));
    bar.position.set(-0.6 + i * 0.42, (0.4 + i * 0.35) / 2, 0);
    icon.add(bar);
  }
  const slash = new THREE.Mesh(roundedSlab(2.4, 0.2, 0.2, 0.1), toonMaterial(PALETTE.merah));
  slash.position.set(0, 0.8, 0.12);
  slash.rotation.z = -0.65;
  icon.add(slash);
  icon.position.set(0, h + 2, -2);
  s.live.add(icon);
  s.ctx.animated.push((e) => {
    icon.position.y = h + 2 + Math.sin(e * 1.6) * 0.25;
    icon.rotation.y = Math.sin(e * 0.7) * 0.5;
    light.visible = Math.floor(e * 1.2) % 2 === 0;
  });

  // Forest patch.
  const trees = ["nature/tree_pineRoundA", "nature/tree_default", "nature/tree_oak_fall", "nature/tree_detailed_fall"] as const;
  [[-4, -4.2], [3.8, -4.4], [-4.3, -0.4], [4.1, -0.8], [-2.2, -5], [2.2, -5.2]].forEach(([px, pz], i) => {
    const tr = normalize(s.ctx.resources.model(trees[i % trees.length]!), 3.4 + (i % 2) * 0.8);
    tr.position.set(px!, 0, pz!);
    s.statics.add(tr);
    s.solid(px!, 1.5, pz!, 0.5, 3, 0.5);
  });
  // Fence around the tower base.
  s.statics.add(box(3.8, 0.9, 0.06, "#8a98a6", 0, 0.45, -0.1), box(3.8, 0.9, 0.06, "#8a98a6", 0, 0.45, -3.9));
  s.statics.add(box(0.06, 0.9, 3.8, "#8a98a6", -1.9, 0.45, -2), box(0.06, 0.9, 3.8, "#8a98a6", 1.9, 0.45, -2));
  s.solid(0, 0.8, -2, 3.9, 1.6, 3.9);
}

/** A giant ID card, snapped in two, leaning on the grass. */
function ektp(s: Site) {
  const card = new THREE.Group();
  const w = 6.4;
  const h = 4;
  // Two halves with a zig-zag gap.
  const half = (sign: number) => {
    const shape = new THREE.Shape();
    const zig = [0.2, -0.25, 0.15, -0.2, 0.25, -0.1];
    if (sign < 0) {
      shape.moveTo(-w / 2, -h / 2);
      zig.forEach((dx, i) => shape.lineTo(dx, -h / 2 + (i / (zig.length - 1)) * h));
      shape.lineTo(-w / 2, h / 2);
    } else {
      shape.moveTo(w / 2, -h / 2);
      shape.lineTo(w / 2, h / 2);
      [...zig].reverse().forEach((dx, i) => shape.lineTo(dx + 0.08, h / 2 - (i / (zig.length - 1)) * h));
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    const m = new THREE.Mesh(geo, toonMaterial("#7fb8e6"));
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  const left = half(-1);
  const right = half(1);
  right.position.set(0.25, -0.12, 0);
  right.rotation.z = -0.05;
  card.add(left, right);
  const face = 0.19;
  // Photo box with a head-and-shoulders silhouette, chip, text lines.
  card.add(box(1.6, 2, 0.03, "#dbe9f5", -2.1, -0.3, face));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), toonMaterial("#5b6b7c"));
  head.position.set(-2.1, 0, face);
  head.scale.z = 0.2;
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), toonMaterial("#5b6b7c"));
  shoulders.position.set(-2.1, -1.2, face);
  shoulders.scale.z = 0.2;
  card.add(head, shoulders);
  card.add(box(0.7, 0.55, 0.05, PALETTE.gold, -0.6, 0.9, face));
  const title = new Text3D(s.ctx.fonts.display, toonMaterial(PALETTE.ink), { size: 0.36, depth: 0.05 }, "KTP-el");
  title.position.set(-2.8, 1.75, face);
  card.add(title);
  for (let i = 0; i < 5; i++) card.add(box(2.4 - (i % 2) * 0.7, 0.14, 0.03, "#4f6b86", 1.4 - (i % 2) * 0.35 + (i === 0 ? 0 : 0), 1 - i * 0.45, face));
  const nik = new Text3D(s.ctx.fonts.body, toonMaterial(PALETTE.ink), { size: 0.22, depth: 0.04 }, "NIK 3201 •••• •••• ••••");
  nik.position.set(-0.9, -1.4, face);
  card.add(nik);
  card.position.set(0, h / 2 * Math.cos(0.3) + 0.1, -2.2);
  card.rotation.x = -0.3;
  s.statics.add(card);
  // Easel prop behind it.
  const prop = box(0.2, 3.2, 0.2, "#6b4a2e", 0, 1.5, -3.7);
  prop.rotation.x = 0.45;
  s.statics.add(prop);
  s.solid(0, 1.8, -2.4, w, 3.6, 1.2);
}

/** Vault riddled with holes, coins trickling out onto a pile. */
function insurance(s: Site) {
  const vw = 4.4;
  const vh = 3.8;
  const vd = 3.2;
  const body = new THREE.Mesh(roundedSlab(vw, vh, vd, 0.35), toonMaterial("#6d7f91"));
  body.position.set(0, vh / 2, -2.4);
  body.castShadow = body.receiveShadow = true;
  s.statics.add(body);
  // Door with a dial.
  const door = cyl(1.2, 1.2, 0.2, "#8c9fb1", 28);
  door.rotation.x = Math.PI / 2;
  door.position.set(0, vh / 2, -2.4 + vd / 2 + 0.05);
  const dial = cyl(0.35, 0.35, 0.18, PALETTE.gold, 18);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, vh / 2, -2.4 + vd / 2 + 0.18);
  s.statics.add(door, dial);
  const spokes = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const sp = box(1.5, 0.1, 0.1, PALETTE.gold);
    sp.rotation.z = (i / 3) * Math.PI;
    spokes.add(sp);
  }
  spokes.position.set(0, vh / 2, -2.4 + vd / 2 + 0.26);
  s.statics.add(spokes);
  // Holes: dark discs on the front and sides.
  const holes: THREE.Vector3[] = [
    new THREE.Vector3(-1.6, 0.7, -2.4 + vd / 2 + 0.02),
    new THREE.Vector3(1.55, 1.1, -2.4 + vd / 2 + 0.02),
    new THREE.Vector3(-1.2, 3.1, -2.4 + vd / 2 + 0.02),
  ];
  for (const hp of holes) {
    const hole = cyl(0.26, 0.26, 0.06, "#1e2833", 14);
    hole.rotation.x = Math.PI / 2;
    hole.position.copy(hp);
    s.statics.add(hole);
  }
  s.solid(0, vh / 2, -2.4, vw, vh, vd);

  // The universal insurance sign: an umbrella, torn open with holes in it.
  const umbrella = new THREE.Group();
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    if (i === 2 || i === 5) continue; // torn-out panels
    const panel = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 0.9, 3, 1, true, (i / segs) * Math.PI * 2, (Math.PI * 2) / segs),
      new THREE.MeshToonMaterial({ color: i % 2 ? PALETTE.putih : PALETTE.merah, gradientMap: getGradientMap(), side: THREE.DoubleSide })
    );
    panel.castShadow = true;
    umbrella.add(panel);
  }
  // Dangling torn flap.
  const flap = box(0.6, 0.5, 0.02, PALETTE.merah, 1.2, -0.55, 0.9);
  flap.rotation.set(0.3, 0.9, 0.5);
  umbrella.add(flap);
  const shaft = cyl(0.04, 0.04, 3.4, "#3d4a57", 6);
  shaft.position.y = -1.3;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 6, 12, Math.PI), toonMaterial("#3d4a57"));
  handle.position.set(0.18, -3, 0);
  handle.rotation.z = Math.PI;
  umbrella.add(shaft, handle);
  umbrella.position.set(3.7, 4.1, -0.6);
  umbrella.rotation.z = -0.35;
  s.statics.add(umbrella);
  s.solid(3.4, 1.2, -0.6, 0.3, 2.4, 0.3);

  // Coin pile under the holes and coins leaking out of them on a loop.
  const geo = coinGeometry(s.ctx.fonts.display, 0.22, 0.07);
  const mats = coinMaterials();
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Mesh(geo, mats);
    const hp = holes[i % 2]!;
    c.position.set(hp.x + ((i * 7) % 5) * 0.15 - 0.3, 0.05 + (i % 3) * 0.06, hp.z + 0.4 + ((i * 3) % 4) * 0.15);
    c.rotation.set(Math.PI / 2, 0, i);
    s.statics.add(c);
  }
  const drops = Array.from({ length: 9 }, (_, i) => {
    const c = new THREE.Mesh(geo, mats);
    c.castShadow = true;
    s.live.add(c);
    return { c, hole: holes[i % holes.length]!, phase: i / 9 };
  });
  s.ctx.animated.push((e) => {
    for (const { c, hole, phase } of drops) {
      const k = (e * 0.55 + phase) % 1;
      c.position.set(hole.x + Math.sin(phase * 20) * 0.1, hole.y - k * k * hole.y, hole.z + 0.15 + k * 0.6);
      c.rotation.set(k * 9, phase * 6, 0);
      c.visible = k < 0.97;
    }
  });
}

/** Aid boxes, knockable — and empty inside. */
function bansos(s: Site) {
  const size = new THREE.Vector3(1.1, 0.8, 0.8);
  const cardboard = ["#d9a066", "#c98a4e", "#e0b07a"];
  const layers = [[-1.2, 0, 1.2, -0.6, 0.6], [-0.6, 0.6, 0], [0]];
  layers.forEach((row, level) => {
    row.forEach((bx, i) => {
      const crate = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), toonMaterial(cardboard[(i + level) % 3]!));
      shell.castShadow = shell.receiveShadow = true;
      crate.add(shell);
      const lz = level === 0 && i > 2 ? -2.3 : -1.5;
      crate.position.copy(s.at(bx, size.y / 2 + level * size.y, lz));
      crate.rotation.y = s.rotY;
      s.ctx.scene.add(crate);
      s.ctx.physics.addDynamicBox(crate, size, 0.5);
    });
  });
  // A few opened boxes on the ground: nothing inside.
  const open = (lx: number, lz: number, rot: number) => {
    const g = new THREE.Group();
    const mat = toonMaterial("#c98a4e");
    const bottom = box(1.1, 0.04, 0.8, "#a8703c", 0, 0.02, 0);
    g.add(bottom);
    for (const [w, d, x, z] of [[1.1, 0.04, 0, 0.38], [1.1, 0.04, 0, -0.38], [0.04, 0.8, 0.53, 0], [0.04, 0.8, -0.53, 0]] as const) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), mat);
      wall.position.set(x, 0.4, z);
      g.add(wall);
    }
    for (const side of [-1, 1]) {
      const flap = box(1.1, 0.03, 0.4, "#d9a066", 0, 0.8, side * 0.56);
      flap.rotation.x = side * -0.5;
      g.add(flap);
    }
    g.position.set(lx, 0, lz);
    g.rotation.y = rot;
    s.statics.add(g);
    s.solid(lx, 0.4, lz, 1.1, 0.8, 0.8);
  };
  open(2.8, 0.4, 0.3);
  open(-3, 0.8, -0.4);
  open(3.4, -3.4, 1.2);
  // A flatbed with an empty load bed.
  const truck = new THREE.Group();
  truck.add(box(1.6, 1.4, 1.8, PALETTE.putih, -1.4, 1.1, 0), box(3, 0.2, 1.8, "#6b7a8a", 0.9, 0.55, 0), box(1.5, 0.6, 1.75, PALETTE.glass, -1.5, 1.4, 0));
  for (const wx of [-1.4, 1.6]) {
    for (const wz of [-0.85, 0.85]) {
      const wheel = cyl(0.38, 0.38, 0.25, "#27313b", 14);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      truck.add(wheel);
    }
  }
  truck.position.set(-1, 0, -4.2);
  s.statics.add(truck);
  s.solid(-0.6, 0.9, -4.2, 4.6, 1.8, 1.9);
}

/** Silver tin ingot (trapezoid bar), the clearest "this is tin" cue. */
function ingotGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.55, 0);
  shape.lineTo(0.55, 0);
  shape.lineTo(0.45, 0.26);
  shape.lineTo(-0.45, 0.26);
  shape.lineTo(-0.55, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  geo.translate(0, 0, -0.18);
  return geo;
}

/**
 * Bangka tin mining: a pyramid of shiny tin ingots in front of a turquoise
 * "kolong" pit lake ringed by white tailings sand, a floating tin dredge
 * pontoon with drums and a sluice pipe, and an excavator on the rim.
 */
function timah(s: Site) {
  const cx = -1.6;
  const cz = -2.6;
  // Pit: white sand rim terraces stepping down to turquoise water.
  const rings = 4;
  for (let i = 0; i < rings; i++) {
    const outer = 4.4 - i * 0.65;
    const inner = outer - 0.65;
    const shape = new THREE.Shape().absarc(0, 0, outer, 0, Math.PI * 2, false);
    shape.holes.push(new THREE.Path().absarc(0, 0, inner, 0, Math.PI * 2, true));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false, curveSegments: 24 });
    geo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(geo, toonMaterial(i % 2 ? "#e9dfc6" : "#f4ecd8"));
    ring.position.set(cx, 0, cz);
    ring.scale.y = 0.35 + (rings - 1 - i) * 0.3;
    ring.receiveShadow = ring.castShadow = true;
    s.statics.add(ring);
  }
  const water = cyl(1.8, 1.8, 0.12, "#2fd1c1", 28);
  water.position.set(cx, 0.22, cz);
  s.statics.add(water);
  s.solid(cx, 0.7, cz, 8.4, 1.4, 8.4);

  // Floating dredge pontoon ("TI apung") on the lake.
  const raft = new THREE.Group();
  raft.add(box(1.4, 0.12, 1, "#8a6a4a", 0, 0.1, 0));
  for (const [dx, dz] of [[-0.45, -0.3], [-0.45, 0.3], [0.45, -0.3], [0.45, 0.3]] as const) {
    const drum = cyl(0.17, 0.17, 0.4, dz > 0 ? "#2f6fb0" : "#d24a3a", 10);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(dx, 0.02, dz);
    raft.add(drum);
  }
  raft.add(box(0.5, 0.35, 0.4, "#4a5561", -0.3, 0.33, 0), box(0.06, 1, 0.06, "#6b7a8a", 0.3, 0.6, 0));
  const pipe = cyl(0.07, 0.07, 2.4, "#3d4a57", 8);
  pipe.rotation.z = 1.1;
  pipe.position.set(1.3, 0.75, 0);
  const sluice = box(1.6, 0.12, 0.35, "#b0773f", 2.6, 1.25, 0);
  sluice.rotation.z = 0.25;
  raft.add(pipe, sluice);
  raft.position.set(cx - 0.4, 0.28, cz + 0.2);
  raft.rotation.y = 0.6;
  s.live.add(raft);
  s.ctx.animated.push((e) => {
    raft.position.y = 0.28 + Math.sin(e * 1.4) * 0.03;
    raft.rotation.z = Math.sin(e * 1.1) * 0.03;
  });

  // Tailings heaps and a second, smaller abandoned pit lake.
  for (const [hx, hz, r, hgt] of [[3.2, -4.3, 1.1, 1.1], [3.9, -2.8, 0.8, 0.8], [-5.8, -5, 1, 0.9]] as const) {
    const heap = new THREE.Mesh(new THREE.ConeGeometry(r, hgt, 10), toonMaterial("#f1e8d2"));
    heap.position.set(hx, hgt / 2, hz);
    heap.castShadow = heap.receiveShadow = true;
    s.statics.add(heap);
  }
  const pond = cyl(1.2, 1.3, 0.08, "#3fc9b8", 20);
  pond.position.set(-6, 0.05, -1.4);
  const pondRim = cyl(1.5, 1.6, 0.06, "#efe6cf", 20);
  pondRim.position.set(-6, 0.03, -1.4);
  s.statics.add(pondRim, pond);

  // The ingots: a big stacked pyramid of shiny tin bars on a pallet, out
  // front beside the price tag where the camera can see them.
  const ingot = ingotGeometry();
  const tin = toonMaterial("#e9eff3");
  const tinToon = toonMaterial("#a9b5bf");
  const px = 4.1;
  const pz = 2.3;
  const stack = new THREE.Group();
  stack.add(box(2.8, 0.18, 1.8, "#8a6a4a", 0, 0.09, 0));
  [4, 3, 2, 1].forEach((n, level) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < 2; j++) {
        const bar = new THREE.Mesh(ingot, (i + level) % 2 ? tin : tinToon);
        bar.position.set((i - (n - 1) / 2) * 0.62, 0.18 + level * 0.28, (j - 0.5) * 0.5 + (level % 2) * 0.05);
        bar.castShadow = bar.receiveShadow = true;
        stack.add(bar);
      }
    }
  });
  stack.scale.setScalar(1.35);
  stack.position.set(px, 0, pz);
  stack.rotation.y = -0.25;
  s.statics.add(stack);
  const glints: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    g.position.set(px - 0.6 + i * 0.6, 1.75 - (i % 2) * 0.4, pz + 0.45);
    s.live.add(g);
    glints.push(g);
    s.ctx.glowing.push(g);
  }
  s.ctx.animated.push((e) => {
    glints.forEach((g, i) => {
      const k = Math.max(0, Math.sin(e * 2.3 + i * 2.1));
      g.scale.setScalar(0.2 + k * k * 1.4);
      g.rotation.y = e * 2;
    });
  });
  s.solid(px, 0.8, pz, 3.6, 1.6, 2.4);

  // Excavator on the rim, bucket over the pit.
  const ex = new THREE.Group();
  ex.add(box(1.8, 0.4, 1.3, "#27313b", 0, 0.2, 0), box(1.4, 0.9, 1.1, PALETTE.gold, 0, 0.85, 0), box(0.6, 0.6, 0.6, PALETTE.glass, -0.3, 1.5, 0.2));
  const boom = box(1.9, 0.2, 0.2, PALETTE.goldDark, 1.2, 1.5, 0);
  boom.rotation.z = 0.5;
  const stick = box(0.2, 1.3, 0.2, PALETTE.goldDark, 2, 1.1, 0);
  stick.rotation.z = -0.3;
  const bucket = box(0.5, 0.4, 0.5, "#4a5561", 2.2, 0.45, 0);
  ex.add(boom, stick, bucket);
  ex.position.set(1.4, 1.4, -6.2);
  ex.rotation.y = 2.2;
  s.statics.add(ex);
  s.solid(1.4, 2, -6.2, 2, 1.6, 2);
}

/**
 * One end car of a KCIC400AF-style high-speed train: a long body whose roof
 * sweeps down into a low, pointed nose (the front faces +x).
 */
function whooshCar(length: number) {
  const H = 1.05;
  const W = 1.25;
  const nose = 1.9;
  const r = 0.16; // edge rounding (bevel)
  const half = length / 2;
  // Side profile in x/y; extruded across the car's width.
  const profile = new THREE.Shape();
  profile.moveTo(-half, 0.12);
  profile.lineTo(half, 0.12);
  profile.quadraticCurveTo(half + nose * 0.85, 0.12, half + nose, 0.3);
  profile.quadraticCurveTo(half + nose * 0.55, H * 0.95, half, H);
  profile.lineTo(-half, H);
  profile.lineTo(-half, 0.12);
  const geo = new THREE.ExtrudeGeometry(profile, { depth: W - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 16 });
  geo.translate(0, 0, -(W - r * 2) / 2);

  const car = new THREE.Group();
  const body = new THREE.Mesh(geo, toonMaterial("#f2f4f6"));
  car.add(body);
  // Dark window band along both sides, and the wrap-around windscreen on the nose.
  for (const side of [-1, 1]) {
    car.add(box(length - 0.3, 0.26, 0.04, PALETTE.glass, -0.1, H * 0.7, side * (W / 2 + r * 0.55)));
    // Red stripe low on the side, rising toward the nose.
    car.add(box(length + 0.2, 0.08, 0.04, PALETTE.merah, 0, 0.42, side * (W / 2 + r * 0.55)));
    const sweep = box(1.3, 0.08, 0.04, PALETTE.merah, half + 0.75, 0.3, side * (W / 2 + r * 0.3));
    sweep.rotation.z = -0.22;
    sweep.scale.z = 1;
    car.add(sweep);
  }
  const shield = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), toonMaterial("#1e2a38"));
  shield.scale.set(1.05, 0.26, 0.95);
  shield.position.set(half + nose * 0.38, H * 0.82, 0);
  shield.rotation.z = -0.42;
  car.add(shield);
  // Headlights low on the nose.
  for (const side of [-1, 1]) {
    const lamp = box(0.22, 0.06, 0.14, "#fff6c9", half + nose * 0.78, 0.26, side * 0.34);
    lamp.rotation.z = -0.25;
    car.add(lamp);
  }
  // Grey skirt and a pantograph on the roof.
  car.add(box(length + nose * 0.6, 0.14, W - 0.1, "#9aa5b1", nose * 0.2, 0.07, 0));
  const panto = new THREE.Group();
  const armA = box(0.9, 0.04, 0.04, "#3d4a57", 0, 0.2, 0);
  armA.rotation.z = 0.45;
  const armB = box(0.9, 0.04, 0.04, "#3d4a57", 0.3, 0.2, 0);
  armB.rotation.z = -0.45;
  panto.add(box(0.5, 0.06, 0.3, "#3d4a57", 0, 0, 0), armA, armB, box(0.08, 0.04, 0.8, "#3d4a57", 0.15, 0.4, 0));
  panto.position.set(-half + 0.8, H + 0.1, 0);
  car.add(panto);
  car.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  return car;
}

/** Two-car Whoosh set on a stretch of elevated viaduct. */
function whoosh(s: Site) {
  const deckY = 2.8;
  const len = 10.6;
  // Box-girder deck with parapets, on hammerhead piers.
  s.statics.add(box(len, 0.45, 2.4, CONCRETE, 0, deckY, -2));
  for (const side of [-1, 1]) s.statics.add(box(len, 0.3, 0.12, CONCRETE, 0, deckY + 0.36, -2 + side * 1.14));
  for (const px of [-3.6, 3.6]) {
    s.statics.add(box(0.9, deckY - 0.2, 0.9, CONCRETE_DARK, px, (deckY - 0.2) / 2, -2), box(1, 0.35, 2.2, CONCRETE_DARK, px, deckY - 0.4, -2));
    s.solid(px, deckY / 2, -2, 1, deckY, 1);
  }
  for (const rz of [-2.35, -1.65]) s.statics.add(box(len, 0.06, 0.08, "#6b7a8a", 0, deckY + 0.26, rz));
  // Catenary masts and wire.
  for (const px of [-4.6, 0, 4.6]) {
    s.statics.add(box(0.08, 2, 0.08, "#8a98a6", px, deckY + 1.2, -3.1), box(0.06, 0.06, 1.2, "#8a98a6", px, deckY + 2.1, -2.55));
  }
  s.statics.add(box(len, 0.02, 0.02, "#3d4a57", 0, deckY + 1.98, -2));
  s.solid(0, deckY, -2, len, 0.5, 2.4);

  const carLen = 2.4;
  const train = new THREE.Group();
  const lead = whooshCar(carLen);
  lead.position.x = carLen / 2 + 0.06;
  const tail = whooshCar(carLen);
  tail.rotation.y = Math.PI;
  tail.position.x = -(carLen / 2 + 0.06);
  // Gangway between the cars.
  train.add(lead, tail, box(0.2, 0.8, 1, "#3d4a57", 0, 0.55, 0));
  train.position.set(0, deckY + 0.3, -2);
  s.live.add(train);
  s.ctx.animated.push((e) => {
    // Rolls gently back and forth along the short deck.
    train.position.x = Math.sin(e * 0.5) * 0.7;
  });
}

/**
 * IKN: the bladed "wings" of the new palace (abstract fan of verdigris
 * fins on a podium, no head or emblem), half of it still in scaffolding,
 * two tower cranes, and cleared land full of tree stumps around it.
 */
function ikn(s: Site) {
  const cx = 1.6;
  const cz = -2.4;
  // Cleared, bare earth with stumps.
  s.statics.add(box(12, 0.04, 8.5, "#c9a77c", cx, 0.02, cz + 0.4));
  [[-3.6, 0.9], [-2.4, 1.6], [5.6, 1.2], [6.4, -4.8], [-3.8, -5.4], [4.8, -6], [-1.2, 1.9], [7, -1.5]].forEach(([x, z], i) => {
    const stump = normalize(s.ctx.resources.model(i % 2 ? "nature/stump_round" : "nature/log"), 1.6 + (i % 3) * 0.3);
    stump.position.set(x!, 0, z!);
    stump.rotation.y = i * 1.3;
    s.statics.add(stump);
  });

  // Scrub creeping back over the cleared land while you're here.
  [[-3.2, -1], [6.4, -3.2], [5.2, 0.8], [-2.8, -4.6], [0.4, 1.4], [3.2, -6.2]].forEach(([bx, bz], i) => {
    const bush = normalize(s.ctx.resources.model(i % 3 === 0 ? "nature/grass_large" : i % 3 === 1 ? "nature/plant_bushSmall" : "nature/plant_bush"), 2.4);
    bush.position.set(bx!, 0, bz!);
    s.grow(bush);
  });

  // Stepped white podium.
  for (let i = 0; i < 3; i++) s.statics.add(box(8 - i * 1.4, 0.45, 4.6 - i * 0.9, i === 2 ? "#e6eef5" : "#d3dde6", cx, 0.225 + i * 0.45, cz));
  s.solid(cx, 0.7, cz, 8, 1.4, 4.6);

  // Fan of vertical fins in a spread-wing silhouette: tall in the middle,
  // dipping, then rising again toward each wing tip.
  const fins = 41;
  const span = 7.2;
  const copper = toonMaterial("#3f7f6c");
  const copperLight = toonMaterial("#5aa38a");
  const baseY = 1.35;
  for (let i = 0; i < fins; i++) {
    const u = i / (fins - 1) * 2 - 1; // -1 … 1 across the span
    const a = Math.abs(u);
    const height = 1.4 + 3.6 * Math.exp(-a * a * 18) + 2.6 * Math.pow(a, 2.2);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, 0.7 + (1 - a) * 0.5), i % 2 ? copper : copperLight);
    // The wings sweep back slightly, like an open V from above.
    fin.position.set(cx + u * span / 2, baseY + height / 2, cz - a * 1.1);
    fin.rotation.y = u * 0.35;
    fin.rotation.z = -u * 0.12;
    fin.castShadow = fin.receiveShadow = true;
    s.statics.add(fin);
  }
  s.solid(cx, 3.5, cz - 0.5, span, 5, 1.6);

  // Scaffolding over the left wing: it isn't finished.
  const scaffold = "#e0a33a";
  for (let i = 0; i < 5; i++) {
    const x = cx - span / 2 + i * 0.8;
    s.statics.add(box(0.06, 6.5, 0.06, scaffold, x, baseY + 3.25, cz + 0.55), box(0.06, 6.5, 0.06, scaffold, x, baseY + 3.25, cz - 1.6));
  }
  for (let j = 0; j < 5; j++) s.statics.add(box(3.4, 0.06, 0.06, scaffold, cx - span / 2 + 1.6, baseY + 0.8 + j * 1.3, cz + 0.55));

  // Two tower cranes; one slowly turning.
  const crane = (x: number, z: number, h: number, turn: boolean) => {
    s.statics.add(box(0.45, h, 0.45, PALETTE.gold, x, h / 2, z));
    s.solid(x, h / 2, z, 0.55, h, 0.55);
    const jib = new THREE.Group();
    jib.add(box(7, 0.3, 0.3, PALETTE.gold, 1.6, 0, 0), box(1.8, 0.55, 0.55, "#5b6b7c", -2.3, -0.1, 0), box(0.8, 0.7, 0.7, PALETTE.glass, 0, -0.55, 0));
    jib.add(box(0.03, 3, 0.03, "#3d4a57", 4.2, -1.5, 0), box(0.45, 0.45, 0.45, "#c9b48a", 4.2, -3.1, 0));
    jib.position.set(x, h, z);
    jib.rotation.y = turn ? 0 : 2.4;
    s.live.add(jib);
    if (turn) s.ctx.animated.push((e) => (jib.rotation.y = Math.sin(e * 0.15) * 1.3));
  };
  crane(cx + 5.4, cz - 3.4, 12, true);
  crane(cx - 5.2, cz - 3.8, 10, false);
}

// ---------------------------------------------------------------------------

const EXHIBITS: [key: keyof typeof PLAQUES, build: (s: Site) => void][] = [
  ["ikn", ikn],
  ["whoosh", whoosh],
  ["hambalang", hambalang],
  ["bts", bts],
  ["ektp", ektp],
  ["insurance", insurance],
  ["bansos", bansos],
  ["timah", timah],
];

/** Along z, leaving a gap in the middle for the entrance sign. */
const SLOT_Z = [-42.1, -30.9, -19.7, -8.5, 8.5, 19.7, 30.9, 42.1];

/** Where the tour camera stands for each exhibit, and what it looks at. */
export const TOUR_STOPS = SLOT_Z.map((z) => ({
  pos: new THREE.Vector3(EXHIBIT_X + 11, 8.5, z + 7),
  look: new THREE.Vector3(EXHIBIT_X, 3, z),
}));

export type MuseumState = { dusk: number; kaching: boolean };
export type Museum = { update: (car: THREE.Vector3, dt: number, elapsed: number) => MuseumState };

/** Street lamp facing the road (west); returns the bulb and its light pool. */
function streetLamp(ctx: WorldCtx, x: number, z: number) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 8), toonMaterial("#4a5561"));
  pole.position.y = 2.1;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), toonMaterial("#4a5561"));
  arm.position.set(-0.65, 4.15, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.32), toonMaterial("#3d4a57"));
  head.position.set(-1.3, 4.1, 0);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: "#5d6470" }));
  bulb.position.set(-1.3, 3.98, 0);
  bulb.scale.y = 0.5;
  g.add(pole, arm, head, bulb);
  g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
  g.position.set(x, 0, z);
  ctx.scene.add(g);
  ctx.glowing.push(bulb);
  ctx.physics.addStaticBox(new THREE.Vector3(x, 2.1, z), new THREE.Vector3(0.25, 4.2, 0.25));
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 28),
    new THREE.MeshBasicMaterial({ color: "#ffd98a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x - 1.3, 0.07, z);
  pool.renderOrder = 2;
  ctx.scene.add(pool);
  return { bulb: bulb.material as THREE.MeshBasicMaterial, pool: pool.material as THREE.MeshBasicMaterial };
}

export function buildMuseum(ctx: WorldCtx): Museum {
  // The broken road: worn asphalt strip with potholes and puddles.
  const road = new THREE.Group();
  const strip = new THREE.Mesh(new THREE.BoxGeometry(5, 0.04, ROAD_LENGTH), toonMaterial("#8e9299"));
  strip.position.set(MUSEUM_ROAD_X, 0.02, 0);
  strip.receiveShadow = true;
  road.add(strip);
  for (const side of [-1, 1]) road.add(box(0.12, 0.05, ROAD_LENGTH, "#d7dbe0", MUSEUM_ROAD_X + side * 2.3, 0.03, 0));
  for (let i = 0; i < 26; i++) {
    const r = 0.35 + ((i * 7) % 5) * 0.12;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.05, 10), toonMaterial(i % 3 ? "#5f646c" : "#7fb3c9"));
    hole.position.set(MUSEUM_ROAD_X + (((i * 13) % 9) - 4) * 0.45, 0.03, -ROAD_LENGTH / 2 + 2 + (i * 3.55) % (ROAD_LENGTH - 4));
    hole.scale.z = 0.7 + ((i * 5) % 4) * 0.15;
    road.add(hole);
  }
  road.traverse((o) => ((o as THREE.Mesh).castShadow = false));
  ctx.statics.add(road);
  for (const [lz, flip] of [[-12.5, 0], [12.5, Math.PI]] as const) {
    const label = new Text3D(ctx.fonts.display, toonMaterial("#f4f6f8"), { size: 0.7, depth: 0.08, align: "center", anchor: "middle" });
    label.rotation.set(-Math.PI / 2, 0, Math.PI / 2 + flip);
    label.position.set(MUSEUM_ROAD_X, 0.06, lz);
    label.castShadow = false;
    ctx.scene.add(label);
    ctx.localized.push((lang) => label.setText(t(TXT.road, lang)));
  }
  // Cones and a barrier where the road ends.
  for (const lz of [-ROAD_LENGTH / 2 + 0.6, ROAD_LENGTH / 2 - 0.6]) {
    const barrier = normalize(ctx.resources.model("roads/construction-barrier"), 3.2);
    barrier.position.set(MUSEUM_ROAD_X, 0, lz);
    ctx.statics.add(barrier);
    ctx.physics.addStaticBox(new THREE.Vector3(MUSEUM_ROAD_X, 0.6, lz), new THREE.Vector3(3, 1.2, 0.4));
  }

  // Entrance sign on the west verge, between the middle exhibits, facing the road.
  const sign = new Board3D(ctx.fonts, {
    width: 6.4,
    height: 2,
    lift: 2,
    panel: PALETTE.ink,
    frame: "#0f2238",
    accent: { color: PALETTE.merah, side: "top" },
    padding: 0.45,
    content: (lang) => [
      { kind: "text", text: t(TXT.title, lang), font: "display", size: 0.44, color: PALETTE.cream, maxLines: 2 },
    ],
  });
  sign.group.position.set(MUSEUM_ROAD_X - 4, 0, 0);
  sign.group.rotation.y = Math.PI / 2;
  ctx.scene.add(sign.group);
  ctx.localized.push((lang) => sign.rebuild(lang));
  ctx.physics.addStaticBox(new THREE.Vector3(MUSEUM_ROAD_X - 4.15, sign.size.y / 2, 0), new THREE.Vector3(0.6, sign.size.y, 5.6));

  const rotY = Math.PI / 2;
  const growers: Grower[] = [];
  const tags: Tag[] = [];
  EXHIBITS.forEach(([key, build], i) => {
    const site = makeSite(ctx, EXHIBIT_X, SLOT_Z[i]!, rotY, growers);
    build(site);
    tags.push(plaque(site, PLAQUES[key]!, -1.4, 4.4));
  });

  // Street lamps on the east verge, between the exhibits; one flickers.
  const lampZ = [-36.5, -25.3, -14.1, -3, 3, 14.1, 25.3, 36.5];
  const lamps = lampZ.map((z) => streetLamp(ctx, MUSEUM_ROAD_X + 3.3, z));
  const off = new THREE.Color("#5d6470");
  const on = new THREE.Color("#ffe29a");

  // Tour pad by the entrance sign.
  ctx.areas.add("museum-tour", new THREE.Vector3(MUSEUM_ROAD_X, 0, -4.5), TXT.tour, { kind: "tour" }, { radius: 2, color: PALETTE.merah, name: TXT.tourName });

  let dusk = 0;
  let overgrowth = 0;
  const applyGrowth = () => {
    const k = 0.12 + 0.88 * Math.min(1, overgrowth / 150);
    for (const { obj, full, mode } of growers) {
      if (mode === "up") obj.scale.set(full.x, full.y * k, full.z);
      else obj.scale.copy(full).multiplyScalar(k);
    }
  };
  applyGrowth();

  return {
    update(car, dt, elapsed) {
      // Dusk falls as you drive in (from the grass west of the exhibits onward).
      const inside = Math.abs(car.z) < ROAD_LENGTH / 2 + 4 ? THREE.MathUtils.smoothstep(car.x, EXHIBIT_X - 9, EXHIBIT_X - 3) : 0;
      dusk += (inside - dusk) * Math.min(1, dt * 1.5);
      lamps.forEach((l, i) => {
        let k = THREE.MathUtils.smoothstep(dusk, 0.3, 0.8);
        if (i === 5) k *= Math.sin(elapsed * 23) > -0.2 && Math.sin(elapsed * 3.1) > -0.6 ? 1 : 0.15; // the dodgy one
        l.bulb.color.copy(off).lerp(on, k);
        l.pool.opacity = k * 0.1;
      });

      if (inside > 0.5) {
        overgrowth += dt;
        applyGrowth();
      }

      // Price tags spin with a "ka-ching" as you pass.
      let kaching = false;
      for (const tag of tags) {
        const d = Math.hypot(car.x - tag.at.x, car.z - tag.at.z);
        if (!tag.near && d < 3.6) {
          tag.near = true;
          tag.spin = 1;
          kaching = true;
        } else if (tag.near && d > 7) tag.near = false;
        if (tag.spin > 0) {
          tag.spin = Math.max(0, tag.spin - dt / 1.4);
          // Two turns, easing out.
          tag.swing.rotation.y = (1 - Math.pow(tag.spin, 3)) * Math.PI * 4;
        }
      }
      return { dusk, kaching };
    },
  };
}
