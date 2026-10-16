import * as THREE from "three";
import { PALETTE } from "./palette";

/**
 * Bruno-Simon-style floor: the "ground" is a screen-space 4-corner gradient
 * drawn behind everything, and a transparent plane on top only catches shadows.
 * No horizon, no void — the world reads as one warm tabletop.
 */
export class Floor {
  background: THREE.Mesh;
  shadowPlane: THREE.Mesh;
  clouds: THREE.Mesh;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;

  constructor(scene: THREE.Scene) {
    const [tl, tr, bl, br] = PALETTE.floor.map((c) => new THREE.Color(c));
    const material = new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTL: { value: tl },
        uTR: { value: tr },
        uBL: { value: bl },
        uBR: { value: br },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTL; uniform vec3 uTR; uniform vec3 uBL; uniform vec3 uBR;
        varying vec2 vUv;
        void main() {
          vec3 top = mix(uTL, uTR, vUv.x);
          vec3 bottom = mix(uBL, uBR, vUv.x);
          gl_FragColor = vec4(mix(bottom, top, vUv.y), 1.0);
          #include <colorspace_fragment>
        }
      `,
    });
    this.background = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.background.frustumCulled = false;
    this.background.renderOrder = -1000;
    scene.add(this.background);

    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.ShadowMaterial({ color: PALETTE.shadow, opacity: 0.32, depthWrite: false })
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.receiveShadow = true;
    this.shadowPlane.renderOrder = -999;
    scene.add(this.shadowPlane);

    // Soft cloud shadows drifting across the floor.
    this.clouds = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(PALETTE.shadow) } },
        vertexShader: /* glsl */ `
          varying vec2 vWorld;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uColor;
          varying vec2 vWorld;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
          }
          void main() {
            vec2 p = vWorld * 0.035 + vec2(uTime * 0.035, uTime * 0.012);
            float n = noise(p) * 0.6 + noise(p * 2.1) * 0.3 + noise(p * 4.3) * 0.1;
            float a = smoothstep(0.55, 0.75, n) * 0.16;
            gl_FragColor = vec4(uColor, a);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.position.y = 0.02;
    this.clouds.renderOrder = -998;
    scene.add(this.clouds);

    this.hemi = new THREE.HemisphereLight(PALETTE.sky, PALETTE.ground, 1.9);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(PALETTE.sun, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const cam = this.sun.shadow.camera;
    cam.left = cam.bottom = -32;
    cam.right = cam.top = 32;
    cam.near = 1;
    cam.far = 80;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.03;
    scene.add(this.sun, this.sun.target);
  }

  setShadowSize(size: number) {
    if (this.sun.shadow.mapSize.x === size) return;
    this.sun.shadow.mapSize.set(size, size);
    // The shadow map is reallocated at the new size on the next render.
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
  }

  private base: { corners: THREE.Color[]; hemiSky: THREE.Color; hemiGround: THREE.Color; hemi: number; sun: number; sunColor: THREE.Color } | null = null;
  private duskLevel = 0;

  /** Blend toward a dusky evening (0 = day, 1 = dusk). */
  setDusk(k: number) {
    if (Math.abs(k - this.duskLevel) < 0.002) return;
    this.duskLevel = k;
    const u = (this.background.material as THREE.ShaderMaterial).uniforms;
    if (!this.base) {
      this.base = {
        corners: [u.uTL!.value.clone(), u.uTR!.value.clone(), u.uBL!.value.clone(), u.uBR!.value.clone()],
        hemiSky: this.hemi.color.clone(),
        hemiGround: this.hemi.groundColor.clone(),
        hemi: this.hemi.intensity,
        sun: this.sun.intensity,
        sunColor: this.sun.color.clone(),
      };
    }
    const b = this.base;
    const dusk = ["#4b4f86", "#6d5a8e", "#2f3a66", "#56477a"].map((c) => new THREE.Color(c));
    (["uTL", "uTR", "uBL", "uBR"] as const).forEach((key, i) => u[key]!.value.copy(b.corners[i]!).lerp(dusk[i]!, k));
    this.hemi.color.copy(b.hemiSky).lerp(new THREE.Color("#8d8fd8"), k);
    this.hemi.groundColor.copy(b.hemiGround).lerp(new THREE.Color("#3d3a5c"), k);
    this.hemi.intensity = THREE.MathUtils.lerp(b.hemi, 0.95, k);
    this.sun.intensity = THREE.MathUtils.lerp(b.sun, 0.7, k);
    this.sun.color.copy(b.sunColor).lerp(new THREE.Color("#ff9d6b"), k);
  }

  /** Keep the shadow frustum centred on the action. */
  update(focus: THREE.Vector3, elapsed = 0) {
    ((this.clouds.material as THREE.ShaderMaterial).uniforms.uTime!).value = elapsed;
    this.sun.target.position.set(focus.x, 0, focus.z);
    this.sun.position.set(focus.x - 12, 30, focus.z + 18);
  }
}
