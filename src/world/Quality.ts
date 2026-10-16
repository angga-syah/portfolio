import * as THREE from "three";

export type QualityLevel = "high" | "low";

export type QualitySettings = {
  /** Cap on devicePixelRatio. */
  pixelRatio: number;
  /** Floor on the render scale: >1 supersamples plain 1080p screens. */
  minPixelRatio: number;
  /** MSAA samples for the composer. */
  samples: number;
  shadowMapSize: number;
};

export const QUALITY: Record<QualityLevel, QualitySettings> = {
  high: { pixelRatio: 2, minPixelRatio: 1.5, samples: 8, shadowMapSize: 4096 },
  low: { pixelRatio: 1.25, minPixelRatio: 1, samples: 2, shadowMapSize: 1024 },
};

export const renderScale = (q: QualitySettings) => THREE.MathUtils.clamp(window.devicePixelRatio, q.minPixelRatio, q.pixelRatio);

// Software rasterisers and GPUs that struggle with 8x MSAA at 2x DPR.
const WEAK_GPU = [
  /swiftshader|llvmpipe|softpipe|software|basic render/i,
  /mali-[4t][0-9]{2}\b|mali-g(3|5)[0-9]\b/i,
  /adreno \(tm\) [2-5][0-9]{2}\b|adreno [2-5][0-9]{2}\b/i,
  /powervr|sgx|videocore|intel\(r\) (hd|gma)|intel hd graphics [2-5][0-9]{2,3}\b/i,
];

/**
 * Pick a quality level from what the browser tells us about the hardware.
 * `?quality=high|low` in the URL overrides it (handy for testing).
 */
export function detectQuality(renderer: THREE.WebGLRenderer): QualityLevel {
  try {
    const forced = new URLSearchParams(window.location.search).get("quality");
    if (forced === "high" || forced === "hd") return "high";
    if (forced === "low") return "low";
  } catch {
    // ignore
  }

  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const gpu = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if (WEAK_GPU.some((re) => re.test(gpu))) return "low";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 4;
  if (memory < 4 || cores < 4) return "low";
  if (renderer.capabilities.maxSamples < 4) return "low";
  if (renderer.capabilities.maxTextureSize < 8192) return "low";

  // Phones and small tablets: only recent, well-equipped ones get HD.
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse && (memory < 6 || cores < 8)) return "low";

  return "high";
}

/**
 * Watches the frame rate and reports when HD turns out to be too heavy, so it
 * can drop to low. Only looks at steady-state frames (skips the first seconds
 * and hidden tabs), and needs a sustained dip, not a single hitch.
 */
export class FpsGuard {
  private time = 0;
  private frames = 0;
  private slowWindows = 0;
  private warmup = 3;
  private done = false;

  constructor(private onSlow: () => void, private threshold = 42) {}

  update(rawDt: number) {
    if (this.done) return;
    // Tab switches and debugger pauses produce huge dts; ignore them.
    if (rawDt > 0.25 || document.hidden) return;
    if (this.warmup > 0) {
      this.warmup -= rawDt;
      return;
    }
    this.time += rawDt;
    this.frames++;
    if (this.time < 2) return;
    const fps = this.frames / this.time;
    this.time = 0;
    this.frames = 0;
    this.slowWindows = fps < this.threshold ? this.slowWindows + 1 : 0;
    if (this.slowWindows >= 2) {
      this.done = true;
      this.onSlow();
    }
  }
}
