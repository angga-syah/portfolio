import * as THREE from "three";
import { t, type L10n, type Lang } from "@/data/world";
import type { WorldCtx } from "./Zones";
import { Text3D, roundedSlab } from "./Text3D";
import { formatTime, type Hud3D } from "./Hud3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

type Entry = { name: string; ms: number };
type Board = { year: number; top: Entry[]; champion: (Entry & { year: number }) | null; offline?: boolean };

const TXT = {
  race: { en: "Race", id: "Balapan" },
  board: { en: "LEADERBOARD", id: "PAPAN JUARA" },
  empty: { en: "No times yet. Be the first!", id: "Belum ada waktu. Jadilah yang pertama!" },
  offline: { en: "Leaderboard offline", id: "Papan juara sedang offline" },
  resets: { en: "Resets every 1 January", id: "Direset tiap 1 Januari" },
  champion: { en: "Champion", id: "Juara" },
  go: { en: "GO!", id: "GAS!" },
  finish: { en: "FINISH!", id: "FINIS!" },
  cancelled: { en: "Race cancelled", id: "Balapan dibatalkan" },
  nameTitle: { en: "Your time: {t} — enter your name", id: "Waktumu: {t} — ketik namamu" },
  nameHint: { en: "3–12 letters or digits · ENTER to submit · ESC to skip", id: "3–12 huruf/angka · ENTER kirim · ESC lewati" },
  type: { en: "TYPE", id: "KETIK" },
  submit: { en: "SUBMIT", id: "KIRIM" },
  skip: { en: "SKIP", id: "LEWATI" },
  rank: { en: "#{r} of {n} this year · best {b}", id: "#{r} dari {n} tahun ini · terbaik {b}" },
  badName: { en: "That name isn't allowed", id: "Nama itu tidak diizinkan" },
  failed: { en: "Couldn't save your time", id: "Waktumu gagal disimpan" },
  local: { en: "Time: {t} (offline, not saved)", id: "Waktu: {t} (offline, tidak disimpan)" },
  hintRace: { en: "Collect all 20 coins as fast as you can · ESC to quit", id: "Kumpulkan 20 koin secepatnya · ESC untuk keluar" },
} satisfies Record<string, L10n>;

type State = "idle" | "countdown" | "running" | "naming" | "submitting";

type RaceHooks = {
  hud: () => Hud3D;
  /** Put the van on the start line and respawn every coin. */
  prepare: () => void;
  setDriving: (enabled: boolean) => void;
  beep: (high: boolean) => void;
  /** Switch to the chase camera for the race and back afterwards. */
  raceCamera: (on: boolean) => void;
};

/**
 * Coin race: drive into the START gate, count down, grab all 20 coins; the
 * server times it and keeps a per-year leaderboard (shown on a 3D board).
 */
export class Race {
  state: State = "idle";
  private lang: Lang = "id";
  private startedAt = 0;
  private countdownAt = 0;
  private beeps = 0;
  private token: Promise<string | null> | null = null;
  private result: { ms: number; token: string | null } | null = null;
  private name = "";
  private input: HTMLInputElement;
  private board: Board = { year: new Date().getFullYear(), top: [], champion: null };
  private boardGroup = new THREE.Group();
  private rows = new THREE.Group();

  constructor(private ctx: WorldCtx, gate: THREE.Vector3, boardPos: THREE.Vector3, private hooks: RaceHooks) {
    this.buildGate(gate);
    this.buildBoard(boardPos);
    ctx.areas.add("race", new THREE.Vector3(gate.x, 0, gate.z), TXT.race, { kind: "race" }, { color: PALETTE.gold, radius: 2.6 });
    ctx.localized.push((lang) => {
      this.lang = lang;
      this.renderBoard();
    });

    // Invisible text field: captures typing (and brings up the phone keyboard);
    // what you type is drawn as 3D text on the HUD.
    this.input = document.createElement("input");
    Object.assign(this.input.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    this.input.maxLength = 12;
    this.input.autocomplete = "off";
    this.input.setAttribute("autocapitalize", "characters");
    this.input.setAttribute("aria-label", "Name");
    this.input.addEventListener("input", () => {
      this.name = this.input.value.toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").slice(0, 12);
      this.input.value = this.name;
      this.hooks.hud().setName(this.name);
    });
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.submit();
      else if (e.key === "Escape") this.skip();
    });
    document.body.appendChild(this.input);
    try {
      this.name = localStorage.getItem("race-name") ?? "";
    } catch {}

