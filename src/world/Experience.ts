import * as THREE from "three";
import type * as CANNON from "cannon-es";
import { CopyPass, EffectComposer, EffectPass, RenderPass, SelectiveBloomEffect } from "postprocessing";
import type { Lang, L10n } from "@/data/world";
import { t, worldContent } from "@/data/world";
import { Resources } from "./Resources";
import { Physics } from "./Physics";
import { Controls } from "./Controls";
import { Car } from "./Car";
import { CAMERA_MODES, CameraRig, type CameraMode } from "./CameraRig";
import { Floor } from "./Floor";
import { Areas, type Area } from "./Areas";
import { Coins } from "./Coins";
import { Dust } from "./Dust";
import { WorldAudio } from "./Audio";
import { createLetters } from "./Letters";
import { buildDecor, buildRoads, TILE, type Keepout } from "./Decor";
import { CONTACT_BOARD, buildAbout, buildContact, buildProjects, buildSkills, buildSpawn, ZONES, type WorldCtx } from "./Zones";
import { Vault, buildCandleChart } from "./Finance";
import { buildDapurMBG, buildFoodEstate, buildKopdes } from "./Programs";
import { MUSEUM_ROAD_X, TOUR_STOPS, buildMuseum, type Museum } from "./Museum";
import { Hud3D, type HudAction } from "./Hud3D";
import { SkidMarks } from "./SkidMarks";
import { confettiDebris, paperDebris, type Debris } from "./Debris";
import { Birds } from "./Birds";
import { Race } from "./Race";
import { ContactForm } from "./ContactForm";
import { Text3D } from "./Text3D";
import { batchStatic } from "./batch";
import { toonMaterial, windUniforms } from "./materials";
import { PALETTE } from "./palette";
import { FpsGuard, QUALITY, detectQuality, renderScale, type QualityLevel } from "./Quality";

const SPAWN = new THREE.Vector3(0, 0, 3);
const SPAWN_YAW = Math.PI; // nose toward -Z (north, into the world)
const ROAD_ARMS = 4;
const VAULT_POS = new THREE.Vector3(-13, 0, 13);
const CHART_POS = new THREE.Vector3(ZONES.projects.x - 19, 0, ZONES.projects.z - 3);
const GATE_POS = new THREE.Vector3(12, 0, 13);
const BOARD_POS = new THREE.Vector3(18.5, 0, 15);
const MBG_POS = new THREE.Vector3(-20, 0, -19);
const KOPDES_POS = new THREE.Vector3(-21, 0, 21);
const FOOD_POS = new THREE.Vector3(23, 0, -21);

/** Quick-travel targets: where to put the van and which way it faces. */
// On the road arm leading to each zone, in the left-hand lane (roads are
// 4.5 m wide, so 1.1 m off the centre line), facing the zone.
const TRAVEL: { pos: THREE.Vector3; yaw: number }[] = [
  { pos: SPAWN, yaw: SPAWN_YAW },
  { pos: new THREE.Vector3(-20, 0, 1.1), yaw: -Math.PI / 2 },
  { pos: new THREE.Vector3(-1.1, 0, -20), yaw: Math.PI },
  { pos: new THREE.Vector3(20, 0, -1.1), yaw: Math.PI / 2 },
  { pos: new THREE.Vector3(1.1, 0, 20), yaw: 0 },
  // Museum road, left lane heading north, right by the entrance sign.
  { pos: new THREE.Vector3(MUSEUM_ROAD_X - 1.1, 0, 4), yaw: Math.PI },
];

const PROMPT = {
  start: { en: "CLICK TO START", id: "KLIK UNTUK MULAI" } satisfies L10n,
  startTouch: { en: "TAP TO START", id: "KETUK UNTUK MULAI" } satisfies L10n,
  keys: { en: "WASD drive · SHIFT boost · SPACE brake · 1–5 travel", id: "WASD setir · SHIFT boost · SPACE rem · 1–5 pindah" } satisfies L10n,
  keysTouch: { en: "Joystick to drive · tap the map to travel", id: "Joystick untuk setir · ketuk peta untuk pindah" } satisfies L10n,
};

