import * as THREE from "three";
import { t, type L10n, type Lang } from "@/data/world";
import { Text3D, roundedSlab, type Fonts } from "./Text3D";
import type { Hud3D } from "./Hud3D";
import { toonMaterial } from "./materials";
import { PALETTE } from "./palette";

// A contact form drawn as a 3D panel on the HUD. Typing goes into hidden DOM
// inputs (which also bring up the phone keyboard); the 3D text mirrors them.
// Sends to the existing /api/contact endpoint (SMTP), with Cloudflare
// Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set — its widget is the one
// DOM element we can't avoid, and it only shows when a challenge is needed.

const TXT = {
  title: { en: "Send me a message", id: "Kirim pesan" },
  name: { en: "Name", id: "Nama" },
  email: { en: "Email", id: "Email" },
  message: { en: "Message", id: "Pesan" },
  send: { en: "SEND", id: "KIRIM" },
  cancel: { en: "CANCEL", id: "BATAL" },
  hint: { en: "TAB next field · CTRL+ENTER send · ESC close", id: "TAB kolom berikutnya · CTRL+ENTER kirim · ESC tutup" },
  sending: { en: "Sending…", id: "Mengirim…" },
  sent: { en: "Message sent. Thank you!", id: "Pesan terkirim. Terima kasih!" },
  missing: { en: "Please fill in name, email and message", id: "Isi nama, email, dan pesan dulu" },
  badEmail: { en: "That email doesn't look right", id: "Format email belum benar" },
  captcha: { en: "Please complete the verification below", id: "Selesaikan verifikasi di bawah dulu" },
  failed: { en: "Couldn't send. Try again or email me directly.", id: "Gagal mengirim. Coba lagi atau email langsung." },
} satisfies Record<string, L10n>;