    this.refresh();
  }

  get busy() {
    return this.state !== "idle";
  }

  private buildGate(p: THREE.Vector3) {
    const g = new THREE.Group();
    const pillar = roundedSlab(0.7, 5, 0.7, 0.15);
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(pillar, toonMaterial(PALETTE.ink));
      m.position.set(side * 3.2, 2.5, 0);
      g.add(m);
    }
    const banner = new THREE.Mesh(roundedSlab(7.4, 1.3, 0.5, 0.2), toonMaterial(PALETTE.ink));
    banner.position.y = 5;
    g.add(banner);
    // Checkered strip on the banner and the ground.
    const white = toonMaterial(PALETTE.cream);
    const black = toonMaterial("#1b2b3a");
    for (let i = 0; i < 14; i++) {
      const sq = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.08), i % 2 ? white : black);
      sq.position.set(-3.25 + i * 0.5, 4.52, 0.28);
      g.add(sq);
      for (let r = 0; r < 2; r++) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), (i + r) % 2 ? white : black);
        tile.position.set(-3.25 + i * 0.5, 0.12, -1.4 - r * 0.46);
        g.add(tile);
      }
    }
    const label = new Text3D(this.ctx.fonts.display, toonMaterial(PALETTE.gold), { size: 0.62, depth: 0.16, align: "center", anchor: "middle" }, "START");
    label.position.set(0, 5.12, 0.25);
    g.add(label);
    this.ctx.glowing.push(label);
    g.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    g.position.set(p.x, 0, p.z - 2.8);
    this.ctx.scene.add(g);
    for (const side of [-1, 1]) this.ctx.physics.addStaticBox(new THREE.Vector3(p.x + side * 3.2, 2.5, p.z - 2.8), new THREE.Vector3(0.8, 5, 0.8));
  }

  private buildBoard(p: THREE.Vector3) {
    const w = 6.4;
    const h = 7.2;
    const back = new THREE.Mesh(roundedSlab(w + 0.3, h + 0.3, 0.2, 0.35), toonMaterial(PALETTE.gold));
    back.position.set(0, 1 + h / 2, -0.08);
    const panel = new THREE.Mesh(roundedSlab(w, h, 0.3, 0.3), toonMaterial(PALETTE.ink));
    panel.position.set(0, 1 + h / 2, 0);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), toonMaterial(PALETTE.ink));
      post.position.set(side * (w / 2 - 0.8), 0.6, -0.2);
      this.boardGroup.add(post);
    }
    this.rows.position.set(-w / 2 + 0.45, 1 + h - 0.45, 0.16);
    this.boardGroup.add(back, panel, this.rows);
    this.boardGroup.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    this.boardGroup.position.set(p.x, 0, p.z);
    this.boardGroup.rotation.y = -0.35;
    this.ctx.scene.add(this.boardGroup);
    this.ctx.physics.addStaticBox(new THREE.Vector3(p.x, 1 + h / 2, p.z), new THREE.Vector3(w, h + 2, 0.8), -0.35);
  }

  private renderBoard() {
    for (const c of [...this.rows.children]) {
      (c as THREE.Mesh).geometry?.dispose();
      this.rows.remove(c);
    }
    const f = this.ctx.fonts;
    const w = 6.4 - 0.9;
    const add = (text: string, font: "display" | "body", size: number, color: string, x: number, y: number, align: "left" | "right" | "center" = "left") => {
      const m = new Text3D(f[font], toonMaterial(color), { size, depth: size * 0.2, align, anchor: "top", maxWidth: w, maxLines: 1 }, text);
      m.position.set(x, y, 0);
      m.castShadow = false;
      this.rows.add(m);
      return m;
    };
    add(t(TXT.board, this.lang), "display", 0.38, PALETTE.gold, 0, 0);
    add(String(this.board.year), "display", 0.38, PALETTE.cream, w, 0, "right");
    let y = -0.85;
    if (this.board.offline) add(t(TXT.offline, this.lang), "body", 0.24, "#d5e6f2", 0, y);
    else if (!this.board.top.length) add(t(TXT.empty, this.lang), "body", 0.24, "#d5e6f2", 0, y);
    this.board.top.slice(0, 10).forEach((e, i) => {
      const color = i === 0 ? PALETTE.gold : i < 3 ? "#ffe07a" : PALETTE.cream;
      add(`${i + 1}.`, "display", 0.3, color, 0, y);
      add(e.name, "display", 0.3, color, 0.6, y);
      add(formatTime(e.ms), "body", 0.28, color, w, y, "right");
      y -= 0.52;
    });
    const bottom = -(7.2 - 0.9);
    if (this.board.champion) {
      const c = this.board.champion;
      add(`${t(TXT.champion, this.lang)} ${c.year}: ${c.name} · ${formatTime(c.ms)}`, "body", 0.2, PALETTE.gold, 0, bottom + 0.35);
    }
    add(t(TXT.resets, this.lang), "body", 0.18, "#9fb3c2", 0, bottom);
  }

  async refresh() {
    try {
      const res = await fetch("/api/race/leaderboard", { cache: "no-store" });
      this.board = await res.json();
    } catch {
      this.board = { ...this.board, offline: true };
    }
    this.renderBoard();
  }

  /** Enter on the START pad. */
  begin() {
    if (this.state !== "idle") return;
    this.state = "countdown";
    this.hooks.prepare();
    this.hooks.raceCamera(true);
    this.hooks.setDriving(false);
    this.countdownAt = performance.now();
    this.beeps = 0;
    this.result = null;
    this.hooks.hud().setTimer(0);
    this.hooks.hud().message(t(TXT.hintRace, this.lang), 4);
  }

  cancel() {
    if (this.state === "countdown" || this.state === "running") {
      this.state = "idle";
      this.hooks.setDriving(true);
      this.hooks.raceCamera(false);
      this.hooks.hud().setTimer(null);
      this.hooks.hud().message(t(TXT.cancelled, this.lang), 2);
    } else if (this.state === "naming") {
      this.skip();
    }
  }

  /** Called when the last coin is picked up. */
  async finish() {
    if (this.state !== "running") return;
    const clientMs = performance.now() - this.startedAt;
    this.state = "naming";
    const hud = this.hooks.hud();
    hud.flash(t(TXT.finish, this.lang), PALETTE.emerald);
    hud.setTimer(clientMs);
    this.hooks.setDriving(false);

    let ms = clientMs;
    let token: string | null = null;
    const start = await this.token;
    if (start) {
      try {
        const res = await fetch("/api/race/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: start }) });
        const data = await res.json();
        if (res.ok) {
          ms = data.ms;
          token = data.result;
        }
      } catch {}
    }
    this.result = { ms, token };
    hud.setTimer(ms);
    // Let the FINISH! pop play before the name panel covers the screen.
    await new Promise((r) => setTimeout(r, 1100));
    if (!token) {
      hud.message(t(TXT.local, this.lang).replace("{t}", formatTime(ms)), 5);
      this.state = "idle";
      this.hooks.setDriving(true);
      this.hooks.raceCamera(false);
      return;
    }
    hud.showNameEntry(true, {
      title: t(TXT.nameTitle, this.lang).replace("{t}", formatTime(ms)),
      hint: t(TXT.nameHint, this.lang),
      type: t(TXT.type, this.lang),
      submit: t(TXT.submit, this.lang),
      skip: t(TXT.skip, this.lang),
    });
    this.input.value = this.name;
    hud.setName(this.name);
    this.focusInput();
  }

  /** Tapping "TYPE" (a user gesture, so phones will open the keyboard). */
  focusInput() {
    this.input.focus({ preventScroll: true });
  }

  async submit() {
    if (this.state !== "naming" || !this.result?.token) return;
    if (this.name.trim().length < 3) {
      this.hooks.hud().message(t(TXT.nameHint, this.lang), 3);
      return;
    }
    this.state = "submitting";
    const hud = this.hooks.hud();
    try {
      const res = await fetch("/api/race/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: this.result.token, name: this.name }),
      });
      const data = await res.json();
      if (res.status === 400 && data.error === "name not allowed") {
        this.state = "naming";
        hud.message(t(TXT.badName, this.lang), 3);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      try {
        localStorage.setItem("race-name", this.name);
      } catch {}
      this.board = { ...this.board, year: data.year, top: data.top, offline: false };
      this.renderBoard();
      hud.message(t(TXT.rank, this.lang).replace("{r}", data.rank).replace("{n}", data.total).replace("{b}", formatTime(data.best)), 6);
    } catch {
      hud.message(t(TXT.failed, this.lang), 4);
    }
    this.close();
  }

  skip() {
    if (this.state !== "naming") return;
    this.close();
  }

  private close() {
    this.state = "idle";
    this.input.blur();
    const hud = this.hooks.hud();
    hud.showNameEntry(false);
    hud.setTimer(null);
    this.hooks.setDriving(true);
    this.hooks.raceCamera(false);
  }

  update() {
    const hud = this.hooks.hud();
    if (this.state === "countdown") {
      const since = (performance.now() - this.countdownAt) / 1000;
      const step = Math.floor(since);
      if (step >= this.beeps && this.beeps < 3) {
        hud.flash(String(3 - this.beeps));
        this.hooks.beep(false);
        this.beeps++;
      } else if (since >= 3) {
        hud.flash(t(TXT.go, this.lang), PALETTE.emerald);
        this.hooks.beep(true);
        this.state = "running";
        this.startedAt = performance.now();
        this.hooks.setDriving(true);
        // Timed from the server's side from here on.
        this.token = fetch("/api/race/start", { method: "POST" })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.token as string) ?? null)
          .catch(() => null);
      }
    } else if (this.state === "running") {
      hud.setTimer(performance.now() - this.startedAt);
    }
  }

  dispose() {
    this.input.remove();
  }
}
