import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'

// El runtime WASM de tasks-vision viaja dentro del bundle en lugar de venir
// de un CDN. Antes se cargaba desde jsdelivr clavado a la versión 0.10.20
// mientras npm instalaba el JS 0.10.35: con ese desfase el runtime ignora
// runningMode y los detectores arrancan en modo imagen, lo que rompe la
// cámara con "Task is not initialized with video mode. 'runningMode' must
// be set to 'VIDEO'". Empaquetados juntos, JS y WASM no pueden desalinearse.
export const visionFileset = {
  wasmLoaderPath,
  wasmBinaryPath,
}