export type ExperienceCallbacks = {
  onProgress?: (ratio: number) => void;
  onStart?: () => void;
  /** The 3D language button was pressed. */
  onToggleLanguage?: () => void;
};

/**
 * Owns the renderer, the physics world and the frame loop. Mounted once by a
 * React client component; everything inside is plain three.js.
 */
export class Experience {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  rig: CameraRig;
  physics = new Physics();
  controls = new Controls();
  resources = new Resources();
  audio = new WorldAudio();
  car!: Car;
  areas!: Areas;
  coins!: Coins;
  dust!: Dust;
  floor: Floor;
  hud!: Hud3D;
  vault!: Vault;
  race!: Race;
  contact!: ContactForm;
  museum!: Museum;
  /** Museum camera tour in progress: which stop, and time spent there. */
  private tour: { stop: number; t: number } | null = null;
  lang: Lang;
  started = false;
  touch: boolean;

  private composer: EffectComposer | null = null;
  private bloom: SelectiveBloomEffect | null = null;
  private localized: ((lang: Lang) => void)[] = [];
  private animated: ((elapsed: number, dt: number) => void)[] = [];
  private glowing: THREE.Object3D[] = [];
  private paperBodies = new Set<CANNON.Body>();
  private letters: ReturnType<typeof createLetters> = [];
  private skids!: SkidMarks;
  private papers!: Debris;
  private confetti!: Debris;
  private birds!: Birds;
  private prompt = new THREE.Group();
  private promptOut = -1;
  /** Prompt shrinks on narrow screens so the title fits. */
  private promptScale = 1;
  private skidBuf: { point: THREE.Vector3; yaw: number; wheel: number }[] = [];
  private clock = new THREE.Clock(false);
  private elapsed = 0;
  private startedAt = 0;
  private landed = false;
  private nextChirp = 6;
  private frame = 0;
  private resizeObserver: ResizeObserver;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private loaded = false;
  private disposed = false;
  private lastHit = 0;
  private lastPaper = 0;
  private confettiLeft = 0;
  /** Camera mode to return to after a race (races switch to the chase cam). */
  private preRaceCamera: CameraMode | null = null;
  /** Graphics level: HD on capable hardware, low otherwise (or once HD proves too slow). */
  quality: QualityLevel;
  private fpsGuard: FpsGuard | null;

  constructor(private container: HTMLElement, lang: Lang, private callbacks: ExperienceCallbacks = {}) {
    this.lang = lang;
    this.touch = window.matchMedia("(pointer: coarse)").matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", stencil: false });
    this.quality = detectQuality(this.renderer);
    this.renderer.setPixelRatio(renderScale(QUALITY[this.quality]));
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    container.appendChild(this.renderer.domElement);

    this.rig = new CameraRig(1);
    this.floor = new Floor(this.scene);
    this.floor.setShadowSize(QUALITY[this.quality].shadowMapSize);
    this.setupPost();
    this.fpsGuard = this.quality === "high" ? new FpsGuard(() => this.setQuality("low")) : null;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);

