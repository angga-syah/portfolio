/**
 * Tiny synthesized soundscape — no audio files: an engine drone whose pitch
 * follows speed, a coin chime and a thud for hard hits.
 */
export class WorldAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private engineGain!: GainNode;
  private engineOsc!: OscillatorNode;
  private engineSub!: OscillatorNode;
  private filter!: BiquadFilterNode;
  muted: boolean;

  constructor() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("world-muted");
    } catch {}
    this.muted = saved === "1";
  }

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = (this.ctx = new Ctx());
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(ctx.destination);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 500;
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.05;
    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 45;
    this.engineSub = ctx.createOscillator();
    this.engineSub.type = "square";
    this.engineSub.frequency.value = 22.5;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.4;
    this.engineOsc.connect(this.filter);
    this.engineSub.connect(subGain).connect(this.filter);
    this.filter.connect(this.engineGain).connect(this.master);
    this.engineOsc.start();
    this.engineSub.start();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem("world-muted", muted ? "1" : "0");
    } catch {}
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  /** speed in m/s, throttle 0…1 */
  engine(speed: number, throttle: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = Math.min(Math.abs(speed) / 20, 1.3);
    this.engineOsc.frequency.setTargetAtTime(42 + s * 80 + throttle * 12, t, 0.08);
    this.engineSub.frequency.setTargetAtTime(21 + s * 40, t, 0.08);
    this.filter.frequency.setTargetAtTime(380 + s * 900 + throttle * 300, t, 0.1);
    this.engineGain.gain.setTargetAtTime(0.035 + s * 0.05 + throttle * 0.03, t, 0.1);
  }

  coin() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [988, 1319].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.25);
      o.connect(g).connect(this.master);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.3);
    });
  }

  hit(strength: number) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    g.gain.setValueAtTime(Math.min(0.5, strength * 0.06), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.25);
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, endFreq?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  /** Filtered noise sweep for quick travel. */
  whoosh() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    f.frequency.exponentialRampToValueAtTime(400, t + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
  }

  /** Little major arpeggio when the vault opens. */
  fanfare() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.11, i === 5 ? 0.6 : 0.22, "triangle", 0.22));
  }

  /** Cash register: drawer clunk plus a bright two-note bell. */
  kaching() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    this.tone(2637, t + 0.07, 0.5, "triangle", 0.12);
    this.tone(3520, t + 0.13, 0.7, "triangle", 0.1);
    this.tone(5274, t + 0.13, 0.35, "sine", 0.03);
  }

  /** Race countdown beep; high = GO. */
  beep(high: boolean) {
    if (!this.ctx || this.muted) return;
    this.tone(high ? 1320 : 660, this.ctx.currentTime, high ? 0.45 : 0.18, "square", 0.12);
  }

  /** Occasional bird chirps for ambience. */
  chirp() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const base = 2200 + Math.random() * 1400;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this.tone(base, t + i * 0.09, 0.07, "sine", 0.035, base * 1.35);
  }

  dispose() {
    this.ctx?.close();
    this.ctx = null;
  }
}
