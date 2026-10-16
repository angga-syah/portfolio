import * as THREE from "three";
import { WARM_TINT, WARM_TINT_AMOUNT } from "./palette";

let gradientMap: THREE.DataTexture | null = null;

// 4-step ramp → flat, painterly toon shading instead of smooth PBR falloff.
export function getGradientMap() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([110, 170, 220, 255]);
  gradientMap = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.generateMipmaps = false;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

const materialCache = new Map<string, THREE.MeshToonMaterial>();

export function toonMaterial(color: THREE.ColorRepresentation, vertexColors = false) {
  const c = new THREE.Color(color);
  const key = `${c.getHexString()}|${vertexColors}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshToonMaterial({ color: c, vertexColors, gradientMap: getGradientMap() });
    materialCache.set(key, mat);
  }
  return mat;
}

const imageDataCache = new WeakMap<object, ImageData>();

function getImageData(image: CanvasImageSource & { width: number; height: number }) {
  let data = imageDataCache.get(image);
  if (data) return data;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  data = ctx.getImageData(0, 0, image.width, image.height);
  imageDataCache.set(image, data);
  return data;
}

// Kenney car/road kits color their faces by UV-mapping into a small palette
// texture. Sampling it once per vertex gives vertex colors, so every model can
// share the same toon material and be recolored per vertex.
function bakeMapToVertexColors(geometry: THREE.BufferGeometry, map: THREE.Texture, tint: THREE.Color) {
  if (geometry.userData.baked) return;
  const uv = geometry.attributes.uv as THREE.BufferAttribute | undefined;
  const image = map.image as (CanvasImageSource & { width: number; height: number }) | undefined;
  if (!uv || !image) return;
  const { data, width, height } = getImageData(image);
  const colors = new Float32Array(uv.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i) % 1;
    let v = uv.getY(i) % 1;
    if (u < 0) u += 1;
    if (v < 0) v += 1;
    const px = Math.min(width - 1, Math.floor(u * width));
    const py = Math.min(height - 1, Math.floor((map.flipY ? 1 - v : v) * height));
    const o = (py * width + px) * 4;
    c.setRGB(data[o]! / 255, data[o + 1]! / 255, data[o + 2]! / 255, THREE.SRGBColorSpace).multiply(tint);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.userData.baked = true;
}

type ToonifyOptions = { tint?: boolean; castShadow?: boolean; receiveShadow?: boolean };

export function toonify(root: THREE.Object3D, { tint = true, castShadow = true, receiveShadow = true }: ToonifyOptions = {}) {
  const warm = new THREE.Color(1, 1, 1).lerp(WARM_TINT, tint ? WARM_TINT_AMOUNT : 0);

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    const convert = (mat: THREE.Material) => {
      const src = mat as THREE.MeshStandardMaterial;
      if (src.map) {
        bakeMapToVertexColors(mesh.geometry, src.map, src.color ?? new THREE.Color(1, 1, 1));
        return toonMaterial(warm, true);
      }
      const hasVertexColors = !!mesh.geometry.attributes.color;
      const base = (src.color ?? new THREE.Color(1, 1, 1)).clone();
      if (tint) base.lerp(WARM_TINT, WARM_TINT_AMOUNT);
      return toonMaterial(base, hasVertexColors);
    };

    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
  return root;
}

// Replace every vertex whose hue is close to `from` with `to`, keeping the
// original light/dark variation so baked gradients survive the repaint.
export function recolorVertices(root: THREE.Object3D, match: (hsl: { h: number; s: number; l: number }) => boolean, to: THREE.ColorRepresentation) {
  const target = new THREE.Color(to);
  const targetHsl = { h: 0, s: 0, l: 0 };
  target.getHSL(targetHsl);
  const c = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const colors = mesh.geometry.attributes.color as THREE.BufferAttribute | undefined;
    if (!colors) return;
    for (let i = 0; i < colors.count; i++) {
      c.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i));
      c.getHSL(hsl);
      if (!match(hsl)) continue;
      c.setHSL(targetHsl.h, targetHsl.s, THREE.MathUtils.clamp(targetHsl.l + (hsl.l - 0.5) * 0.5, 0.05, 0.95));
      colors.setXYZ(i, c.r, c.g, c.b);
    }
    colors.needsUpdate = true;
  });
}

// Most common saturated vertex hue — used to find a model's "paint" color.
export function dominantHue(root: THREE.Object3D) {
  const buckets = new Map<number, number>();
  const c = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const colors = mesh.isMesh ? (mesh.geometry.attributes.color as THREE.BufferAttribute | undefined) : undefined;
    if (!colors) return;
    for (let i = 0; i < colors.count; i++) {
      c.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i));
      c.getHSL(hsl);
      if (hsl.s < 0.25 || hsl.l < 0.15 || hsl.l > 0.85) continue;
      const key = Math.round(hsl.h * 36);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  });
  let best = -1;
  let bestCount = 0;
  buckets.forEach((count, key) => {
    if (count > bestCount) { best = key; bestCount = count; }
  });
  return best < 0 ? null : best / 36;
}

/** Shared clock for every wind-swayed material. */
export const windUniforms = { uTime: { value: 0 } };

/**
 * Copy of `base` whose vertices sway in the wind, more the higher they are.
 * Meant for batched decor, whose geometry is already in world space.
 */
export function windMaterial(base: THREE.MeshToonMaterial) {
  const mat = base.clone();
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float sway = max(position.y - 0.3, 0.0);
        float gust = sin(uTime * 0.6 + position.x * 0.05) * 0.5 + 0.8;
        transformed.x += sin(uTime * 1.8 + position.x * 0.4 + position.z * 0.3) * sway * 0.035 * gust;
        transformed.z += cos(uTime * 1.5 + position.z * 0.4) * sway * 0.025 * gust;`
      );
  };
  mat.customProgramCacheKey = () => "wind";
  return mat;
}
