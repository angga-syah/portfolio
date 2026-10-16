import * as THREE from "three";

// Cool daytime palette (sky blue + mint, one mood) + brand accents.
export const PALETTE = {
  // Screen-space floor gradient corners (top-left, top-right, bottom-left, bottom-right)
  floor: ["#bfe3f5", "#d6f0f7", "#9fd3e8", "#cdeee0"] as const,
  shadow: "#2f5d7a",
  sky: "#f2fbff",
  ground: "#8fc3d6",
  sun: "#fffaf0",

  emerald: "#10b981",
  emeraldDark: "#047857",
  gold: "#f5b301",
  goldDark: "#c98a00",
  ink: "#1d3557",
  cream: "#fbfdff",
  coral: "#f06d5b",
  sky2: "#38bdf8",

  // Merah-putih, for the MBG van and the national-programme landmarks.
  merah: "#d62828",
  merahDark: "#9d1b1b",
  putih: "#f4f6f8",
  glass: "#2b4058",
};

// Subtle cool cast applied to every imported model so kits from different
// packs read as one palette.
export const WARM_TINT = new THREE.Color("#b9e2f2");
export const WARM_TINT_AMOUNT = 0.1;