    this.controls.onReset = () => this.car?.recover();
    this.controls.onInteract = () => this.interact();
    this.controls.onTravel = (slot) => this.travel(slot);
    this.controls.onStart = () => this.start();
    this.controls.onToggleLanguage = () => this.callbacks.onToggleLanguage?.();
    this.controls.onToggleMute = () => this.setMuted(!this.audio.muted);
    this.controls.onEscape = () => {
      if (this.tour) this.stopTour();
      else if (this.contact?.open) this.contact.close();
      else this.race?.cancel();
    };
    this.controls.onCamera = () => this.cycleCamera();

    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("click", this.onClick);
    canvas.addEventListener("wheel", this.onWheel, { passive: true });

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __experience?: Experience }).__experience = this;
    }

    this.frame = requestAnimationFrame(this.tick);
  }

  private setupPost() {
    try {
      const samples = Math.min(QUALITY[this.quality].samples, this.renderer.capabilities.maxSamples);
      this.composer = new EffectComposer(this.renderer, { multisampling: samples, frameBufferType: THREE.HalfFloatType });
      this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
      this.bloom = new SelectiveBloomEffect(this.scene, this.rig.camera, {
        intensity: 1.1,
        luminanceThreshold: 0.25,
        luminanceSmoothing: 0.4,
        mipmapBlur: true,
        radius: 0.6,
      });
      this.bloom.ignoreBackground = true;
      this.composer.addPass(new EffectPass(this.rig.camera, this.bloom));
    } catch (err) {
      console.warn("Post-processing unavailable, rendering directly", err);
      this.composer = null;
      this.bloom = null;
    }
  }

  async load() {
    await this.resources.load((r) => this.callbacks.onProgress?.(r));
    if (this.disposed) return;
    this.build();
    this.resize();
    this.setLanguage(this.lang);
    this.loaded = true;
    // Upload everything to the GPU now rather than hitching on the first frames.
    this.renderer.compile(this.scene, this.rig.camera);
  }

  private build() {
    const fonts = this.resources.fonts;
    const statics = new THREE.Group();
    this.areas = new Areas(this.scene, fonts);

    const ctx: WorldCtx = {
      scene: this.scene,
      physics: this.physics,
      resources: this.resources,
      areas: this.areas,
      fonts,
      localized: this.localized,
      animated: this.animated,
      glowing: this.glowing,
      paperBodies: this.paperBodies,
      statics,
    };

    this.scene.add(buildRoads(this.resources, ROAD_ARMS));
    buildSpawn(ctx);
    buildAbout(ctx);
    buildProjects(ctx);
    buildSkills(ctx);
    buildContact(ctx);
    buildCandleChart(ctx, CHART_POS.x, CHART_POS.z, 0.25);
    buildDapurMBG(ctx, MBG_POS.x, MBG_POS.z, Math.PI / 2);
    buildKopdes(ctx, KOPDES_POS.x, KOPDES_POS.z, Math.PI / 2);
    buildFoodEstate(ctx, FOOD_POS.x, FOOD_POS.z);
    this.museum = buildMuseum(ctx);

    this.letters = createLetters(worldContent.name, fonts.display, this.scene, this.physics, {
      center: new THREE.Vector3(0, 0, -8.5),
      size: 2.4,
      colors: [PALETTE.emerald, PALETTE.emerald, PALETTE.gold, PALETTE.emerald, PALETTE.emerald],
    });

    const reach = (ROAD_ARMS + 1.5) * TILE;
    const keepouts: Keepout[] = [
      { x: 0, z: 0, r: 11 },
      { x0: -3.6, x1: 3.6, z0: -reach, z1: reach },
      { x0: -reach, x1: reach, z0: -3.6, z1: 3.6 },
      { x: ZONES.about.x - 1, z: ZONES.about.z, r: 14 },
      { x: ZONES.projects.x, z: ZONES.projects.z - 1, r: 17 },
      { x: ZONES.skills.x + 1, z: ZONES.skills.z + 1, r: 14 },
      { x: ZONES.contact.x, z: ZONES.contact.z + 1, r: 17 },
      { x: VAULT_POS.x, z: VAULT_POS.z, r: 6 },
      { x: CHART_POS.x, z: CHART_POS.z, r: 8 },
      { x: (GATE_POS.x + BOARD_POS.x) / 2, z: (GATE_POS.z + BOARD_POS.z) / 2, r: 10 },
      { x: MBG_POS.x + 1.5, z: MBG_POS.z, r: 9 },
      { x: CONTACT_BOARD.x + 1, z: CONTACT_BOARD.z + 1, r: 7 },
      { x: KOPDES_POS.x + 1.5, z: KOPDES_POS.z, r: 9 },
      { x0: FOOD_POS.x - 10, x1: FOOD_POS.x + 10, z0: FOOD_POS.z - 10, z1: FOOD_POS.z + 12 },
      { x0: MUSEUM_ROAD_X - 14, x1: 70, z0: -50, z1: 50 },
    ];
    this.scene.add(buildDecor(this.resources, this.physics, keepouts));
    this.scene.add(batchStatic(statics));

    this.car = new Car(this.physics, this.resources.model("car/van"), this.scene, fonts.display, SPAWN, SPAWN_YAW);
    this.car.body.addEventListener("collide", this.onCarCollide);
    this.car.onUnstuck = () => {
      this.dust.burst(this.car.position, 20, 3);
      this.audio.whoosh();
      this.hud.message(this.lang === "en" ? "Stuck? Put you back on the road (R does this too)" : "Nyangkut? Dikembalikan ke jalan (bisa juga tekan R)", 3);
    };

    const coinSpots = coinPositions();
    this.coins = new Coins(this.scene, fonts.display, coinSpots);
    this.coins.onCollect = (n, total, at) => {
      this.audio.coin();
      this.hud.setCoins(n, total, this.lang);
      this.vault.setCount(n);
      this.confetti.burst(at, 10, 4);
      if (n >= total) {
        this.celebrate();
        if (this.race.state === "running") void this.race.finish();
      }
    };
    this.vault = new Vault(ctx, VAULT_POS.x, VAULT_POS.z, coinSpots.length);

    this.dust = new Dust(this.scene, "#eef8fc");
    this.skids = new SkidMarks(this.scene);
    this.papers = paperDebris(this.scene);
    this.confetti = confettiDebris(this.scene);
    this.birds = new Birds(this.scene);

    this.hud = new Hud3D(
      fonts,
      [
        { slot: 1, x: ZONES.about.x, z: ZONES.about.z, color: PALETTE.gold },
        { slot: 2, x: ZONES.projects.x, z: ZONES.projects.z, color: "#38bdf8" },
        { slot: 3, x: ZONES.skills.x, z: ZONES.skills.z, color: PALETTE.emerald },
        { slot: 4, x: ZONES.contact.x, z: ZONES.contact.z, color: PALETTE.coral },
        { slot: 5, x: MUSEUM_ROAD_X, z: -20, color: PALETTE.merah }, // pinned to the rim, clear of 3
      ],
      36,
      (ROAD_ARMS + 1.5) * TILE
    );
    this.hud.setCoins(0, coinSpots.length, this.lang);
    this.hud.setQuality(this.quality);
    if (this.composer) {
      // Draw the HUD into the composer's multisampled buffer, after bloom (so
      // world glow doesn't bleed over the buttons), then copy to the screen.
      // Rendered straight to the canvas it would get no anti-aliasing at all.
      const hudPass = new RenderPass(this.hud.scene, this.hud.camera);
      hudPass.clearPass.color = false;
      hudPass.clearPass.depth = true;
      this.composer.addPass(hudPass);
      this.composer.addPass(new CopyPass());
    }
    this.hud.setMuted(this.audio.muted);

    this.race = new Race(ctx, GATE_POS, BOARD_POS, {
      hud: () => this.hud,
      prepare: () => {
        this.car.reset(SPAWN, SPAWN_YAW);
        this.coins.reset();
        this.hud.setCoins(0, this.coins.total, this.lang);
        this.vault.setCount(0);
        this.dust.burst(SPAWN, 24, 4);
        this.audio.whoosh();
      },
      setDriving: (on) => {
        this.controls.enabled = on;
        if (!on) this.controls.keys.forward = this.controls.keys.backward = this.controls.keys.left = this.controls.keys.right = false;
      },
      beep: (high) => this.audio.beep(high),
      raceCamera: (on) => {
        if (on) {
          this.preRaceCamera = this.rig.mode;
          if (this.rig.mode === "diorama") this.setCamera("chase");
        } else if (this.preRaceCamera) {
          this.setCamera(this.preRaceCamera);
          this.preRaceCamera = null;
        }
      },
    });

    this.contact = new ContactForm(fonts, this.hud);
    this.contact.onClose = () => {
      this.controls.enabled = this.started;
    };

    this.buildPrompt();

    if (this.bloom) {
      const sel = this.bloom.selection;
      for (const m of this.coins.meshes) sel.add(m);
      for (const m of this.glowing) sel.add(m);
      for (const m of this.areas.glowing) sel.add(m);
      for (const m of this.vault.gold) sel.add(m);
    }

    // Before "start": van and letters wait off-stage for the intro drop.
    this.car.hold();
    for (const l of this.letters) {
      l.mesh.visible = false;
      l.body.position.y = 60;
      l.body.sleep();
    }
    this.rig.snap(SPAWN);
  }

  /** Floating 3D title + "click to start" shown before the intro. */
  private buildPrompt() {
    const fonts = this.resources.fonts;
    const name = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 2.2, depth: 0.6, align: "center", anchor: "middle" }, worldContent.fullName.toUpperCase());
    name.position.y = 2.2;
    const cta = new Text3D(fonts.display, toonMaterial(PALETTE.emerald), { size: 1.25, depth: 0.4, align: "center", anchor: "middle" });
    const keys = new Text3D(fonts.body, toonMaterial("#4a5d6e"), { size: 0.6, depth: 0.14, align: "center", anchor: "middle", maxWidth: 30 });
    keys.position.y = -1.6;
    this.prompt.add(name, cta, keys);
    for (const m of [name, cta, keys]) m.castShadow = false;
    this.prompt.position.set(0, 6, 0);
    this.scene.add(this.prompt);
    this.glowing.push(cta);
    this.localized.push((lang) => {
      cta.setText(t(this.touch ? PROMPT.startTouch : PROMPT.start, lang));
      keys.setText(t(this.touch ? PROMPT.keysTouch : PROMPT.keys, lang));
    });
    this.animated.push((e) => {
      cta.scale.setScalar(1 + Math.sin(e * 3) * 0.04);
    });
  }

  /** Called from the first click / Enter. */
  start() {
    if (this.started || !this.loaded) return;
    this.started = true;
    this.startedAt = this.elapsed;
    this.promptOut = 0;
    this.controls.enabled = true;
    this.rig.startIntro();
    this.audio.start();
    this.car.drop();
    this.callbacks.onStart?.();
  }

  private celebrate() {
    this.audio.fanfare();
    this.rig.shake(0.5);
    this.confettiLeft = 5;
  }

  travel(slot: number) {
    // No teleporting mid-race.
    if (!this.started || !this.car || this.car.held || this.race.busy) return;
    this.stopTour();
    const target = TRAVEL[slot];
    if (!target) return;
    this.dust.burst(this.car.position, 20, 4);
    this.car.reset(target.pos, target.yaw);
    this.dust.burst(target.pos, 28, 4);
    this.audio.whoosh();
    this.rig.shake(0.25);
  }

  private startTour() {
    if (this.race.busy || this.tour) return;
    this.tour = { stop: 0, t: 0 };
    this.controls.enabled = false;
    this.controls.keys.forward = this.controls.keys.backward = this.controls.keys.left = this.controls.keys.right = false;
    this.hud.message(this.lang === "en" ? "Museum tour · ESC to stop" : "Tur museum · ESC untuk berhenti", 4);
    this.audio.whoosh();
  }

  private stopTour() {
    if (!this.tour) return;
    this.tour = null;
    this.rig.override = null;
    this.controls.enabled = true;
  }

  /** Glide the camera from exhibit to exhibit, then hand control back. */
  private tourStep(dt: number) {
    if (!this.tour) return;
    this.tour.t += dt;
    if (this.tour.t > 3.6) {
      this.tour.stop++;
      this.tour.t = 0;
    }
    const stop = TOUR_STOPS[this.tour.stop];
    if (!stop) return this.stopTour();
    this.rig.override = stop;
  }

  setCamera(mode: CameraMode) {
    this.rig.setMode(mode);
    this.car?.setCockpit(mode === "cockpit");
    this.hud?.setCameraMode(mode, this.lang);
  }

  cycleCamera() {
    if (!this.started) return;
    const i = CAMERA_MODES.indexOf(this.rig.mode);
    this.setCamera(CAMERA_MODES[(i + 1) % CAMERA_MODES.length]!);
  }

  setLanguage(lang: Lang) {
    this.lang = lang;
    this.hud?.setCameraMode(this.rig.mode, lang);
    this.contact?.setLanguage(lang);
    for (const fn of this.localized) fn(lang);
    this.areas?.setLanguage(lang);
    this.hud?.setLanguage(lang);
    if (this.coins) this.hud.setCoins(this.coins.collected, this.coins.total, lang);
  }

  setMuted(muted: boolean) {
    this.audio.setMuted(muted);
    this.hud?.setMuted(muted);
  }

  interact() {
    const a = this.areas?.active;
    if (a) this.open(a);
  }

  private open(area: Area) {
    if (area.action.kind === "race") {
      this.race.begin();
      return;
    }
    if (area.action.kind === "tour") {
      this.startTour();
      return;
    }
    if (area.action.kind === "form") {
      if (this.race.busy) return;
      this.controls.enabled = false;
      this.controls.keys.forward = this.controls.keys.backward = this.controls.keys.left = this.controls.keys.right = false;
      this.contact.show();
      return;
    }
    this.controls.keys.forward = this.controls.keys.backward = false;
    if (area.action.kind === "email") {
      // mailto: does nothing on machines without a mail app, so also copy the address.
      const address = area.action.address;
      navigator.clipboard?.writeText(address).catch(() => {});
      this.hud.message(this.lang === "en" ? `Email copied: ${address}` : `Email disalin: ${address}`, 5);
      this.audio.coin();
      window.location.href = `mailto:${address}`;
      return;
    }
    const url = area.action.url;
    if (/^https?:/.test(url)) window.open(url, "_blank", "noopener,noreferrer");
    else window.location.href = url;
  }

  private onCarCollide = (e: { body: CANNON.Body; contact: { getImpactVelocityAlongNormal(): number } }) => {
    const v = Math.abs(e.contact.getImpactVelocityAlongNormal());
    if (!this.landed && this.started) {
      // First touchdown after the intro drop.
      this.landed = true;
      this.rig.shake(0.55);
      this.dust.burst(this.car.position, 32, 5);
    }
    if (v > 3 && this.elapsed - this.lastHit > 0.15) {
      this.lastHit = this.elapsed;
      this.audio.hit(v);
      this.rig.shake(Math.min(0.35, v * 0.03));
    }
    if (this.paperBodies.has(e.body) && v > 1.5 && this.elapsed - this.lastPaper > 0.4) {
      this.lastPaper = this.elapsed;
      const at = this.car.position.clone().addScaledVector(this.car.forward, 1.6);
      at.y = 1.2;
      this.papers.burst(at, 12, 6, this.car.forward);
    }
  };

  private ndc(e: PointerEvent | MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
  }

  private pickWorld(ndc: THREE.Vector2): Area | "keycap" | null {
    if (!this.loaded) return null;
    this.raycaster.setFromCamera(ndc, this.rig.camera);
    const targets: THREE.Object3D[] = [...this.areas.clickables.keys()];
    if (this.areas.keycap.visible) targets.push(this.areas.keycap);
    const hit = this.raycaster.intersectObjects(targets, true)[0];
    if (!hit) return null;
    let o: THREE.Object3D | null = hit.object;
    while (o) {
      if (o === this.areas.keycap) return "keycap";
      const area = this.areas.clickables.get(o);
      if (area) return area;
      o = o.parent;
    }
    return null;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !this.loaded) return;
    const ndc = this.ndc(e);
    const over = !this.started || this.hud.pick(ndc) || this.pickWorld(ndc);
    this.renderer.domElement.style.cursor = over ? "pointer" : "";
  };

  private onClick = (e: MouseEvent) => {
    if (!this.loaded) return;
    if (!this.started) {
      this.start();
      return;
    }
    const ndc = this.ndc(e);
    const action = this.hud.pick(ndc);
    if (action) return this.hudAction(action);
    const target = this.pickWorld(ndc);
    if (target === "keycap") this.interact();
    else if (target) this.open(target);
  };

  private hudAction(action: HudAction) {
    if (action.kind === "language") this.callbacks.onToggleLanguage?.();
    else if (action.kind === "mute") this.setMuted(!this.audio.muted);
    else if (action.kind === "travel") this.travel(action.slot);
    else if (action.kind === "camera") this.cycleCamera();
    else if (action.kind === "quality") {
      // A manual pick sticks: the FPS guard no longer overrides it.
      this.fpsGuard = null;
      this.setQuality(this.quality === "high" ? "low" : "high");
    }
    else if (action.kind === "form") this.contact.handle(action.target);
    else if (action.kind === "type") this.race.focusInput();
    else if (action.kind === "submit") void this.race.submit();
    else this.race.skip();
  }

  private onWheel = (e: WheelEvent) => this.rig.onWheel(e.deltaY);

  private resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.composer?.setSize(w, h, false);
    this.rig.resize(w / h);
    this.hud?.resize(w / h);
    this.promptScale = Math.min(1, w / h / 0.85);
    if (this.promptOut < 0) this.prompt.scale.setScalar(this.promptScale);
  }

  private tick = () => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    if (!this.clock.running) this.clock.start();
    const raw = this.clock.getDelta();
    if (this.loaded) this.fpsGuard?.update(raw);
    this.step(Math.min(raw, 1 / 20));
  };

  setQuality(level: QualityLevel) {
    if (level === this.quality) return;
    this.quality = level;
    const q = QUALITY[level];
    this.renderer.setPixelRatio(renderScale(q));
    if (this.composer) this.composer.multisampling = Math.min(q.samples, this.renderer.capabilities.maxSamples);
    this.floor.setShadowSize(q.shadowMapSize);
    this.hud?.setQuality(level);
    this.resize();
  }

  /** Advance the simulation by `dt` seconds and render (also a dev/test hook). */
  step(dt: number) {
    this.elapsed += dt;
    windUniforms.uTime.value = this.elapsed;
    if (!this.loaded) {
      this.render(dt);
      return;
    }
    this.introStep(dt);

    this.car.update(this.controls, dt);
    this.physics.step(dt);
    this.car.sync(this.elapsed, dt);

    const v = this.car.body.velocity;
    const focus = this.car.held ? SPAWN : this.car.position;
    const pose = this.car.held ? undefined : { object: this.car.object, cabin: this.car.tilt, eye: Car.EYE, speed: this.car.speed };
    this.rig.update(focus, new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(this.car.held ? 0 : 1), dt, pose);
    this.floor.update(this.rig.shadowFocus, this.elapsed);
    this.areas.update(this.car.position, this.rig.camera, this.elapsed, dt);
    this.coins.update(this.car.held ? new THREE.Vector3(0, -99, 0) : this.car.position, this.elapsed, dt);
    this.vault.update(this.elapsed, dt);
    const museum = this.museum.update(this.car.held ? new THREE.Vector3(0, 0, 0) : this.car.position, dt, this.elapsed);
    this.floor.setDusk(museum.dusk);
    if (museum.kaching) this.audio.kaching();
    this.tourStep(dt);
    this.race.update();
    const racing = this.race.state === "countdown" || this.race.state === "running";
    this.coins.setBeams(racing);
    this.hud.setCoinMarkers(racing ? this.coins.remaining() : null);
    for (const fn of this.animated) fn(this.elapsed, dt);
    this.birds.update(this.elapsed);
    this.papers.update(dt, this.elapsed);
    this.confetti.update(dt, this.elapsed);
    if (this.confettiLeft > 0 && Math.floor(this.elapsed * 4) !== Math.floor((this.elapsed - dt) * 4)) {
      this.confettiLeft--;
      this.confetti.burst(this.vault.mouth, 45, 9);
    }

    const speed = Math.abs(this.car.speed);
    const throttle = Math.abs(this.controls.enabled ? this.controls.throttle : 0);
    const puff = this.car.grounded && !this.car.held ? (this.car.vehicle.sliding ? 1 : THREE.MathUtils.clamp((speed - 5) / 12, 0, 0.8) * (throttle > 0 ? 1 : 0.3)) : 0;
    this.dust.update(dt, this.car.rearWheelPositions, puff);
    if (!this.car.held) this.skids.update(this.elapsed, this.car.skidPoints(this.skidBuf));
    this.audio.engine(this.car.held ? 0 : speed, throttle);
    if (this.started && this.elapsed > this.nextChirp) {
      this.nextChirp = this.elapsed + 4 + Math.random() * 7;
      this.audio.chirp();
    }

    const e = new THREE.Euler().setFromQuaternion(this.car.object.quaternion, "YXZ");
    this.hud.update(this.elapsed, dt, this.car.position, e.y);
    this.render(dt);
  }

  /** Prompt fade-out and the letters dropping in one by one after start. */
  private introStep(dt: number) {
    this.prompt.quaternion.copy(this.rig.camera.quaternion);
    if (this.promptOut >= 0 && this.prompt.visible) {
      this.promptOut += dt / 0.45;
      const s = Math.max(0, 1 - this.promptOut);
      this.prompt.scale.setScalar(s * s * this.promptScale);
      this.prompt.position.y = 6 + this.promptOut * 3;
      if (s <= 0) this.prompt.visible = false;
    }
    if (!this.started) return;
    const since = this.elapsed - this.startedAt;
    this.letters.forEach((l, i) => {
      if (l.mesh.visible || since < 0.9 + i * 0.22) return;
      l.mesh.visible = true;
      // Straight down, no spin, so they thump onto their feet.
      l.body.position.set(l.home.x, l.home.y + 7, l.home.z);
      l.body.velocity.set(0, -4, 0);
      l.body.angularVelocity.set(0, 0, 0);
      l.body.quaternion.set(0, 0, 0, 1);
      l.body.wakeUp();
    });
  }

  private render(dt: number) {
    if (this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.rig.camera);
    if (this.hud && this.loaded && !this.composer) {
      this.renderer.autoClear = false;
      this.renderer.clearDepth();
      this.renderer.render(this.hud.scene, this.hud.camera);
      this.renderer.autoClear = true;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.audio.dispose();
    this.race?.dispose();
    this.contact?.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("click", this.onClick);
    canvas.removeEventListener("wheel", this.onWheel);
    for (const scene of [this.scene, this.hud?.scene]) {
      scene?.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) m.dispose();
      });
    }
    this.composer?.dispose();
    this.renderer.dispose();
    canvas.remove();
    const w = window as unknown as { __experience?: Experience };
    if (w.__experience === this) delete w.__experience;
  }
}

