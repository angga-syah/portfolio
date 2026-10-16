import * as THREE from "three";
import type { Lang } from "@/data/world";
import { Text3D, measure, roundedSlab, type Fonts } from "./Text3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

export type Block =
  | { kind: "text"; text: string; font?: "display" | "body"; size: number; color: string; maxLines?: number; gap?: number; bottom?: boolean }
  | { kind: "chips"; items: string[]; size: number; fg: string; bg: string; gap?: number };

type BoardOptions = {
  width: number;
  height: number;
  /** Height of the panel's bottom edge above the ground. */
  lift?: number;
  panel?: string;
  frame?: string;
  /** Coloured strip along the top (or left) edge. */
  accent?: { color: string; side: "top" | "left" };
  padding?: number;
  content: (lang: Lang) => Block[];
};

/**
 * A signboard whose content is real extruded 3D text sitting proud of the
 * panel. `rebuild(lang)` re-lays it out when the language changes.
 */
export class Board3D {
  group = new THREE.Group();
  /** Everything that should count as "the board" for clicks. */
  panel: THREE.Mesh;
  size: THREE.Vector3;
  private content = new THREE.Group();
  private front: number;

  constructor(private fonts: Fonts, private opts: BoardOptions) {
    const { width, height, lift = 1.2, panel = PALETTE.cream, frame = PALETTE.ink, accent } = opts;
    const depth = 0.24;
    this.front = depth / 2;

    const back = new THREE.Mesh(roundedSlab(width + 0.24, height + 0.24, depth * 0.8, 0.28), toonMaterial(frame));
    back.position.set(0, lift + height / 2, -0.06);
    this.panel = new THREE.Mesh(roundedSlab(width, height, depth, 0.2), toonMaterial(panel));
    this.panel.position.set(0, lift + height / 2, 0);
    for (const m of [back, this.panel]) {
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }

    if (accent) {
      const strip =
        accent.side === "top"
          ? new THREE.Mesh(roundedSlab(width - 0.3, 0.16, 0.08, 0.06), toonMaterial(accent.color))
          : new THREE.Mesh(roundedSlab(0.16, height - 0.3, 0.08, 0.06), toonMaterial(accent.color));
      if (accent.side === "top") strip.position.set(0, lift + height - 0.22, this.front + 0.04);
      else strip.position.set(-width / 2 + 0.22, lift + height / 2, this.front + 0.04);
      this.group.add(strip);
    }

    const postH = lift + height * 0.6;
    const postGeo = new THREE.BoxGeometry(0.26, postH, 0.26);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, toonMaterial(frame));
      post.position.set(side * (width / 2 - 0.6), postH / 2, -0.28);
      post.castShadow = true;
      this.group.add(post);
    }

    this.content.position.set(0, lift + height / 2, this.front);
    this.group.add(this.content);
    this.size = new THREE.Vector3(width, lift + height, depth + 0.4);
  }

  rebuild(lang: Lang) {
    for (const child of [...this.content.children]) {
      (child as THREE.Mesh).geometry?.dispose();
      this.content.remove(child);
    }
    const { width, height, padding = 0.5, accent } = this.opts;
    const left = -width / 2 + padding + (accent?.side === "left" ? 0.2 : 0);
    const maxWidth = width / 2 - padding - left;
    let y = height / 2 - padding - (accent?.side === "top" ? 0.12 : 0);
    const bottomBlocks: Block[] = [];

    for (const block of this.opts.content(lang)) {
      if (block.kind === "text" && block.bottom) {
        bottomBlocks.push(block);
        continue;
      }
      y = this.place(block, left, y, maxWidth) - (block.gap ?? 0.18);
    }
    let by = -height / 2 + padding;
    for (const block of bottomBlocks.reverse()) {
      if (block.kind !== "text") continue;
      const size = block.size;
      this.place({ ...block, maxLines: 1 }, left, by + size * 0.72, maxWidth);
      by += size * 1.4;
    }
  }

  /** Lays out one block with its top at `y`; returns the y below it. */
  private place(block: Block, left: number, y: number, maxWidth: number) {
    if (block.kind === "text") {
      const font = this.fonts[block.font ?? "body"];
      const text = new Text3D(font, toonMaterial(block.color), {
        size: block.size,
        depth: block.font === "display" ? block.size * 0.22 : block.size * 0.14,
        maxWidth,
        maxLines: block.maxLines,
      }, block.text);
      text.castShadow = false;
      text.position.set(left, y, 0);
      this.content.add(text);
      return y - text.height;
    }
    // Chips: rounded slabs with text, flowing left to right.
    const font = this.fonts.body;
    const h = block.size * 2;
    const padX = block.size * 0.8;
    let x = left;
    for (const item of block.items) {
      const w = measure(font, item, block.size) + padX * 2;
      if (x + w > left + maxWidth && x > left) {
        x = left;
        y -= h + block.size * 0.5;
      }
      const chip = new THREE.Mesh(roundedSlab(w, h, 0.06, h / 2), toonMaterial(block.bg));
      chip.position.set(x + w / 2, y - h / 2, 0.03);
      const label = new Text3D(font, toonMaterial(block.fg), { size: block.size, depth: 0.03, anchor: "middle" }, item);
      label.position.set(x + padX, y - h / 2, 0.06);
      this.content.add(chip, label);
      x += w + block.size * 0.5;
    }
    return y - h;
  }
}
