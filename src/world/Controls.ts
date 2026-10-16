const KEYS: Record<string, "forward" | "backward" | "left" | "right" | "boost" | "brake"> = {
  KeyW: "forward", ArrowUp: "forward",
  KeyS: "backward", ArrowDown: "backward",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
  ShiftLeft: "boost", ShiftRight: "boost",
  Space: "brake",
};

export class Controls {
  keys = { forward: false, backward: false, left: false, right: false, boost: false, brake: false };
  /** Touch joystick, x = steer (-1 left … 1 right), y = throttle (-1 back … 1 forward). */
  joystick = { x: 0, y: 0 };
  enabled = false;

  onReset: () => void = () => {};
  onInteract: () => void = () => {};
  /** Quick travel: 0 = home, 1…4 = zones, 5 = museum. */
  onTravel: (slot: number) => void = () => {};
  /** Any Enter/Space before the controls are enabled (the start gesture). */
  onStart: () => void = () => {};
  onToggleLanguage: () => void = () => {};
  onToggleMute: () => void = () => {};
  onEscape: () => void = () => {};
  onCamera: () => void = () => {};

  private down = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === "Escape") {
      this.onEscape();
      return;
    }
    if (!this.enabled) {
      if (e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter") {
        e.preventDefault();
        this.onStart();
      }
      return;
    }
    const action = KEYS[e.code];
    if (action) {
      this.keys[action] = true;
      e.preventDefault();
    } else if (e.code === "KeyR") {
      this.onReset();
    } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "KeyE") {
      this.onInteract();
    } else if (/^(Digit|Numpad)[0-5]$/.test(e.code)) {
      this.onTravel(Number(e.code.slice(-1)));
    } else if (e.code === "KeyH") {
      this.onTravel(0);
    } else if (e.code === "KeyL") {
      this.onToggleLanguage();
    } else if (e.code === "KeyM") {
      this.onToggleMute();
    } else if (e.code === "KeyC") {
      this.onCamera();
    }
  };

  private up = (e: KeyboardEvent) => {
    const action = KEYS[e.code];
    if (action) this.keys[action] = false;
  };

  private blur = () => {
    for (const k of Object.keys(this.keys) as (keyof typeof this.keys)[]) this.keys[k] = false;
  };

  constructor() {
    window.addEventListener("keydown", this.down);
    window.addEventListener("keyup", this.up);
    window.addEventListener("blur", this.blur);
  }

  /** -1 … 1 */
  get throttle() {
    const k = (this.keys.forward ? 1 : 0) - (this.keys.backward ? 1 : 0);
    return k !== 0 ? k : this.joystick.y;
  }

  /** -1 (left) … 1 (right) */
  get steer() {
    const k = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    return k !== 0 ? k : this.joystick.x;
  }

  dispose() {
    window.removeEventListener("keydown", this.down);
    window.removeEventListener("keyup", this.up);
    window.removeEventListener("blur", this.blur);
  }
}