/** Coins line the road arms and sprinkle each zone. */
function coinPositions() {
  const out: THREE.Vector3[] = [];
  const y = 1;
  for (const d of [7, 12, 17]) {
    const side = d === 12 ? 1.3 : -1.3;
    out.push(new THREE.Vector3(side, y, -d), new THREE.Vector3(-side, y, d), new THREE.Vector3(d, y, side), new THREE.Vector3(-d, y, -side));
  }
  out.push(
    new THREE.Vector3(ZONES.about.x + 2, y, ZONES.about.z + 5),
    new THREE.Vector3(ZONES.about.x - 3, y, ZONES.about.z - 4),
    new THREE.Vector3(ZONES.projects.x - 5, y, ZONES.projects.z + 4),
    new THREE.Vector3(ZONES.projects.x + 5, y, ZONES.projects.z + 4),
    new THREE.Vector3(ZONES.skills.x + 7, y + 1.4, ZONES.skills.z + 8),
    new THREE.Vector3(ZONES.skills.x + 4, y, ZONES.skills.z + 3),
    new THREE.Vector3(ZONES.contact.x - 5, y, ZONES.contact.z - 3),
    new THREE.Vector3(ZONES.contact.x + 8, y, ZONES.contact.z - 5)
  );
  return out;
}
