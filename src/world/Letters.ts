import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import type { Physics } from "./Physics";
import { toonMaterial } from "./materials";

/**
 * Big extruded letters standing on the ground, each its own physics box, so
 * the van can bowl them over.
 */
export function createLetters(
  text: string,
  font: Font,
  scene: THREE.Scene,
  physics: Physics,
  { center, size = 2, spacing = 0.35, colors }: { center: THREE.Vector3; size?: number; spacing?: number; colors: string[] }
) {
  const letters: { mesh: THREE.Mesh; body: ReturnType<Physics["addDynamicBox"]>; home: THREE.Vector3 }[] = [];
  const widths: number[] = [];
  const geometries = [...text].map((char) => {
    const geo = new TextGeometry(char, {
      font,
      size,
      depth: size * 0.42,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: size * 0.05,
      bevelSize: size * 0.04,
      bevelSegments: 3,
    });
    geo.computeBoundingBox();
    geo.center();
    const box = geo.boundingBox!;
    widths.push(box.max.x - box.min.x);
    return geo;
  });

  const total = widths.reduce((a, b) => a + b, 0) + spacing * (widths.length - 1);
  let x = center.x - total / 2;
  geometries.forEach((geo, i) => {
    const mesh = new THREE.Mesh(geo, toonMaterial(colors[i % colors.length]!));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const bb = geo.boundingBox!;
    const s = bb.getSize(new THREE.Vector3());
    mesh.position.set(x + widths[i]! / 2, s.y / 2 + 0.02, center.z);
    x += widths[i]! + spacing;
    scene.add(mesh);
    const body = physics.addDynamicBox(mesh, s, 8);
    letters.push({ mesh, body, home: mesh.position.clone() });
  });
  return letters;
}
