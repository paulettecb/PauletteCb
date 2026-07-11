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

// La inferencia con delegate GPU (WebGL) corre varias veces más rápido que
// CPU; con pose + manos a la vez, CPU se arrastra a ~10 fps y el tracking se
// ve tembloroso y atrasado. GPU puede fallar al crear el contexto en
// navegadores/drivers raros, así que se recae a CPU en ese caso.
export const createLandmarkerWithFallback = async (TaskClass, options) => {
  try {
    return await TaskClass.createFromOptions(visionFileset, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: 'GPU' },
    })
  } catch (error) {
    console.warn('MotionLab: GPU no disponible para MediaPipe, usando CPU.', error)
    return TaskClass.createFromOptions(visionFileset, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: 'CPU' },
    })
  }
}
