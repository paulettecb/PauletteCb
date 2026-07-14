// Vendoriza el runtime de MediaPipe tasks-vision dentro del package
// lector-kyn, para que la mirada (FaceLandmarker) corra en HTML estático sin
// depender de un CDN para el WASM.
//
// POR QUÉ COPIAR JS Y WASM JUNTOS: el bundle JS y el .wasm deben ser de la
// MISMA versión de @mediapipe/tasks-vision. Si se desalinean (p. ej. JS nuevo
// de npm + wasm viejo pineado a un CDN), el runtime ignora runningMode y los
// detectores arrancan en modo imagen → la cámara truena con "Task is not
// initialized with video mode". Este script re-copia el par completo desde el
// node_modules instalado, así que tras un `npm i` que suba tasks-vision basta
// correr `node scripts/vendor-lector-kyn.mjs` para re-emparejarlos.
//
// El modelo .task NO se vendoriza: se baja del CDL de Google en runtime
// (configurable vía window.LECTOR_KYN_CONFIG.modelUrl). Solo el WASM vive local.

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'node_modules', '@mediapipe', 'tasks-vision');
const dest = path.join(root, 'proyectos', 'packages', 'lector-kyn', 'vendor');

const version = JSON.parse(readFileSync(path.join(src, 'package.json'), 'utf8')).version;

const copies = [
  ['vision_bundle.mjs', 'vision_bundle.mjs'],
  ['wasm/vision_wasm_internal.js', 'wasm/vision_wasm_internal.js'],
  ['wasm/vision_wasm_internal.wasm', 'wasm/vision_wasm_internal.wasm'],
];

mkdirSync(path.join(dest, 'wasm'), { recursive: true });
for (const [from, to] of copies) {
  cpSync(path.join(src, from), path.join(dest, to));
  console.log(`  ✓ ${to}`);
}

// Deja constancia de la versión vendorizada para saber cuándo re-emparejar.
writeFileSync(
  path.join(dest, 'VERSION'),
  `@mediapipe/tasks-vision ${version}\nRe-vendorizar con: node scripts/vendor-lector-kyn.mjs (tras actualizar tasks-vision)\n`,
);

console.log(`✅ Vendorizado tasks-vision ${version} en proyectos/packages/lector-kyn/vendor/`);