type Field = "name" | "email" | "message";
const FIELDS: Field[] = ["name", "email", "message"];
const LIMITS: Record<Field, number> = { name: 120, email: 160, message: 2000 };

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export class ContactForm {
  open = false;
  onClose: () => void = () => {};
  private panel = new THREE.Group();
  private lang: Lang = "id";
  private values: Record<Field, string> = { name: "", email: "", message: "" };
  private inputs = {} as Record<Field, HTMLInputElement | HTMLTextAreaElement>;
  private boxes = {} as Record<Field, THREE.Mesh>;
  private texts = {} as Record<Field, Text3D>;
  private labels = {} as Record<Field, Text3D>;
  private title: Text3D;
  private hint: Text3D;
  private sendLabel: Text3D;
  private cancelLabel: Text3D;
  private sending = false;
  private siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  private tsBox: HTMLDivElement | null = null;
  private tsWidget: string | null = null;
  private tsToken = "";
  private idle = toonMaterial(PALETTE.cream);
  private focused = toonMaterial("#fff4c7");

  constructor(fonts: Fonts, private hud: Hud3D) {
    const bg = new THREE.Mesh(roundedSlab(8, 6.2, 0.3, 0.45), toonMaterial(PALETTE.ink));
    this.panel.add(bg);
    this.title = new Text3D(fonts.display, toonMaterial(PALETTE.gold), { size: 0.42, depth: 0.1, anchor: "middle" });
    this.title.position.set(-3.6, 2.6, 0.18);
    this.panel.add(this.title);

    const rows: [Field, number, number][] = [
      ["name", 1.6, 0.66],
      ["email", 0.42, 0.66],
      ["message", -1.12, 1.6],
    ];
    for (const [field, y, h] of rows) {
      const label = new Text3D(fonts.body, toonMaterial("#d5e6f2"), { size: 0.18, depth: 0.03, anchor: "middle" });
      label.position.set(-3.6, y + h / 2 + 0.14, 0.18);
      const box = new THREE.Mesh(roundedSlab(7.2, h, 0.16, 0.14), this.idle);
      box.position.set(0, y - 0.05, 0.12);
      const text = new Text3D(fonts.body, toonMaterial(PALETTE.ink), {
        size: 0.26,
        depth: 0.04,
        anchor: "top",
        maxWidth: 6.8,
        maxLines: field === "message" ? 4 : 1,
      });
      text.position.set(-3.4, y - 0.05 + h / 2 - 0.2, 0.22);
      this.panel.add(label, box, text);
      this.boxes[field] = box;
      this.texts[field] = text;
      this.labels[field] = label;
      this.hud.addButton(box, { kind: "form", target: field });
      this.inputs[field] = this.makeInput(field);
    }

    const button = (x: number, color: string, target: string) => {
      const b = new THREE.Mesh(roundedSlab(2.4, 0.7, 0.2, 0.34), toonMaterial(color));
      b.position.set(x, -2.45, 0.2);
      const l = new Text3D(fonts.display, toonMaterial(PALETTE.ink), { size: 0.28, depth: 0.06, align: "center", anchor: "middle" });
      l.position.set(x, -2.45, 0.32);
      this.panel.add(b, l);
      this.hud.addButton(b, { kind: "form", target });
      return l;
    };
    this.sendLabel = button(1.5, PALETTE.emerald, "send");
    this.cancelLabel = button(-1.5, "#9fb3c2", "cancel");
    this.hint = new Text3D(fonts.body, toonMaterial("#9fb3c2"), { size: 0.17, depth: 0.03, align: "center", anchor: "middle" });
    this.hint.position.set(0, -2.95, 0.18);
    this.panel.add(this.hint);

    this.panel.visible = false;
    this.panel.scale.setScalar(0.9);
    this.hud.addCenter(this.panel);
  }

  private makeInput(field: Field) {
    const el = field === "message" ? document.createElement("textarea") : document.createElement("input");
    Object.assign(el.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none", fontSize: "16px" });
    el.setAttribute("aria-label", field);
    el.maxLength = LIMITS[field];
    if (el instanceof HTMLInputElement) {
      el.type = field === "email" ? "email" : "text";
      el.autocomplete = field === "email" ? "email" : "name";
    }
    el.addEventListener("focus", () => this.setActive(field));
    el.addEventListener("input", () => {
      this.values[field] = el.value;
      this.render(field);
    });
    el.addEventListener("keydown", (e: Event) => {
      const k = e as KeyboardEvent;
      if (k.key === "Escape") {
        k.preventDefault();
        this.close();
      } else if (k.key === "Tab") {
        k.preventDefault();
        const i = FIELDS.indexOf(field);
        this.focus(FIELDS[(i + (k.shiftKey ? FIELDS.length - 1 : 1)) % FIELDS.length]!);
      } else if (k.key === "Enter" && (field !== "message" || k.ctrlKey || k.metaKey)) {
        k.preventDefault();
        if (field === "message" || (this.values.name && this.values.email && this.values.message)) void this.send();
        else this.focus(FIELDS[FIELDS.indexOf(field) + 1]!);
      }
    });
    document.body.appendChild(el);
    return el;
  }

  setLanguage(lang: Lang) {
    this.lang = lang;
    this.title.setText(t(TXT.title, lang));
    for (const f of FIELDS) this.labels[f].setText(t(TXT[f], lang));
    this.sendLabel.setText(t(TXT.send, lang));
    this.cancelLabel.setText(t(TXT.cancel, lang));
    this.hint.setText(t(TXT.hint, lang));
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.panel.visible = true;
    this.focus("name");
    this.loadTurnstile();
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.panel.visible = false;
    for (const f of FIELDS) this.inputs[f].blur();
    if (this.tsBox) this.tsBox.style.display = "none";
    this.onClose();
  }

  /** HUD button / field clicks (a user gesture, so phones open the keyboard). */
  handle(target: string) {
    if (target === "send") void this.send();
    else if (target === "cancel") this.close();
    else if ((FIELDS as string[]).includes(target)) this.focus(target as Field);
  }

  private focus(field: Field) {
    this.setActive(field);
    this.inputs[field].focus({ preventScroll: true });
  }

  private setActive(field: Field) {
    for (const f of FIELDS) this.boxes[f].material = f === field ? this.focused : this.idle;
  }

  private render(field: Field) {
    const v = this.values[field];
    // Long values show their tail so you can see what you're typing.
    const shown = field === "message" ? (v.length > 220 ? `…${v.slice(-220)}` : v) : v.length > 34 ? `…${v.slice(-34)}` : v;
    this.texts[field].setText(shown.replace(/\n/g, " "));
  }

  private loadTurnstile() {
    if (!this.siteKey || this.tsWidget) return;
    if (!this.tsBox) {
      this.tsBox = document.createElement("div");
      Object.assign(this.tsBox.style, { position: "fixed", left: "50%", bottom: "16px", transform: "translateX(-50%)", zIndex: "20" });
      document.body.appendChild(this.tsBox);
    }
    this.tsBox.style.display = "block";
    const render = () => {
      if (!window.turnstile || !this.tsBox || this.tsWidget) return;
      this.tsWidget = window.turnstile.render(this.tsBox, {
        sitekey: this.siteKey,
        appearance: "interaction-only",
        theme: "light",
        callback: (token: string) => (this.tsToken = token),
        "expired-callback": () => (this.tsToken = ""),
      });
    };
    if (window.turnstile) return render();
    if (document.querySelector("script[data-turnstile]")) return;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.dataset.turnstile = "1";
    s.onload = render;
    document.head.appendChild(s);
  }

  private async send() {
    if (this.sending) return;
    const name = this.values.name.trim();
    const email = this.values.email.trim();
    const message = this.values.message.trim();
    if (!name || !email || !message) return this.hud.message(t(TXT.missing, this.lang), 3);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return this.hud.message(t(TXT.badEmail, this.lang), 3);
    if (this.siteKey && !this.tsToken) {
      if (this.tsBox) this.tsBox.style.display = "block";
      return this.hud.message(t(TXT.captcha, this.lang), 4);
    }
    this.sending = true;
    this.hud.message(t(TXT.sending, this.lang), 10);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, turnstileToken: this.tsToken }),
      });
      if (!res.ok) throw new Error(String(res.status));
      this.hud.message(t(TXT.sent, this.lang), 5);
      this.values = { name: "", email: "", message: "" };
      for (const f of FIELDS) {
        this.inputs[f].value = "";
        this.render(f);
      }
      this.close();
    } catch {
      this.hud.message(t(TXT.failed, this.lang), 5);
    } finally {
      this.sending = false;
      if (this.tsWidget && window.turnstile) {
        window.turnstile.reset(this.tsWidget);
        this.tsToken = "";
      }
    }
  }

  dispose() {
    for (const f of FIELDS) this.inputs[f]?.remove();
    this.tsBox?.remove();
  }
}
