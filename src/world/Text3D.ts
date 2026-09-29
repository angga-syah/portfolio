import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type Fonts = { display: Font; body: Font };

export type TextOptions = {
  size: number;
  depth?: number | undefined;
  align?: "left" | "center" | "right" | undefined;
  /** Wrap onto new lines past this width (world units). */
  maxWidth?: number | undefined;
  maxLines?: number | undefined;
  lineHeight?: number | undefined;
  curveSegments?: number | undefined;
  /** Vertical anchor: "top" puts the first line's cap height at y = 0. */
  anchor?: "top" | "middle" | "baseline" | undefined;
};

type GlyphData = { ha: number };

function glyphs(font: Font) {
  return font.data.glyphs as unknown as Record<string, GlyphData | undefined>;
}

/** Horizontal advance of `text` at `size`, from the typeface's glyph metrics. */
export function measure(font: Font, text: string, size: number) {
  const g = glyphs(font);
  const scale = size / font.data.resolution;
  let w = 0;
  for (const ch of text) w += (g[ch] ?? g["?"])?.ha ?? 0;
  return w * scale;
}

/** Only characters the converted typeface actually has (others drop out). */
export function sanitize(font: Font, text: string) {
  const g = glyphs(font);
  return [...text].filter((ch) => ch === " " || ch === "\n" || g[ch]).join("");
}

export function wrap(font: Font, text: string, size: number, maxWidth = Infinity, maxLines = 99) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (line && measure(font, test, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]!.replace(/[\s,.;:]+$/, "")}…`;
    return kept;
  }
  return lines;
}

/**
 * Extruded, word-wrapped text as a single merged geometry. Origin is at the
 * left/centre/right edge (per `align`) of the first line.
 */
export function textGeometry(font: Font, raw: string, opts: TextOptions) {
  const { size, depth = size * 0.18, align = "left", maxWidth, maxLines, lineHeight = 1.3, curveSegments = 4, anchor = "top" } = opts;
  const text = sanitize(font, raw);
  const lines = wrap(font, text, size, maxWidth, maxLines);
  const parts: THREE.BufferGeometry[] = [];
  let width = 0;
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    const shapes = font.generateShapes(line, size);
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments });
    const w = measure(font, line, size);
    width = Math.max(width, w);
    const x = align === "center" ? -w / 2 : align === "right" ? -w : 0;
    geo.translate(x, -i * size * lineHeight, 0);
    parts.push(geo.index ? geo.toNonIndexed() : geo);
  });
  const geometry = parts.length ? mergeGeometries(parts, false) ?? new THREE.BufferGeometry() : new THREE.BufferGeometry();
  parts.forEach((p) => p.dispose());
  const capHeight = size * 0.72;
  if (anchor === "top") geometry.translate(0, -capHeight, 0);
  else if (anchor === "middle") geometry.translate(0, -capHeight / 2 + ((lines.length - 1) * size * lineHeight) / 2, 0);
  geometry.computeVertexNormals();
  const height = capHeight + (lines.length - 1) * size * lineHeight;
  return { geometry, width, height, lines: lines.length };
}

/** A text mesh whose string can be swapped (language changes). */
export class Text3D extends THREE.Mesh {
  width = 0;
  height = 0;
  private current = "";

  constructor(private font: Font, material: THREE.Material, private opts: TextOptions, text = "") {
    super(new THREE.BufferGeometry(), material);
    this.castShadow = true;
    this.receiveShadow = true;
    if (text) this.setText(text);
  }

  setText(text: string) {
    if (text === this.current) return this;
    this.current = text;
    const { geometry, width, height } = textGeometry(this.font, text, this.opts);
    this.geometry.dispose();
    this.geometry = geometry;
    this.width = width;
    this.height = height;
    return this;
  }
}

/** Rounded-rectangle slab (panels, chips, key caps). Centred, front face at +z. */
export function roundedSlab(width: number, height: number, depth: number, radius: number, segments = 4) {
  const r = Math.min(radius, width / 2, height / 2);
  const s = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: segments });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** Flat arrow pointing +x, extruded, centred at its middle. */
export function arrowGeometry(length: number, width: number, depth: number) {
  const head = width * 1.1;
  const shaft = width * 0.42;
  const s = new THREE.Shape();
  s.moveTo(-length / 2, -shaft / 2);
  s.lineTo(length / 2 - head, -shaft / 2);
  s.lineTo(length / 2 - head, -width / 2);
  s.lineTo(length / 2, 0);
  s.lineTo(length / 2 - head, width / 2);
  s.lineTo(length / 2 - head, shaft / 2);
  s.lineTo(-length / 2, shaft / 2);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}
