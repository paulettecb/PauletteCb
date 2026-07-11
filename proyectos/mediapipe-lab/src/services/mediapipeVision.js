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

const GPU_INIT_TIMEOUT_MS = 10000

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} no respondió en ${ms} ms`)), ms)
  }),
])

// En algunos drivers la creación con GPU "funciona" pero la primera
// inferencia truena (o la creación se cuelga sin lanzar error, dejando el
// botón de cámara muerto). Se prueba con un frame sintético para que esas
// GPUs caigan a CPU aquí, y no a media sesión.
const warmUp = (landmarker) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  canvas.getContext('2d').fillRect(0, 0, 64, 64)
  landmarker.detectForVideo(canvas, performance.now())
}

// La inferencia con delegate GPU (WebGL) corre varias veces más rápido que
// CPU; con pose + manos a la vez, CPU se arrastra a ~10 fps y el tracking se
// ve tembloroso y atrasado. Si la GPU falla o se cuelga, se recae a CPU con
// cpuOptions (permite un modelo más ligero para máquinas sin GPU).
export const createLandmarkerWithFallback = async (TaskClass, options, cpuOptions = options) => {
  let gpuLandmarker = null
  try {
    gpuLandmarker = await withTimeout(
      TaskClass.createFromOptions(visionFileset, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'GPU' },
      }),
      GPU_INIT_TIMEOUT_MS,
      'La inicialización GPU de MediaPipe',
    )
    warmUp(gpuLandmarker)
    return gpuLandmarker
  } catch (error) {
    console.warn('MotionLab: GPU no disponible/estable para MediaPipe, usando CPU.', error)
    try { gpuLandmarker?.close() } catch { /* ya inválido */ }
    return TaskClass.createFromOptions(visionFileset, {
      ...cpuOptions,
      baseOptions: { ...cpuOptions.baseOptions, delegate: 'CPU' },
    })
  }
}
